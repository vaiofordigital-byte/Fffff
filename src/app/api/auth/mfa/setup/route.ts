import * as OTPAuth from "otpauth";
import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { encrypt } from "@/lib/encryption";
import { apiError, AppError } from "@/lib/http";
import { assertSameOrigin } from "@/lib/security";

export async function POST() {
  try {
    await assertSameOrigin();
    const user = await getCurrentUser();
    if (!user) throw new AppError("AUTHENTICATION_REQUIRED", 401);
    const secret = new OTPAuth.Secret({ size: 20 });
    const totp = new OTPAuth.TOTP({
      issuer: "PROMPTX",
      label: user.email,
      algorithm: "SHA1",
      digits: 6,
      period: 30,
      secret,
    });
    await db.user.update({
      where: { id: user.id },
      data: {
        mfaEnabled: false,
        mfaSecretCiphertext: encrypt(secret.base32),
      },
    });
    return NextResponse.json(
      { secret: secret.base32, uri: totp.toString() },
      { headers: { "Cache-Control": "private, no-store" } },
    );
  } catch (error) {
    return apiError(error);
  }
}
