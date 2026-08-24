import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, ArrowRight, BookOpen } from "lucide-react";
import { db } from "@/lib/db";
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
    title: locale === "ar" ? "مركز المعرفة" : "AI Productivity Insights",
    description:
      locale === "ar"
        ? "أدلة عربية احترافية لتشغيل الأعمال والموظفين الأذكياء والإنتاجية."
        : "Professional guides to AI business operations, intelligent employees and productivity.",
  };
}

export default async function BlogPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: raw } = await params;
  const locale: Locale = isLocale(raw) ? raw : "ar";
  const ar = locale === "ar";
  const posts = await db.blogPost.findMany({
    where: { status: "PUBLISHED", publishedAt: { lte: new Date() } },
    orderBy: { publishedAt: "desc" },
    include: { category: { select: { nameAr: true, nameEn: true } } },
  });
  const Arrow = ar ? ArrowLeft : ArrowRight;

  return (
    <div className="container-shell py-14 sm:py-20">
      <header className="max-w-3xl">
        <p className="eyebrow">{ar ? "معرفة عملية، لا حشو آلي" : "Practical insight, never automated filler"}</p>
        <h1 className="text-balance mt-3 text-4xl font-bold tracking-[-0.04em] sm:text-6xl">
          {ar ? "اعمل بذكاء أكبر مع AI" : "Work more intelligently with AI"}
        </h1>
        <p className="mt-5 text-base leading-8 text-muted">
          {ar ? "أدلة ثنائية اللغة يراجعها محررون حول تشغيل الأعمال والموظفين الأذكياء وسير العمل." : "Editor-reviewed bilingual guides to AI business operations, intelligent employees and professional workflows."}
        </p>
      </header>

      {posts.length ? (
        <div className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {posts.map((post) => (
            <Link
              key={post.id}
              href={`/${locale}/blog/${post.slug}`}
              className="premium-card group flex min-h-72 flex-col p-6 transition hover:-translate-y-1 hover:border-accent/40"
            >
              <span className="grid size-11 place-items-center rounded-xl bg-surface-soft">
                <BookOpen className="size-5 text-accent-strong" />
              </span>
              <p className="mt-6 text-xs text-muted">
                {post.category ? (ar ? post.category.nameAr : post.category.nameEn) : ar ? "معرفة" : "Insights"}
              </p>
              <h2 className="mt-2 text-xl font-bold leading-8">{ar ? post.titleAr : post.titleEn}</h2>
              <p className="mt-3 line-clamp-3 text-sm leading-6 text-muted">{ar ? post.excerptAr : post.excerptEn}</p>
              <span className="mt-auto inline-flex items-center gap-2 pt-5 text-sm font-semibold">
                {ar ? "اقرأ المقال" : "Read article"}
                <Arrow className="size-4" />
              </span>
            </Link>
          ))}
        </div>
      ) : (
        <div className="premium-card mt-10 p-10 text-center">
          <BookOpen className="mx-auto size-10 text-muted" />
          <h2 className="mt-4 text-xl font-bold">{ar ? "لا توجد مقالات منشورة" : "No published articles"}</h2>
          <p className="mt-2 text-sm text-muted">
            {ar ? "لا ننشئ صفحات SEO آلية منخفضة الجودة." : "We do not generate low-quality automated SEO pages."}
          </p>
        </div>
      )}
    </div>
  );
}
