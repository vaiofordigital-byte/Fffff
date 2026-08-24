import { db } from "@/lib/db";
import { AppError } from "@/lib/http";

export async function getPremiumPrompt(userId: string, productId: string) {
  const now = new Date();
  const product = await db.product.findFirst({
    where: { id: productId, status: "PUBLISHED", type: "PROMPT" },
    include: {
      prompt: {
        include: {
          versions: {
            where: { isCurrent: true, publishedAt: { lte: now } },
            take: 1,
          },
          variables: { orderBy: { sortOrder: "asc" } },
        },
      },
    },
  });
  if (!product?.prompt?.versions[0]) throw new AppError("PROMPT_NOT_FOUND", 404);

  const entitlement = await db.entitlement.findFirst({
    where: {
      userId,
      productId,
      revokedAt: null,
      startsAt: { lte: now },
      OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
    },
  });

  let subscriptionAccess = false;
  if (!entitlement && product.subscriptionEligible) {
    subscriptionAccess =
      (await db.subscription.count({
        where: {
          userId,
          status: { in: ["ACTIVE", "TRIALING"] },
          currentPeriodEnd: { gt: now },
        },
      })) > 0;
  }

  if (!entitlement && !subscriptionAccess) {
    throw new AppError("ENTITLEMENT_REQUIRED", 403);
  }

  const version = product.prompt.versions[0];
  return {
    id: product.id,
    titleAr: product.titleAr,
    titleEn: product.titleEn,
    version: version.version,
    content: version.premiumContent,
    variables: product.prompt.variables,
    license: entitlement?.licenseType ?? product.licenseType,
  };
}
