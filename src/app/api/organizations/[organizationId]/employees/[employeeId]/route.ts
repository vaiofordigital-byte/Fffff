import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { apiError, AppError } from "@/lib/http";
import { requireOrganizationMembership } from "@/lib/organizations";
import { assertSameOrigin, requestFingerprint } from "@/lib/security";

const schema = z.object({
  status: z
    .enum(["ACTIVE", "PAUSED", "DISABLED"])
    .default("ACTIVE"),
  usageLimit: z.number().int().min(1).max(1_000_000).nullable().optional(),
  configuration: z.record(z.string(), z.unknown()).optional(),
});

export async function PUT(
  request: Request,
  {
    params,
  }: { params: Promise<{ organizationId: string; employeeId: string }> },
) {
  try {
    await assertSameOrigin();
    const user = await getCurrentUser();
    if (!user) throw new AppError("AUTHENTICATION_REQUIRED", 401);
    const { organizationId, employeeId } = await params;
    await requireOrganizationMembership(user.id, organizationId, "MANAGER");
    const input = schema.parse(await request.json());
    const employee = await db.aiEmployee.findFirst({
      where: { id: employeeId, active: true },
      select: { id: true, slug: true },
    });
    if (!employee) throw new AppError("AI_EMPLOYEE_NOT_FOUND", 404);
    if (input.status === "ACTIVE") {
      const [currentActivation, activeCount, subscription] = await Promise.all([
        db.organizationAiEmployee.findUnique({
          where: {
            organizationId_aiEmployeeId: { organizationId, aiEmployeeId: employeeId },
          },
          select: { status: true },
        }),
        db.organizationAiEmployee.count({
          where: { organizationId, status: "ACTIVE" },
        }),
        db.subscription.findFirst({
          where: {
            organizationId,
            status: { in: ["ACTIVE", "TRIALING"] },
            currentPeriodEnd: { gt: new Date() },
          },
          include: { plan: { select: { limits: true } } },
        }),
      ]);
      const limits = (subscription?.plan.limits ?? {}) as {
        aiEmployees?: number;
      };
      if (
        currentActivation?.status !== "ACTIVE" &&
        typeof limits.aiEmployees === "number" &&
        activeCount >= limits.aiEmployees
      ) {
        throw new AppError("PLAN_AI_EMPLOYEE_LIMIT_REACHED", 402);
      }
    }
    const fingerprint = await requestFingerprint();

    const activation = await db.$transaction(async (tx) => {
      const saved = await tx.organizationAiEmployee.upsert({
        where: {
          organizationId_aiEmployeeId: { organizationId, aiEmployeeId: employeeId },
        },
        create: {
          organizationId,
          aiEmployeeId: employeeId,
          activatedById: user.id,
          status: input.status,
          usageLimit: input.usageLimit,
          configuration: input.configuration
            ? JSON.parse(JSON.stringify(input.configuration))
            : undefined,
        },
        update: {
          status: input.status,
          usageLimit: input.usageLimit,
          configuration: input.configuration
            ? JSON.parse(JSON.stringify(input.configuration))
            : undefined,
        },
      });
      await tx.auditLog.create({
        data: {
          actorId: user.id,
          action: "AI_EMPLOYEE_ACTIVATION_CHANGED",
          entityType: "OrganizationAiEmployee",
          entityId: saved.id,
          changes: {
            organizationId,
            employeeSlug: employee.slug,
            status: saved.status,
          },
          ...fingerprint,
        },
      });
      return saved;
    });

    return NextResponse.json({
      id: activation.id,
      status: activation.status,
      usageLimit: activation.usageLimit,
    });
  } catch (error) {
    return apiError(error);
  }
}
