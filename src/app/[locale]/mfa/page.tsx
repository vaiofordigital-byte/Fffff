import type { Metadata } from "next";
import { MfaForm } from "@/components/auth/mfa-form";
import { isLocale, type Locale } from "@/lib/i18n";
import { safeRedirectPath } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Multifactor verification",
  robots: { index: false, follow: false },
};

export default async function MfaPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ next?: string }>;
}) {
  const [{ locale: raw }, query] = await Promise.all([params, searchParams]);
  const locale: Locale = isLocale(raw) ? raw : "ar";
  return (
    <div className="container-shell grid min-h-[38rem] place-items-center py-12">
      <div className="w-full max-w-md">
        <MfaForm
          locale={locale}
          nextPath={safeRedirectPath(query.next ?? null, `/${locale}/dashboard`)}
        />
      </div>
    </div>
  );
}
