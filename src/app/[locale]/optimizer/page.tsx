import type { Metadata } from "next";
import { OptimizerWorkspace } from "@/components/prompt/optimizer-workspace";
import { isLocale, type Locale } from "@/lib/i18n";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale: raw } = await params;
  const locale = isLocale(raw) ? raw : "ar";
  return {
    title: locale === "ar" ? "محسّن البرومبت" : "Prompt Optimizer",
    description:
      locale === "ar"
        ? "حسّن أي برومبت، اكشف الغموض وأضف السياق والقيود وصيغة المخرجات."
        : "Improve any prompt by resolving ambiguity and adding context, constraints and output structure.",
  };
}

export default async function OptimizerPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: raw } = await params;
  const locale: Locale = isLocale(raw) ? raw : "ar";
  const ar = locale === "ar";

  return (
    <div className="container-shell py-10 sm:py-14">
      <header className="mb-8 max-w-3xl">
        <p className="eyebrow">{ar ? "حافظ على النية. حسّن التعليمات." : "Preserve intent. Improve instruction."}</p>
        <h1 className="mt-3 text-4xl font-bold tracking-[-0.04em] sm:text-5xl">
          {ar ? "محسّن البرومبت" : "Prompt Optimizer"}
        </h1>
        <p className="mt-4 text-base leading-8 text-muted">
          {ar
            ? "يحلل الغموض والمعلومات الناقصة والتناقضات، ثم يبني نسخة أوضح ويشرح كل تحسين."
            : "Detect ambiguity, missing information and contradictions, then get a clearer version with an explanation."}
        </p>
      </header>
      <OptimizerWorkspace locale={locale} />
    </div>
  );
}
