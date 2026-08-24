import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser, hasRole } from "@/lib/auth";
import { db } from "@/lib/db";
import { apiError, AppError } from "@/lib/http";
import { assertSameOrigin, requestFingerprint } from "@/lib/security";

const schema = z.object({
  slug: z.string().trim().min(2).max(120).regex(/^[a-z0-9-]+$/),
  nameAr: z.string().trim().min(2).max(160),
  nameEn: z.string().trim().min(2).max(160),
  parentId: z.string().cuid().optional(),
});

export async function POST(request: Request) {
  try {
    await assertSameOrigin();
    const user = await getCurrentUser();
    if (!user) throw new AppError("AUTHENTICATION_REQUIRED", 401);
    if (!hasRole(user.role, "CONTENT_EDITOR")) throw new AppError("FORBIDDEN", 403);
    const input = schema.parse(await request.json());
    const fingerprint = await requestFingerprint();
    const category = await db.$transaction(async (tx) => {
      const created = await tx.category.create({ data: input });
      await tx.auditLog.create({
        data: {
          actorId: user.id,
          action: "CATEGORY_CREATED",
          entityType: "Category",
          entityId: created.id,
          changes: { slug: created.slug },
          ...fingerprint,
        },
      });
      return created;
    });
    return NextResponse.json(
      { id: category.id, slug: category.slug },
      { status: 201 },
    );
  } catch (error) {
    return apiError(error);
  }
}
