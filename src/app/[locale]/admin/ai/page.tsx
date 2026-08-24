import type { Metadata } from "next";
import { AiControlCenter } from "@/components/admin/ai-control-center";
import { requireRole } from "@/lib/auth";
import { db } from "@/lib/db";
import { isLocale, type Locale } from "@/lib/i18n";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "AI Control Center",
  robots: { index: false, follow: false },
};

export default async function AdminAiPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: raw } = await params;
  const locale: Locale = isLocale(raw) ? raw : "ar";
  const ar = locale === "ar";
  await requireRole("ADMINISTRATOR", locale);
  const [providerRows, employees] = await Promise.all([
    db.aiProviderConfiguration.findMany({
      orderBy: [{ isFallback: "asc" }, { createdAt: "asc" }],
      select: {
        id: true,
        key: true,
        displayName: true,
        baseUrl: true,
        defaultModel: true,
        enabled: true,
        isFallback: true,
        apiKeyCiphertext: true,
      },
    }),
    db.aiEmployee.findMany({
      orderBy: { sortOrder: "asc" },
      select: {
        id: true,
        slug: true,
        nameAr: true,
        nameEn: true,
        defaultCreditCost: true,
        active: true,
      },
    }),
  ]);
  const providers = providerRows.map(({ apiKeyCiphertext, ...provider }) => ({
    ...provider,
    hasApiKey: Boolean(apiKeyCiphertext),
  }));

  return (
    <div className="container-shell py-10 sm:py-14">
      <header className="mb-8">
        <p className="eyebrow">{ar ? "إدارة الذكاء والتكلفة" : "Intelligence and cost management"}</p>
        <h1 className="mt-2 text-4xl font-bold tracking-[-0.04em]">
          {ar ? "مركز تحكم AI" : "AI Control Center"}
        </h1>
      </header>
      <AiControlCenter
        locale={locale}
        providers={providers}
        employees={employees}
      />
    </div>
  );
}
