import type { Metadata } from "next";
import Link from "next/link";
import { Clock3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { isLocale, type Locale } from "@/lib/i18n";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Checkout status",
  robots: { index: false, follow: false },
};

export default async function CheckoutSuccessPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ order?: string }>;
}) {
  const [{ locale: raw }, query] = await Promise.all([params, searchParams]);
  const locale: Locale = isLocale(raw) ? raw : "ar";
  const ar = locale === "ar";
  const user = await requireUser(locale);
  const order = query.order
    ? await db.order.findFirst({
        where: { id: query.order, userId: user.id },
        select: { number: true, status: true },
      })
    : null;
  const paid = order?.status === "PAID";

  return (
    <div className="container-shell grid min-h-[36rem] place-items-center py-12">
      <div className="premium-card max-w-lg p-8 text-center">
        <Clock3 className={`mx-auto size-12 ${paid ? "text-success" : "text-accent"}`} />
        <h1 className="mt-5 text-2xl font-bold">
          {paid
            ? ar
              ? "تم تأكيد الدفع"
              : "Payment confirmed"
            : ar
              ? "جارٍ التحقق من الدفع"
              : "Verifying payment"}
        </h1>
        <p className="mt-3 text-sm leading-7 text-muted">
          {paid
            ? ar
              ? "أضيفت الأصول إلى خزنتك بعد التحقق من إشعار بوابة الدفع."
              : "Your assets were added after the payment webhook was verified."
            : ar
              ? "لا نمنح الوصول من صفحة النجاح وحدها. سيظهر الأصل بعد وصول تأكيد موقّع من بوابة الدفع."
              : "This page alone never grants access. Your asset appears after a signed provider confirmation."}
        </p>
        {order ? <p className="mt-3 text-xs text-muted" dir="ltr">{order.number}</p> : null}
        <Button asChild className="mt-6">
          <Link href={`/${locale}/vault`}>{ar ? "فتح الخزنة" : "Open Vault"}</Link>
        </Button>
      </div>
    </div>
  );
}
