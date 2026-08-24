import type { Metadata } from "next";
import { ShieldCheck } from "lucide-react";
import { MfaForm } from "@/components/auth/mfa-form";
import { requireUser } from "@/lib/auth";
import { isLocale, type Locale } from "@/lib/i18n";

export const metadata: Metadata = {
  title: "Account security",
  robots: { index: false, follow: false },
};

export default async function SecuritySettingsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: raw } = await params;
  const locale: Locale = isLocale(raw) ? raw : "ar";
  const ar = locale === "ar";
  const user = await requireUser(locale);

  return (
    <div className="container-shell py-12">
      <div className="mx-auto max-w-md">
        {user.mfaEnabled ? (
          <div className="premium-card p-8 text-center">
            <ShieldCheck className="mx-auto size-12 text-success" />
            <h1 className="mt-5 text-2xl font-bold">
              {ar ? "المصادقة متعددة العوامل مفعّلة" : "Multifactor authentication is enabled"}
            </h1>
            <p className="mt-3 text-sm leading-7 text-muted">
              {ar ? "يتطلب تسجيل الدخول رمزاً إضافياً. تواصل مع مسؤول أعلى لإعادة الضبط الآمن." : "Sign-in requires an additional code. Contact a higher administrator for a secure reset."}
            </p>
          </div>
        ) : (
          <MfaForm locale={locale} setup nextPath={`/${locale}/admin`} />
        )}
      </div>
    </div>
  );
}
