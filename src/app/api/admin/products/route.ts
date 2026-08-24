import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser, hasRole } from "@/lib/auth";
import { db } from "@/lib/db";
import { apiError, AppError } from "@/lib/http";
import { assertSameOrigin, requestFingerprint } from "@/lib/security";

const variableSchema = z.object({
  key: z.string().trim().min(1).max(80).regex(/^[A-Z][A-Z0-9_]*$/),
  labelAr: z.string().trim().min(1).max(160),
  labelEn: z.string().trim().min(1).max(160),
  required: z.boolean().default(true),
});

const schema = z.object({
  slug: z.string().trim().min(2).max(160).regex(/^[a-z0-9-]+$/),
  categoryId: z.string().cuid(),
  titleAr: z.string().trim().min(3).max(191),
  titleEn: z.string().trim().min(3).max(191),
  shortDescriptionAr: z.string().trim().min(10).max(500),
  shortDescriptionEn: z.string().trim().min(10).max(500),
  descriptionAr: z.string().trim().min(20).max(50_000),
  descriptionEn: z.string().trim().min(20).max(50_000),
  previewAr: z.string().trim().max(10_000).optional(),
  previewEn: z.string().trim().max(10_000).optional(),
  industry: z.string().trim().max(120).optional(),
  difficulty: z
    .enum(["BEGINNER", "INTERMEDIATE", "ADVANCED", "EXPERT"])
    .default("INTERMEDIATE"),
  price: z.number().min(0).max(1_000_000),
  salePrice: z.number().min(0).max(1_000_000).optional(),
  currency: z.string().length(3).transform((value) => value.toUpperCase()),
  licenseType: z
    .enum(["PERSONAL", "PROFESSIONAL", "COMMERCIAL", "AGENCY"])
    .default("PERSONAL"),
  subscriptionEligible: z.boolean().default(false),
  status: z.enum(["DRAFT", "REVIEW", "PUBLISHED"]).default("DRAFT"),
  version: z.string().regex(/^\d+\.\d+(?:\.\d+)?$/),
  premiumContent: z.string().trim().min(20).max(100_000),
  changelogAr: z.string().trim().max(2_000).optional(),
  changelogEn: z.string().trim().max(2_000).optional(),
  compatibility: z.array(z.string().max(80)).min(1).max(20),
  variables: z.array(variableSchema).max(50).default([]),
});

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) throw new AppError("AUTHENTICATION_REQUIRED", 401);
    if (!hasRole(user.role, "PROMPT_EDITOR")) throw new AppError("FORBIDDEN", 403);
    const products = await db.product.findMany({
      orderBy: { updatedAt: "desc" },
      take: 100,
      select: {
        id: true,
        slug: true,
        titleAr: true,
        titleEn: true,
        status: true,
        price: true,
        currency: true,
        updatedAt: true,
        prompt: {
          select: {
            versions: {
              where: { isCurrent: true },
              select: { version: true },
              take: 1,
            },
          },
        },
      },
    });
    return NextResponse.json(
      products.map((product) => ({
        ...product,
        price: Number(product.price),
      })),
      { headers: { "Cache-Control": "private, no-store" } },
    );
  } catch (error) {
    return apiError(error);
  }
}

export async function POST(request: Request) {
  try {
    await assertSameOrigin();
    const user = await getCurrentUser();
    if (!user) throw new AppError("AUTHENTICATION_REQUIRED", 401);
    if (!hasRole(user.role, "PROMPT_EDITOR")) throw new AppError("FORBIDDEN", 403);
    const input = schema.parse(await request.json());
    if (input.salePrice !== undefined && input.salePrice >= input.price) {
      throw new AppError("INVALID_SALE_PRICE", 422);
    }
    const canPublish = hasRole(user.role, "ADMINISTRATOR");
    const status = input.status === "PUBLISHED" && !canPublish ? "REVIEW" : input.status;
    const now = new Date();
    const fingerprint = await requestFingerprint();

    const product = await db.$transaction(async (tx) => {
      const created = await tx.product.create({
        data: {
          categoryId: input.categoryId,
          slug: input.slug,
          type: "PROMPT",
          status,
          titleAr: input.titleAr,
          titleEn: input.titleEn,
          shortDescriptionAr: input.shortDescriptionAr,
          shortDescriptionEn: input.shortDescriptionEn,
          descriptionAr: input.descriptionAr,
          descriptionEn: input.descriptionEn,
          previewAr: input.previewAr,
          previewEn: input.previewEn,
          industry: input.industry,
          difficulty: input.difficulty,
          price: input.price,
          salePrice: input.salePrice,
          currency: input.currency,
          licenseType: input.licenseType,
          subscriptionEligible: input.subscriptionEligible,
          publishedAt: status === "PUBLISHED" ? now : null,
          prompt: {
            create: {
              compatibility: input.compatibility,
              languages: ["ar", "en"],
              versions: {
                create: {
                  version: input.version,
                  premiumContent: input.premiumContent,
                  changelogAr: input.changelogAr,
                  changelogEn: input.changelogEn,
                  isCurrent: true,
                  qualityScore: null,
                  publishedAt: status === "PUBLISHED" ? now : null,
                  createdById: user.id,
                },
              },
              variables: {
                create: input.variables.map((variable, index) => ({
                  ...variable,
                  inputType: "text",
                  sortOrder: index,
                })),
              },
            },
          },
        },
      });
      await tx.auditLog.create({
        data: {
          actorId: user.id,
          action: "PRODUCT_CREATED",
          entityType: "Product",
          entityId: created.id,
          changes: {
            slug: created.slug,
            status: created.status,
            price: String(created.price),
            currency: created.currency,
            version: input.version,
          },
          ...fingerprint,
        },
      });
      return created;
    });

    return NextResponse.json(
      { id: product.id, status: product.status },
      { status: 201 },
    );
  } catch (error) {
    return apiError(error);
  }
}
