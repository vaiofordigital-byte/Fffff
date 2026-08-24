import { NextResponse } from "next/server";
import { z } from "zod";
import { executeGeneration } from "@/lib/ai/generation";
import { getCurrentUser } from "@/lib/auth";
import { apiError, AppError } from "@/lib/http";
import { assertSameOrigin } from "@/lib/security";

const schema = z.object({
  prompt: z.string().trim().min(12).max(20_000),
  locale: z.enum(["ar", "en"]).default("ar"),
  privateMode: z.boolean().default(false),
  projectId: z.string().cuid().optional(),
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
    const result = await executeGeneration({
      userId: user.id,
      idempotencyKey,
      ...input,
    });
    return NextResponse.json(result, {
      headers: { "Cache-Control": "private, no-store" },
    });
  } catch (error) {
    return apiError(error);
  }
}
