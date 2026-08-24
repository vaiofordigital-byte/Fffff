import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Coins, CreditCard, RefreshCw } from "lucide-react";
import { BillingManager } from "@/components/billing/billing-manager";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { isLocale, type Locale } from "@/lib/i18n";
import {
  getOrganizationMembership,
  hasOrganizationRole,
} from "@/lib/organizations";
import { formatMoney } from "@/lib/utils";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Billing",
  robots: { index: false, follow: false },
};

export default async function BillingPage({
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
  const subscription = await db.subscription.findFirst({
    where: {
      organizationId: membership.organizationId,
      status: { in: ["ACTIVE", "TRIALING", "PAST_DUE", "PAUSED"] },
    },
    orderBy: { createdAt: "desc" },
    include: { plan: true },
  });

  return (
    <div className="container-shell py-10 sm:py-14">
      <header>
        <p className="eyebrow">{membership.organization.name}</p>
        <h1 className="mt-2 text-4xl font-bold tracking-[-0.04em]">
          {ar ? "الفوترة والاشتراك" : "Billing and subscription"}
        </h1>
      </header>

      {subscription ? (
        <section className="premium-card mt-8 overflow-hidden">
          <div className="flex flex-wrap items-start justify-between gap-5 border-b p-6 sm:p-8">
            <div>
              <p className="text-xs font-semibold text-intelligence">
                {subscription.status}
              </p>
              <h2 className="mt-2 text-2xl font-bold">
                {ar ? subscription.plan.nameAr : subscription.plan.nameEn}
              </h2>
              <p className="mt-2 text-sm text-muted">
                {subscription.interval === "MONTHLY"
                  ? formatMoney(
                      Number(subscription.plan.monthlyPrice),
                      subscription.plan.currency,
                      locale,
                    )
                  : formatMoney(
                      Number(subscription.plan.yearlyPrice),
                      subscription.plan.currency,
                      locale,
                    )}
                /{subscription.interval === "MONTHLY" ? (ar ? "شهر" : "month") : ar ? "سنة" : "year"}
              </p>
            </div>
            <span className="grid size-12 place-items-center rounded-2xl bg-[#eaf0ff] text-intelligence">
              <CreditCard className="size-5" />
            </span>
          </div>
          <div className="grid gap-5 p-6 sm:grid-cols-3 sm:p-8">
            <div>
              <p className="text-xs text-muted">{ar ? "الفترة الحالية" : "Current period"}</p>
              <p className="mt-2 text-sm font-semibold">
                {new Intl.DateTimeFormat(ar ? "ar-SA" : "en", {
                  dateStyle: "medium",
                }).format(subscription.currentPeriodEnd)}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted">{ar ? "الرصيد الشهري" : "Monthly credits"}</p>
              <p className="mt-2 flex items-center gap-2 text-sm font-semibold">
                <Coins className="size-4 text-intelligence" />
                {subscription.plan.monthlyCredits}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted">{ar ? "التجديد" : "Renewal"}</p>
              <p className="mt-2 flex items-center gap-2 text-sm font-semibold">
                <RefreshCw className="size-4 text-intelligence" />
                {subscription.cancelAtPeriodEnd
                  ? ar
                    ? "سيتوقف بنهاية الفترة"
                    : "Ends at period close"
                  : ar
                    ? "تلقائي عبر المزود"
                    : "Automatic through provider"}
              </p>
            </div>
          </div>
          <div className="border-t p-6 sm:p-8">
            <BillingManager
              locale={locale}
              organizationId={membership.organizationId}
              canCancel={
                hasOrganizationRole(membership.role, "OWNER") &&
                Boolean(subscription.providerSubscriptionId)
              }
              cancelAtPeriodEnd={subscription.cancelAtPeriodEnd}
            />
          </div>
        </section>
      ) : (
        <section className="premium-card mt-8 p-8 text-center">
          <CreditCard className="mx-auto size-10 text-muted" />
          <h2 className="mt-4 text-xl font-bold">
            {ar ? "لا يوجد اشتراك نشط" : "No active subscription"}
          </h2>
          <p className="mt-2 text-sm text-muted">
            {ar ? "اختر خطة بعد تهيئة بوابة دفع حقيقية." : "Choose a plan after a real payment gateway is configured."}
          </p>
        </section>
      )}
    </div>
  );
}
