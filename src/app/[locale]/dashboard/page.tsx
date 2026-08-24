import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  Bot,
  BrainCircuit,
  BriefcaseBusiness,
  CheckCircle2,
  Coins,
  Lightbulb,
  Plus,
  Sparkles,
} from "lucide-react";
import { LogoutButton } from "@/components/auth/logout-button";
import { WorkspaceNavigation } from "@/components/layout/workspace-navigation";
import { Button } from "@/components/ui/button";
import { requireUser } from "@/lib/auth";
import {
  calculateBusinessIntelligenceScore,
  deriveBusinessRecommendations,
} from "@/lib/business-intelligence";
import { db } from "@/lib/db";
import { isLocale, type Locale } from "@/lib/i18n";
import { getOrganizationMembership } from "@/lib/organizations";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Business operating system",
  robots: { index: false, follow: false },
};

export default async function DashboardPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: raw } = await params;
  const locale: Locale = isLocale(raw) ? raw : "ar";
  const ar = locale === "ar";
  const user = await requireUser(locale);
  if (!user.profile?.onboardingDone) redirect(`/${locale}/onboarding`);
  const membership = await getOrganizationMembership(user.id);
  if (!membership) redirect(`/${locale}/onboarding`);
  const organizationId = membership.organizationId;

  const [
    activeEmployees,
    recentTasks,
    knowledgeCount,
    projectCount,
    usage,
    subscription,
    score,
    recommendations,
  ] = await Promise.all([
    db.organizationAiEmployee.findMany({
      where: { organizationId, status: "ACTIVE" },
      orderBy: { activatedAt: "asc" },
      include: {
        aiEmployee: {
          select: {
            id: true,
            nameAr: true,
            nameEn: true,
            purposeAr: true,
            purposeEn: true,
            slug: true,
          },
        },
        _count: { select: { tasks: true } },
      },
    }),
    db.businessTask.findMany({
      where: { organizationId },
      orderBy: { createdAt: "desc" },
      take: 6,
      include: {
        aiEmployee: { select: { nameAr: true, nameEn: true } },
      },
    }),
    db.knowledgeEntry.count({
      where: { organizationId, approved: true },
    }),
    db.project.count({
      where: { organizationId, archived: false },
    }),
    db.aiUsageEvent.aggregate({
      where: { organizationId },
      _count: true,
      _sum: { creditAmount: true },
    }),
    db.subscription.findFirst({
      where: {
        OR: [{ organizationId }, { userId: user.id }],
        status: { in: ["ACTIVE", "TRIALING"] },
      },
      include: { plan: { select: { nameAr: true, nameEn: true } } },
    }),
    calculateBusinessIntelligenceScore(organizationId),
    deriveBusinessRecommendations(organizationId),
  ]);
  const Arrow = ar ? ArrowLeft : ArrowRight;
  const stats = [
    [Bot, ar ? "موظفون نشطون" : "Active employees", activeEmployees.length, "employees"],
    [BrainCircuit, ar ? "معرفة معتمدة" : "Approved knowledge", knowledgeCount, "brain"],
    [CheckCircle2, ar ? "مهام مكتملة" : "Completed tasks", recentTasks.filter((task) => task.status === "COMPLETED").length, "tasks"],
    [Coins, ar ? "رصيد مستخدم" : "Credits used", usage._sum.creditAmount ?? 0, "usage"],
  ] as const;

  return (
    <div className="container-shell py-10 sm:py-14">
      <header className="flex flex-wrap items-end justify-between gap-5">
        <div>
          <p className="eyebrow">{membership.organization.name}</p>
          <h1 className="mt-2 text-3xl font-bold tracking-[-0.035em] sm:text-4xl">
            {ar
              ? `مرحباً، ${user.profile?.displayName ?? "بك"}`
              : `Welcome, ${user.profile?.displayName ?? "back"}`}
          </h1>
          <p className="mt-2 text-sm text-muted">
            {subscription
              ? `${ar ? "الخطة" : "Plan"}: ${ar ? subscription.plan.nameAr : subscription.plan.nameEn}`
              : ar
                ? "لا يوجد اشتراك نشط"
                : "No active subscription"}
            {" · "}
            {projectCount} {ar ? "مشاريع" : "projects"}
          </p>
        </div>
        <div className="flex gap-2">
          <LogoutButton locale={locale} />
          <Button asChild variant="accent">
            <Link href={`/${locale}/tasks/new`}>
              <Plus className="size-4" />
              {ar ? "مهمة جديدة" : "New task"}
            </Link>
          </Button>
        </div>
      </header>
      <WorkspaceNavigation locale={locale} />

      <section className="mt-8 grid grid-cols-2 gap-3 lg:grid-cols-4" aria-label={ar ? "ملخص الشركة" : "Company summary"}>
        {stats.map(([Icon, label, value, href]) => (
          <Link
            key={label}
            href={`/${locale}/${href}`}
            className="premium-card group p-5 transition hover:-translate-y-0.5 hover:border-intelligence/35"
          >
            <div className="flex items-center justify-between">
              <span className="grid size-10 place-items-center rounded-xl bg-[#eaf0ff] text-intelligence">
                <Icon className="size-5" />
              </span>
              <Arrow className="size-4 text-muted transition group-hover:text-foreground" />
            </div>
            <strong className="mt-5 block text-2xl">{value}</strong>
            <span className="mt-1 block text-xs text-muted">{label}</span>
          </Link>
        ))}
      </section>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1.25fr_0.75fr]">
        <section className="premium-card overflow-hidden">
          <div className="flex min-h-16 items-center justify-between border-b px-5">
            <div>
              <h2 className="font-bold">{ar ? "فريق AI النشط" : "Active AI workforce"}</h2>
              <p className="text-xs text-muted">{ar ? "موظفون متخصصون، لا محادثة عامة" : "Specialists, not a generic chat"}</p>
            </div>
            <Button asChild variant="ghost" size="sm">
              <Link href={`/${locale}/employees`}>{ar ? "إدارة الفريق" : "Manage workforce"}</Link>
            </Button>
          </div>
          {activeEmployees.length ? (
            <div className="grid gap-3 p-5 sm:grid-cols-2">
              {activeEmployees.map((activation) => (
                <Link
                  key={activation.id}
                  href={`/${locale}/tasks/new?employee=${activation.aiEmployee.id}`}
                  className="rounded-2xl border bg-white p-5 transition hover:border-intelligence/40"
                >
                  <span className="grid size-9 place-items-center rounded-xl bg-[#eaf0ff] text-intelligence">
                    <Bot className="size-4" />
                  </span>
                  <h3 className="mt-4 font-bold">
                    {ar ? activation.aiEmployee.nameAr : activation.aiEmployee.nameEn}
                  </h3>
                  <p className="mt-2 line-clamp-2 text-xs leading-5 text-muted">
                    {ar ? activation.aiEmployee.purposeAr : activation.aiEmployee.purposeEn}
                  </p>
                  <p className="mt-3 text-[0.68rem] text-muted">
                    {activation._count.tasks} {ar ? "مهام" : "tasks"}
                  </p>
                </Link>
              ))}
            </div>
          ) : (
            <div className="p-10 text-center">
              <Bot className="mx-auto size-9 text-muted" />
              <h3 className="mt-4 font-bold">{ar ? "ابنِ فريقك الذكي" : "Build your AI workforce"}</h3>
              <p className="mt-2 text-sm text-muted">
                {ar ? "اختر موظفاً وفق أولويتك الحالية." : "Choose an employee for your current priority."}
              </p>
              <Button asChild variant="outline" className="mt-5">
                <Link href={`/${locale}/employees`}>{ar ? "عرض الموظفين" : "View employees"}</Link>
              </Button>
            </div>
          )}
        </section>

        <section className="premium-card overflow-hidden">
          <div className="border-b p-5">
            <div className="flex items-center justify-between">
              <h2 className="font-bold">{ar ? "مؤشر ذكاء الأعمال" : "Business Intelligence Score"}</h2>
              <span className="rounded-full bg-[#eaf0ff] px-3 py-1 text-sm font-bold text-intelligence">
                {score.score}/100
              </span>
            </div>
            <div className="mt-4 h-2 overflow-hidden rounded-full bg-surface-soft">
              <div className="h-full rounded-full bg-intelligence" style={{ width: `${score.score}%` }} />
            </div>
          </div>
          <div className="grid gap-3 p-5">
            {score.dimensions.map((dimension) => (
              <div key={dimension.key} className="flex items-center justify-between text-xs">
                <span className="text-muted">{ar ? dimension.labelAr : dimension.labelEn}</span>
                <strong>{dimension.score}/20</strong>
              </div>
            ))}
            <p className="mt-2 border-t pt-4 text-[0.68rem] leading-5 text-muted">
              {ar ? score.disclaimerAr : score.disclaimerEn}
            </p>
          </div>
        </section>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1.25fr_0.75fr]">
        <section className="premium-card overflow-hidden">
          <div className="flex min-h-16 items-center justify-between border-b px-5">
            <div>
              <h2 className="font-bold">{ar ? "آخر المهام" : "Recent tasks"}</h2>
              <p className="text-xs text-muted">{usage._count} {ar ? "طلبات AI مسجلة" : "tracked AI requests"}</p>
            </div>
            <Button asChild variant="ghost" size="sm">
              <Link href={`/${locale}/tasks`}>{ar ? "عرض الكل" : "View all"}</Link>
            </Button>
          </div>
          {recentTasks.length ? (
            <div className="divide-y">
              {recentTasks.map((task) => (
                <Link
                  key={task.id}
                  href={`/${locale}/tasks/${task.id}`}
                  className="flex items-center gap-4 p-5 hover:bg-surface-soft/50"
                >
                  <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-surface-soft">
                    <BriefcaseBusiness className="size-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <h3 className="truncate text-sm font-semibold">{task.title}</h3>
                    <p className="mt-1 text-xs text-muted">
                      {ar ? task.aiEmployee.nameAr : task.aiEmployee.nameEn}
                    </p>
                  </div>
                  <span className="text-xs font-semibold">{task.status}</span>
                </Link>
              ))}
            </div>
          ) : (
            <p className="p-8 text-center text-sm text-muted">
              {ar ? "لا توجد مهام بعد." : "No tasks yet."}
            </p>
          )}
        </section>

        <section className="premium-card overflow-hidden">
          <div className="flex items-center gap-3 border-b p-5">
            <Lightbulb className="size-5 text-intelligence" />
            <div>
              <h2 className="font-bold">{ar ? "توصيات مبنية على بياناتك" : "Data-based recommendations"}</h2>
              <p className="text-xs text-muted">{ar ? "لا نختلق رؤى" : "No fabricated insights"}</p>
            </div>
          </div>
          {recommendations.length ? (
            <div className="divide-y">
              {recommendations.slice(0, 4).map((recommendation) => (
                <div key={recommendation.key} className="p-5">
                  <h3 className="text-sm font-semibold">
                    {ar ? recommendation.titleAr : recommendation.titleEn}
                  </h3>
                  <p className="mt-2 text-xs leading-6 text-muted">
                    {ar ? recommendation.bodyAr : recommendation.bodyEn}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center">
              <Sparkles className="mx-auto size-7 text-success" />
              <p className="mt-3 text-sm text-muted">
                {ar ? "لا توجد فجوات مؤكدة حالياً." : "No evidence-based gaps detected right now."}
              </p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
