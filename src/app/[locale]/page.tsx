import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  BarChart3,
  Bot,
  BrainCircuit,
  Building2,
  Check,
  ChevronLeft,
  ChevronRight,
  Headphones,
  LockKeyhole,
  Megaphone,
  Network,
  Search,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  Workflow,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { db } from "@/lib/db";
import { publicEnv } from "@/lib/env";
import { getDictionary, isLocale, type Locale } from "@/lib/i18n";
import { formatMoney } from "@/lib/utils";

export const dynamic = "force-dynamic";

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
        ? "حوّل عملك إلى شركة تعمل بذكاء"
        : "The AI Operating System for Modern Businesses",
    description:
      locale === "ar"
        ? "موظفون أذكياء يفهمون شركتك ويساعدونها في التسويق والمبيعات وخدمة العملاء وتحليل الأعمال."
        : "Specialized AI employees understand your company and help with marketing, sales, customer service and business analysis.",
    alternates: {
      canonical: `/${locale}`,
      languages: { ar: "/ar", en: "/en" },
    },
  };
}

const employeeIcons = {
  MARKETING_MANAGER: Megaphone,
  CUSTOMER_SERVICE_MANAGER: Headphones,
  SALES_ASSISTANT: TrendingUp,
  CONTENT_CREATOR: Sparkles,
  ECOMMERCE_MANAGER: Building2,
  BUSINESS_ANALYST: BarChart3,
  INDUSTRY_SPECIALIST: Bot,
};

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
  const [employees, packages, plans] = await Promise.all([
    db.aiEmployee.findMany({
      where: { active: true },
      orderBy: { sortOrder: "asc" },
      take: 6,
      select: {
        id: true,
        slug: true,
        type: true,
        nameAr: true,
        nameEn: true,
        purposeAr: true,
        purposeEn: true,
        capabilities: true,
      },
    }),
    db.industryPackage.findMany({
      where: { active: true },
      orderBy: { sortOrder: "asc" },
      take: 4,
      include: { _count: { select: { employees: true } } },
    }),
    db.plan.findMany({
      where: { active: true },
      orderBy: { sortOrder: "asc" },
      take: 4,
    }),
  ]);
  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "EVELIA Intelligence",
    url: publicEnv.appUrl,
    description: ar
      ? "نظام تشغيل أعمال عربي أولاً بموظفين متخصصين من الذكاء الاصطناعي"
      : "Arabic-first AI business operating system with specialized AI employees",
  };
  const faq = [
    {
      qAr: "هل EVELIA مجرد روبوت محادثة؟",
      qEn: "Is EVELIA another chatbot?",
      aAr: "لا. تُسند المهام إلى موظفين متخصصين بأدوار واضحة، ويستخدمون معرفة شركتك المعتمدة ويحفظون النتائج والاستخدام.",
      aEn: "No. Tasks go to specialized employees with defined roles, approved company knowledge, saved outputs and tracked usage.",
    },
    {
      qAr: "كيف تُحمى معلومات شركتي؟",
      qEn: "How is company information protected?",
      aAr: "كل معلومة مرتبطة بمؤسسة محددة، وتتحقق الخوادم من العضوية والصلاحية قبل القراءة أو التنفيذ. لا تنتقل المعرفة بين الشركات.",
      aEn: "Every knowledge entry belongs to one organization, and server-side membership checks run before access or execution. Knowledge never crosses companies.",
    },
    {
      qAr: "هل يحتاج النظام إلى خبرة تقنية؟",
      qEn: "Do I need technical expertise?",
      aAr: "لا. يبدأ الإعداد بنوع العمل والقطاع والأهداف، ثم يقترح الموظفين ومسارات العمل المناسبة.",
      aEn: "No. Onboarding begins with business type, industry and goals, then recommends suitable employees and workflows.",
    },
    {
      qAr: "متى يُخصم الرصيد؟",
      qEn: "When are credits charged?",
      aAr: "بعد نجاح مهمة الذكاء الاصطناعي فقط. فشل المزود أو الحظر قبل التنفيذ لا يستهلك الرصيد.",
      aEn: "Only after successful AI execution. Provider failures and pre-execution moderation do not consume credits.",
    },
  ];
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faq.map((item) => ({
      "@type": "Question",
      name: ar ? item.qAr : item.qEn,
      acceptedAnswer: {
        "@type": "Answer",
        text: ar ? item.aAr : item.aEn,
      },
    })),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />

      <section className="relative overflow-hidden pt-16 sm:pt-24">
        <div className="grid-lines absolute inset-x-0 top-0 -z-10 h-[48rem]" />
        <div className="absolute inset-x-[15%] top-12 -z-10 h-64 rounded-full bg-intelligence/10 blur-3xl" />
        <div className="container-shell">
          <div className="mx-auto max-w-5xl text-center">
            <p className="eyebrow justify-center">
              <Sparkles className="size-3.5" />
              {dictionary.home.eyebrow}
            </p>
            <h1 className="text-balance mt-6 text-4xl font-bold leading-[1.12] tracking-[-0.05em] sm:text-6xl lg:text-[4.75rem]">
              {dictionary.home.title}
            </h1>
            <p className="text-balance mx-auto mt-6 max-w-3xl text-base leading-8 text-muted sm:text-lg">
              {dictionary.home.subtitle}
            </p>
            <div className="mt-9 flex flex-col justify-center gap-3 sm:flex-row">
              <Button asChild variant="accent" size="lg">
                <Link href={`/${locale}/register`}>
                  {dictionary.home.primary}
                  <Arrow className="size-4" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <a href="#how-it-works">{dictionary.home.secondary}</a>
              </Button>
            </div>
          </div>

          <form
            action={`/${locale}/search`}
            className="premium-card mx-auto mt-12 flex max-w-3xl items-center gap-3 p-2 sm:p-3"
            role="search"
          >
            <Search className="ms-2 size-5 shrink-0 text-muted" />
            <label htmlFor="business-search" className="sr-only">
              {ar ? "ابحث عن حل عمل" : "Search business solutions"}
            </label>
            <input
              id="business-search"
              name="q"
              className="min-h-11 min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted/70"
              placeholder={dictionary.home.searchPlaceholder}
            />
            <Button type="submit" size="sm" className="hidden sm:inline-flex">
              {ar ? "ابحث بالهدف" : "Search by goal"}
            </Button>
          </form>

          <div className="mx-auto mt-12 max-w-5xl overflow-hidden rounded-[2rem] border border-white/10 bg-[#181b1f] p-3 shadow-2xl">
            <div className="grid gap-3 md:grid-cols-[15rem_1fr]">
              <div className="rounded-[1.4rem] border border-white/8 bg-white/[0.035] p-5 text-white">
                <div className="flex items-center gap-3 border-b border-white/10 pb-5">
                  <span className="grid size-10 place-items-center rounded-xl bg-[#75a7ff] text-[#181b1f]">
                    <Bot className="size-5" />
                  </span>
                  <div>
                    <p className="text-sm font-bold">EVELIA OS</p>
                    <p className="text-[0.68rem] text-white/45">{ar ? "شركة تجريبية توضيحية" : "Illustrative workspace"}</p>
                  </div>
                </div>
                <div className="mt-5 grid gap-2 text-xs text-white/55">
                  {[ar ? "نظرة عامة" : "Overview", ar ? "الموظفون" : "Employees", ar ? "عقل الشركة" : "Company Brain", ar ? "المهام" : "Tasks", ar ? "التقارير" : "Reports"].map((item, index) => (
                    <div key={item} className={`rounded-lg px-3 py-2 ${index === 0 ? "bg-white/10 text-white" : ""}`}>
                      {item}
                    </div>
                  ))}
                </div>
              </div>
              <div className="rounded-[1.4rem] bg-[#f5f6f8] p-5 sm:p-7">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <p className="text-xs text-muted">{ar ? "صباح الخير" : "Good morning"}</p>
                    <h2 className="mt-1 text-xl font-bold">{ar ? "فريقك الذكي جاهز للعمل" : "Your AI workforce is ready"}</h2>
                  </div>
                  <Button asChild size="sm">
                    <Link href={`/${locale}/register`}>{ar ? "مهمة جديدة" : "New task"}</Link>
                  </Button>
                </div>
                <div className="mt-6 grid gap-3 sm:grid-cols-3">
                  {[
                    [Bot, ar ? "فريق AI مفعل" : "Active AI workforce"],
                    [BrainCircuit, ar ? "معرفة شركة معتمدة" : "Approved company knowledge"],
                    [Workflow, ar ? "سير عمل منظم" : "Structured workflow"],
                  ].map(([Icon, label]) => {
                    const ItemIcon = Icon as typeof Bot;
                    return (
                      <div key={String(label)} className="rounded-xl border bg-white p-4">
                        <ItemIcon className="size-4 text-intelligence" />
                        <p className="mt-4 text-sm font-semibold">{String(label)}</p>
                        <p className="mt-1 text-[0.68rem] text-muted">{ar ? "مثال توضيحي للواجهة" : "Illustrative UI example"}</p>
                      </div>
                    );
                  })}
                </div>
                <div className="mt-3 rounded-xl border bg-white p-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-bold">{ar ? "مؤشر ذكاء الأعمال" : "Business Intelligence Score"}</p>
                      <p className="mt-1 text-xs text-muted">{ar ? "مؤشر إرشادي مبني على البيانات" : "Data-based guidance indicator"}</p>
                    </div>
                    <span className="rounded-full bg-[#eaf0ff] px-3 py-1 text-sm font-bold text-intelligence">
                      {ar ? "مثال" : "Example"} · 78/100
                    </span>
                  </div>
                  <div className="mt-4 h-2 rounded-full bg-surface-soft">
                    <div className="h-full w-[78%] rounded-full bg-intelligence" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="container-shell mt-24" aria-labelledby="why-evelia">
        <div className="max-w-3xl">
          <p className="eyebrow">{ar ? "لماذا EVELIA؟" : "Why EVELIA"}</p>
          <h2 id="why-evelia" className="text-balance mt-3 text-3xl font-bold tracking-[-0.04em] sm:text-5xl">
            {ar ? "لا تحتاج أداة AI أخرى. تحتاج نظاماً يفهم كيف يعمل نشاطك." : "You do not need another AI tool. You need a system that understands how your business works."}
          </h2>
        </div>
        <div className="mt-9 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[
            [Bot, ar ? "موظفون جاهزون" : "Ready employees", ar ? "أدوار وقدرات وإجراءات محددة لكل وظيفة." : "Defined roles, capabilities and actions for every job."],
            [BrainCircuit, ar ? "عقل الشركة" : "Company Brain", ar ? "معرفة معتمدة بالمنتجات والسياسات والعملاء." : "Approved product, policy and customer knowledge."],
            [Network, ar ? "عمل منظم" : "Organized execution", ar ? "مهام ومشاريع وسير عمل ونتائج قابلة للمراجعة." : "Reviewable tasks, projects, workflows and outputs."],
            [BarChart3, ar ? "قرارات أوضح" : "Clearer decisions", ar ? "تقارير وتوصيات مبنية على الاستخدام الفعلي." : "Reports and recommendations based on actual usage."],
          ].map(([Icon, title, text]) => {
            const ItemIcon = Icon as typeof Bot;
            return (
              <div key={String(title)} className="premium-card p-6">
                <span className="grid size-11 place-items-center rounded-xl bg-[#eaf0ff] text-intelligence">
                  <ItemIcon className="size-5" />
                </span>
                <h3 className="mt-5 text-lg font-bold">{String(title)}</h3>
                <p className="mt-2 text-sm leading-7 text-muted">{String(text)}</p>
              </div>
            );
          })}
        </div>
      </section>

      <section className="container-shell mt-24" aria-labelledby="employees-title">
        <div className="flex flex-wrap items-end justify-between gap-5">
          <div>
            <p className="eyebrow">{ar ? "فريقك الجديد" : "Your new workforce"}</p>
            <h2 id="employees-title" className="mt-3 text-3xl font-bold tracking-[-0.04em] sm:text-5xl">
              {ar ? "موظفون متخصصون، لا روبوت عام" : "Specialized employees, not a generic bot"}
            </h2>
          </div>
          <Button asChild variant="outline">
            <Link href={`/${locale}/employees`}>
              {ar ? "استكشف كل الموظفين" : "Explore all employees"}
              <Arrow className="size-4" />
            </Link>
          </Button>
        </div>
        <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {employees.map((employee) => {
            const Icon = employeeIcons[employee.type];
            const capabilities = employee.capabilities as {
              ar?: string[];
              en?: string[];
            };
            const items = (ar ? capabilities.ar : capabilities.en) ?? [];
            return (
              <article key={employee.id} className="group overflow-hidden rounded-2xl border bg-white/70 transition hover:-translate-y-1 hover:border-intelligence/40">
                <div className="bg-[#181b1f] p-6 text-white">
                  <span className="grid size-10 place-items-center rounded-xl border border-white/10 bg-white/5">
                    <Icon className="size-5 text-[#75a7ff]" />
                  </span>
                  <h3 className="mt-6 text-xl font-bold">{ar ? employee.nameAr : employee.nameEn}</h3>
                  <p className="mt-2 min-h-12 text-sm leading-6 text-white/55">
                    {ar ? employee.purposeAr : employee.purposeEn}
                  </p>
                </div>
                <div className="p-5">
                  <ul className="grid gap-2 text-xs text-muted">
                    {items.slice(0, 3).map((item) => (
                      <li key={item} className="flex items-center gap-2">
                        <Check className="size-3.5 text-success" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section className="container-shell mt-24">
        <div className="overflow-hidden rounded-[2rem] bg-[#181b1f] text-white shadow-2xl">
          <div className="grid lg:grid-cols-[0.9fr_1.1fr]">
            <div className="p-8 sm:p-12">
              <p className="eyebrow !text-[#75a7ff]">{ar ? "عقل الشركة" : "Company Brain"}</p>
              <h2 className="text-balance mt-4 text-3xl font-bold tracking-[-0.04em] sm:text-5xl">
                {ar ? "موظفون يفهمون شركتك، لا يخمنون عنها." : "Employees that understand your company instead of guessing."}
              </h2>
              <p className="mt-5 text-sm leading-8 text-white/58">
                {ar
                  ? "أضف الخدمات والمنتجات والسياسات ونبرة العلامة والمستندات. يستخدم EVELIA المعرفة المعتمدة فقط، مع عزل كامل بين المؤسسات."
                  : "Add services, products, policies, brand voice and documents. EVELIA uses approved knowledge only, with strict organization isolation."}
              </p>
              <ul className="mt-7 grid gap-3 text-sm text-white/80">
                {[ar ? "PDF وDOCX ونصوص" : "PDF, DOCX and text", ar ? "اعتماد واستبعاد يدوي" : "Approval and manual-only controls", ar ? "تهيئة للبحث الدلالي مستقبلاً" : "Future semantic search ready"].map((item) => (
                  <li key={item} className="flex items-center gap-3">
                    <span className="grid size-6 place-items-center rounded-full bg-white/10">
                      <Check className="size-3.5 text-[#75a7ff]" />
                    </span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div className="m-4 rounded-[1.5rem] border border-white/10 bg-white/[0.04] p-6 sm:m-6 sm:p-8">
              <div className="flex items-center gap-3 border-b border-white/10 pb-5">
                <BrainCircuit className="size-5 text-[#75a7ff]" />
                <div>
                  <p className="font-bold">{ar ? "معرفة الشركة المعتمدة" : "Approved company knowledge"}</p>
                  <p className="text-xs text-white/40">{ar ? "لا تظهر لشركة أخرى" : "Never visible to another company"}</p>
                </div>
              </div>
              <div className="mt-5 grid gap-3">
                {[
                  [ar ? "نبرة العلامة" : "Brand voice", ar ? "مهنية، فاخرة، موثوقة" : "Professional, premium, trustworthy"],
                  [ar ? "المنتجات" : "Products", ar ? "عطور سعودية فاخرة" : "Luxury Saudi perfumes"],
                  [ar ? "الجمهور" : "Audience", ar ? "نساء 25–45 في السعودية" : "Women 25–45 in Saudi Arabia"],
                  [ar ? "سياسة التوصيل" : "Delivery policy", ar ? "معلومة معتمدة من مستند الشركة" : "Approved from a company document"],
                ].map(([title, text]) => (
                  <div key={title} className="rounded-xl border border-white/8 bg-white/[0.035] p-4">
                    <p className="text-xs font-semibold text-[#75a7ff]">{title}</p>
                    <p className="mt-2 text-sm text-white/70">{text}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="how-it-works" className="container-shell mt-24 scroll-mt-24">
        <div className="text-center">
          <p className="eyebrow justify-center">{ar ? "ابدأ بدون تعقيد" : "Start without complexity"}</p>
          <h2 className="mt-3 text-3xl font-bold tracking-[-0.04em] sm:text-5xl">
            {ar ? "من شركة تقليدية إلى عمل يعمل بذكاء" : "From traditional operations to an AI-powered business"}
          </h2>
        </div>
        <div className="mt-10 grid gap-4 md:grid-cols-3">
          {[
            ["01", ar ? "عرّف شركتك" : "Connect your business", ar ? "اختر النشاط والقطاع والأهداف، وأضف المعرفة المعتمدة." : "Choose business type, industry and goals, then add approved knowledge."],
            ["02", ar ? "فعّل الموظفين" : "Activate AI employees", ar ? "اختر موظفين متخصصين وفق أولوياتك الحالية." : "Choose specialists aligned with your current priorities."],
            ["03", ar ? "انمُ بذكاء" : "Grow smarter", ar ? "نفّذ المهام وراجع النتائج والتقارير والتوصيات." : "Run tasks and review outputs, reports and recommendations."],
          ].map(([number, title, text]) => (
            <div key={number} className="premium-card p-7">
              <span className="text-sm font-bold text-intelligence">{number}</span>
              <h3 className="mt-7 text-xl font-bold">{title}</h3>
              <p className="mt-3 text-sm leading-7 text-muted">{text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="container-shell mt-24" aria-labelledby="industries-title">
        <div className="flex flex-wrap items-end justify-between gap-5">
          <div>
            <p className="eyebrow">{ar ? "حلول القطاعات" : "Industry solutions"}</p>
            <h2 id="industries-title" className="mt-3 text-3xl font-bold tracking-[-0.04em] sm:text-5xl">
              {ar ? "فريق مناسب لطبيعة عملك" : "A workforce shaped for your industry"}
            </h2>
          </div>
          <Button asChild variant="ghost">
            <Link href={`/${locale}/industries`}>{ar ? "كل القطاعات" : "All industries"} <Arrow className="size-4" /></Link>
          </Button>
        </div>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {packages.map((item) => (
            <Link
              href={`/${locale}/industries`}
              key={item.id}
              className="premium-card group p-6 transition hover:-translate-y-0.5 hover:border-intelligence/40"
            >
              <Building2 className="size-5 text-intelligence" />
              <p className="mt-5 text-xs text-muted">{item.industry}</p>
              <h3 className="mt-1 text-lg font-bold">{ar ? item.nameAr : item.nameEn}</h3>
              <p className="mt-3 text-xs text-muted">{item._count.employees} {ar ? "موظفين مقترحين" : "recommended employees"}</p>
              <Chevron className="mt-5 size-4 text-muted group-hover:text-foreground" />
            </Link>
          ))}
        </div>
      </section>

      <section className="container-shell mt-24">
        <div className="grid gap-4 md:grid-cols-3">
          {[
            [ShieldCheck, ar ? "عزل المؤسسات" : "Organization isolation", ar ? "الصلاحيات والملكية تُفحصان على الخادم قبل كل وصول." : "Permissions and ownership are checked server-side before access."],
            [LockKeyhole, ar ? "أسرار محمية" : "Protected secrets", ar ? "مفاتيح المزود وتعليماته لا تصل إلى الواجهة." : "Provider keys and internal instructions never reach the browser."],
            [Network, ar ? "تتبع واضح" : "Transparent operations", ar ? "المهام والرصيد والاستخدام وسجل الإدارة قابلة للمراجعة." : "Tasks, credits, usage and admin actions are reviewable."],
          ].map(([Icon, title, text]) => {
            const ItemIcon = Icon as typeof ShieldCheck;
            return (
              <div key={String(title)} className="rounded-2xl p-6">
                <ItemIcon className="size-6 text-intelligence" />
                <h3 className="mt-4 font-bold">{String(title)}</h3>
                <p className="mt-2 text-sm leading-7 text-muted">{String(text)}</p>
              </div>
            );
          })}
        </div>
      </section>

      <section className="container-shell mt-24" aria-labelledby="pricing-title">
        <div className="text-center">
          <p className="eyebrow justify-center">{ar ? "خطط قابلة للتوسع" : "Plans that scale"}</p>
          <h2 id="pricing-title" className="mt-3 text-3xl font-bold tracking-[-0.04em] sm:text-5xl">
            {ar ? "ابدأ صغيراً وابنِ فريقك مع النمو" : "Start focused and expand your workforce"}
          </h2>
        </div>
        <div className="mt-9 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {plans.map((plan, index) => {
            const features = Array.isArray(plan.features)
              ? (plan.features as Array<{ ar?: string; en?: string }>)
              : [];
            return (
              <article key={plan.id} className={`rounded-2xl border p-6 ${index === 1 ? "border-intelligence bg-[#181b1f] text-white shadow-xl" : "bg-white/70"}`}>
                <h3 className="text-xl font-bold">{ar ? plan.nameAr : plan.nameEn}</h3>
                <p className={`mt-2 min-h-12 text-sm leading-6 ${index === 1 ? "text-white/55" : "text-muted"}`}>
                  {ar ? plan.descriptionAr : plan.descriptionEn}
                </p>
                <strong className="mt-6 block text-3xl">
                  {formatMoney(Number(plan.monthlyPrice), plan.currency, locale)}
                </strong>
                <p className={`mt-1 text-xs ${index === 1 ? "text-white/40" : "text-muted"}`}>/{ar ? "شهرياً" : "month"}</p>
                <ul className="my-6 grid gap-3 border-y border-current/10 py-5 text-sm">
                  {features.slice(0, 3).map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex gap-2">
                      <Check className="mt-0.5 size-4 shrink-0 text-success" />
                      {ar ? feature.ar : feature.en}
                    </li>
                  ))}
                </ul>
                <Button asChild variant={index === 1 ? "accent" : "outline"} className="w-full">
                  <Link href={`/${locale}/register`}>{ar ? "ابدأ الآن" : "Start now"}</Link>
                </Button>
              </article>
            );
          })}
        </div>
      </section>

      <section className="container-shell mt-24" aria-labelledby="faq-title">
        <div className="mx-auto max-w-3xl">
          <div className="text-center">
            <p className="eyebrow justify-center">{ar ? "أسئلة واضحة" : "Clear answers"}</p>
            <h2 id="faq-title" className="mt-3 text-3xl font-bold tracking-[-0.04em] sm:text-5xl">
              {ar ? "قبل أن تبدأ" : "Before you begin"}
            </h2>
          </div>
          <div className="mt-8 grid gap-3">
            {faq.map((item) => (
              <details key={item.qEn} className="premium-card group p-5">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-semibold [&::-webkit-details-marker]:hidden">
                  {ar ? item.qAr : item.qEn}
                  <span className="text-xl text-muted group-open:rotate-45">+</span>
                </summary>
                <p className="mt-4 border-t pt-4 text-sm leading-7 text-muted">
                  {ar ? item.aAr : item.aEn}
                </p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <section className="container-shell mt-24">
        <div className="premium-card relative overflow-hidden p-8 text-center sm:p-14">
          <div className="absolute inset-x-[20%] top-0 -z-10 h-40 rounded-full bg-intelligence/12 blur-3xl" />
          <p className="eyebrow justify-center">{ar ? "فريقك الذكي يبدأ هنا" : "Your AI workforce starts here"}</p>
          <h2 className="text-balance mx-auto mt-4 max-w-3xl text-3xl font-bold tracking-[-0.04em] sm:text-5xl">
            {ar ? "أعطِ كل شركة إمكانية الوصول إلى موظفين أذكياء." : "Give every business access to intelligent AI employees."}
          </h2>
          <Button asChild variant="accent" size="lg" className="mt-8">
            <Link href={`/${locale}/register`}>
              {ar ? "ابدأ مجاناً" : "Start free"}
              <Arrow className="size-4" />
            </Link>
          </Button>
        </div>
      </section>
    </>
  );
}
