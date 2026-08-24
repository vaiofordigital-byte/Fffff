import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { z } from "zod";
import { createSession, hashPassword, verifyPassword } from "@/lib/auth";
import { db } from "@/lib/db";
import { apiError, AppError } from "@/lib/http";
import {
  assertSameOrigin,
  enforceRateLimit,
  requestFingerprint,
} from "@/lib/security";

const schema = z.object({
  email: z.email().transform((value) => value.trim().toLocaleLowerCase()),
  password: z.string().min(1).max(128),
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
    await enforceRateLimit("login-ip", ip, 12, 15 * 60);
    await enforceRateLimit("login-account", input.email, 8, 15 * 60);

    const user = await db.user.findUnique({ where: { email: input.email } });
    if (!user?.passwordHash) {
      await hashPassword(input.password);
      throw new AppError("INVALID_CREDENTIALS", 401);
    }

    const valid = await verifyPassword(user.passwordHash, input.password);
    if (!valid) throw new AppError("INVALID_CREDENTIALS", 401);
    if (user.status === "PENDING") {
      throw new AppError("EMAIL_VERIFICATION_REQUIRED", 403);
    }
    if (user.status !== "ACTIVE") throw new AppError("ACCOUNT_UNAVAILABLE", 403);

    await createSession(user.id, !user.mfaEnabled);
    const fingerprint = await requestFingerprint();
    await db.$transaction([
      db.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } }),
      db.auditLog.create({
        data: {
          actorId: user.id,
          action: "AUTH_LOGIN",
          entityType: "User",
          entityId: user.id,
          ...fingerprint,
        },
      }),
    ]);

    return NextResponse.json({
      authenticated: !user.mfaEnabled,
      mfaRequired: user.mfaEnabled,
    });
  } catch (error) {
    return apiError(error);
  }
}
