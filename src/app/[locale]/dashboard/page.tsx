import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  Coins,
  FolderKanban,
  Heart,
  Library,
  Plus,
  Sparkles,
} from "lucide-react";
import { LogoutButton } from "@/components/auth/logout-button";
import { Button } from "@/components/ui/button";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { isLocale, type Locale } from "@/lib/i18n";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Workspace",
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
  const [entitlements, projects, favorites, generations, subscription, notifications] =
    await Promise.all([
      db.entitlement.count({
        where: {
          userId: user.id,
          revokedAt: null,
          OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
        },
      }),
      db.project.count({ where: { userId: user.id, archived: false } }),
      db.favorite.count({ where: { userId: user.id } }),
      db.generatedPrompt.findMany({
        where: { userId: user.id, privateMode: false },
        orderBy: { updatedAt: "desc" },
        take: 5,
        select: {
          id: true,
          title: true,
          mode: true,
          qualityScore: true,
          status: true,
          updatedAt: true,
        },
      }),
      db.subscription.findFirst({
        where: { userId: user.id, status: { in: ["ACTIVE", "TRIALING"] } },
        include: { plan: { select: { nameAr: true, nameEn: true } } },
      }),
      db.notification.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: "desc" },
        take: 4,
      }),
    ]);
  const Arrow = ar ? ArrowLeft : ArrowRight;
  const stats = [
    [Library, ar ? "أصول الخزنة" : "Vault assets", entitlements, "vault"],
    [Coins, ar ? "الرصيد" : "Credits", user.creditAccount?.balance ?? 0, "pricing"],
    [FolderKanban, ar ? "المشاريع" : "Projects", projects, "projects"],
    [Heart, ar ? "المفضلة" : "Favorites", favorites, "vault?tab=favorites"],
  ] as const;

  return (
    <div className="container-shell py-10 sm:py-14">
      <header className="flex flex-wrap items-end justify-between gap-5">
        <div>
          <p className="eyebrow">{ar ? "مركز القيادة" : "Command center"}</p>
          <h1 className="mt-2 text-3xl font-bold tracking-[-0.035em] sm:text-4xl">
            {ar
              ? `مرحباً، ${user.profile?.displayName ?? "بك"}`
              : `Welcome, ${user.profile?.displayName ?? "back"}`}
          </h1>
          <p className="mt-2 text-sm text-muted">
            {subscription
              ? `${ar ? "خطتك" : "Your plan"}: ${ar ? subscription.plan.nameAr : subscription.plan.nameEn}`
              : ar
                ? "الخطة المجانية"
                : "Free plan"}
          </p>
        </div>
        <div className="flex gap-2">
          <LogoutButton locale={locale} />
          <Button asChild variant="accent">
            <Link href={`/${locale}/architect`}>
              <Plus className="size-4" />
              {ar ? "إنشاء برومبت" : "Create prompt"}
            </Link>
          </Button>
        </div>
      </header>

      <section className="mt-8 grid grid-cols-2 gap-3 lg:grid-cols-4" aria-label={ar ? "ملخص الحساب" : "Account summary"}>
        {stats.map(([Icon, label, value, href]) => (
          <Link
            key={label}
            href={`/${locale}/${href}`}
            className="premium-card group p-5 transition hover:-translate-y-0.5 hover:border-accent/35"
          >
            <div className="flex items-center justify-between">
              <span className="grid size-10 place-items-center rounded-xl bg-surface-soft">
                <Icon className="size-5" />
              </span>
              <Arrow className="size-4 text-muted transition group-hover:text-foreground" />
            </div>
            <strong className="mt-5 block text-2xl">{value}</strong>
            <span className="mt-1 block text-xs text-muted">{label}</span>
          </Link>
        ))}
      </section>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1.4fr_0.8fr]">
        <section className="premium-card overflow-hidden">
          <div className="flex min-h-16 items-center justify-between border-b px-5">
            <div>
              <h2 className="font-bold">{ar ? "آخر البرومبتات" : "Recent prompts"}</h2>
              <p className="text-xs text-muted">{ar ? "الأصول التي عملت عليها" : "Assets you worked on"}</p>
            </div>
            <Button asChild variant="ghost" size="sm">
              <Link href={`/${locale}/vault`}>{ar ? "عرض الخزنة" : "Open Vault"}</Link>
            </Button>
          </div>
          {generations.length ? (
            <div className="divide-y">
              {generations.map((generation) => (
                <Link
                  key={generation.id}
                  href={`/${locale}/lab?prompt=${generation.id}`}
                  className="flex items-center gap-4 p-5 transition hover:bg-surface-soft/55"
                >
                  <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-[#ecf0ff] text-intelligence">
                    <Sparkles className="size-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <h3 className="truncate text-sm font-semibold">{generation.title}</h3>
                    <p className="mt-1 text-xs text-muted">
                      {generation.mode} ·{" "}
                      {new Intl.DateTimeFormat(ar ? "ar-SA" : "en", {
                        dateStyle: "medium",
                      }).format(generation.updatedAt)}
                    </p>
                  </div>
                  {generation.qualityScore ? (
                    <span className="rounded-full bg-surface-soft px-2.5 py-1 text-xs">
                      {generation.qualityScore}
                    </span>
                  ) : null}
                </Link>
              ))}
            </div>
          ) : (
            <div className="p-10 text-center">
              <Sparkles className="mx-auto size-8 text-muted" />
              <h3 className="mt-4 font-bold">{ar ? "مساحتك جاهزة" : "Your workspace is ready"}</h3>
              <p className="mt-2 text-sm text-muted">
                {ar ? "أنشئ أول برومبت احترافي ليظهر هنا." : "Create your first professional prompt to see it here."}
              </p>
              <Button asChild variant="outline" className="mt-5">
                <Link href={`/${locale}/architect`}>{ar ? "ابدأ الآن" : "Start now"}</Link>
              </Button>
            </div>
          )}
        </section>

        <section className="premium-card overflow-hidden">
          <div className="border-b p-5">
            <h2 className="font-bold">{ar ? "الإشعارات" : "Notifications"}</h2>
          </div>
          {notifications.length ? (
            <div className="divide-y">
              {notifications.map((notification) => (
                <div key={notification.id} className="p-5">
                  <h3 className="text-sm font-semibold">
                    {ar ? notification.titleAr : notification.titleEn}
                  </h3>
                  <p className="mt-1 text-xs leading-5 text-muted">
                    {ar ? notification.bodyAr : notification.bodyEn}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="p-8 text-center text-sm text-muted">
              {ar ? "لا توجد إشعارات جديدة." : "No new notifications."}
            </p>
          )}
        </section>
      </div>
    </div>
  );
}
