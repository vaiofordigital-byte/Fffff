import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getPremiumPrompt } from "@/lib/entitlements";
import { apiError, AppError } from "@/lib/http";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ productId: string }> },
) {
  try {
    const user = await getCurrentUser();
    if (!user) throw new AppError("AUTHENTICATION_REQUIRED", 401);
    const { productId } = await params;
    const prompt = await getPremiumPrompt(user.id, productId);
    return NextResponse.json(prompt, {
      headers: {
        "Cache-Control": "private, no-store, max-age=0",
        "X-Robots-Tag": "noindex, nofollow",
      },
    });
  } catch (error) {
    return apiError(error);
  }
}
