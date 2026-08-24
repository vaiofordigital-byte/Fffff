import { redirect } from "next/navigation";
import { isLocale } from "@/lib/i18n";

export default async function LegacyLabPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: raw } = await params;
  const locale = isLocale(raw) ? raw : "ar";
  redirect(`/${locale}/tasks`);
}
