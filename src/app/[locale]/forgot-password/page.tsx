import type { Metadata } from "next";
import { RecoveryForm } from "@/components/auth/recovery-form";
import { isLocale, type Locale } from "@/lib/i18n";

export const metadata: Metadata = {
  title: "Account recovery",
  robots: { index: false, follow: false },
};

export default async function ForgotPasswordPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: raw } = await params;
  const locale: Locale = isLocale(raw) ? raw : "ar";
  return (
    <div className="container-shell grid min-h-[38rem] place-items-center py-12">
      <div className="w-full max-w-md">
        <RecoveryForm locale={locale} />
      </div>
    </div>
  );
}
