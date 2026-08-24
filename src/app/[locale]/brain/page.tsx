import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { BrainCircuit, FileCheck2, ShieldCheck } from "lucide-react";
import { BrainManager } from "@/components/brain/brain-manager";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { isLocale, type Locale } from "@/lib/i18n";
import { getOrganizationMembership } from "@/lib/organizations";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Company Brain",
  robots: { index: false, follow: false, noarchive: true },
};

export default async function BrainPage({
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
  const [entries, documents] = await Promise.all([
    db.knowledgeEntry.findMany({
      where: { organizationId: membership.organizationId },
      orderBy: { updatedAt: "desc" },
      take: 200,
      select: {
        id: true,
        kind: true,
        titleAr: true,
        titleEn: true,
        approved: true,
        privateMode: true,
        source: true,
        updatedAt: true,
      },
    }),
    db.knowledgeDocument.count({
      where: {
        organizationId: membership.organizationId,
        status: "READY",
      },
    }),
  ]);
  const approved = entries.filter((entry) => entry.approved).length;
  const automatic = entries.filter(
    (entry) => entry.approved && !entry.privateMode,
  ).length;

  return (
    <div className="container-shell py-10 sm:py-14">
      <header className="flex flex-wrap items-end justify-between gap-5">
        <div className="max-w-3xl">
          <p className="eyebrow">{membership.organization.name}</p>
          <h1 className="mt-2 text-4xl font-bold tracking-[-0.04em] sm:text-5xl">
            {ar ? "عقل الشركة" : "Company Brain"}
          </h1>
          <p className="mt-4 text-sm leading-7 text-muted">
            {ar
              ? "مصدر معرفة آمن ومعتمد يستخدمه موظفو AI داخل شركتك فقط. لا تنتقل معلومة بين المؤسسات."
              : "A secure approved knowledge source used only by your company's AI employees. Knowledge never crosses organizations."}
          </p>
        </div>
      </header>

      <section className="mt-8 grid grid-cols-3 gap-3" aria-label={ar ? "ملخص المعرفة" : "Knowledge summary"}>
        {[
          [BrainCircuit, ar ? "إجمالي المعرفة" : "Knowledge entries", entries.length],
          [ShieldCheck, ar ? "معتمد" : "Approved", approved],
          [FileCheck2, ar ? "مستندات معالجة" : "Processed documents", documents],
        ].map(([Icon, label, value]) => {
          const ItemIcon = Icon as typeof BrainCircuit;
          return (
            <div key={String(label)} className="premium-card p-4 sm:p-5">
              <ItemIcon className="size-5 text-intelligence" />
              <strong className="mt-4 block text-2xl">{String(value)}</strong>
              <span className="mt-1 block text-xs text-muted">{String(label)}</span>
            </div>
          );
        })}
      </section>

      <div className="mt-4 rounded-xl border bg-white/55 p-4 text-xs leading-6 text-muted">
        {ar
          ? `${automatic} عنصر معرفة معتمد متاح تلقائياً للموظفين. العناصر اليدوية فقط لا تدخل السياق إلا بإجراء صريح.`
          : `${automatic} approved entries are available to employees automatically. Manual-only entries stay outside task context unless explicitly used.`}
      </div>

      <section className="mt-8">
        <BrainManager
          locale={locale}
          organizationId={membership.organizationId}
          entries={entries}
        />
      </section>
    </div>
  );
}
