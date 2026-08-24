import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { apiError, AppError } from "@/lib/http";
import { requireOrganizationMembership } from "@/lib/organizations";
import { assertSameOrigin } from "@/lib/security";

const schema = z.object({
  organizationId: z.string().cuid(),
  kind: z.enum([
    "COMPANY_PROFILE",
    "PRODUCT",
    "SERVICE",
    "POLICY",
    "CUSTOMER",
    "FAQ",
    "BRAND_VOICE",
    "PROCEDURE",
    "DOCUMENT",
  ]),
  titleAr: z.string().trim().min(2).max(191),
  titleEn: z.string().trim().min(2).max(191),
  content: z.string().trim().min(10).max(100_000),
  approved: z.boolean().default(true),
  privateMode: z.boolean().default(false),
});

export async function GET(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) throw new AppError("AUTHENTICATION_REQUIRED", 401);
    const organizationId = new URL(request.url).searchParams.get("organizationId");
    if (!organizationId) throw new AppError("ORGANIZATION_REQUIRED", 422);
    await requireOrganizationMembership(user.id, organizationId);
    const entries = await db.knowledgeEntry.findMany({
      where: { organizationId },
      orderBy: { updatedAt: "desc" },
      take: 200,
      select: {
        id: true,
        kind: true,
        source: true,
        titleAr: true,
        titleEn: true,
        content: true,
        approved: true,
        privateMode: true,
        updatedAt: true,
        document: {
          select: {
            filename: true,
            mimeType: true,
            sizeBytes: true,
            status: true,
          },
        },
      },
    });
    return NextResponse.json(entries, {
      headers: {
        "Cache-Control": "private, no-store",
        "X-Robots-Tag": "noindex, nofollow",
      },
    });
  } catch (error) {
    return apiError(error);
  }
}

export async function POST(request: Request) {
  try {
    await assertSameOrigin();
    const user = await getCurrentUser();
    if (!user) throw new AppError("AUTHENTICATION_REQUIRED", 401);
    const input = schema.parse(await request.json());
    await requireOrganizationMembership(user.id, input.organizationId, "EMPLOYEE");
    const entry = await db.knowledgeEntry.create({
      data: {
        organizationId: input.organizationId,
        createdById: user.id,
        kind: input.kind,
        source: "MANUAL",
        titleAr: input.titleAr,
        titleEn: input.titleEn,
        content: input.content,
        approved: input.approved,
        privateMode: input.privateMode,
      },
      select: {
        id: true,
        kind: true,
        approved: true,
        updatedAt: true,
      },
    });
    return NextResponse.json(entry, { status: 201 });
  } catch (error) {
    return apiError(error);
  }
}
