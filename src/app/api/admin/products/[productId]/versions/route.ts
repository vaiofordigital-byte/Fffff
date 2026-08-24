import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser, hasRole } from "@/lib/auth";
import { db } from "@/lib/db";
import { apiError, AppError } from "@/lib/http";
import { assertSameOrigin, requestFingerprint } from "@/lib/security";

const schema = z.object({
  version: z.string().regex(/^\d+\.\d+(?:\.\d+)?$/),
  premiumContent: z.string().trim().min(20).max(100_000),
  changelogAr: z.string().trim().min(3).max(2_000),
  changelogEn: z.string().trim().min(3).max(2_000),
});

export async function POST(
  request: Request,
  { params }: { params: Promise<{ productId: string }> },
) {
  try {
    await assertSameOrigin();
    const user = await getCurrentUser();
    if (!user) throw new AppError("AUTHENTICATION_REQUIRED", 401);
    if (!hasRole(user.role, "ADMINISTRATOR")) throw new AppError("FORBIDDEN", 403);
    const input = schema.parse(await request.json());
    const { productId } = await params;
    const product = await db.product.findUnique({
      where: { id: productId },
      include: {
        prompt: { select: { id: true } },
        entitlements: {
          where: { revokedAt: null },
          distinct: ["userId"],
          select: { userId: true },
        },
      },
    });
    if (!product?.prompt) throw new AppError("PROMPT_NOT_FOUND", 404);
    const fingerprint = await requestFingerprint();
    const now = new Date();

    await db.$transaction(async (tx) => {
      await tx.promptVersion.updateMany({
        where: { promptId: product.prompt!.id, isCurrent: true },
        data: { isCurrent: false },
      });
      const version = await tx.promptVersion.create({
        data: {
          promptId: product.prompt!.id,
          createdById: user.id,
          version: input.version,
          premiumContent: input.premiumContent,
          changelogAr: input.changelogAr,
          changelogEn: input.changelogEn,
          isCurrent: true,
          publishedAt: now,
        },
      });
      await tx.product.update({
        where: { id: product.id },
        data: { status: "PUBLISHED", publishedAt: product.publishedAt ?? now },
      });
      if (product.entitlements.length) {
        await tx.notification.createMany({
          data: product.entitlements.map(({ userId }) => ({
            userId,
            type: "PROMPT_UPDATE" as const,
            titleAr: `تحديث جديد: ${product.titleAr}`,
            titleEn: `New update: ${product.titleEn}`,
            bodyAr: `الإصدار ${input.version} متاح الآن في خزنتك.`,
            bodyEn: `Version ${input.version} is now available in your Vault.`,
            actionUrl: `/vault/${product.id}`,
          })),
        });
      }
      await tx.auditLog.create({
        data: {
          actorId: user.id,
          action: "PROMPT_VERSION_PUBLISHED",
          entityType: "PromptVersion",
          entityId: version.id,
          changes: { productId: product.id, version: input.version },
          ...fingerprint,
        },
      });
    });

    return NextResponse.json({ published: true, version: input.version }, { status: 201 });
  } catch (error) {
    return apiError(error);
  }
}
