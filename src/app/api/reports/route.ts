import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { deriveBusinessRecommendations } from "@/lib/business-intelligence";
import { db } from "@/lib/db";
import { apiError, AppError } from "@/lib/http";
import { requireOrganizationMembership } from "@/lib/organizations";
import { assertSameOrigin } from "@/lib/security";

const schema = z.object({
  organizationId: z.string().cuid(),
  type: z
    .enum(["WEEKLY", "BUSINESS", "MARKETING", "CUSTOMER_SERVICE"])
    .default("WEEKLY"),
});

export async function POST(request: Request) {
  try {
    await assertSameOrigin();
    const user = await getCurrentUser();
    if (!user) throw new AppError("AUTHENTICATION_REQUIRED", 401);
    const input = schema.parse(await request.json());
    await requireOrganizationMembership(user.id, input.organizationId, "EMPLOYEE");
    const periodEnd = new Date();
    const periodStart = new Date(periodEnd.getTime() - 7 * 24 * 60 * 60 * 1000);

    const [tasks, usage, recommendations] = await Promise.all([
      db.businessTask.findMany({
        where: {
          organizationId: input.organizationId,
          createdAt: { gte: periodStart, lte: periodEnd },
        },
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          title: true,
          status: true,
          creditCost: true,
          createdAt: true,
          aiEmployee: { select: { nameAr: true, nameEn: true, type: true } },
        },
      }),
      db.aiUsageEvent.aggregate({
        where: {
          organizationId: input.organizationId,
          createdAt: { gte: periodStart, lte: periodEnd },
        },
        _count: true,
        _sum: { creditAmount: true },
      }),
      deriveBusinessRecommendations(input.organizationId),
    ]);
    const completed = tasks.filter((task) => task.status === "COMPLETED");
    const failed = tasks.filter((task) =>
      ["FAILED", "MODERATED"].includes(task.status),
    );
    const content = {
      period: {
        start: periodStart.toISOString(),
        end: periodEnd.toISOString(),
      },
      completedTasks: completed,
      failedTaskCount: failed.length,
      usage: {
        requests: usage._count,
        credits: usage._sum.creditAmount ?? 0,
      },
      recommendations,
      dataCoverage: {
        taskCount: tasks.length,
        generatedFromActualUsage: true,
      },
    };
    const report = await db.businessReport.create({
      data: {
        organizationId: input.organizationId,
        type: input.type,
        status: "READY",
        titleAr:
          input.type === "WEEKLY"
            ? "تقرير الأعمال الأسبوعي"
            : `تقرير ${input.type}`,
        titleEn:
          input.type === "WEEKLY"
            ? "Weekly Business Report"
            : `${input.type.replaceAll("_", " ")} Report`,
        periodStart,
        periodEnd,
        content,
        generatedAt: new Date(),
      },
      select: { id: true, status: true },
    });
    const preferences = await db.notificationPreference.findUnique({
      where: { userId: user.id },
      select: { inAppEnabled: true },
    });
    if (preferences?.inAppEnabled ?? true) {
      await db.notification.create({
        data: {
          userId: user.id,
          type: "REPORT",
          titleAr: "تقرير EVELIA جاهز",
          titleEn: "EVELIA report is ready",
          bodyAr: "تم إنشاء التقرير من المهام والاستخدام الفعلي.",
          bodyEn: "The report was created from actual tasks and usage.",
          actionUrl: "/reports",
        },
      });
    }

    return NextResponse.json(report, { status: 201 });
  } catch (error) {
    return apiError(error);
  }
}
