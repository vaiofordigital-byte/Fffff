import type { Metadata } from "next";
import { Bot, Building2, Check } from "lucide-react";
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
    title: locale === "ar" ? "حلول AI حسب القطاع" : "Industry AI solutions",
    description:
      locale === "ar"
        ? "فرق ذكاء اصطناعي جاهزة للتجارة والمطاعم والعقار والوكالات."
        : "Ready AI workforces for commerce, restaurants, real estate and agencies.",
  };
}

export default async function IndustriesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: raw } = await params;
  const locale: Locale = isLocale(raw) ? raw : "ar";
  const ar = locale === "ar";
  const packages = await db.industryPackage.findMany({
    where: { active: true },
    orderBy: { sortOrder: "asc" },
    include: {
      employees: {
        orderBy: { sortOrder: "asc" },
        include: {
          aiEmployee: {
            select: { nameAr: true, nameEn: true, slug: true },
          },
        },
      },
    },
  });

  return (
    <div className="container-shell py-14 sm:py-20">
      <header className="mx-auto max-w-3xl text-center">
        <span className="mx-auto grid size-12 place-items-center rounded-2xl bg-[#eaf0ff] text-intelligence">
          <Building2 className="size-5" />
        </span>
        <p className="eyebrow mt-5 justify-center">{ar ? "ابدأ من واقع قطاعك" : "Start from your industry reality"}</p>
        <h1 className="text-balance mt-3 text-4xl font-bold tracking-[-0.04em] sm:text-6xl">
          {ar ? "فريق AI مناسب لطبيعة عملك" : "An AI workforce shaped for your business"}
        </h1>
        <p className="mt-5 text-base leading-8 text-muted">
          {ar
            ? "الحزم تجمع موظفين متخصصين، لكنها لا تدّعي معرفة شركتك قبل إضافة سياقها المعتمد."
            : "Packages combine specialists without pretending to know your company before approved context is added."}
        </p>
      </header>

      <div className="mt-12 grid gap-5 md:grid-cols-2">
        {packages.map((item) => (
          <article key={item.id} className="premium-card overflow-hidden">
            <div className="bg-[#181b1f] p-7 text-white">
              <p className="text-xs font-semibold uppercase tracking-wider text-[#75a7ff]">
                {item.industry}
              </p>
              <h2 className="mt-3 text-2xl font-bold">
                {ar ? item.nameAr : item.nameEn}
              </h2>
              <p className="mt-3 text-sm leading-7 text-white/58">
                {ar ? item.descriptionAr : item.descriptionEn}
              </p>
            </div>
            <div className="p-6">
              <h3 className="text-xs font-bold text-muted">
                {ar ? "الفريق المقترح" : "Recommended workforce"}
              </h3>
              <ul className="mt-4 grid gap-3">
                {item.employees.map(({ aiEmployee }) => (
                  <li key={aiEmployee.slug} className="flex items-center gap-3 text-sm">
                    <span className="grid size-7 place-items-center rounded-lg bg-[#eaf0ff] text-intelligence">
                      <Bot className="size-3.5" />
                    </span>
                    <span className="flex-1">
                      {ar ? aiEmployee.nameAr : aiEmployee.nameEn}
                    </span>
                    <Check className="size-4 text-success" />
                  </li>
                ))}
              </ul>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
