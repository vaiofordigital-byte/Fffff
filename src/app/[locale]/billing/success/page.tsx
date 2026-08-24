import type { Metadata } from "next";
import Link from "next/link";
import { CheckCircle2, Clock3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { isLocale, type Locale } from "@/lib/i18n";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Subscription status",
  robots: { index: false, follow: false },
};

export default async function BillingSuccessPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ subscription?: string }>;
}) {
  const [{ locale: raw }, query] = await Promise.all([params, searchParams]);
  const locale: Locale = isLocale(raw) ? raw : "ar";
  const ar = locale === "ar";
  const user = await requireUser(locale);
  const checkout = query.subscription
    ? await db.subscriptionCheckout.findFirst({
        where: { id: query.subscription, userId: user.id },
        include: { plan: { select: { nameAr: true, nameEn: true } } },
      })
    : null;
  const active = checkout?.status === "PAID";

  return (
    <div className="container-shell grid min-h-[36rem] place-items-center py-12">
      <div className="premium-card max-w-lg p-8 text-center">
        {active ? (
          <CheckCircle2 className="mx-auto size-12 text-success" />
        ) : (
          <Clock3 className="mx-auto size-12 text-intelligence" />
        )}
        <h1 className="mt-5 text-2xl font-bold">
          {active
            ? ar
              ? "تم تفعيل الاشتراك"
              : "Subscription activated"
            : ar
              ? "جارٍ التحقق من الدفع"
              : "Verifying payment"}
        </h1>
        <p className="mt-3 text-sm leading-7 text-muted">
          {active
            ? `${ar ? "الخطة" : "Plan"}: ${ar ? checkout.plan.nameAr : checkout.plan.nameEn}`
            : ar
              ? "لا نفعّل الخطة من صفحة النجاح. يجب أن يصل إشعار موقع من مزود الدفع."
              : "This page never activates a plan. A signed payment-provider webhook is required."}
        </p>
        <Button asChild className="mt-6">
          <Link href={`/${locale}/dashboard`}>
            {ar ? "فتح لوحة الأعمال" : "Open business dashboard"}
          </Link>
        </Button>
      </div>
    </div>
  );
}
