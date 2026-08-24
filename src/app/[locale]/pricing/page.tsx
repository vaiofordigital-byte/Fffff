import type { Metadata } from "next";
import { Check, Sparkles } from "lucide-react";
import { SubscribeButton } from "@/components/billing/subscribe-button";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { isLocale, type Locale } from "@/lib/i18n";
import { getOrganizationMembership } from "@/lib/organizations";
import { paymentAdapter } from "@/lib/payments/adapter";
import { formatMoney } from "@/lib/utils";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale: raw } = await params;
  const locale = isLocale(raw) ? raw : "ar";
  return {
    title: locale === "ar" ? "خطط واضحة للنمو" : "Transparent plans",
    description:
      locale === "ar"
        ? "خطط EVELIA للشركات من أول موظف ذكي إلى فريق مؤسسي كامل."
        : "EVELIA plans from the first AI employee to a complete enterprise workforce.",
  };
}

export default async function PricingPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: raw } = await params;
  const locale: Locale = isLocale(raw) ? raw : "ar";
  const ar = locale === "ar";
  const [plans, user] = await Promise.all([
    db.plan.findMany({
      where: { active: true },
      orderBy: { sortOrder: "asc" },
    }),
    getCurrentUser(),
  ]);
  const membership = user ? await getOrganizationMembership(user.id) : null;
  let paymentsAvailable = false;
  try {
    paymentsAvailable = paymentAdapter().available;
  } catch {
    paymentsAvailable = false;
  }

  return (
    <div className="container-shell py-14 sm:py-20">
      <header className="mx-auto max-w-3xl text-center">
        <p className="eyebrow justify-center">
          <Sparkles className="size-4" />
          {ar ? "قيمة واضحة. بلا وعود وهمية." : "Clear value. No inflated promises."}
        </p>
        <h1 className="text-balance mt-4 text-4xl font-bold tracking-[-0.04em] sm:text-6xl">
          {ar ? "اختر مساحة العمل التي تناسب طموحك" : "Choose the workspace that fits your ambition"}
        </h1>
        <p className="mt-5 text-base leading-8 text-muted">
          {ar ? "تُدار الأسعار والحدود والرصيد بالكامل من لوحة الإدارة." : "Pricing, limits and credits are fully controlled from administration."}
        </p>
      </header>

      {plans.length ? (
        <div className="mt-12 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {plans.map((plan, index) => {
            const features = Array.isArray(plan.features)
              ? (plan.features as Array<{ ar?: string; en?: string }>)
              : [];
            const featured = index === 1;
            return (
              <article
                key={plan.id}
                className={`relative flex flex-col rounded-[1.5rem] border p-6 ${featured ? "border-accent bg-[#1b1e1a] text-white shadow-2xl" : "bg-white/70"}`}
              >
                {featured ? (
                  <span className="absolute -top-3 start-6 rounded-full bg-accent px-3 py-1 text-[0.68rem] font-bold text-white">
                    {ar ? "الأكثر توازناً" : "Most balanced"}
                  </span>
                ) : null}
                <h2 className="text-xl font-bold">{ar ? plan.nameAr : plan.nameEn}</h2>
                <p className={`mt-2 min-h-12 text-sm leading-6 ${featured ? "text-white/55" : "text-muted"}`}>
                  {ar ? plan.descriptionAr : plan.descriptionEn}
                </p>
                <div className="mt-6">
                  <strong className="text-3xl">
                    {formatMoney(Number(plan.monthlyPrice), plan.currency, locale)}
                  </strong>
                  <span className={`text-xs ${featured ? "text-white/45" : "text-muted"}`}>
                    /{ar ? "شهر" : "month"}
                  </span>
                </div>
                <p className={`mt-2 text-xs ${featured ? "text-white/45" : "text-muted"}`}>
                  {plan.monthlyCredits} {ar ? "رصيد AI شهرياً" : "AI credits monthly"}
                </p>
                <ul className="my-7 grid gap-3 border-y border-current/10 py-6">
                  {features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex gap-2 text-sm">
                      <Check className={`mt-0.5 size-4 shrink-0 ${featured ? "text-[#dfbf7a]" : "text-success"}`} />
                      {ar ? feature.ar : feature.en}
                    </li>
                  ))}
                </ul>
                <div className="mt-auto">
                  <SubscribeButton
                    locale={locale}
                    planId={plan.id}
                    organizationId={membership?.organizationId}
                    free={Number(plan.monthlyPrice) === 0}
                    paymentsAvailable={paymentsAvailable}
                    featured={featured}
                  />
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <div className="premium-card mx-auto mt-12 max-w-xl p-8 text-center">
          <h2 className="text-xl font-bold">{ar ? "الخطط قيد الإعداد" : "Plans are being configured"}</h2>
          <p className="mt-2 text-sm leading-7 text-muted">
            {ar ? "لن نعرض أسعاراً أو مزايا غير مهيأة من الإدارة." : "We do not display unconfigured prices or benefits."}
          </p>
        </div>
      )}
    </div>
  );
}
