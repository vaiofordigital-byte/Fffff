import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Building2, CheckCircle2, HelpCircle, ShieldCheck } from "lucide-react";
import { db } from "@/lib/db";
import { isLocale, type Locale } from "@/lib/i18n";

export const dynamic = "force-dynamic";

type BuiltInPage = {
  titleAr: string;
  titleEn: string;
  introAr: string;
  introEn: string;
  sections: Array<{ headingAr: string; headingEn: string; bodyAr: string; bodyEn: string }>;
};

const builtIns: Record<string, BuiltInPage> = {
  about: {
    titleAr: "عن EVELIA",
    titleEn: "About EVELIA",
    introAr: "نظام تشغيل أعمال عربي أولاً يمنح الشركات موظفين متخصصين من الذكاء الاصطناعي.",
    introEn: "An Arabic-first business operating system that gives companies specialized AI employees.",
    sections: [
      {
        headingAr: "المبدأ",
        headingEn: "Our principle",
        bodyAr: "العمل الأفضل يبدأ بمعرفة شركة معتمدة وأدوار واضحة ونتائج قابلة للمراجعة، لا بوعود مبالغ فيها.",
        bodyEn: "Better work starts with approved company knowledge, clear roles and reviewable outputs—not inflated AI promises.",
      },
    ],
  },
  privacy: {
    titleAr: "سياسة الخصوصية",
    titleEn: "Privacy policy",
    introAr: "نوضح البيانات التي تحتاجها الخدمة، ولماذا تُستخدم، وكيف يمكنك التحكم بها.",
    introEn: "We explain what data the service needs, why it is used and how you control it.",
    sections: [
      {
        headingAr: "تقليل البيانات",
        headingEn: "Data minimization",
        bodyAr: "لا نفهرس مهام الشركة أو معرفتها الخاصة. يقلل الوضع الخاص التخزين، وتتوفر أدوات الحذف وفق متطلبات الاحتفاظ القانونية والمالية.",
        bodyEn: "Private company tasks and knowledge are not indexed. Private mode minimizes storage, and deletion controls respect legal and financial retention duties.",
      },
      {
        headingAr: "التحليلات",
        headingEn: "Analytics",
        bodyAr: "نستخدم بيانات مجمعة لتحسين المنتج. تُحذف أنماط البريد والأرقام الطويلة من مصطلحات البحث التحليلية.",
        bodyEn: "We use aggregated data to improve the product. Email patterns and long numbers are excluded from analytical search terms.",
      },
    ],
  },
  terms: {
    titleAr: "شروط الاستخدام",
    titleEn: "Terms of use",
    introAr: "استخدم EVELIA بصورة قانونية ومسؤولة، وراجع مخرجات AI قبل الاعتماد عليها.",
    introEn: "Use EVELIA lawfully and responsibly, and review AI outputs before relying on them.",
    sections: [
      {
        headingAr: "المخرجات",
        headingEn: "Outputs",
        bodyAr: "مؤشر الجودة تقييم بنيوي وليس ضماناً لصحة أو ملاءمة مخرجات مزود الذكاء الاصطناعي.",
        bodyEn: "The quality score is structural and does not guarantee the correctness or fitness of provider outputs.",
      },
    ],
  },
  licenses: {
    titleAr: "سياسة استخدام الذكاء الاصطناعي",
    titleEn: "AI usage policy",
    introAr: "تحدد الخطة حدود الموظفين والرصيد والأعضاء، وتبقى مسؤولية مراجعة المخرجات لدى الشركة.",
    introEn: "Plans define employee, credit and member limits; the company remains responsible for reviewing outputs.",
    sections: [
      {
        headingAr: "شخصي واحترافي",
        headingEn: "Personal and professional",
        bodyAr: "يجب ألا تُستخدم المخرجات في التضليل أو انتهاك الخصوصية أو اتخاذ قرارات عالية المخاطر دون مراجعة بشرية مؤهلة.",
        bodyEn: "Outputs must not be used for deception, privacy violations or high-risk decisions without qualified human review.",
      },
      {
        headingAr: "تجاري ووكالات",
        headingEn: "Commercial and agency",
        bodyAr: "تُدار حدود الاستخدام والموظفين والأعضاء من الخطة المحفوظة في الإدارة، وليست قواعد ثابتة في الواجهة.",
        bodyEn: "Usage, employee and member limits come from administrator-managed plans, never fixed UI rules.",
      },
    ],
  },
  help: {
    titleAr: "مركز المساعدة",
    titleEn: "Help center",
    introAr: "إجابات مباشرة حول الحساب، الرصيد، المشتريات، والخصوصية.",
    introEn: "Direct answers about accounts, credits, purchases and privacy.",
    sections: [
      {
        headingAr: "متى يُخصم الرصيد؟",
        headingEn: "When are credits charged?",
        bodyAr: "بعد نجاح توليد AI فقط. لا يُخصم الرصيد عند فشل المزود أو حظر الطلب قبل التنفيذ.",
        bodyEn: "Only after a successful AI generation. Provider failures and pre-execution moderation blocks are not charged.",
      },
      {
        headingAr: "متى تتفعّل خطتي؟",
        headingEn: "When does my plan activate?",
        bodyAr: "بعد التحقق من إشعار دفع موقّع من المزود. صفحة النجاح وحدها لا تفعّل الاشتراك.",
        bodyEn: "After a signed provider webhook is verified. The success page alone never activates a subscription.",
      },
    ],
  },
  status: {
    titleAr: "حالة الخدمة",
    titleEn: "Service status",
    introAr: "لا توجد خدمة مراقبة عامة مهيأة حالياً. لا نعرض حالة تشغيل مصطنعة.",
    introEn: "No public monitoring service is configured. We do not display fabricated uptime.",
    sections: [],
  },
  industries: {
    titleAr: "حلول حسب القطاع",
    titleEn: "Industry solutions",
    introAr: "مساحات مصممة للتجارة والمطاعم والعقار والتقنية والوكالات والتعليم والاستشارات والموارد البشرية.",
    introEn: "Workspaces for commerce, restaurants, real estate, technology, agencies, education, consulting and HR.",
    sections: [
      {
        headingAr: "السياق أولاً",
        headingEn: "Context first",
        bodyAr: "تستخدم مراكز القطاعات تصنيفات وسير عمل وأدلة منشورة يراجعها فريق المحتوى، ولا تنشئ صفحات SEO آلية.",
        bodyEn: "Industry hubs use editor-reviewed categories, workflows and guides; they never generate automated SEO pages.",
      },
    ],
  },
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; page: string }>;
}): Promise<Metadata> {
  const { locale: raw, page } = await params;
  const locale: Locale = isLocale(raw) ? raw : "ar";
  const builtIn = builtIns[page];
  return {
    title: builtIn ? (locale === "ar" ? builtIn.titleAr : builtIn.titleEn) : page,
  };
}

export default async function ContentPage({
  params,
}: {
  params: Promise<{ locale: string; page: string }>;
}) {
  const { locale: raw, page } = await params;
  const locale: Locale = isLocale(raw) ? raw : "ar";
  const ar = locale === "ar";
  const cmsPage = await db.cmsPage.findFirst({
    where: { slug: page, status: "PUBLISHED", publishedAt: { lte: new Date() } },
  });
  const builtIn = builtIns[page];
  if (!cmsPage && !builtIn) notFound();

  const cmsContent = (ar ? cmsPage?.contentAr : cmsPage?.contentEn) as
    | { intro?: string; sections?: Array<{ heading?: string; body?: string }> }
    | undefined;
  const title = cmsPage
    ? ar
      ? cmsPage.titleAr
      : cmsPage.titleEn
    : ar
      ? builtIn.titleAr
      : builtIn.titleEn;
  const intro =
    cmsContent?.intro ?? (ar ? builtIn?.introAr : builtIn?.introEn) ?? "";
  const sections =
    cmsContent?.sections?.map((section) => ({
      heading: section.heading ?? "",
      body: section.body ?? "",
    })) ??
    (builtIn?.sections ?? []).map((section) => ({
      heading: ar ? section.headingAr : section.headingEn,
      body: ar ? section.bodyAr : section.bodyEn,
    }));
  const Icon =
    page === "privacy" || page === "terms"
      ? ShieldCheck
      : page === "help"
        ? HelpCircle
        : page === "industries"
          ? Building2
          : CheckCircle2;

  return (
    <div className="container-shell py-14 sm:py-20">
      <header className="mx-auto max-w-3xl text-center">
        <span className="mx-auto grid size-12 place-items-center rounded-2xl bg-surface-soft">
          <Icon className="size-5 text-accent-strong" />
        </span>
        <h1 className="text-balance mt-5 text-4xl font-bold tracking-[-0.04em] sm:text-5xl">
          {title}
        </h1>
        <p className="mt-5 text-base leading-8 text-muted">{intro}</p>
      </header>
      {sections.length ? (
        <div className="mx-auto mt-12 grid max-w-3xl gap-5">
          {sections.map((section, index) => (
            <section key={`${section.heading}-${index}`} className="premium-card p-6 sm:p-8">
              <h2 className="text-xl font-bold">{section.heading}</h2>
              <p className="mt-3 whitespace-pre-line text-sm leading-8 text-muted">{section.body}</p>
            </section>
          ))}
        </div>
      ) : null}
    </div>
  );
}
