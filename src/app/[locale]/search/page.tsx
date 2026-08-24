import type { Metadata } from "next";
import { BusinessSearch } from "@/components/search/business-search";
import { isLocale, type Locale } from "@/lib/i18n";

export const metadata: Metadata = {
  title: "Business search",
};

export default async function SearchPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ q?: string }>;
}) {
  const [{ locale: raw }, query] = await Promise.all([params, searchParams]);
  const locale: Locale = isLocale(raw) ? raw : "ar";
  const ar = locale === "ar";

  return (
    <div className="container-shell py-12 sm:py-16">
      <header className="mb-8 max-w-3xl">
        <p className="eyebrow">{ar ? "ابحث بالهدف، لا باسم الأداة" : "Search by goal, not tool name"}</p>
        <h1 className="mt-2 text-4xl font-bold tracking-[-0.04em]">
          {ar ? "بحث EVELIA الذكي" : "EVELIA intelligent search"}
        </h1>
        <p className="mt-3 text-sm leading-7 text-muted">
          {ar
            ? "ابحث في الموظفين وسير العمل والتقارير ومعرفة شركتك بصياغة طبيعية."
            : "Search employees, workflows, reports and company knowledge in natural language."}
        </p>
      </header>
      <BusinessSearch locale={locale} initialQuery={query.q} />
    </div>
  );
}
