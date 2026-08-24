import type { Metadata } from "next";
import Link from "next/link";
import { Filter, Search, Sparkles } from "lucide-react";
import { SearchTracker } from "@/components/analytics/search-tracker";
import { ProductCard } from "@/components/marketplace/product-card";
import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/field";
import { getCatalog } from "@/lib/catalog";
import { isLocale, type Locale } from "@/lib/i18n";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale: raw } = await params;
  const locale = isLocale(raw) ? raw : "ar";
  return {
    title: locale === "ar" ? "متجر البرومبتات الاحترافية" : "Professional Prompt Marketplace",
    description:
      locale === "ar"
        ? "اكتشف برومبتات وسير عمل احترافية للأعمال والتجارة والتسويق والتقنية."
        : "Discover professional prompts and workflows for business, commerce, marketing and technology.",
    alternates: {
      canonical: `/${locale}/marketplace`,
      languages: { ar: "/ar/marketplace", en: "/en/marketplace" },
    },
  };
}

export default async function MarketplacePage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [{ locale: raw }, query] = await Promise.all([params, searchParams]);
  const locale: Locale = isLocale(raw) ? raw : "ar";
  const ar = locale === "ar";
  const get = (key: string) =>
    typeof query[key] === "string" ? (query[key] as string) : undefined;
  const difficulty = get("difficulty");
  const sort = get("sort");
  const catalog = await getCatalog({
    q: get("q"),
    category: get("category"),
    difficulty: ["BEGINNER", "INTERMEDIATE", "ADVANCED", "EXPERT"].includes(
      difficulty ?? "",
    )
      ? (difficulty as "BEGINNER" | "INTERMEDIATE" | "ADVANCED" | "EXPERT")
      : undefined,
    sort: ["newest", "popular", "price-low", "price-high"].includes(sort ?? "")
      ? (sort as "newest" | "popular" | "price-low" | "price-high")
      : undefined,
    page: Number(get("page") ?? 1),
  });

  return (
    <div className="container-shell py-12 sm:py-16">
      <SearchTracker query={get("q")} resultCount={catalog.total} locale={locale} />
      <header className="max-w-3xl">
        <p className="eyebrow">
          <Sparkles className="size-4" aria-hidden="true" />
          {ar ? "أصول AI للعمل الحقيقي" : "AI assets for real work"}
        </p>
        <h1 className="text-balance mt-4 text-4xl font-bold tracking-[-0.04em] sm:text-5xl">
          {ar ? "متجر البرومبتات الاحترافية" : "Professional prompt marketplace"}
        </h1>
        <p className="mt-4 text-base leading-8 text-muted">
          {ar
            ? "برومبتات وسير عمل مدروسة، بإصدارات واضحة وتراخيص عملية ومحتوى محمي."
            : "Curated prompts and workflows with clear versions, practical licenses and protected content."}
        </p>
      </header>

      <form
        action={`/${locale}/marketplace`}
        className="premium-card mt-9 grid gap-3 p-3 md:grid-cols-[1fr_auto_auto_auto]"
        role="search"
      >
        <div className="relative">
          <Search className="absolute start-4 top-1/2 size-4 -translate-y-1/2 text-muted" />
          <Input
            name="q"
            defaultValue={get("q")}
            className="ps-11"
            placeholder={
              ar ? "مثال: زيادة مبيعات متجر عطور" : "e.g. increase perfume store sales"
            }
            aria-label={ar ? "البحث" : "Search"}
          />
        </div>
        <Select
          name="category"
          defaultValue={get("category") ?? ""}
          aria-label={ar ? "التصنيف" : "Category"}
        >
          <option value="">{ar ? "كل التصنيفات" : "All categories"}</option>
          {catalog.categories.map((category) => (
            <option key={category.slug} value={category.slug}>
              {ar ? category.nameAr : category.nameEn}
            </option>
          ))}
        </Select>
        <Select
          name="sort"
          defaultValue={sort ?? "newest"}
          aria-label={ar ? "الترتيب" : "Sort"}
        >
          <option value="newest">{ar ? "الأحدث" : "Newest"}</option>
          <option value="popular">{ar ? "الأكثر طلباً" : "Most popular"}</option>
          <option value="price-low">{ar ? "السعر: الأقل" : "Price: low to high"}</option>
          <option value="price-high">{ar ? "السعر: الأعلى" : "Price: high to low"}</option>
        </Select>
        <Button type="submit">
          <Filter className="size-4" aria-hidden="true" />
          {ar ? "تطبيق" : "Apply"}
        </Button>
      </form>

      <div className="mt-8 flex items-center justify-between gap-4">
        <p className="text-sm text-muted">
          {catalog.total === 0
            ? ar
              ? "لا توجد نتائج"
              : "No results"
            : ar
              ? `${catalog.total} أصل متاح`
              : `${catalog.total} assets available`}
        </p>
      </div>

      {catalog.products.length ? (
        <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {catalog.products.map((product) => (
            <ProductCard key={product.id} locale={locale} product={product} />
          ))}
        </div>
      ) : (
        <div className="premium-card mt-5 grid min-h-80 place-items-center p-8 text-center">
          <div>
            <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-surface-soft">
              <Search className="size-6 text-muted" />
            </span>
            <h2 className="mt-5 text-xl font-bold">
              {ar ? "لم نجد أصلاً مطابقاً" : "No matching asset found"}
            </h2>
            <p className="mx-auto mt-2 max-w-md text-sm leading-7 text-muted">
              {ar
                ? "جرّب وصف النتيجة بعبارة أوسع. تُستخدم عمليات البحث المجمعة لتحديد فجوات المحتوى دون نشر بياناتك."
                : "Try a broader outcome. Aggregated searches help identify catalog gaps without publishing your data."}
            </p>
            <Button asChild variant="outline" className="mt-5">
              <Link href={`/${locale}/marketplace`}>
                {ar ? "مسح عوامل البحث" : "Clear filters"}
              </Link>
            </Button>
          </div>
        </div>
      )}

      {catalog.pageCount > 1 ? (
        <nav className="mt-10 flex justify-center gap-2" aria-label="Pagination">
          {Array.from({ length: catalog.pageCount }, (_, index) => index + 1).map(
            (page) => {
              const params = new URLSearchParams();
              Object.entries(query).forEach(([key, value]) => {
                if (typeof value === "string" && key !== "page") params.set(key, value);
              });
              params.set("page", String(page));
              return (
                <Button
                  key={page}
                  asChild
                  variant={page === catalog.page ? "primary" : "outline"}
                  size="icon"
                >
                  <Link href={`/${locale}/marketplace?${params.toString()}`}>
                    {page}
                  </Link>
                </Button>
              );
            },
          )}
        </nav>
      ) : null}
    </div>
  );
}
