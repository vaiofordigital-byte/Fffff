import type { Metadata } from "next";
import Link from "next/link";
import { Bot, CheckCircle2, CircleDashed, Plus, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { isLocale, type Locale } from "@/lib/i18n";
import { getOrganizationMembership } from "@/lib/organizations";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Business tasks",
  robots: { index: false, follow: false },
};

export default async function TasksPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: raw } = await params;
  const locale: Locale = isLocale(raw) ? raw : "ar";
  const ar = locale === "ar";
  const user = await requireUser(locale);
  const membership = await getOrganizationMembership(user.id);
  if (!membership) redirect(`/${locale}/onboarding`);
  const tasks = await db.businessTask.findMany({
    where: { organizationId: membership.organizationId },
    orderBy: { createdAt: "desc" },
    take: 100,
    include: {
      aiEmployee: {
        select: { nameAr: true, nameEn: true },
      },
      createdBy: {
        select: { profile: { select: { displayName: true } } },
      },
    },
  });

  return (
    <div className="container-shell py-10 sm:py-14">
      <header className="flex flex-wrap items-end justify-between gap-5">
        <div>
          <p className="eyebrow">{membership.organization.name}</p>
          <h1 className="mt-2 text-4xl font-bold tracking-[-0.04em]">
            {ar ? "مهام فريق AI" : "AI workforce tasks"}
          </h1>
          <p className="mt-3 text-sm text-muted">
            {ar ? "نتائج محفوظة، تكلفة واضحة، وسجل قابل للمراجعة." : "Saved outputs, transparent usage and a reviewable history."}
          </p>
        </div>
        <Button asChild variant="accent">
          <Link href={`/${locale}/tasks/new`}>
            <Plus className="size-4" />
            {ar ? "مهمة جديدة" : "New task"}
          </Link>
        </Button>
      </header>

      {tasks.length ? (
        <div className="mt-8 overflow-hidden rounded-2xl border bg-white/70">
          <div className="divide-y">
            {tasks.map((task) => (
              <Link
                key={task.id}
                href={`/${locale}/tasks/${task.id}`}
                className="flex items-center gap-4 p-4 transition hover:bg-surface-soft/60 sm:p-5"
              >
                <span
                  className={`grid size-10 shrink-0 place-items-center rounded-xl ${
                    task.status === "COMPLETED"
                      ? "bg-[#e8f3ed] text-success"
                      : task.status === "FAILED" || task.status === "MODERATED"
                        ? "bg-red-50 text-danger"
                        : "bg-[#eaf0ff] text-intelligence"
                  }`}
                >
                  {task.status === "COMPLETED" ? (
                    <CheckCircle2 className="size-5" />
                  ) : task.privateMode ? (
                    <Shield className="size-4" />
                  ) : (
                    <CircleDashed className="size-5" />
                  )}
                </span>
                <div className="min-w-0 flex-1">
                  <h2 className="truncate text-sm font-semibold">{task.title}</h2>
                  <p className="mt-1 text-xs text-muted">
                    {ar ? task.aiEmployee.nameAr : task.aiEmployee.nameEn} ·{" "}
                    {new Intl.DateTimeFormat(ar ? "ar-SA" : "en", {
                      dateStyle: "medium",
                      timeStyle: "short",
                    }).format(task.createdAt)}
                  </p>
                </div>
                <div className="text-end">
                  <p className="text-xs font-semibold">{task.status}</p>
                  <p className="mt-1 text-[0.68rem] text-muted">
                    {task.creditCost} {ar ? "رصيد" : "credits"}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      ) : (
        <div className="premium-card mt-8 p-10 text-center">
          <Bot className="mx-auto size-10 text-muted" />
          <h2 className="mt-4 text-xl font-bold">
            {ar ? "لم تُنفذ مهام بعد" : "No tasks have run yet"}
          </h2>
          <p className="mt-2 text-sm text-muted">
            {ar ? "فعّل موظفاً ذكيًا وأسند إليه أول نتيجة عمل." : "Activate an AI employee and assign the first business outcome."}
          </p>
        </div>
      )}
    </div>
  );
}
