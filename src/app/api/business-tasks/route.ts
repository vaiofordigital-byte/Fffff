import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { executeBusinessTask } from "@/lib/business-tasks";
import { db } from "@/lib/db";
import { apiError, AppError } from "@/lib/http";
import { requireOrganizationMembership } from "@/lib/organizations";
import { assertSameOrigin } from "@/lib/security";

const createSchema = z.object({
  organizationId: z.string().cuid(),
  aiEmployeeId: z.string().cuid(),
  title: z.string().trim().min(3).max(191),
  instruction: z.string().trim().min(12).max(20_000),
  locale: z.enum(["ar", "en"]).default("ar"),
  projectId: z.string().cuid().optional(),
  parentTaskId: z.string().cuid().optional(),
  privateMode: z.boolean().default(false),
});

export async function GET(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) throw new AppError("AUTHENTICATION_REQUIRED", 401);
    const organizationId = new URL(request.url).searchParams.get("organizationId");
    if (!organizationId) throw new AppError("ORGANIZATION_REQUIRED", 422);
    await requireOrganizationMembership(user.id, organizationId);
    const tasks = await db.businessTask.findMany({
      where: { organizationId },
      orderBy: { createdAt: "desc" },
      take: 100,
      select: {
        id: true,
        title: true,
        status: true,
        privateMode: true,
        creditCost: true,
        createdAt: true,
        completedAt: true,
        aiEmployee: {
          select: {
            nameAr: true,
            nameEn: true,
            slug: true,
          },
        },
        createdBy: {
          select: {
            profile: { select: { displayName: true } },
          },
        },
      },
    });
    return NextResponse.json(tasks, {
      headers: { "Cache-Control": "private, no-store" },
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
    const idempotencyKey = request.headers.get("idempotency-key");
    if (!idempotencyKey || idempotencyKey.length < 12 || idempotencyKey.length > 191) {
      throw new AppError("IDEMPOTENCY_KEY_REQUIRED", 400);
    }
    const input = createSchema.parse(await request.json());
    const result = await executeBusinessTask({
      userId: user.id,
      idempotencyKey,
      ...input,
    });
    return NextResponse.json(result, {
      status: result.replayed ? 200 : 201,
      headers: { "Cache-Control": "private, no-store" },
    });
  } catch (error) {
    return apiError(error);
  }
}
