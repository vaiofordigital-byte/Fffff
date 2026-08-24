import type { Metadata } from "next";
import { LabWorkspace } from "@/components/prompt/lab-workspace";
import { isLocale, type Locale } from "@/lib/i18n";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale: raw } = await params;
  const locale = isLocale(raw) ? raw : "ar";
  return {
    title: locale === "ar" ? "مختبر البرومبت" : "Prompt Lab",
    robots: { index: false, follow: false },
  };
}

export default async function LabPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: raw } = await params;
  const locale: Locale = isLocale(raw) ? raw : "ar";
  const ar = locale === "ar";

  return (
    <div className="container-shell py-8 sm:py-10">
      <header className="mb-6">
        <p className="eyebrow">{ar ? "مساحة عمل احترافية" : "Professional workspace"}</p>
        <h1 className="mt-2 text-3xl font-bold tracking-[-0.035em]">
          {ar ? "مختبر البرومبت" : "Prompt Lab"}
        </h1>
      </header>
      <LabWorkspace locale={locale} />
    </div>
  );
}
