import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AuthForm } from "@/components/auth/auth-form";
import { getCurrentUser } from "@/lib/auth";
import { isLocale, type Locale } from "@/lib/i18n";

export const metadata: Metadata = {
  title: "Create account",
  robots: { index: false, follow: false },
};

export default async function RegisterPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const [{ locale: raw }, user] = await Promise.all([params, getCurrentUser()]);
  const locale: Locale = isLocale(raw) ? raw : "ar";
  if (user) redirect(`/${locale}/dashboard`);

  return (
    <div className="container-shell grid min-h-[42rem] place-items-center py-12">
      <div className="w-full max-w-md">
        <AuthForm locale={locale} mode="register" />
      </div>
    </div>
  );
}
