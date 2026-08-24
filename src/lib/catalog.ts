import { db } from "@/lib/db";

export type CatalogQuery = {
  q?: string;
  category?: string;
  difficulty?: "BEGINNER" | "INTERMEDIATE" | "ADVANCED" | "EXPERT";
  sort?: "newest" | "popular" | "price-low" | "price-high";
  page?: number;
};

const intentTerms: Array<{ signals: RegExp; terms: string[] }> = [
  {
    signals: /(زيادة|رفع|تحسين).{0,20}(مبيعات|تحويل)|increase.{0,20}(sales|conversion)/iu,
    terms: ["sales", "conversion", "مبيعات", "تحويل"],
  },
  {
    signals: /(عطور|perfume|fragrance)/iu,
    terms: ["perfume", "fragrance", "عطور", "تجارة إلكترونية"],
  },
  {
    signals: /(مطعم|restaurant)/iu,
    terms: ["restaurant", "مطعم", "marketing", "تسويق"],
  },
];

export function expandSearchIntent(query: string) {
  const terms = new Set([query.trim()]);
  for (const intent of intentTerms) {
    if (intent.signals.test(query)) intent.terms.forEach((term) => terms.add(term));
  }
  return [...terms].filter(Boolean).slice(0, 10);
}

export async function getCatalog(query: CatalogQuery) {
  const page = Math.max(1, query.page ?? 1);
  const pageSize = 12;
  const searchTerms = query.q ? expandSearchIntent(query.q) : [];
  const where = {
    status: "PUBLISHED" as const,
    ...(query.category ? { category: { slug: query.category } } : {}),
    ...(query.difficulty ? { difficulty: query.difficulty } : {}),
    ...(searchTerms.length
      ? {
          OR: searchTerms.flatMap((term) => [
            { titleAr: { contains: term } },
            { titleEn: { contains: term } },
            { shortDescriptionAr: { contains: term } },
            { shortDescriptionEn: { contains: term } },
            { industry: { contains: term } },
            { tags: { some: { tag: { nameAr: { contains: term } } } } },
            { tags: { some: { tag: { nameEn: { contains: term } } } } },
          ]),
        }
      : {}),
  };

  const orderBy =
    query.sort === "popular"
      ? ({ popularityScore: "desc" } as const)
      : query.sort === "price-low"
        ? ({ price: "asc" } as const)
        : query.sort === "price-high"
          ? ({ price: "desc" } as const)
          : ({ publishedAt: "desc" } as const);

  const [products, total, categories] = await db.$transaction([
    db.product.findMany({
      where,
      include: {
        category: { select: { slug: true, nameAr: true, nameEn: true } },
        prompt: {
          select: {
            versions: {
              where: { isCurrent: true },
              select: { version: true, qualityScore: true },
              take: 1,
            },
          },
        },
      },
      orderBy,
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    db.product.count({ where }),
    db.category.findMany({
      where: { active: true, parentId: null },
      orderBy: { sortOrder: "asc" },
      select: { slug: true, nameAr: true, nameEn: true },
    }),
  ]);

  return {
    products: products.map((product) => ({
      ...product,
      price: Number(product.price),
      salePrice: product.salePrice === null ? null : Number(product.salePrice),
      ratingAverage: Number(product.ratingAverage),
      currentVersion: product.prompt?.versions[0] ?? null,
    })),
    categories,
    total,
    page,
    pageCount: Math.ceil(total / pageSize),
  };
}
