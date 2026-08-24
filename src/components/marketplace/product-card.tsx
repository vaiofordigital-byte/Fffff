import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  Boxes,
  Sparkles,
  Star,
  Workflow,
} from "lucide-react";
import type { Locale } from "@/lib/i18n";
import { formatMoney } from "@/lib/utils";

type ProductCardProps = {
  locale: Locale;
  product: {
    slug: string;
    type: "PROMPT" | "BUNDLE" | "WORKFLOW" | "CREDIT_PACK" | "SUBSCRIPTION";
    titleAr: string;
    titleEn: string;
    shortDescriptionAr: string;
    shortDescriptionEn: string;
    price: number;
    salePrice: number | null;
    currency: string;
    featured: boolean;
    ratingAverage: number;
    ratingCount: number;
    difficulty: string;
    category: { nameAr: string; nameEn: string } | null;
    currentVersion: { version: string; qualityScore: number | null } | null;
  };
};

export function ProductCard({ locale, product }: ProductCardProps) {
  const ar = locale === "ar";
  const Arrow = ar ? ArrowLeft : ArrowRight;
  const Icon =
    product.type === "BUNDLE"
      ? Boxes
      : product.type === "WORKFLOW"
        ? Workflow
        : Sparkles;
  const price = product.salePrice ?? product.price;

  return (
    <article className="premium-card group relative flex min-h-[24rem] flex-col overflow-hidden transition duration-300 hover:-translate-y-1 hover:border-accent/40 hover:shadow-xl">
      <div className="relative h-36 overflow-hidden border-b bg-[#20231f] p-5 text-white">
        <div className="absolute -end-8 -top-10 size-36 rounded-full bg-accent/18 blur-3xl" />
        <div className="relative flex items-start justify-between">
          <span className="grid size-11 place-items-center rounded-xl border border-white/10 bg-white/8">
            <Icon className="size-5 text-[#ddbd78]" aria-hidden="true" />
          </span>
          {product.featured ? (
            <span className="inline-flex items-center gap-1 rounded-full border border-[#ddbd78]/25 bg-[#ddbd78]/10 px-2.5 py-1 text-[0.68rem] font-semibold text-[#e4c889]">
              <BadgeCheck className="size-3.5" />
              {ar ? "مختار" : "Featured"}
            </span>
          ) : null}
        </div>
        <div className="relative mt-5 flex items-center gap-3 text-xs text-white/50">
          <span>{product.category?.[ar ? "nameAr" : "nameEn"] ?? product.type}</span>
          {product.currentVersion ? (
            <>
              <span className="size-1 rounded-full bg-white/25" />
              <span dir="ltr">v{product.currentVersion.version}</span>
            </>
          ) : null}
        </div>
      </div>

      <div className="flex flex-1 flex-col p-5">
        <h2 className="text-lg font-bold leading-7">
          <Link href={`/${locale}/marketplace/${product.slug}`} className="after:absolute after:inset-0">
            {ar ? product.titleAr : product.titleEn}
          </Link>
        </h2>
        <p className="mt-2 line-clamp-3 text-sm leading-6 text-muted">
          {ar ? product.shortDescriptionAr : product.shortDescriptionEn}
        </p>

        <div className="relative z-10 mt-5 flex items-center gap-4 text-xs text-muted">
          {product.ratingCount > 0 ? (
            <span className="inline-flex items-center gap-1">
              <Star className="size-3.5 fill-accent text-accent" aria-hidden="true" />
              {product.ratingAverage.toFixed(1)} ({product.ratingCount})
            </span>
          ) : (
            <span>{ar ? "لا توجد مراجعات بعد" : "No reviews yet"}</span>
          )}
          {product.currentVersion?.qualityScore ? (
            <span>{product.currentVersion.qualityScore}/100</span>
          ) : null}
        </div>

        <div className="relative z-10 mt-auto flex items-end justify-between border-t pt-5">
          <div>
            <p className="text-[0.68rem] text-muted">{ar ? "السعر" : "Price"}</p>
            <div className="mt-1 flex items-center gap-2">
              <strong className="text-lg">{formatMoney(price, product.currency, locale)}</strong>
              {product.salePrice !== null ? (
                <span className="text-xs text-muted line-through">
                  {formatMoney(product.price, product.currency, locale)}
                </span>
              ) : null}
            </div>
          </div>
          <span className="grid size-9 place-items-center rounded-full bg-surface-soft transition group-hover:bg-foreground group-hover:text-white">
            <Arrow className="size-4" aria-hidden="true" />
          </span>
        </div>
      </div>
    </article>
  );
}
