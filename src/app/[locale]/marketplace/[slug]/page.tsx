import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  BadgeCheck,
  Check,
  ChevronLeft,
  ChevronRight,
  Clock3,
  LockKeyhole,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  Star,
} from "lucide-react";
import { PurchaseButton } from "@/components/marketplace/purchase-button";
import { db } from "@/lib/db";
import { publicEnv } from "@/lib/env";
import { isLocale, type Locale } from "@/lib/i18n";
import { formatMoney } from "@/lib/utils";

export const dynamic = "force-dynamic";

async function getProduct(slug: string) {
  return db.product.findFirst({
    where: { slug, status: "PUBLISHED" },
    select: {
      id: true,
      slug: true,
      type: true,
      titleAr: true,
      titleEn: true,
      shortDescriptionAr: true,
      shortDescriptionEn: true,
      descriptionAr: true,
      descriptionEn: true,
      previewAr: true,
      previewEn: true,
      price: true,
      salePrice: true,
      currency: true,
      licenseType: true,
      subscriptionEligible: true,
      difficulty: true,
      ratingAverage: true,
      ratingCount: true,
      seoTitleAr: true,
      seoTitleEn: true,
      seoDescriptionAr: true,
      seoDescriptionEn: true,
      updatedAt: true,
      category: { select: { slug: true, nameAr: true, nameEn: true } },
      tags: { select: { tag: { select: { slug: true, nameAr: true, nameEn: true } } } },
      prompt: {
        select: {
          compatibility: true,
          languages: true,
          expectedOutputs: true,
          variables: {
            orderBy: { sortOrder: "asc" },
            select: {
              key: true,
              labelAr: true,
              labelEn: true,
              descriptionAr: true,
              descriptionEn: true,
              inputType: true,
              required: true,
            },
          },
          versions: {
            orderBy: { createdAt: "desc" },
            select: {
              version: true,
              changelogAr: true,
              changelogEn: true,
              qualityScore: true,
              isCurrent: true,
              publishedAt: true,
            },
          },
        },
      },
      reviews: {
        where: { status: "PUBLISHED", verified: true },
        orderBy: { createdAt: "desc" },
        take: 8,
        select: {
          id: true,
          rating: true,
          comment: true,
          createdAt: true,
          verified: true,
          user: { select: { profile: { select: { displayName: true } } } },
        },
      },
    },
  });
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale: raw, slug } = await params;
  const locale: Locale = isLocale(raw) ? raw : "ar";
  const product = await getProduct(slug);
  if (!product) return {};
  const ar = locale === "ar";

  return {
    title:
      (ar ? product.seoTitleAr : product.seoTitleEn) ??
      (ar ? product.titleAr : product.titleEn),
    description:
      (ar ? product.seoDescriptionAr : product.seoDescriptionEn) ??
      (ar ? product.shortDescriptionAr : product.shortDescriptionEn),
    alternates: {
      canonical: `/${locale}/marketplace/${slug}`,
      languages: {
        ar: `/ar/marketplace/${slug}`,
        en: `/en/marketplace/${slug}`,
      },
    },
  };
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale: raw, slug } = await params;
  const locale: Locale = isLocale(raw) ? raw : "ar";
  const ar = locale === "ar";
  const product = await getProduct(slug);
  if (!product) notFound();
  const Chevron = ar ? ChevronLeft : ChevronRight;
  const currentVersion = product.prompt?.versions.find((version) => version.isCurrent);
  const price = Number(product.salePrice ?? product.price);
  const originalPrice = Number(product.price);

  const productSchema = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: ar ? product.titleAr : product.titleEn,
    description: ar ? product.shortDescriptionAr : product.shortDescriptionEn,
    url: `${publicEnv.appUrl}/${locale}/marketplace/${product.slug}`,
    offers: {
      "@type": "Offer",
      price,
      priceCurrency: product.currency,
      availability: "https://schema.org/InStock",
    },
    ...(product.ratingCount > 0
      ? {
          aggregateRating: {
            "@type": "AggregateRating",
            ratingValue: Number(product.ratingAverage),
            reviewCount: product.ratingCount,
          },
        }
      : {}),
  };

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: ar ? "المتجر" : "Marketplace",
        item: `${publicEnv.appUrl}/${locale}/marketplace`,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: ar ? product.titleAr : product.titleEn,
      },
    ],
  };

  return (
    <div className="container-shell py-10 sm:py-14">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />

      <nav className="flex items-center gap-2 text-xs text-muted" aria-label="Breadcrumb">
        <Link href={`/${locale}/marketplace`} className="hover:text-foreground">
          {ar ? "المتجر" : "Marketplace"}
        </Link>
        <Chevron className="size-3.5" />
        <span>{product.category?.[ar ? "nameAr" : "nameEn"]}</span>
      </nav>

      <div className="mt-7 grid gap-8 lg:grid-cols-[1fr_23rem] lg:items-start">
        <article>
          <div className="overflow-hidden rounded-[1.75rem] bg-[#1b1e1a] p-7 text-white sm:p-11">
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="rounded-full border border-[#d9b66b]/25 bg-[#d9b66b]/10 px-3 py-1 text-[#e1c584]">
                {product.category?.[ar ? "nameAr" : "nameEn"] ?? product.type}
              </span>
              {currentVersion ? (
                <span className="rounded-full border border-white/10 px-3 py-1 text-white/55" dir="ltr">
                  v{currentVersion.version}
                </span>
              ) : null}
            </div>
            <div className="mt-10 grid size-14 place-items-center rounded-2xl border border-white/10 bg-white/7">
              <Sparkles className="size-6 text-[#e1c584]" />
            </div>
            <h1 className="text-balance mt-6 max-w-3xl text-3xl font-bold leading-tight tracking-[-0.035em] sm:text-5xl">
              {ar ? product.titleAr : product.titleEn}
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-8 text-white/62">
              {ar ? product.shortDescriptionAr : product.shortDescriptionEn}
            </p>
          </div>

          <section className="mt-10" aria-labelledby="about-product">
            <h2 id="about-product" className="text-2xl font-bold">
              {ar ? "ما الذي ستحصل عليه؟" : "What you will get"}
            </h2>
            <div className="mt-4 whitespace-pre-line text-base leading-8 text-muted">
              {ar ? product.descriptionAr : product.descriptionEn}
            </div>
          </section>

          {product.previewAr || product.previewEn ? (
            <section className="premium-card mt-10 p-6 sm:p-8" aria-labelledby="preview-title">
              <div className="flex items-center gap-3">
                <span className="grid size-10 place-items-center rounded-xl bg-surface-soft">
                  <LockKeyhole className="size-4 text-accent-strong" />
                </span>
                <div>
                  <h2 id="preview-title" className="font-bold">
                    {ar ? "معاينة احترافية" : "Professional preview"}
                  </h2>
                  <p className="text-xs text-muted">
                    {ar
                      ? "المحتوى الكامل لا يُرسل قبل التحقق من الاستحقاق."
                      : "Full content is never sent before entitlement verification."}
                  </p>
                </div>
              </div>
              <div className="mt-6 whitespace-pre-line rounded-xl border bg-surface-soft/60 p-5 text-sm leading-7">
                {(ar ? product.previewAr : product.previewEn) ??
                  (ar ? product.previewEn : product.previewAr)}
              </div>
            </section>
          ) : null}

          {product.prompt?.variables.length ? (
            <section className="mt-10" aria-labelledby="variables-title">
              <h2 id="variables-title" className="text-2xl font-bold">
                {ar ? "متغيرات تفاعلية" : "Interactive variables"}
              </h2>
              <p className="mt-2 text-sm text-muted">
                {ar
                  ? "بعد الشراء، يطرح PROMPTX الأسئلة المطلوبة ويبني نسختك المخصصة."
                  : "After purchase, PROMPTX collects these inputs and builds your customized version."}
              </p>
              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                {product.prompt.variables.map((variable) => (
                  <div key={variable.key} className="rounded-2xl border bg-white/60 p-5">
                    <div className="flex items-center justify-between gap-3">
                      <code className="text-xs font-bold text-accent-strong">
                        {`{{${variable.key}}}`}
                      </code>
                      {variable.required ? (
                        <span className="text-[0.65rem] text-muted">
                          {ar ? "مطلوب" : "Required"}
                        </span>
                      ) : null}
                    </div>
                    <h3 className="mt-3 font-semibold">
                      {ar ? variable.labelAr : variable.labelEn}
                    </h3>
                    <p className="mt-1 text-xs leading-6 text-muted">
                      {(ar ? variable.descriptionAr : variable.descriptionEn) ??
                        variable.inputType}
                    </p>
                  </div>
                ))}
              </div>
            </section>
          ) : null}

          {product.prompt?.versions.length ? (
            <section className="mt-10" aria-labelledby="versions-title">
              <h2 id="versions-title" className="text-2xl font-bold">
                {ar ? "الإصدارات والتحديثات" : "Versions and updates"}
              </h2>
              <div className="mt-5 grid gap-3">
                {product.prompt.versions.map((version) => (
                  <div key={version.version} className="flex gap-4 rounded-2xl border bg-white/60 p-5">
                    <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-surface-soft text-xs font-bold" dir="ltr">
                      v{version.version}
                    </span>
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-semibold">
                          {version.isCurrent
                            ? ar
                              ? "الإصدار الحالي"
                              : "Current version"
                            : ar
                              ? "إصدار سابق"
                              : "Previous version"}
                        </h3>
                        {version.publishedAt ? (
                          <time className="text-xs text-muted">
                            {new Intl.DateTimeFormat(ar ? "ar-SA" : "en-US", {
                              dateStyle: "medium",
                            }).format(version.publishedAt)}
                          </time>
                        ) : null}
                      </div>
                      <p className="mt-1 text-sm leading-6 text-muted">
                        {(ar ? version.changelogAr : version.changelogEn) ??
                          (ar ? "تحسينات بنيوية وجودة." : "Structure and quality improvements.")}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          ) : null}

          <section className="mt-10" aria-labelledby="reviews-title">
            <div className="flex items-center justify-between">
              <h2 id="reviews-title" className="text-2xl font-bold">
                {ar ? "مراجعات مشترين موثّقين" : "Verified buyer reviews"}
              </h2>
              {product.ratingCount > 0 ? (
                <span className="inline-flex items-center gap-1 text-sm font-semibold">
                  <Star className="size-4 fill-accent text-accent" />
                  {Number(product.ratingAverage).toFixed(1)}
                </span>
              ) : null}
            </div>
            {product.reviews.length ? (
              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                {product.reviews.map((review) => (
                  <blockquote key={review.id} className="rounded-2xl border bg-white/60 p-5">
                    <div className="flex items-center gap-2 text-xs text-success">
                      <BadgeCheck className="size-4" />
                      {ar ? "شراء موثّق" : "Verified purchase"}
                    </div>
                    <p className="mt-3 text-sm leading-7">{review.comment}</p>
                    <footer className="mt-4 text-xs text-muted">
                      {review.user.profile?.displayName ?? (ar ? "مستخدم موثّق" : "Verified user")}
                    </footer>
                  </blockquote>
                ))}
              </div>
            ) : (
              <p className="mt-4 rounded-2xl border border-dashed p-6 text-sm text-muted">
                {ar
                  ? "لا توجد مراجعات منشورة بعد. لا نعرض مراجعات غير حقيقية."
                  : "No published reviews yet. We never display fabricated reviews."}
              </p>
            )}
          </section>
        </article>

        <aside className="premium-card sticky top-24 p-5 sm:p-6">
          <p className="text-xs text-muted">{ar ? "وصول دائم لهذا الإصدار" : "Ongoing access to this asset"}</p>
          <div className="mt-2 flex items-baseline gap-2">
            <strong className="text-3xl">{formatMoney(price, product.currency, locale)}</strong>
            {product.salePrice !== null ? (
              <span className="text-sm text-muted line-through">
                {formatMoney(originalPrice, product.currency, locale)}
              </span>
            ) : null}
          </div>

          <ul className="my-6 grid gap-3 border-y py-5 text-sm">
            {[
              [RefreshCw, ar ? "تحديثات الإصدارات المؤهلة" : "Eligible version updates"],
              [ShieldCheck, `${ar ? "ترخيص" : "License"}: ${product.licenseType}`],
              [Clock3, ar ? "إضافة فورية إلى الخزنة بعد الدفع" : "Instant Vault access after payment"],
            ].map(([Icon, label]) => {
              const ItemIcon = Icon as typeof Check;
              return (
                <li key={String(label)} className="flex items-center gap-3">
                  <ItemIcon className="size-4 shrink-0 text-success" />
                  {String(label)}
                </li>
              );
            })}
          </ul>

          <PurchaseButton productId={product.id} locale={locale} />

          <div className="mt-5 flex items-start gap-3 rounded-xl bg-surface-soft p-4 text-xs leading-6 text-muted">
            <LockKeyhole className="mt-1 size-4 shrink-0" />
            <p>
              {ar
                ? "تُراجع الأسعار والاستحقاقات على الخادم. لا تظهر طريقة دفع إلا بعد تهيئتها."
                : "Prices and entitlements are verified server-side. Payment methods appear only when configured."}
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}
