import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { publicEnv } from "@/lib/env";
import { isLocale, type Locale } from "@/lib/i18n";

export const dynamic = "force-dynamic";

async function getPost(slug: string) {
  return db.blogPost.findFirst({
    where: { slug, status: "PUBLISHED", publishedAt: { lte: new Date() } },
    include: { category: true },
  });
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale: raw, slug } = await params;
  const locale: Locale = isLocale(raw) ? raw : "ar";
  const post = await getPost(slug);
  if (!post) return {};
  const ar = locale === "ar";
  return {
    title: ar ? post.titleAr : post.titleEn,
    description: ar ? post.excerptAr : post.excerptEn,
    alternates: {
      canonical: `/${locale}/blog/${slug}`,
      languages: { ar: `/ar/blog/${slug}`, en: `/en/blog/${slug}` },
    },
  };
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale: raw, slug } = await params;
  const locale: Locale = isLocale(raw) ? raw : "ar";
  const ar = locale === "ar";
  const post = await getPost(slug);
  if (!post) notFound();

  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: ar ? post.titleAr : post.titleEn,
    datePublished: post.publishedAt?.toISOString(),
    dateModified: post.updatedAt.toISOString(),
    author: { "@type": "Person", name: post.authorName },
    publisher: { "@type": "Organization", name: "PROMPTX" },
    mainEntityOfPage: `${publicEnv.appUrl}/${locale}/blog/${post.slug}`,
  };

  return (
    <article className="container-shell py-14 sm:py-20">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }}
      />
      <header className="mx-auto max-w-3xl">
        <Link href={`/${locale}/blog`} className="text-xs font-semibold text-accent-strong">
          {post.category ? (ar ? post.category.nameAr : post.category.nameEn) : ar ? "المعرفة" : "Insights"}
        </Link>
        <h1 className="text-balance mt-4 text-4xl font-bold leading-tight tracking-[-0.04em] sm:text-6xl">
          {ar ? post.titleAr : post.titleEn}
        </h1>
        <p className="mt-5 text-lg leading-8 text-muted">{ar ? post.excerptAr : post.excerptEn}</p>
        <div className="mt-6 flex items-center gap-3 text-xs text-muted">
          <span>{post.authorName}</span>
          <span>·</span>
          {post.publishedAt ? (
            <time>{new Intl.DateTimeFormat(ar ? "ar-SA" : "en", { dateStyle: "long" }).format(post.publishedAt)}</time>
          ) : null}
        </div>
      </header>
      <div className="mx-auto mt-12 max-w-3xl whitespace-pre-line text-base leading-9">
        {ar ? post.contentAr : post.contentEn}
      </div>
    </article>
  );
}
