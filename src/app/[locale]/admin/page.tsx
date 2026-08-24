import type { Metadata } from "next";
import Link from "next/link";
import {
  AlertTriangle,
  Bot,
  Building2,
  Coins,
  CreditCard,
  ShieldCheck,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { requireRole } from "@/lib/auth";
import { db } from "@/lib/db";
import { isLocale, type Locale } from "@/lib/i18n";
import { formatMoney } from "@/lib/utils";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "EVELIA Administration",
  robots: { index: false, follow: false },
};

export default async function AdminDashboardPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: raw } = await params;
  const locale: Locale = isLocale(raw) ? raw : "ar";
  const ar = locale === "ar";
  const user = await requireRole("ADMINISTRATOR", locale);
  // Request-time operational window, not a client render value.
  // eslint-disable-next-line react-hooks/purity
  const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const [
    users,
    organizations,
    subscriptions,
    paidOrders,
    aiUsage,
    activeEmployees,
    popularEmployees,
    failedTasks,
    recentOrganizations,
  ] = await Promise.all([
    db.user.count({ where: { status: "ACTIVE" } }),
    db.organization.count({ where: { status: "ACTIVE" } }),
    db.subscription.count({ where: { status: "ACTIVE" } }),
    db.order.aggregate({
      where: { status: "PAID" },
      _count: true,
      _sum: { total: true },
    }),
    db.aiUsageEvent.aggregate({
      _count: true,
      _sum: { creditAmount: true, estimatedCost: true },
    }),
    db.organizationAiEmployee.count({ where: { status: "ACTIVE" } }),
    db.aiUsageEvent.groupBy({
      by: ["aiEmployeeId"],
      where: { aiEmployeeId: { not: null } },
      _count: true,
      orderBy: { _count: { aiEmployeeId: "desc" } },
      take: 5,
    }),
    db.businessTask.count({
      where: {
        status: { in: ["FAILED", "MODERATED"] },
        createdAt: { gte: dayAgo },
      },
    }),
    db.organization.findMany({
      orderBy: { createdAt: "desc" },
      take: 8,
      include: {
        _count: {
          select: {
            members: true,
            businessTasks: true,
            knowledgeEntries: true,
          },
        },
      },
    }),
  ]);
  const employeeIds = popularEmployees
    .map((item) => item.aiEmployeeId)
    .filter((value): value is string => Boolean(value));
  const employeeNames = await db.aiEmployee.findMany({
    where: { id: { in: employeeIds } },
    select: { id: true, nameAr: true, nameEn: true },
  });
  const names = new Map(employeeNames.map((employee) => [employee.id, employee]));
  const stats = [
    [Users, ar ? "المستخدمون النشطون" : "Active users", users],
    [Building2, ar ? "الشركات النشطة" : "Active companies", organizations],
    [CreditCard, ar ? "الاشتراكات النشطة" : "Active subscriptions", subscriptions],
    [Bot, ar ? "تفعيلات الموظفين" : "Employee activations", activeEmployees],
  ] as const;

  return (
    <div className="container-shell py-10 sm:py-14">
      <header className="flex flex-wrap items-end justify-between gap-5">
        <div>
          <p className="eyebrow">{ar ? "مركز تحكم الأعمال والذكاء" : "Business and intelligence control center"}</p>
          <h1 className="mt-2 text-4xl font-bold tracking-[-0.04em]">
            {ar ? "إدارة EVELIA" : "EVELIA Administration"}
          </h1>
          <p className="mt-2 text-sm text-muted">
            {user.email} · {user.role}
          </p>
        </div>
        <Button asChild variant="accent">
          <Link href={`/${locale}/admin/ai`}>
            <Bot className="size-4" />
            {ar ? "إدارة AI" : "Manage AI"}
          </Link>
        </Button>
      </header>

      <section className="mt-8 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {stats.map(([Icon, label, value]) => (
          <div key={label} className="premium-card p-5">
            <Icon className="size-5 text-intelligence" />
            <strong className="mt-5 block text-2xl">{value}</strong>
            <p className="mt-1 text-xs text-muted">{label}</p>
          </div>
        ))}
      </section>

      <section className="mt-6 grid gap-3 sm:grid-cols-3">
        <div className="premium-card p-5">
          <Coins className="size-5 text-intelligence" />
          <p className="mt-4 text-xs text-muted">{ar ? "طلبات AI المسجلة" : "Tracked AI requests"}</p>
          <strong className="mt-1 block text-2xl">{aiUsage._count}</strong>
          <p className="mt-1 text-xs text-muted">
            {aiUsage._sum.creditAmount ?? 0} {ar ? "رصيد مستخدم" : "credits used"}
          </p>
        </div>
        <div className="premium-card p-5">
          <CreditCard className="size-5 text-success" />
          <p className="mt-4 text-xs text-muted">{ar ? "الإيراد المؤكد" : "Confirmed revenue"}</p>
          <strong className="mt-1 block text-2xl">
            {formatMoney(Number(paidOrders._sum.total ?? 0), "SAR", locale)}
          </strong>
          <p className="mt-1 text-xs text-muted">{paidOrders._count} {ar ? "طلبات مدفوعة" : "paid orders"}</p>
        </div>
        <div className="premium-card p-5">
          <AlertTriangle className={`size-5 ${failedTasks ? "text-danger" : "text-success"}`} />
          <p className="mt-4 text-xs text-muted">{ar ? "فشل خلال 24 ساعة" : "Failures in 24 hours"}</p>
          <strong className="mt-1 block text-2xl">{failedTasks}</strong>
          <p className="mt-1 text-xs text-muted">
            {ar ? "لا يشمل محتوى المهام الخاصة" : "Private task content is excluded"}
          </p>
        </div>
      </section>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1.25fr_0.75fr]">
        <section className="premium-card overflow-hidden">
          <div className="border-b p-5">
            <h2 className="font-bold">{ar ? "أحدث الشركات" : "Recent companies"}</h2>
          </div>
          {recentOrganizations.length ? (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[42rem] text-sm">
                <thead className="bg-surface-soft/60 text-xs text-muted">
                  <tr>
                    <th className="px-5 py-3 text-start">{ar ? "الشركة" : "Company"}</th>
                    <th className="px-5 py-3 text-start">{ar ? "القطاع" : "Industry"}</th>
                    <th className="px-5 py-3 text-start">{ar ? "الأعضاء" : "Members"}</th>
                    <th className="px-5 py-3 text-start">{ar ? "المهام" : "Tasks"}</th>
                    <th className="px-5 py-3 text-start">{ar ? "المعرفة" : "Knowledge"}</th>
                    <th className="px-5 py-3 text-start">{ar ? "الحالة" : "Status"}</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {recentOrganizations.map((organization) => (
                    <tr key={organization.id}>
                      <td className="px-5 py-4 font-semibold">{organization.name}</td>
                      <td className="px-5 py-4 text-muted">{organization.industry ?? "—"}</td>
                      <td className="px-5 py-4">{organization._count.members}</td>
                      <td className="px-5 py-4">{organization._count.businessTasks}</td>
                      <td className="px-5 py-4">{organization._count.knowledgeEntries}</td>
                      <td className="px-5 py-4">{organization.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="p-8 text-center text-sm text-muted">
              {ar ? "لا توجد شركات بعد." : "No companies yet."}
            </p>
          )}
        </section>

        <section className="premium-card overflow-hidden">
          <div className="flex items-center gap-3 border-b p-5">
            <ShieldCheck className="size-5 text-intelligence" />
            <div>
              <h2 className="font-bold">{ar ? "الموظفون الأكثر استخداماً" : "Most-used AI employees"}</h2>
              <p className="text-xs text-muted">{ar ? "من الاستخدام الفعلي فقط" : "Actual usage only"}</p>
            </div>
          </div>
          {popularEmployees.length ? (
            <div className="divide-y">
              {popularEmployees.map((item) => {
                const employee = item.aiEmployeeId
                  ? names.get(item.aiEmployeeId)
                  : null;
                return (
                  <div key={item.aiEmployeeId} className="flex items-center justify-between gap-3 p-5 text-sm">
                    <span>{employee ? (ar ? employee.nameAr : employee.nameEn) : "—"}</span>
                    <strong>{item._count}</strong>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="p-8 text-center text-sm text-muted">
              {ar ? "لا يوجد استخدام بعد." : "No usage yet."}
            </p>
          )}
        </section>
      </div>
    </div>
  );
}
