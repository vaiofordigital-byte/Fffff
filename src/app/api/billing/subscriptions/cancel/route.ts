import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { apiError, AppError } from "@/lib/http";
import { assertSameOrigin } from "@/lib/security";
import { cancelOrganizationSubscription } from "@/lib/subscriptions";

const schema = z.object({
  organizationId: z.string().cuid(),
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
    const result = await cancelOrganizationSubscription({
      userId: user.id,
      idempotencyKey,
      ...input,
    });
    return NextResponse.json(result);
  } catch (error) {
    return apiError(error);
  }
}
