import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Bot, Coins, Gauge, ReceiptText } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { isLocale, type Locale } from "@/lib/i18n";
import { getOrganizationMembership } from "@/lib/organizations";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "AI usage",
  robots: { index: false, follow: false },
};

export default async function UsagePage({
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
  const [events, summary, employeeUsage] = await Promise.all([
    db.aiUsageEvent.findMany({
      where: { organizationId: membership.organizationId },
      orderBy: { createdAt: "desc" },
      take: 100,
      include: {
        aiEmployee: { select: { nameAr: true, nameEn: true } },
      },
    }),
    db.aiUsageEvent.aggregate({
      where: { organizationId: membership.organizationId },
      _count: true,
      _sum: { creditAmount: true, estimatedCost: true },
    }),
    db.aiUsageEvent.groupBy({
      by: ["aiEmployeeId"],
      where: {
        organizationId: membership.organizationId,
        aiEmployeeId: { not: null },
      },
      _count: true,
      _sum: { creditAmount: true },
      orderBy: { _count: { aiEmployeeId: "desc" } },
    }),
  ]);

  return (
    <div className="container-shell py-10 sm:py-14">
      <header>
        <p className="eyebrow">{membership.organization.name}</p>
        <h1 className="mt-2 text-4xl font-bold tracking-[-0.04em]">
          {ar ? "استخدام الذكاء الاصطناعي" : "AI usage"}
        </h1>
        <p className="mt-3 text-sm text-muted">
          {ar ? "كل طلب وتكلفة ورصيد في سجل واضح." : "Every request, cost and credit in a transparent ledger."}
        </p>
      </header>

      <section className="mt-8 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          [Gauge, ar ? "طلبات AI" : "AI requests", summary._count],
          [Coins, ar ? "الرصيد المستخدم" : "Credits used", summary._sum.creditAmount ?? 0],
          [Bot, ar ? "موظفون مستخدمون" : "Employees used", employeeUsage.length],
          [ReceiptText, ar ? "الرصيد المتبقي" : "Credit balance", user.creditAccount?.balance ?? 0],
        ].map(([Icon, label, value]) => {
          const ItemIcon = Icon as typeof Gauge;
          return (
            <div key={String(label)} className="premium-card p-5">
              <ItemIcon className="size-5 text-intelligence" />
              <strong className="mt-5 block text-2xl">{String(value)}</strong>
              <span className="mt-1 block text-xs text-muted">{String(label)}</span>
            </div>
          );
        })}
      </section>

      <section className="premium-card mt-6 overflow-hidden">
        <div className="border-b p-5">
          <h2 className="font-bold">{ar ? "سجل الطلبات" : "Request history"}</h2>
        </div>
        {events.length ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[42rem] text-sm">
              <thead className="bg-surface-soft/60 text-xs text-muted">
                <tr>
                  <th className="px-5 py-3 text-start">{ar ? "الموظف" : "Employee"}</th>
                  <th className="px-5 py-3 text-start">{ar ? "النوع" : "Type"}</th>
                  <th className="px-5 py-3 text-start">{ar ? "الحالة" : "Status"}</th>
                  <th className="px-5 py-3 text-start">{ar ? "الرصيد" : "Credits"}</th>
                  <th className="px-5 py-3 text-start">{ar ? "التاريخ" : "Date"}</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {events.map((event) => (
                  <tr key={event.id}>
                    <td className="px-5 py-4">
                      {event.aiEmployee
                        ? ar
                          ? event.aiEmployee.nameAr
                          : event.aiEmployee.nameEn
                        : "—"}
                    </td>
                    <td className="px-5 py-4 text-muted">{event.requestType}</td>
                    <td className="px-5 py-4">{event.status}</td>
                    <td className="px-5 py-4">{event.creditAmount}</td>
                    <td className="px-5 py-4 text-muted">
                      {new Intl.DateTimeFormat(ar ? "ar-SA" : "en", {
                        dateStyle: "medium",
                        timeStyle: "short",
                      }).format(event.createdAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="p-8 text-center text-sm text-muted">
            {ar ? "لا يوجد استخدام مسجل بعد." : "No usage recorded yet."}
          </p>
        )}
      </section>
    </div>
  );
}
