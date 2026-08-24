import type { Metadata } from "next";
import { ArchitectWorkspace } from "@/components/prompt/architect-workspace";
import { isLocale, type Locale } from "@/lib/i18n";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale: raw } = await params;
  const locale = isLocale(raw) ? raw : "ar";
  return {
    title: locale === "ar" ? "مهندس البرومبت الذكي" : "AI Prompt Architect",
    description:
      locale === "ar"
        ? "حوّل فكرتك إلى برومبت احترافي منظم دون الحاجة إلى خبرة في هندسة البرومبت."
        : "Turn an idea into a structured professional prompt without prompt engineering expertise.",
  };
}

export default async function ArchitectPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ project?: string }>;
}) {
  const [{ locale: raw }, query] = await Promise.all([params, searchParams]);
  const locale: Locale = isLocale(raw) ? raw : "ar";
  const ar = locale === "ar";

  return (
    <div className="container-shell py-10 sm:py-14">
      <header className="mb-8 max-w-3xl">
        <p className="eyebrow">{ar ? "من الفكرة إلى تعليمات عالية الأداء" : "Idea to high-performance instruction"}</p>
        <h1 className="mt-3 text-4xl font-bold tracking-[-0.04em] sm:text-5xl">
          {ar ? "مهندس البرومبت" : "Prompt Architect"}
        </h1>
        <p className="mt-4 text-base leading-8 text-muted">
          {ar
            ? "اكتب ما تريد تحقيقه. نطرح فقط الأسئلة التي تغيّر النتيجة مادياً، ثم نبني هيكلاً احترافياً قابلاً لإعادة الاستخدام."
            : "Describe the outcome. We ask only questions that materially improve it, then build a reusable professional structure."}
        </p>
      </header>
      <ArchitectWorkspace locale={locale} projectId={query.project} />
    </div>
  );
}
