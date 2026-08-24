import type { Metadata } from "next";
import Link from "next/link";
import { Library, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CollectionCreator } from "@/components/vault/collection-creator";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { isLocale, type Locale } from "@/lib/i18n";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Prompt Vault",
  robots: { index: false, follow: false },
};

export default async function VaultPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: raw } = await params;
  const locale: Locale = isLocale(raw) ? raw : "ar";
  const ar = locale === "ar";
  const user = await requireUser(locale);
  const [owned, generated, collections] = await Promise.all([
    db.entitlement.findMany({
      where: {
        userId: user.id,
        revokedAt: null,
        OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
      },
      distinct: ["productId"],
      orderBy: { createdAt: "desc" },
      include: {
        product: {
          select: {
            id: true,
            titleAr: true,
            titleEn: true,
            shortDescriptionAr: true,
            shortDescriptionEn: true,
            type: true,
            prompt: {
              select: {
                versions: {
                  where: { isCurrent: true },
                  select: { version: true },
                  take: 1,
                },
              },
            },
          },
        },
      },
    }),
    db.generatedPrompt.findMany({
      where: { userId: user.id },
      orderBy: { updatedAt: "desc" },
      take: 30,
      select: {
        id: true,
        title: true,
        mode: true,
        status: true,
        privateMode: true,
        qualityScore: true,
        updatedAt: true,
      },
    }),
    db.collection.findMany({
      where: { userId: user.id },
      include: { _count: { select: { items: true } } },
      orderBy: { updatedAt: "desc" },
    }),
  ]);

  return (
    <div className="container-shell py-10 sm:py-14">
      <header className="flex flex-wrap items-end justify-between gap-5">
        <div>
          <p className="eyebrow">{ar ? "أصول AI الخاصة بك" : "Your private AI assets"}</p>
          <h1 className="mt-2 text-4xl font-bold tracking-[-0.04em]">
            {ar ? "خزنة البرومبت" : "Prompt Vault"}
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-muted">
            {ar
              ? "نظّم المشتريات والبرومبتات التي أنشأتها ونسخك الشخصية دون تعديل الأصل الرسمي."
              : "Organize purchases, generated prompts and personal revisions without changing official assets."}
          </p>
        </div>
        <Button asChild variant="accent">
          <Link href={`/${locale}/architect`}>
            <Sparkles className="size-4" />
            {ar ? "برومبت جديد" : "New prompt"}
          </Link>
        </Button>
      </header>

      <section className="mt-9" aria-labelledby="owned-title">
        <div className="flex items-center justify-between">
          <h2 id="owned-title" className="text-xl font-bold">
            {ar ? "المشتريات" : "Purchased assets"}
          </h2>
          <span className="text-xs text-muted">{owned.length}</span>
        </div>
        {owned.length ? (
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {owned.map(({ product }) => (
              <Link
                key={product.id}
                href={`/${locale}/vault/${product.id}`}
                className="premium-card group p-5 transition hover:-translate-y-0.5 hover:border-accent/40"
              >
                <span className="grid size-10 place-items-center rounded-xl bg-[#f4eee2] text-accent-strong">
                  <Library className="size-5" />
                </span>
                <h3 className="mt-5 font-bold">{ar ? product.titleAr : product.titleEn}</h3>
                <p className="mt-2 line-clamp-2 text-sm leading-6 text-muted">
                  {ar ? product.shortDescriptionAr : product.shortDescriptionEn}
                </p>
                <p className="mt-4 text-xs text-muted" dir="ltr">
                  {product.prompt?.versions[0]
                    ? `Official v${product.prompt.versions[0].version}`
                    : product.type}
                </p>
              </Link>
            ))}
          </div>
        ) : (
          <div className="mt-4 rounded-2xl border border-dashed p-8 text-center text-sm text-muted">
            {ar ? "لا توجد مشتريات بعد." : "No purchases yet."}{" "}
            <Link href={`/${locale}/marketplace`} className="font-semibold text-foreground underline">
              {ar ? "استكشف المتجر" : "Explore marketplace"}
            </Link>
          </div>
        )}
      </section>

      <section className="mt-10" aria-labelledby="generated-title">
        <div className="flex items-center justify-between">
          <h2 id="generated-title" className="text-xl font-bold">
            {ar ? "البرومبتات المنشأة" : "Generated prompts"}
          </h2>
          <span className="text-xs text-muted">{generated.length}</span>
        </div>
        {generated.length ? (
          <div className="mt-4 overflow-hidden rounded-2xl border bg-white/65">
            <div className="divide-y">
              {generated.map((prompt) => (
                <Link
                  key={prompt.id}
                  href={`/${locale}/lab?prompt=${prompt.id}`}
                  className="flex items-center gap-4 p-4 transition hover:bg-surface-soft/60"
                >
                  <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-[#ecf0ff] text-intelligence">
                    <Sparkles className="size-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <h3 className="truncate text-sm font-semibold">{prompt.title}</h3>
                    <p className="mt-1 text-xs text-muted">
                      {prompt.mode} · {prompt.privateMode ? (ar ? "خاص" : "Private") : prompt.status}
                    </p>
                  </div>
                  {prompt.qualityScore ? (
                    <span className="text-xs font-semibold">{prompt.qualityScore}/100</span>
                  ) : null}
                </Link>
              ))}
            </div>
          </div>
        ) : null}
      </section>

      <section className="mt-10" aria-labelledby="collections-title">
        <div className="flex items-center justify-between">
          <h2 id="collections-title" className="text-xl font-bold">
            {ar ? "المجموعات" : "Collections"}
          </h2>
          <CollectionCreator locale={locale} />
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {collections.map((collection) => (
            <div key={collection.id} className="rounded-2xl border bg-white/60 p-5">
              <h3 className="font-semibold">{collection.name}</h3>
              <p className="mt-1 text-xs text-muted">
                {collection._count.items} {ar ? "عناصر" : "items"}
              </p>
            </div>
          ))}
          {!collections.length ? (
            <div className="col-span-full rounded-2xl border border-dashed p-6 text-sm text-muted">
              {ar ? "أنشئ مجموعات لتنظيم أصول العمل حسب العميل أو المهمة." : "Create collections to organize assets by client or job."}
            </div>
          ) : null}
        </div>
      </section>
    </div>
  );
}
