import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Bot, Coins, LockKeyhole, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { isLocale, type Locale } from "@/lib/i18n";
import { requireOrganizationMembership } from "@/lib/organizations";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Business task result",
  robots: { index: false, follow: false, noarchive: true },
};

export default async function TaskDetailPage({
  params,
}: {
  params: Promise<{ locale: string; taskId: string }>;
}) {
  const { locale: raw, taskId } = await params;
  const locale: Locale = isLocale(raw) ? raw : "ar";
  const ar = locale === "ar";
  const user = await requireUser(locale);
  const task = await db.businessTask.findUnique({
    where: { id: taskId },
    include: {
      organization: { select: { id: true, name: true } },
      aiEmployee: {
        select: {
          id: true,
          nameAr: true,
          nameEn: true,
          purposeAr: true,
          purposeEn: true,
        },
      },
      createdBy: {
        select: { profile: { select: { displayName: true } } },
      },
      refinements: {
        orderBy: { createdAt: "desc" },
        select: { id: true, title: true, status: true, createdAt: true },
      },
    },
  });
  if (!task) notFound();
  await requireOrganizationMembership(user.id, task.organizationId);

  return (
    <div className="container-shell py-10 sm:py-14">
      <header className="flex flex-wrap items-end justify-between gap-5">
        <div className="max-w-3xl">
          <p className="eyebrow">{task.organization.name}</p>
          <h1 className="mt-2 text-3xl font-bold tracking-[-0.035em] sm:text-4xl">
            {task.title}
          </h1>
          <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-muted">
            <span>{ar ? task.aiEmployee.nameAr : task.aiEmployee.nameEn}</span>
            <span>·</span>
            <span>{task.status}</span>
            <span>·</span>
            <span className="inline-flex items-center gap-1">
              <Coins className="size-3.5" />
              {task.creditCost}
            </span>
          </div>
        </div>
        {!task.privateMode && task.status === "COMPLETED" ? (
          <Button asChild variant="outline">
            <Link
              href={`/${locale}/tasks/new?employee=${task.aiEmployeeId}&parent=${task.id}`}
            >
              <RefreshCw className="size-4" />
              {ar ? "تحسين النتيجة" : "Refine result"}
            </Link>
          </Button>
        ) : null}
      </header>

      <div className="mt-8 grid gap-5 lg:grid-cols-[1fr_18rem]">
        <section className="premium-card overflow-hidden">
          <div className="border-b p-5">
            <h2 className="font-bold">{ar ? "نتيجة المهمة" : "Task result"}</h2>
          </div>
          {task.privateMode ? (
            <div className="grid min-h-80 place-items-center p-8 text-center">
              <div>
                <LockKeyhole className="mx-auto size-10 text-muted" />
                <h3 className="mt-4 text-lg font-bold">
                  {ar ? "لم تُحفظ النتيجة" : "Result was not stored"}
                </h3>
                <p className="mt-2 text-sm text-muted">
                  {ar
                    ? "نُفذت المهمة بالوضع الخاص، لذا احتُفظ ببيانات تشغيل محدودة فقط."
                    : "This task used private mode, so only minimal operational metadata was retained."}
                </p>
              </div>
            </div>
          ) : task.result ? (
            <pre className="min-h-80 whitespace-pre-wrap p-5 font-[inherit] text-sm leading-8 sm:p-8">
              {task.result}
            </pre>
          ) : (
            <div className="grid min-h-80 place-items-center p-8 text-center">
              <div>
                <Bot className="mx-auto size-10 text-muted" />
                <h3 className="mt-4 font-bold">
                  {task.status === "FAILED"
                    ? ar
                      ? "فشلت المهمة ولم يُخصم الرصيد"
                      : "The task failed and no credits were charged"
                    : ar
                      ? "النتيجة غير متاحة"
                      : "Result unavailable"}
                </h3>
                {task.errorCode ? (
                  <p className="mt-2 text-xs text-muted">{task.errorCode}</p>
                ) : null}
              </div>
            </div>
          )}
        </section>

        <aside className="premium-card h-fit p-5">
          <h2 className="font-bold">{ar ? "الموظف المسؤول" : "Assigned employee"}</h2>
          <p className="mt-2 text-sm font-semibold">
            {ar ? task.aiEmployee.nameAr : task.aiEmployee.nameEn}
          </p>
          <p className="mt-2 text-xs leading-6 text-muted">
            {ar ? task.aiEmployee.purposeAr : task.aiEmployee.purposeEn}
          </p>
          <div className="mt-5 border-t pt-4 text-xs text-muted">
            <p>
              {ar ? "أنشأها" : "Created by"}:{" "}
              {task.createdBy.profile?.displayName ?? (ar ? "عضو الفريق" : "Team member")}
            </p>
            {task.completedAt ? (
              <p className="mt-2">
                {new Intl.DateTimeFormat(ar ? "ar-SA" : "en", {
                  dateStyle: "medium",
                  timeStyle: "short",
                }).format(task.completedAt)}
              </p>
            ) : null}
          </div>
        </aside>
      </div>
    </div>
  );
}
