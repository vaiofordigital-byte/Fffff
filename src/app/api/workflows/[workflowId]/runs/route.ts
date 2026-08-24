import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { apiError, AppError } from "@/lib/http";
import { assertSameOrigin } from "@/lib/security";

const schema = z.object({
  projectId: z.string().cuid().optional(),
  context: z.record(z.string(), z.unknown()).default({}),
});

export async function POST(
  request: Request,
  { params }: { params: Promise<{ workflowId: string }> },
) {
  try {
    await assertSameOrigin();
    const user = await getCurrentUser();
    if (!user) throw new AppError("AUTHENTICATION_REQUIRED", 401);
    const idempotencyKey = request.headers.get("idempotency-key");
    if (!idempotencyKey || idempotencyKey.length < 12 || idempotencyKey.length > 191) {
      throw new AppError("IDEMPOTENCY_KEY_REQUIRED", 400);
    }
    const input = schema.parse(await request.json());
    const { workflowId } = await params;
    const existing = await db.workflowRun.findUnique({ where: { idempotencyKey } });
    if (existing) {
      if (existing.userId !== user.id) throw new AppError("IDEMPOTENCY_CONFLICT", 409);
      return NextResponse.json({ id: existing.id, replayed: true });
    }
    const workflow = await db.workflow.findFirst({
      where: { id: workflowId, status: "PUBLISHED" },
      include: { steps: { orderBy: { sortOrder: "asc" } } },
    });
    if (!workflow) throw new AppError("WORKFLOW_NOT_FOUND", 404);
    if (input.projectId) {
      const owned = await db.project.count({
        where: { id: input.projectId, userId: user.id },
      });
      if (!owned) throw new AppError("PROJECT_NOT_FOUND", 404);
    }

    const run = await db.workflowRun.create({
      data: {
        workflowId,
        userId: user.id,
        projectId: input.projectId,
        context: input.context,
        idempotencyKey,
        status: "PENDING",
        steps: {
          create: workflow.steps.map((step) => ({
            workflowStepId: step.id,
            status: "PENDING",
          })),
        },
      },
      select: { id: true },
    });
    return NextResponse.json({ id: run.id, replayed: false }, { status: 201 });
  } catch (error) {
    return apiError(error);
  }
}
