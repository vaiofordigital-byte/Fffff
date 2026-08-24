import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { passwordResetEmail, sendEmail } from "@/lib/email";
import { publicEnv } from "@/lib/env";
import { apiError } from "@/lib/http";
import {
  assertSameOrigin,
  enforceRateLimit,
  randomToken,
  securityHash,
} from "@/lib/security";

const schema = z.object({
  email: z.email().transform((value) => value.trim().toLocaleLowerCase()),
  locale: z.enum(["ar", "en"]).default("ar"),
});

export async function POST(request: Request) {
  try {
    await assertSameOrigin();
    const input = schema.parse(await request.json());
    const requestHeaders = await headers();
    const ip =
      requestHeaders.get("x-forwarded-for")?.split(",")[0]?.trim() ??
      requestHeaders.get("x-real-ip") ??
      "unknown";
    await enforceRateLimit("forgot-password-ip", ip, 8, 60 * 60);
    await enforceRateLimit("forgot-password-email", input.email, 3, 60 * 60);

    const user = await db.user.findUnique({ where: { email: input.email } });
    if (user?.status === "ACTIVE") {
      const rawToken = randomToken();
      await db.$transaction([
        db.passwordResetToken.deleteMany({
          where: { userId: user.id, usedAt: null },
        }),
        db.passwordResetToken.create({
          data: {
            userId: user.id,
            tokenHash: securityHash(rawToken),
            expiresAt: new Date(Date.now() + 30 * 60 * 1000),
          },
        }),
      ]);
      const resetUrl = `${publicEnv.appUrl}/${input.locale}/reset-password?token=${encodeURIComponent(rawToken)}`;
      const email = passwordResetEmail({ locale: input.locale, url: resetUrl });
      await sendEmail({ to: input.email, ...email });
    }

    return NextResponse.json({ accepted: true });
  } catch (error) {
    return apiError(error);
  }
}
