import { redirect } from "next/navigation";
import { isLocale } from "@/lib/i18n";

export default async function LegacyProductPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale: raw } = await params;
  const locale = isLocale(raw) ? raw : "ar";
  redirect(`/${locale}/employees`);
}
