import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { OnboardingForm } from "@/components/onboarding/onboarding-form";
import { requireUser } from "@/lib/auth";
import { isLocale, type Locale } from "@/lib/i18n";

export const metadata: Metadata = {
  title: "Workspace setup",
  robots: { index: false, follow: false },
};

export default async function OnboardingPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: raw } = await params;
  const locale: Locale = isLocale(raw) ? raw : "ar";
  const user = await requireUser(locale);
  if (user.profile?.onboardingDone) redirect(`/${locale}/dashboard`);

  return (
    <div className="container-shell grid min-h-[42rem] place-items-center py-12">
      <div className="w-full max-w-lg">
        <OnboardingForm locale={locale} />
      </div>
    </div>
  );
}
