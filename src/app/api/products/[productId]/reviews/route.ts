import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { apiError, AppError } from "@/lib/http";
import { assertSameOrigin } from "@/lib/security";

const schema = z.object({
  rating: z.number().int().min(1).max(5),
  comment: z.string().trim().min(10).max(2_000),
});

export async function POST(
  request: Request,
  { params }: { params: Promise<{ productId: string }> },
) {
  try {
    await assertSameOrigin();
    const user = await getCurrentUser();
    if (!user) throw new AppError("AUTHENTICATION_REQUIRED", 401);
    const input = schema.parse(await request.json());
    const { productId } = await params;
    const verifiedPurchase = await db.entitlement.findFirst({
      where: {
        userId: user.id,
        productId,
        source: { in: ["PURCHASE", "BUNDLE"] },
        revokedAt: null,
        order: { status: "PAID" },
      },
      select: { id: true },
    });
    if (!verifiedPurchase) throw new AppError("VERIFIED_PURCHASE_REQUIRED", 403);

    const review = await db.review.upsert({
      where: { userId_productId: { userId: user.id, productId } },
      create: {
        userId: user.id,
        productId,
        rating: input.rating,
        comment: input.comment,
        verified: true,
        status: "REVIEW",
      },
      update: {
        rating: input.rating,
        comment: input.comment,
        verified: true,
        status: "REVIEW",
        moderatedAt: null,
        moderatedBy: null,
      },
      select: { id: true, status: true },
    });

    return NextResponse.json(review, { status: 201 });
  } catch (error) {
    return apiError(error);
  }
}
