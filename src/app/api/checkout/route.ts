import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { apiError, AppError } from "@/lib/http";
import { createCheckout } from "@/lib/payments/checkout";
import { assertSameOrigin } from "@/lib/security";

const schema = z.object({
  locale: z.enum(["ar", "en"]).default("ar"),
  items: z
    .array(
      z.object({
        productId: z.string().cuid(),
        quantity: z.number().int().min(1).max(10).optional(),
      }),
    )
    .min(1)
    .max(20),
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
    const checkout = await createCheckout({
      userId: user.id,
      email: user.email,
      idempotencyKey,
      ...input,
    });
    return NextResponse.json(checkout, { status: 201 });
  } catch (error) {
    return apiError(error);
  }
}
