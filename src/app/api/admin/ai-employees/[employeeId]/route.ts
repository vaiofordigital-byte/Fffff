import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser, hasRole } from "@/lib/auth";
import { db } from "@/lib/db";
import { apiError, AppError } from "@/lib/http";
import { assertSameOrigin, requestFingerprint } from "@/lib/security";

const schema = z.object({
  nameAr: z.string().trim().min(2).max(191).optional(),
  nameEn: z.string().trim().min(2).max(191).optional(),
  purposeAr: z.string().trim().min(10).max(500).optional(),
  purposeEn: z.string().trim().min(10).max(500).optional(),
  defaultCreditCost: z.number().int().min(1).max(1_000).optional(),
  active: z.boolean().optional(),
  capabilities: z.record(z.string(), z.unknown()).optional(),
  actions: z.array(z.string().max(80)).max(100).optional(),
  requiredKnowledge: z.array(z.string().max(80)).max(50).optional(),
  systemInstructions: z.string().trim().min(20).max(50_000).optional(),
});

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ employeeId: string }> },
) {
  try {
    await assertSameOrigin();
    const user = await getCurrentUser();
    if (!user) throw new AppError("AUTHENTICATION_REQUIRED", 401);
    if (!hasRole(user.role, "ADMINISTRATOR")) throw new AppError("FORBIDDEN", 403);
    const input = schema.parse(await request.json());
    const { employeeId } = await params;
    const fingerprint = await requestFingerprint();
    const employee = await db.$transaction(async (tx) => {
      const saved = await tx.aiEmployee.update({
        where: { id: employeeId },
        data: {
          ...input,
          capabilities: input.capabilities
            ? JSON.parse(JSON.stringify(input.capabilities))
            : undefined,
        },
        select: {
          id: true,
          slug: true,
          nameAr: true,
          nameEn: true,
          defaultCreditCost: true,
          active: true,
        },
      });
      await tx.auditLog.create({
        data: {
          actorId: user.id,
          action: "AI_EMPLOYEE_CONFIGURATION_CHANGED",
          entityType: "AiEmployee",
          entityId: saved.id,
          changes: {
            slug: saved.slug,
            active: saved.active,
            defaultCreditCost: saved.defaultCreditCost,
            systemInstructionsChanged: Boolean(input.systemInstructions),
          },
          ...fingerprint,
        },
      });
      return saved;
    });
    return NextResponse.json(employee);
  } catch (error) {
    return apiError(error);
  }
}
