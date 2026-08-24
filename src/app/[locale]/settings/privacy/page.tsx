import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { PrivacyCenter } from "@/components/privacy/privacy-center";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { isLocale, type Locale } from "@/lib/i18n";
import { getOrganizationMembership } from "@/lib/organizations";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Privacy Center",
  robots: { index: false, follow: false },
};

export default async function PrivacySettingsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: raw } = await params;
  const locale: Locale = isLocale(raw) ? raw : "ar";
  const ar = locale === "ar";
  const user = await requireUser(locale);
  const membership = await getOrganizationMembership(user.id);
  if (!membership) redirect(`/${locale}/onboarding`);
  const preferences = await db.notificationPreference.upsert({
    where: { userId: user.id },
    create: { userId: user.id },
    update: {},
    select: {
      purchasesEmail: true,
      promptUpdatesEmail: true,
      creditsEmail: true,
      subscriptionsEmail: true,
      securityEmail: true,
      taskCompletedEmail: true,
      reportsEmail: true,
      recommendationsEmail: true,
      marketingEmail: true,
      inAppEnabled: true,
    },
  });

  return (
    <div className="container-shell py-10 sm:py-14">
      <header className="mb-8 max-w-3xl">
        <p className="eyebrow">{membership.organization.name}</p>
        <h1 className="mt-2 text-4xl font-bold tracking-[-0.04em]">
          {ar ? "مركز الخصوصية" : "Privacy Center"}
        </h1>
        <p className="mt-3 text-sm leading-7 text-muted">
          {ar
            ? "تحكم في السجل والإشعارات وحذف الحساب دون وعود مستحيلة عن السرية."
            : "Control history, notifications and account deletion without impossible secrecy promises."}
        </p>
      </header>
      <PrivacyCenter
        locale={locale}
        organizationId={membership.organizationId}
        initialPreferences={preferences}
      />
    </div>
  );
}
