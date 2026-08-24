import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser, hasRole } from "@/lib/auth";
import { db } from "@/lib/db";
import { apiError, AppError } from "@/lib/http";
import { assertSameOrigin, requestFingerprint } from "@/lib/security";

const sectionSchema = z.object({
  heading: z.string().trim().min(1).max(191),
  body: z.string().trim().min(1).max(50_000),
});

const schema = z.object({
  slug: z.string().trim().min(2).max(160).regex(/^[a-z0-9-]+$/),
  titleAr: z.string().trim().min(2).max(191),
  titleEn: z.string().trim().min(2).max(191),
  introAr: z.string().trim().max(2_000),
  introEn: z.string().trim().max(2_000),
  sectionsAr: z.array(sectionSchema).max(50),
  sectionsEn: z.array(sectionSchema).max(50),
  status: z.enum(["DRAFT", "REVIEW", "PUBLISHED"]).default("DRAFT"),
});

export async function POST(request: Request) {
  try {
    await assertSameOrigin();
    const user = await getCurrentUser();
    if (!user) throw new AppError("AUTHENTICATION_REQUIRED", 401);
    if (!hasRole(user.role, "CONTENT_EDITOR")) throw new AppError("FORBIDDEN", 403);
    const input = schema.parse(await request.json());
    const canPublish = hasRole(user.role, "ADMINISTRATOR");
    const status = input.status === "PUBLISHED" && !canPublish ? "REVIEW" : input.status;
    const fingerprint = await requestFingerprint();
    const page = await db.$transaction(async (tx) => {
      const saved = await tx.cmsPage.upsert({
        where: { slug: input.slug },
        create: {
          slug: input.slug,
          titleAr: input.titleAr,
          titleEn: input.titleEn,
          contentAr: { intro: input.introAr, sections: input.sectionsAr },
          contentEn: { intro: input.introEn, sections: input.sectionsEn },
          status,
          publishedAt: status === "PUBLISHED" ? new Date() : null,
        },
        update: {
          titleAr: input.titleAr,
          titleEn: input.titleEn,
          contentAr: { intro: input.introAr, sections: input.sectionsAr },
          contentEn: { intro: input.introEn, sections: input.sectionsEn },
          status,
          publishedAt: status === "PUBLISHED" ? new Date() : null,
        },
      });
      await tx.auditLog.create({
        data: {
          actorId: user.id,
          action: "CMS_PAGE_SAVED",
          entityType: "CmsPage",
          entityId: saved.id,
          changes: { slug: saved.slug, status: saved.status },
          ...fingerprint,
        },
      });
      return saved;
    });
    return NextResponse.json({ id: page.id, status: page.status }, { status: 201 });
  } catch (error) {
    return apiError(error);
  }
}
