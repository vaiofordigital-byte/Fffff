import { NextResponse } from "next/server";
import { apiError, AppError } from "@/lib/http";
import { processPaymentEvent } from "@/lib/payments/checkout";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ provider: string }> },
) {
  try {
    const { provider } = await params;
    const signature = request.headers.get("x-payment-signature");
    if (!signature) throw new AppError("WEBHOOK_SIGNATURE_REQUIRED", 401);
    const rawBody = await request.text();
    const result = await processPaymentEvent(provider, rawBody, signature);
    return NextResponse.json(result);
  } catch (error) {
    return apiError(error);
  }
}
