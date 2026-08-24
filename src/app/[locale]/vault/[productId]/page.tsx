import { redirect } from "next/navigation";
import { isLocale } from "@/lib/i18n";

export default async function LegacyVaultItemPage({
  params,
}: {
  params: Promise<{ locale: string; productId: string }>;
}) {
  const { locale: raw } = await params;
  const locale = isLocale(raw) ? raw : "ar";
  redirect(`/${locale}/brain`);
}
