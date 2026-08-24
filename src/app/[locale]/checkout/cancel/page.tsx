import Link from "next/link";
import { XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { isLocale, type Locale } from "@/lib/i18n";

export default async function CheckoutCancelPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: raw } = await params;
  const locale: Locale = isLocale(raw) ? raw : "ar";
  const ar = locale === "ar";

  return (
    <div className="container-shell grid min-h-[32rem] place-items-center py-12">
      <div className="premium-card max-w-md p-8 text-center">
        <XCircle className="mx-auto size-11 text-muted" />
        <h1 className="mt-5 text-2xl font-bold">
          {ar ? "لم يكتمل الدفع" : "Payment was not completed"}
        </h1>
        <p className="mt-3 text-sm leading-7 text-muted">
          {ar ? "لم تُخصم قيمة ولم يُمنح أي استحقاق." : "No access was granted. You can return and try again."}
        </p>
        <Button asChild variant="outline" className="mt-6">
          <Link href={`/${locale}/marketplace`}>{ar ? "العودة للمتجر" : "Back to marketplace"}</Link>
        </Button>
      </div>
    </div>
  );
}
