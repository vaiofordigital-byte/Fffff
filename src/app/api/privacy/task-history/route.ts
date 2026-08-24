import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { apiError, AppError } from "@/lib/http";
import { requireOrganizationMembership } from "@/lib/organizations";
import { assertSameOrigin, requestFingerprint } from "@/lib/security";

const schema = z.object({
  organizationId: z.string().cuid(),
  confirmation: z.literal("DELETE"),
});

export async function DELETE(request: Request) {
  try {
    await assertSameOrigin();
    const user = await getCurrentUser();
    if (!user) throw new AppError("AUTHENTICATION_REQUIRED", 401);
    const input = schema.parse(await request.json());
    await requireOrganizationMembership(user.id, input.organizationId);
    const tasks = await db.businessTask.findMany({
      where: {
        organizationId: input.organizationId,
        createdById: user.id,
      },
      select: { id: true, generatedPromptId: true },
    });
    const generatedPromptIds = tasks
      .map((task) => task.generatedPromptId)
      .filter((value): value is string => Boolean(value));
    const fingerprint = await requestFingerprint();

    await db.$transaction(async (tx) => {
      await tx.aiUsageEvent.updateMany({
        where: { businessTaskId: { in: tasks.map((task) => task.id) } },
        data: { businessTaskId: null },
      });
      await tx.businessTask.deleteMany({
        where: {
          organizationId: input.organizationId,
          createdById: user.id,
        },
      });
      if (generatedPromptIds.length) {
        await tx.generatedPrompt.deleteMany({
          where: { id: { in: generatedPromptIds }, userId: user.id },
        });
      }
      await tx.auditLog.create({
        data: {
          actorId: user.id,
          action: "TASK_HISTORY_DELETED",
          entityType: "Organization",
          entityId: input.organizationId,
          changes: { deletedTaskCount: tasks.length },
          ...fingerprint,
        },
      });
    });
    return NextResponse.json({ deleted: tasks.length });
  } catch (error) {
    return apiError(error);
  }
}
