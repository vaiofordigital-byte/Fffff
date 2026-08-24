import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AuthForm } from "@/components/auth/auth-form";
import { getCurrentUser } from "@/lib/auth";
import { isLocale, type Locale } from "@/lib/i18n";
import { safeRedirectPath } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Sign in",
  robots: { index: false, follow: false },
};

export default async function LoginPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ next?: string; verified?: string }>;
}) {
  const [{ locale: raw }, query, user] = await Promise.all([
    params,
    searchParams,
    getCurrentUser(),
  ]);
  const locale: Locale = isLocale(raw) ? raw : "ar";
  const nextPath = safeRedirectPath(query.next ?? null, `/${locale}/dashboard`);
  if (user) redirect(nextPath);

  return (
    <div className="container-shell grid min-h-[42rem] place-items-center py-12">
      <div className="w-full max-w-md">
        <AuthForm
          locale={locale}
          mode="login"
          nextPath={nextPath}
          verified={query.verified}
        />
      </div>
    </div>
  );
}
