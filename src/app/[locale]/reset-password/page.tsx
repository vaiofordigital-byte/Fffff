import type { Metadata } from "next";
import { RecoveryForm } from "@/components/auth/recovery-form";
import { isLocale, type Locale } from "@/lib/i18n";

export const metadata: Metadata = {
  title: "Reset password",
  robots: { index: false, follow: false },
};

export default async function ResetPasswordPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ token?: string }>;
}) {
  const [{ locale: raw }, query] = await Promise.all([params, searchParams]);
  const locale: Locale = isLocale(raw) ? raw : "ar";
  return (
    <div className="container-shell grid min-h-[38rem] place-items-center py-12">
      <div className="w-full max-w-md">
        <RecoveryForm locale={locale} token={query.token} />
      </div>
    </div>
  );
}
