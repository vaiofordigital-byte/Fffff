import { NextResponse } from "next/server";
import { z } from "zod";
import { hashPassword } from "@/lib/auth";
import { db } from "@/lib/db";
import { apiError, AppError } from "@/lib/http";
import { assertSameOrigin, securityHash } from "@/lib/security";

const schema = z.object({
  token: z.string().min(32).max(200),
  password: z
    .string()
    .min(12)
    .max(128)
    .refine((value) => /[a-zA-Z]/.test(value) && /\d/.test(value), "WEAK_PASSWORD"),
});

export async function POST(request: Request) {
  try {
    await assertSameOrigin();
    const input = schema.parse(await request.json());
    const record = await db.passwordResetToken.findUnique({
      where: { tokenHash: securityHash(input.token) },
    });
    if (!record || record.usedAt || record.expiresAt <= new Date()) {
      throw new AppError("RESET_TOKEN_INVALID", 422);
    }

    const passwordHash = await hashPassword(input.password);
    await db.$transaction([
      db.passwordResetToken.update({
        where: { id: record.id },
        data: { usedAt: new Date() },
      }),
      db.user.update({
        where: { id: record.userId },
        data: { passwordHash },
      }),
      db.session.deleteMany({ where: { userId: record.userId } }),
      db.auditLog.create({
        data: {
          actorId: record.userId,
          action: "PASSWORD_RESET",
          entityType: "User",
          entityId: record.userId,
        },
      }),
    ]);

    return NextResponse.json({ reset: true });
  } catch (error) {
    return apiError(error);
  }
}
