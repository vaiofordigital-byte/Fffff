import * as OTPAuth from "otpauth";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser, getPendingMfaSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { decrypt } from "@/lib/encryption";
import { env } from "@/lib/env";
import { apiError, AppError } from "@/lib/http";
import {
  assertSameOrigin,
  enforceRateLimit,
  securityHash,
} from "@/lib/security";

const schema = z.object({
  token: z.string().regex(/^\d{6}$/),
});

export async function POST(request: Request) {
  try {
    await assertSameOrigin();
    const input = schema.parse(await request.json());
    const pending = await getPendingMfaSession();
    const current = pending ? null : await getCurrentUser();
    const userId = pending?.user.id ?? current?.id;
    if (!userId) throw new AppError("MFA_SESSION_REQUIRED", 401);
    await enforceRateLimit("mfa-verify", userId, 8, 10 * 60);

    const secretCiphertext =
      pending?.user.mfaSecretCiphertext ??
      (
        await db.user.findUnique({
          where: { id: userId },
          select: { mfaSecretCiphertext: true },
        })
      )?.mfaSecretCiphertext;
    if (!secretCiphertext) throw new AppError("MFA_NOT_CONFIGURED", 409);

    const totp = new OTPAuth.TOTP({
      issuer: "EVELIA",
      label: pending?.user.email ?? current?.email ?? "account",
      algorithm: "SHA1",
      digits: 6,
      period: 30,
      secret: OTPAuth.Secret.fromBase32(decrypt(secretCiphertext)),
    });
    if (totp.validate({ token: input.token, window: 1 }) === null) {
      throw new AppError("MFA_CODE_INVALID", 422);
    }

    const cookieName = env().SESSION_COOKIE_NAME;
    const rawSession = (await cookies()).get(cookieName)?.value;
    if (!rawSession) throw new AppError("MFA_SESSION_REQUIRED", 401);
    const now = new Date();
    await db.$transaction([
      db.session.updateMany({
        where: { tokenHash: securityHash(rawSession), userId },
        data: { mfaVerifiedAt: now },
      }),
      db.user.update({
        where: { id: userId },
        data: { mfaEnabled: true, lastLoginAt: now },
      }),
      db.auditLog.create({
        data: {
          actorId: userId,
          action: pending ? "MFA_LOGIN_VERIFIED" : "MFA_ENABLED",
          entityType: "User",
          entityId: userId,
        },
      }),
    ]);

    return NextResponse.json({ verified: true });
  } catch (error) {
    return apiError(error);
  }
}
