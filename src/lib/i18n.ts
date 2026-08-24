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
    brandTagline: "نظام تشغيل الأعمال بالذكاء الاصطناعي",
    nav: {
      marketplace: "موظفو AI",
      architect: "المهام",
      optimizer: "ذكاء الأعمال",
      workflows: "سير العمل",
      employees: "موظفو AI",
      brain: "عقل الشركة",
      tasks: "المهام",
      reports: "التقارير",
      industries: "القطاعات",
      pricing: "الأسعار",
      blog: "المعرفة",
      dashboard: "لوحة الأعمال",
      signIn: "تسجيل الدخول",
      getStarted: "ابدأ مجاناً",
    },
    home: {
      eyebrow: "فريق ذكاء اصطناعي يفهم أعمالك",
      title: "حوّل عملك إلى شركة تعمل بذكاء.",
      subtitle:
        "موظفون أذكياء يساعدونك في التسويق والمبيعات وخدمة العملاء وتحليل الأعمال، مستخدمين معرفة شركتك المعتمدة.",
      primary: "ابدأ مجاناً",
      secondary: "اكتشف كيف يعمل",
      searchPlaceholder: "ماذا تريد أن ينجز فريقك اليوم؟",
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
      score: "مؤشر جودة النتيجة",
    },
  },
  en: {
    brandTagline: "AI business operating system",
    nav: {
      marketplace: "AI Employees",
      architect: "Tasks",
      optimizer: "Business Intelligence",
      workflows: "Workflows",
      employees: "AI Employees",
      brain: "Company Brain",
      tasks: "Tasks",
      reports: "Reports",
      industries: "Industries",
      pricing: "Pricing",
      blog: "Insights",
      dashboard: "Business OS",
      signIn: "Sign in",
      getStarted: "Start free",
    },
    home: {
      eyebrow: "An AI workforce that understands your business",
      title: "Turn your business into an intelligent company.",
      subtitle:
        "Specialized AI employees help with marketing, sales, customer service and business analysis using approved company knowledge.",
      primary: "Start free",
      secondary: "See how it works",
      searchPlaceholder: "What should your AI team accomplish today?",
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
      score: "Output quality score",
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
