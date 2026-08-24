import { hashPassword } from "../src/lib/auth";
import { db } from "../src/lib/db";

const categories = [
  ["business", "الأعمال والاستراتيجية", "Business & Strategy"],
  ["ecommerce", "التجارة الإلكترونية", "E-commerce"],
  ["marketing", "التسويق", "Marketing"],
  ["advertising", "الإعلانات", "Advertising"],
  ["social-media", "وسائل التواصل", "Social Media"],
  ["content", "المحتوى", "Content"],
  ["seo", "تحسين محركات البحث", "SEO"],
  ["sales", "المبيعات", "Sales"],
  ["customer-service", "خدمة العملاء", "Customer Service"],
  ["hr", "الموارد البشرية", "HR"],
  ["programming", "البرمجة", "Programming"],
  ["design", "التصميم", "Design"],
  ["productivity", "الإنتاجية", "Productivity"],
  ["education", "التعليم", "Education"],
] as const;

const plans = [
  {
    slug: "free",
    nameAr: "مجاني",
    nameEn: "Free",
    descriptionAr: "لبناء أول أصولك وفهم طريقة العمل.",
    descriptionEn: "Build your first assets and learn the workflow.",
    monthlyPrice: 0,
    yearlyPrice: 0,
    monthlyCredits: 5,
    sortOrder: 0,
    features: [
      { ar: "مهندس البرومبت الأساسي", en: "Core Prompt Architect" },
      { ar: "خزنة شخصية محدودة", en: "Limited personal Vault" },
      { ar: "مشروع واحد", en: "One project" },
    ],
    limits: { projects: 1, generationsPerMonth: 5, members: 1 },
  },
  {
    slug: "pro",
    nameAr: "احترافي",
    nameEn: "Pro",
    descriptionAr: "للمحترفين الذين يستخدمون AI يومياً.",
    descriptionEn: "For professionals who use AI every day.",
    monthlyPrice: 99,
    yearlyPrice: 990,
    monthlyCredits: 150,
    sortOrder: 1,
    features: [
      { ar: "المكتبة الاحترافية", en: "Professional library" },
      { ar: "مختبر وتحسين متقدم", en: "Advanced Lab and optimization" },
      { ar: "مشاريع وسياق قابلان لإعادة الاستخدام", en: "Reusable projects and context" },
    ],
    limits: { projects: 20, generationsPerMonth: 150, members: 1 },
  },
  {
    slug: "business",
    nameAr: "أعمال",
    nameEn: "Business",
    descriptionAr: "لمساحات العمل ذات الاستخدام الأعلى.",
    descriptionEn: "For higher-volume professional workspaces.",
    monthlyPrice: 249,
    yearlyPrice: 2490,
    monthlyCredits: 500,
    sortOrder: 2,
    features: [
      { ar: "حدود أعلى وسير عمل", en: "Higher limits and workflows" },
      { ar: "مساحات عمل متعددة", en: "Multiple workspaces" },
      { ar: "تهيئة مستقبلية للفرق", en: "Team-ready architecture" },
    ],
    limits: { projects: 100, generationsPerMonth: 500, members: 5 },
  },
  {
    slug: "agency",
    nameAr: "وكالة",
    nameEn: "Agency",
    descriptionAr: "لإدارة أصول وسياقات عملاء متعددين.",
    descriptionEn: "Manage assets and context across multiple clients.",
    monthlyPrice: 599,
    yearlyPrice: 5990,
    monthlyCredits: 1500,
    sortOrder: 3,
    features: [
      { ar: "ترخيص استخدام للوكالات", en: "Agency usage license" },
      { ar: "مشاريع عملاء منفصلة", en: "Separated client projects" },
      { ar: "حدود تشغيل مرتفعة", en: "High operating limits" },
    ],
    limits: { projects: 500, generationsPerMonth: 1500, members: 15 },
  },
];

async function main() {
  for (const [slug, nameAr, nameEn] of categories) {
    await db.category.upsert({
      where: { slug },
      create: { slug, nameAr, nameEn, active: true },
      update: { nameAr, nameEn, active: true },
    });
  }

  for (const plan of plans) {
    await db.plan.upsert({
      where: { slug: plan.slug },
      create: { ...plan, currency: "SAR", active: true },
      update: { ...plan, currency: "SAR", active: true },
    });
  }

  await db.setting.upsert({
    where: { key: "checkout.taxRate" },
    create: {
      key: "checkout.taxRate",
      value: 0,
      description: "Tax rate applied at checkout; configure for the merchant jurisdiction.",
    },
    update: {},
  });

  for (const [key, description] of [
    ["ai.experimental.converter", "Experimental prompt converter"],
    ["workflows.beta", "Beta workflow execution"],
    ["teams.preview", "Future team workspace preview"],
  ]) {
    await db.featureFlag.upsert({
      where: { key },
      create: { key, description, enabled: false, rollout: 0 },
      update: {},
    });
  }

  const adminEmail = process.env.BOOTSTRAP_ADMIN_EMAIL?.toLocaleLowerCase();
  const adminPassword = process.env.BOOTSTRAP_ADMIN_PASSWORD;
  if (adminEmail && adminPassword) {
    if (adminPassword.length < 14 || !/[a-zA-Z]/.test(adminPassword) || !/\d/.test(adminPassword)) {
      throw new Error("BOOTSTRAP_ADMIN_PASSWORD must be 14+ characters and include letters and numbers");
    }
    const passwordHash = await hashPassword(adminPassword);
    await db.user.upsert({
      where: { email: adminEmail },
      create: {
        email: adminEmail,
        passwordHash,
        role: "SUPER_ADMIN",
        status: "ACTIVE",
        emailVerifiedAt: new Date(),
        profile: { create: { displayName: "PROMPTX Administrator" } },
        creditAccount: { create: {} },
        notificationPreference: { create: {} },
      },
      update: {
        passwordHash,
        role: "SUPER_ADMIN",
        status: "ACTIVE",
        emailVerifiedAt: new Date(),
      },
    });
  }
}

main()
  .then(() => db.$disconnect())
  .catch(async (error) => {
    console.error(error);
    await db.$disconnect();
    process.exit(1);
  });
