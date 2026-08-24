export const locales = ["ar", "en"] as const;
export type Locale = (typeof locales)[number];

export function isLocale(value: string): value is Locale {
  return locales.includes(value as Locale);
}

export function direction(locale: Locale) {
  return locale === "ar" ? "rtl" : "ltr";
}

const dictionaries = {
  ar: {
    brandTagline: "نظام تشغيل البرومبتات الاحترافية",
    nav: {
      marketplace: "المتجر",
      architect: "مهندس البرومبت",
      optimizer: "المُحسِّن",
      workflows: "سير العمل",
      pricing: "الأسعار",
      blog: "المعرفة",
      dashboard: "مساحة العمل",
      signIn: "تسجيل الدخول",
      getStarted: "ابدأ مجاناً",
    },
    home: {
      eyebrow: "مصمم للعربية. جاهز للعالم.",
      title: "حوّل فكرتك إلى تعليمات ذكية ونتائج احترافية.",
      subtitle:
        "أنشئ وحسّن ونظّم برومبتات عالية الأداء، ثم حوّلها إلى أصول عمل قابلة لإعادة الاستخدام.",
      primary: "ابنِ برومبتك",
      secondary: "استكشف المتجر",
      searchPlaceholder: "صف النتيجة التي تريدها، مثل: أريد زيادة مبيعات متجر عطور",
    },
    common: {
      explore: "استكشف",
      viewAll: "عرض الكل",
      learnMore: "اعرف المزيد",
      save: "حفظ",
      copy: "نسخ",
      copied: "تم النسخ",
      loading: "جارٍ التحميل",
      error: "تعذر إكمال الطلب",
      retry: "إعادة المحاولة",
      currency: "ر.س",
      score: "مؤشر جودة البرومبت",
    },
  },
  en: {
    brandTagline: "Professional prompt operating system",
    nav: {
      marketplace: "Marketplace",
      architect: "Prompt Architect",
      optimizer: "Optimizer",
      workflows: "Workflows",
      pricing: "Pricing",
      blog: "Insights",
      dashboard: "Workspace",
      signIn: "Sign in",
      getStarted: "Start free",
    },
    home: {
      eyebrow: "Built for Arabic. Ready for the world.",
      title: "Turn an idea into intelligent instructions and professional results.",
      subtitle:
        "Create, improve and organize high-performance prompts, then turn them into reusable business assets.",
      primary: "Build your prompt",
      secondary: "Explore marketplace",
      searchPlaceholder: "Describe the outcome you need, e.g. increase perfume store sales",
    },
    common: {
      explore: "Explore",
      viewAll: "View all",
      learnMore: "Learn more",
      save: "Save",
      copy: "Copy",
      copied: "Copied",
      loading: "Loading",
      error: "We could not complete this request",
      retry: "Try again",
      currency: "SAR",
      score: "Prompt quality score",
    },
  },
} as const;

export function getDictionary(locale: Locale) {
  return dictionaries[locale];
}

export function localized<T extends { ar: string; en: string }>(
  value: T,
  locale: Locale,
) {
  return value[locale];
}
