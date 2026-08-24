import type { Metadata } from "next";
import { PremiumPromptViewer } from "@/components/vault/premium-prompt-viewer";
import { requireUser } from "@/lib/auth";
import { isLocale, type Locale } from "@/lib/i18n";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Protected prompt",
  robots: { index: false, follow: false, noarchive: true },
};

export default async function VaultPromptPage({
  params,
}: {
  params: Promise<{ locale: string; productId: string }>;
}) {
  const { locale: raw, productId } = await params;
  const locale: Locale = isLocale(raw) ? raw : "ar";
  await requireUser(locale);

  return (
    <div className="container-shell py-10">
      <PremiumPromptViewer productId={productId} locale={locale} />
    </div>
  );
}
