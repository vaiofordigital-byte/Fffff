import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser, hasRole } from "@/lib/auth";
import { db } from "@/lib/db";
import { apiError, AppError } from "@/lib/http";
import { assertSameOrigin, requestFingerprint } from "@/lib/security";

const schema = z.object({
  userId: z.string().cuid(),
  amount: z.number().int().min(-1_000_000).max(1_000_000).refine((value) => value !== 0),
  reason: z.string().trim().min(5).max(500),
});

export async function POST(request: Request) {
  try {
    await assertSameOrigin();
    const admin = await getCurrentUser();
    if (!admin) throw new AppError("AUTHENTICATION_REQUIRED", 401);
    if (!hasRole(admin.role, "ADMINISTRATOR")) throw new AppError("FORBIDDEN", 403);
    const idempotencyKey = request.headers.get("idempotency-key");
    if (!idempotencyKey || idempotencyKey.length < 12 || idempotencyKey.length > 191) {
      throw new AppError("IDEMPOTENCY_KEY_REQUIRED", 400);
    }
    const input = schema.parse(await request.json());
    const fingerprint = await requestFingerprint();
    const result = await db.$transaction(async (tx) => {
      const account = await tx.creditAccount.findUnique({
        where: { userId: input.userId },
      });
      if (!account) throw new AppError("CREDIT_ACCOUNT_NOT_FOUND", 404);
      if (input.amount < 0 && account.balance < Math.abs(input.amount)) {
        throw new AppError("CREDIT_BALANCE_CANNOT_BE_NEGATIVE", 422);
      }
      const updated = await tx.creditAccount.update({
        where: { id: account.id },
        data: {
          balance: { increment: input.amount },
          ...(input.amount > 0
            ? { lifetimeIn: { increment: input.amount } }
            : { lifetimeOut: { increment: Math.abs(input.amount) } }),
        },
      });
      await tx.creditTransaction.create({
        data: {
          accountId: account.id,
          type: "ADMIN_ADJUSTMENT",
          amount: input.amount,
          balanceAfter: updated.balance,
          reason: input.reason,
          relatedType: "AdminUser",
          relatedId: admin.id,
          idempotencyKey,
        },
      });
      await tx.auditLog.create({
        data: {
          actorId: admin.id,
          action: "CREDIT_ADMIN_ADJUSTMENT",
          entityType: "User",
          entityId: input.userId,
          changes: {
            amount: input.amount,
            reason: input.reason,
            balanceAfter: updated.balance,
          },
          ...fingerprint,
        },
      });
      return updated;
    });
    return NextResponse.json({ balance: result.balance });
  } catch (error) {
    return apiError(error);
  }
}
