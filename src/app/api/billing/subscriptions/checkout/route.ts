import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { apiError, AppError } from "@/lib/http";
import { assertSameOrigin } from "@/lib/security";
import { createSubscriptionCheckout } from "@/lib/subscriptions";

const schema = z.object({
  organizationId: z.string().cuid(),
  planId: z.string().cuid(),
  interval: z.enum(["MONTHLY", "YEARLY"]),
  locale: z.enum(["ar", "en"]).default("ar"),
});

export async function POST(request: Request) {
  try {
    await assertSameOrigin();
    const user = await getCurrentUser();
    if (!user) throw new AppError("AUTHENTICATION_REQUIRED", 401);
    const idempotencyKey = request.headers.get("idempotency-key");
    if (!idempotencyKey || idempotencyKey.length < 12 || idempotencyKey.length > 191) {
      throw new AppError("IDEMPOTENCY_KEY_REQUIRED", 400);
    }
    const input = schema.parse(await request.json());
    const result = await createSubscriptionCheckout({
      userId: user.id,
      email: user.email,
      idempotencyKey,
      ...input,
    });
    return NextResponse.json(result, { status: result.replayed ? 200 : 201 });
  } catch (error) {
    return apiError(error);
  }
}
