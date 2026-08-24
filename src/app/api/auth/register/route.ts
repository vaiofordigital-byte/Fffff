import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { z } from "zod";
import { hashPassword } from "@/lib/auth";
import { db } from "@/lib/db";
import { sendEmail, verificationEmail } from "@/lib/email";
import { publicEnv } from "@/lib/env";
import { apiError, AppError } from "@/lib/http";
import {
  assertSameOrigin,
  enforceRateLimit,
  randomToken,
  securityHash,
} from "@/lib/security";

const schema = z.object({
  name: z.string().trim().min(2).max(120),
  email: z.email().transform((value) => value.trim().toLocaleLowerCase()),
  password: z
    .string()
    .min(12)
    .max(128)
    .refine((value) => /[a-zA-Z]/.test(value) && /\d/.test(value), "WEAK_PASSWORD"),
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
    await enforceRateLimit("register-ip", ip, 10, 60 * 60);
    await enforceRateLimit("register-email", input.email, 3, 60 * 60);

    const exists = await db.user.count({ where: { email: input.email } });
    if (exists) throw new AppError("EMAIL_UNAVAILABLE", 409);

    const passwordHash = await hashPassword(input.password);
    const rawToken = randomToken();
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000);
    const user = await db.user.create({
      data: {
        email: input.email,
        passwordHash,
        preferredLocale: input.locale === "ar" ? "AR" : "EN",
        status: "PENDING",
        profile: { create: { displayName: input.name } },
        creditAccount: { create: {} },
        notificationPreference: { create: {} },
        emailTokens: {
          create: { tokenHash: securityHash(rawToken), expiresAt },
        },
      },
      select: { id: true },
    });

    const verificationUrl = `${publicEnv.appUrl}/api/auth/verify-email?token=${encodeURIComponent(rawToken)}&locale=${input.locale}`;
    const email = verificationEmail({ locale: input.locale, url: verificationUrl });
    const delivery = await sendEmail({ to: input.email, ...email });

    return NextResponse.json(
      {
        userId: user.id,
        verificationRequired: true,
        emailDelivered: delivery.delivered,
        ...(process.env.NODE_ENV === "development"
          ? { developmentVerificationUrl: verificationUrl }
          : {}),
      },
      { status: 201 },
    );
  } catch (error) {
    return apiError(error);
  }
}
