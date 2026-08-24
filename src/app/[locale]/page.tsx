import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  Blocks,
  BrainCircuit,
  BriefcaseBusiness,
  Check,
  ChevronLeft,
  ChevronRight,
  FlaskConical,
  FolderLock,
  Layers3,
  Search,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  WandSparkles,
  Workflow,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { getDictionary, isLocale, type Locale } from "@/lib/i18n";
import { publicEnv } from "@/lib/env";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale: raw } = await params;
  const locale: Locale = isLocale(raw) ? raw : "ar";
  return {
    title:
      locale === "ar"
        ? "تعليمات أذكى. نتائج احترافية."
        : "Smarter instructions. Professional results.",
    alternates: {
      canonical: `/${locale}`,
      languages: { ar: "/ar", en: "/en" },
    },
  };
}

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: raw } = await params;
  const locale: Locale = isLocale(raw) ? raw : "ar";
  const ar = locale === "ar";
  const dictionary = getDictionary(locale);
  const Arrow = ar ? ArrowLeft : ArrowRight;
  const Chevron = ar ? ChevronLeft : ChevronRight;

  const capabilities = [
    {
      icon: WandSparkles,
      title: ar ? "مهندس البرومبت" : "Prompt Architect",
      text: ar
        ? "صف ما تريد بلغتك، واحصل على تعليمات احترافية منظمة دون خبرة مسبقة."
        : "Describe your goal naturally and receive a structured professional instruction.",
      href: "architect",
      tone: "bg-[#ecf0ff] text-intelligence",
    },
    {
      icon: FlaskConical,
      title: ar ? "مختبر البرومبت" : "Prompt Lab",
      text: ar
        ? "حرّر المتغيرات، قارن النسخ، راقب الجودة واحفظ أفضل إصدار."
        : "Edit variables, compare versions, inspect quality and keep the best result.",
      href: "lab",
      tone: "bg-[#f4eee2] text-accent-strong",
    },
    {
      icon: ShoppingBag,
      title: ar ? "متجر مهني" : "Professional marketplace",
      text: ar
        ? "أصول مدروسة للقطاعات والمهام الحقيقية، مع تحديثات وتراخيص واضحة."
        : "Curated assets for real jobs, with clear licenses and version updates.",
      href: "marketplace",
      tone: "bg-[#e8f3ed] text-success",
    },
    {
      icon: FolderLock,
      title: ar ? "خزنة السياق" : "Context Vault",
      text: ar
        ? "احفظ سياق علامتك ومشاريعك بأمان وأعد استخدامه بإذن واضح."
        : "Securely keep approved brand and project context for deliberate reuse.",
      href: "vault",
      tone: "bg-[#f2ebf4] text-[#7c4b83]",
    },
  ];

  const categories = [
    [BriefcaseBusiness, ar ? "الأعمال والاستراتيجية" : "Business & strategy", "business"],
    [ShoppingBag, ar ? "التجارة الإلكترونية" : "E-commerce", "ecommerce"],
    [BrainCircuit, ar ? "التسويق والمحتوى" : "Marketing & content", "marketing"],
    [Blocks, ar ? "البرمجة والتقنية" : "Development & tech", "programming"],
    [Layers3, ar ? "الإنتاجية والبحث" : "Productivity & research", "productivity"],
    [Workflow, ar ? "سير العمل المتعدد" : "Multi-step workflows", "workflows"],
  ] as const;

  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "PROMPTX",
    url: publicEnv.appUrl,
    description: ar
      ? "نظام تشغيل عربي للبرومبتات الاحترافية"
      : "Arabic-first professional prompt operating system",
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
      />
      <section className="relative overflow-hidden pt-16 sm:pt-24">
        <div className="grid-lines absolute inset-x-0 top-0 -z-10 h-[42rem]" />
        <div className="container-shell">
          <div className="mx-auto max-w-4xl text-center">
            <p className="eyebrow justify-center">
              <Sparkles className="size-3.5" aria-hidden="true" />
              {dictionary.home.eyebrow}
            </p>
            <h1 className="text-balance mt-6 text-4xl font-bold leading-[1.15] tracking-[-0.045em] sm:text-6xl lg:text-[4.65rem]">
              {dictionary.home.title}
            </h1>
            <p className="text-balance mx-auto mt-6 max-w-2xl text-base leading-8 text-muted sm:text-lg">
              {dictionary.home.subtitle}
            </p>
            <div className="mt-9 flex flex-col justify-center gap-3 sm:flex-row">
              <Button asChild variant="accent" size="lg">
                <Link href={`/${locale}/architect`}>
                  {dictionary.home.primary}
                  <Arrow className="size-4" aria-hidden="true" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link href={`/${locale}/marketplace`}>
                  {dictionary.home.secondary}
                </Link>
              </Button>
            </div>
          </div>

          <form
            action={`/${locale}/marketplace`}
            className="premium-card mx-auto mt-12 flex max-w-3xl items-center gap-3 p-2 sm:p-3"
            role="search"
          >
            <Search className="ms-2 size-5 shrink-0 text-muted" aria-hidden="true" />
            <label htmlFor="home-search" className="sr-only">
              {ar ? "ابحث عن برومبت" : "Search prompts"}
            </label>
            <input
              id="home-search"
              name="q"
              className="min-h-11 min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted/70"
              placeholder={dictionary.home.searchPlaceholder}
            />
            <Button type="submit" size="sm" className="hidden sm:inline-flex">
              {ar ? "ابحث بذكاء" : "Smart search"}
            </Button>
          </form>
        </div>
      </section>

      <section className="container-shell mt-24" aria-labelledby="capabilities-title">
        <div className="flex items-end justify-between gap-6">
          <div>
            <p className="eyebrow">{ar ? "من الفكرة إلى أصل عمل" : "Idea to business asset"}</p>
            <h2 id="capabilities-title" className="mt-3 text-3xl font-bold tracking-[-0.035em] sm:text-4xl">
              {ar ? "مساحة واحدة لكل دورة عملك مع AI" : "One system for your complete AI workflow"}
            </h2>
          </div>
        </div>
        <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {capabilities.map((item) => (
            <Link
              href={`/${locale}/${item.href}`}
              key={item.href}
              className="premium-card group flex min-h-64 flex-col p-6 transition duration-300 hover:-translate-y-1 hover:border-accent/40 hover:shadow-xl"
            >
              <span className={`grid size-11 place-items-center rounded-xl ${item.tone}`}>
                <item.icon className="size-5" aria-hidden="true" />
              </span>
              <h3 className="mt-6 text-lg font-bold">{item.title}</h3>
              <p className="mt-3 text-sm leading-7 text-muted">{item.text}</p>
              <span className="mt-auto inline-flex items-center gap-1 pt-5 text-sm font-semibold">
                {dictionary.common.explore}
                <Chevron className="size-4 transition group-hover:translate-x-[-2px] rtl:group-hover:translate-x-[2px]" />
              </span>
            </Link>
          ))}
        </div>
      </section>

      <section className="container-shell mt-24">
        <div className="overflow-hidden rounded-[2rem] bg-[#191b18] text-white shadow-2xl">
          <div className="grid lg:grid-cols-[0.9fr_1.1fr]">
            <div className="p-7 sm:p-11 lg:p-14">
              <p className="eyebrow !text-[#d8b66f]">
                {ar ? "ذكاء منظم" : "Structured intelligence"}
              </p>
              <h2 className="text-balance mt-4 text-3xl font-bold leading-tight tracking-[-0.035em] sm:text-4xl">
                {ar
                  ? "لا تكتب برومبتاً أطول. اكتب تعليمات أوضح."
                  : "Do not write a longer prompt. Write a clearer instruction."}
              </h2>
              <p className="mt-5 max-w-lg text-sm leading-7 text-white/62">
                {ar
                  ? "يحلل PROMPTX الهدف والسياق والجمهور والقيود وشكل المخرجات، ثم يعرض مؤشر جودة بنيوياً قابلاً للفهم."
                  : "PROMPTX analyzes the goal, context, audience, constraints and output format, then exposes an explainable structural quality score."}
              </p>
              <ul className="mt-7 grid gap-3 text-sm text-white/85">
                {[
                  ar ? "متغيرات قابلة لإعادة الاستخدام" : "Reusable variables",
                  ar ? "قيود وصيغة مخرجات دقيقة" : "Precise constraints and output format",
                  ar ? "مراجعة جودة قبل النتيجة" : "Quality control before the result",
                ].map((item) => (
                  <li key={item} className="flex items-center gap-3">
                    <span className="grid size-6 place-items-center rounded-full bg-white/10">
                      <Check className="size-3.5 text-[#d8b66f]" aria-hidden="true" />
                    </span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div className="relative m-3 min-h-96 overflow-hidden rounded-[1.45rem] border border-white/10 bg-[#222520] p-5 sm:m-5 sm:p-7">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(182,138,58,.16),transparent_45%)]" />
              <div className="relative flex items-center justify-between border-b border-white/10 pb-4">
                <div className="flex items-center gap-3">
                  <span className="grid size-9 place-items-center rounded-lg bg-[#d8b66f] text-[#191b18]">
                    <Sparkles className="size-4" />
                  </span>
                  <div>
                    <p className="text-sm font-semibold">{ar ? "حملة إطلاق متجر عطور" : "Perfume store launch"}</p>
                    <p className="text-xs text-white/45">{ar ? "إصدار العمل" : "Working version"} · v1.2</p>
                  </div>
                </div>
                <div className="rounded-full border border-[#d8b66f]/25 bg-[#d8b66f]/8 px-3 py-1 text-xs text-[#e1c382]">
                  {ar ? "مثال توضيحي" : "Illustrative"} · 91 / 100
                </div>
              </div>
              <div className="relative mt-6 grid gap-4 text-sm">
                {[
                  [ar ? "الدور" : "ROLE", ar ? "خبير نمو للتجارة الفاخرة" : "Luxury commerce growth strategist"],
                  [ar ? "الهدف" : "OBJECTIVE", ar ? "بناء حملة إطلاق قابلة للقياس" : "Build a measurable launch campaign"],
                  [ar ? "السوق" : "MARKET", "{{COUNTRY}} · {{AUDIENCE}}"],
                  [ar ? "المخرجات" : "OUTPUT", ar ? "استراتيجية، رسائل، قنوات، مؤشرات" : "Strategy, messaging, channels, metrics"],
                ].map(([label, value]) => (
                  <div key={label} className="rounded-xl border border-white/8 bg-white/[0.035] p-4">
                    <p className="text-[0.68rem] font-bold tracking-widest text-[#d8b66f]">{label}</p>
                    <p className="mt-2 text-white/78">{value}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="container-shell mt-24" aria-labelledby="categories-title">
        <div className="text-center">
          <p className="eyebrow justify-center">{ar ? "مكتبة تتحدث لغة العمل" : "A library that speaks business"}</p>
          <h2 id="categories-title" className="mt-3 text-3xl font-bold tracking-[-0.035em] sm:text-4xl">
            {ar ? "ابدأ من المهمة، لا من صفحة فارغة" : "Start from the job, not a blank page"}
          </h2>
        </div>
        <div className="mt-9 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {categories.map(([Icon, label, slug]) => (
            <Link
              href={`/${locale}/marketplace?category=${slug}`}
              key={slug}
              className="group flex items-center gap-4 rounded-2xl border bg-white/70 p-5 transition hover:border-accent/40 hover:bg-white"
            >
              <span className="grid size-11 place-items-center rounded-xl bg-surface-soft">
                <Icon className="size-5" aria-hidden="true" />
              </span>
              <span className="font-semibold">{label}</span>
              <Chevron className="ms-auto size-4 text-muted transition group-hover:text-foreground" />
            </Link>
          ))}
        </div>
      </section>

      <section className="container-shell mt-24">
        <div className="grid gap-4 md:grid-cols-3">
          {[
            [ShieldCheck, ar ? "محتوى مدفوع محمي" : "Protected premium content", ar ? "لا يصل المحتوى الاحترافي إلا بعد التحقق من الاستحقاق على الخادم." : "Premium content is returned only after server-side entitlement checks."],
            [Layers3, ar ? "إصدارات قابلة للتتبع" : "Traceable versions", ar ? "احتفظ بالأصل الرسمي وأنشئ نسختك الخاصة دون فقد التحديثات." : "Keep the official asset intact while building private personal revisions."],
            [FolderLock, ar ? "خصوصية تتحكم بها" : "Privacy you control", ar ? "الوضع الخاص يقلل التخزين ويمنع فهرسة المحتوى الشخصي." : "Private mode minimizes storage and excludes personal prompts from indexing."],
          ].map(([Icon, title, text]) => {
            const ItemIcon = Icon as typeof ShieldCheck;
            return (
              <div key={String(title)} className="rounded-2xl border border-transparent p-6">
                <ItemIcon className="size-6 text-accent-strong" aria-hidden="true" />
                <h3 className="mt-4 font-bold">{String(title)}</h3>
                <p className="mt-2 text-sm leading-7 text-muted">{String(text)}</p>
              </div>
            );
          })}
        </div>
      </section>

      <section className="container-shell mt-24">
        <div className="premium-card relative overflow-hidden p-8 text-center sm:p-14">
          <div className="absolute inset-x-[20%] top-0 -z-10 h-40 rounded-full bg-accent/10 blur-3xl" />
          <p className="eyebrow justify-center">
            {ar ? "نتيجة أفضل تبدأ الآن" : "A better result starts now"}
          </p>
          <h2 className="text-balance mx-auto mt-4 max-w-2xl text-3xl font-bold tracking-[-0.035em] sm:text-5xl">
            {ar
              ? "حوّل فكرتك التالية إلى أصل عمل ذكي."
              : "Turn your next idea into an intelligent business asset."}
          </h2>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Button asChild variant="accent" size="lg">
              <Link href={`/${locale}/architect`}>
                {dictionary.home.primary}
                <Arrow className="size-4" />
              </Link>
            </Button>
            <Button asChild variant="ghost" size="lg">
              <Link href={`/${locale}/pricing`}>
                {ar ? "قارن الخطط" : "Compare plans"}
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </>
  );
}
