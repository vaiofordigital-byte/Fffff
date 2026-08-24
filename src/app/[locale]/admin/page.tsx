import type { Metadata } from "next";
import Link from "next/link";
import {
  AlertTriangle,
  Coins,
  FilePlus2,
  Package,
  ReceiptText,
  Sparkles,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { requireRole } from "@/lib/auth";
import { db } from "@/lib/db";
import { isLocale, type Locale } from "@/lib/i18n";
import { formatMoney } from "@/lib/utils";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Administration",
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
  const [
    productCount,
    userCount,
    paidOrders,
    activeSubscriptions,
    failedGenerations,
    recentOrders,
    zeroSearches,
  ] = await Promise.all([
    db.product.count({ where: { status: "PUBLISHED" } }),
    db.user.count({ where: { status: "ACTIVE" } }),
    db.order.aggregate({
      where: { status: "PAID" },
      _count: true,
      _sum: { total: true },
    }),
    db.subscription.count({ where: { status: "ACTIVE" } }),
    db.generatedPrompt.count({
      where: { status: "FAILED", createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } },
    }),
    db.order.findMany({
      orderBy: { createdAt: "desc" },
      take: 8,
      select: {
        id: true,
        number: true,
        status: true,
        total: true,
        currency: true,
        createdAt: true,
        user: { select: { email: true } },
      },
    }),
    db.searchEvent.groupBy({
      by: ["normalizedQuery"],
      where: { resultCount: 0, normalizedQuery: { not: null } },
      _count: true,
      orderBy: { _count: { normalizedQuery: "desc" } },
      take: 5,
    }),
  ]);
  const stats = [
    [Package, ar ? "منتجات منشورة" : "Published products", productCount],
    [Users, ar ? "عملاء نشطون" : "Active customers", userCount],
    [ReceiptText, ar ? "طلبات مدفوعة" : "Paid orders", paidOrders._count],
    [Sparkles, ar ? "اشتراكات نشطة" : "Active subscriptions", activeSubscriptions],
  ] as const;

  return (
    <div className="container-shell py-10 sm:py-14">
      <header className="flex flex-wrap items-end justify-between gap-5">
        <div>
          <p className="eyebrow">{ar ? "نظام تشغيل الأعمال" : "Business operating system"}</p>
          <h1 className="mt-2 text-4xl font-bold tracking-[-0.04em]">
            {ar ? "لوحة الإدارة" : "Administration"}
          </h1>
          <p className="mt-2 text-sm text-muted">
            {user.email} · {user.role}
          </p>
        </div>
        <Button asChild variant="accent">
          <Link href={`/${locale}/admin/products/new`}>
            <FilePlus2 className="size-4" />
            {ar ? "منتج جديد" : "New product"}
          </Link>
        </Button>
      </header>

      <section className="mt-8 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {stats.map(([Icon, label, value]) => (
          <div key={label} className="premium-card p-5">
            <Icon className="size-5 text-accent-strong" />
            <strong className="mt-5 block text-2xl">{value}</strong>
            <p className="mt-1 text-xs text-muted">{label}</p>
          </div>
        ))}
      </section>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1.4fr_0.8fr]">
        <section className="premium-card overflow-hidden">
          <div className="flex items-center justify-between border-b p-5">
            <div>
              <h2 className="font-bold">{ar ? "آخر الطلبات" : "Recent orders"}</h2>
              <p className="text-xs text-muted">
                {ar ? "الإيراد المؤكد فقط" : "Confirmed revenue only"}:{" "}
                {formatMoney(Number(paidOrders._sum.total ?? 0), "SAR", locale)}
              </p>
            </div>
          </div>
          {recentOrders.length ? (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[38rem] text-start text-sm">
                <thead className="bg-surface-soft/60 text-xs text-muted">
                  <tr>
                    <th className="px-5 py-3 text-start">{ar ? "الطلب" : "Order"}</th>
                    <th className="px-5 py-3 text-start">{ar ? "العميل" : "Customer"}</th>
                    <th className="px-5 py-3 text-start">{ar ? "الحالة" : "Status"}</th>
                    <th className="px-5 py-3 text-start">{ar ? "الإجمالي" : "Total"}</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {recentOrders.map((order) => (
                    <tr key={order.id}>
                      <td className="px-5 py-4 font-medium" dir="ltr">{order.number}</td>
                      <td className="px-5 py-4 text-muted">{order.user.email}</td>
                      <td className="px-5 py-4">{order.status}</td>
                      <td className="px-5 py-4">
                        {formatMoney(Number(order.total), order.currency, locale)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="p-8 text-center text-sm text-muted">
              {ar ? "لا توجد طلبات بعد." : "No orders yet."}
            </p>
          )}
        </section>

        <div className="grid gap-6">
          <section className="premium-card p-5">
            <div className="flex items-center gap-3">
              <AlertTriangle className={`size-5 ${failedGenerations ? "text-danger" : "text-success"}`} />
              <div>
                <h2 className="font-bold">{ar ? "صحة AI" : "AI health"}</h2>
                <p className="text-xs text-muted">
                  {failedGenerations} {ar ? "فشل خلال 24 ساعة" : "failures in 24 hours"}
                </p>
              </div>
            </div>
          </section>

          <section className="premium-card p-5">
            <div className="flex items-center gap-3">
              <Coins className="size-5 text-accent-strong" />
              <h2 className="font-bold">{ar ? "فجوات البحث" : "Search gaps"}</h2>
            </div>
            {zeroSearches.length ? (
              <ul className="mt-4 grid gap-3 text-xs">
                {zeroSearches.map((item) => (
                  <li key={item.normalizedQuery} className="flex justify-between gap-3">
                    <span className="truncate text-muted">{item.normalizedQuery}</span>
                    <strong>{item._count}</strong>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-4 text-xs leading-6 text-muted">
                {ar ? "لا توجد عمليات بحث صفرية مسجلة." : "No zero-result searches recorded."}
              </p>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
