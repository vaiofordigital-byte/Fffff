import type { MetadataRoute } from "next";
import { db } from "@/lib/db";
import { publicEnv } from "@/lib/env";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [products, posts, pages] = await Promise.all([
    db.product.findMany({
      where: { status: "PUBLISHED" },
      select: { slug: true, updatedAt: true },
    }),
    db.blogPost.findMany({
      where: { status: "PUBLISHED" },
      select: { slug: true, updatedAt: true },
    }),
    db.cmsPage.findMany({
      where: { status: "PUBLISHED" },
      select: { slug: true, updatedAt: true },
    }),
  ]);
  const locales = ["ar", "en"] as const;
  const staticPaths = ["", "/marketplace", "/architect", "/optimizer", "/workflows", "/pricing", "/blog"];

  return [
    ...locales.flatMap((locale) =>
      staticPaths.map((path) => ({
        url: `${publicEnv.appUrl}/${locale}${path}`,
        lastModified: new Date(),
        changeFrequency: path === "" ? ("weekly" as const) : ("daily" as const),
        priority: path === "" ? 1 : 0.8,
      })),
    ),
    ...locales.flatMap((locale) =>
      products.map((product) => ({
        url: `${publicEnv.appUrl}/${locale}/marketplace/${product.slug}`,
        lastModified: product.updatedAt,
        changeFrequency: "weekly" as const,
        priority: 0.8,
      })),
    ),
    ...locales.flatMap((locale) =>
      posts.map((post) => ({
        url: `${publicEnv.appUrl}/${locale}/blog/${post.slug}`,
        lastModified: post.updatedAt,
        changeFrequency: "monthly" as const,
        priority: 0.7,
      })),
    ),
    ...locales.flatMap((locale) =>
      pages.map((page) => ({
        url: `${publicEnv.appUrl}/${locale}/${page.slug}`,
        lastModified: page.updatedAt,
        changeFrequency: "monthly" as const,
        priority: 0.5,
      })),
    ),
  ];
}
