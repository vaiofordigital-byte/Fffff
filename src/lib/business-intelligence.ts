import { db } from "@/lib/db";

type Dimension = {
  key: string;
  score: number;
  labelAr: string;
  labelEn: string;
};

export async function calculateBusinessIntelligenceScore(
  organizationId: string,
  persist = false,
) {
  const [
    organization,
    activeEmployees,
    completedTasks,
    projects,
    knowledgeByKind,
  ] = await Promise.all([
    db.organization.findUniqueOrThrow({
      where: { id: organizationId },
      select: {
        name: true,
        industry: true,
        businessType: true,
        country: true,
        goals: true,
      },
    }),
    db.organizationAiEmployee.count({
      where: { organizationId, status: "ACTIVE" },
    }),
    db.businessTask.count({
      where: { organizationId, status: "COMPLETED" },
    }),
    db.project.count({
      where: { organizationId, archived: false },
    }),
    db.knowledgeEntry.groupBy({
      by: ["kind"],
      where: { organizationId, approved: true },
      _count: true,
    }),
  ]);

  const knowledgeKinds = new Set(knowledgeByKind.map((item) => item.kind));
  const profileFields = [
    organization.name,
    organization.industry,
    organization.businessType,
    organization.country,
    Array.isArray(organization.goals) && organization.goals.length
      ? "goals"
      : null,
  ].filter(Boolean).length;

  const dimensions: Dimension[] = [
    {
      key: "aiAdoption",
      score: Math.min(20, activeEmployees * 6 + Math.min(completedTasks, 8)),
      labelAr: "تبني الموظفين الأذكياء",
      labelEn: "AI employee adoption",
    },
    {
      key: "processOrganization",
      score: Math.min(20, projects * 5 + Math.min(completedTasks, 10)),
      labelAr: "تنظيم العمليات",
      labelEn: "Process organization",
    },
    {
      key: "customerServiceReadiness",
      score:
        (knowledgeKinds.has("FAQ") ? 8 : 0) +
        (knowledgeKinds.has("POLICY") ? 6 : 0) +
        (activeEmployees > 0 ? 6 : 0),
      labelAr: "جاهزية خدمة العملاء",
      labelEn: "Customer service readiness",
    },
    {
      key: "contentConsistency",
      score:
        (knowledgeKinds.has("BRAND_VOICE") ? 10 : 0) +
        (knowledgeKinds.has("PRODUCT") || knowledgeKinds.has("SERVICE") ? 6 : 0) +
        (completedTasks > 0 ? 4 : 0),
      labelAr: "اتساق المحتوى",
      labelEn: "Content consistency",
    },
    {
      key: "knowledgeCompleteness",
      score: Math.min(
        20,
        profileFields * 2 +
          Math.min(knowledgeKinds.size * 2, 10),
      ),
      labelAr: "اكتمال معرفة الشركة",
      labelEn: "Company knowledge completeness",
    },
  ];

  const score = Math.min(
    100,
    dimensions.reduce((total, dimension) => total + dimension.score, 0),
  );
  const strengths = dimensions
    .filter((dimension) => dimension.score >= 14)
    .map((dimension) => ({
      key: dimension.key,
      ar: dimension.labelAr,
      en: dimension.labelEn,
    }));
  const weaknesses = dimensions
    .filter((dimension) => dimension.score < 10)
    .map((dimension) => ({
      key: dimension.key,
      ar: dimension.labelAr,
      en: dimension.labelEn,
    }));
  const suggestions = [
    !knowledgeKinds.has("COMPANY_PROFILE")
      ? {
          key: "company-profile",
          ar: "أضف وصف الشركة وخدماتها إلى عقل الشركة.",
          en: "Add your company profile and services to Company Brain.",
        }
      : null,
    !knowledgeKinds.has("BRAND_VOICE")
      ? {
          key: "brand-voice",
          ar: "اعتمد نبرة العلامة لتحسين اتساق المحتوى.",
          en: "Approve a brand voice to improve content consistency.",
        }
      : null,
    activeEmployees === 0
      ? {
          key: "activate-employee",
          ar: "فعّل أول موظف ذكي وفق هدفك الرئيسي.",
          en: "Activate your first AI employee for your primary goal.",
        }
      : null,
    completedTasks === 0
      ? {
          key: "first-task",
          ar: "نفّذ مهمة عمل حقيقية لبدء قياس التبني.",
          en: "Complete a real business task to begin measuring adoption.",
        }
      : null,
  ].filter((item): item is NonNullable<typeof item> => Boolean(item));

  const result = {
    score,
    dimensions,
    strengths,
    weaknesses,
    suggestions,
    disclaimerAr:
      "مؤشر إرشادي مبني على اكتمال البيانات والاستخدام الفعلي، وليس مقياساً علمياً لنجاح الأعمال.",
    disclaimerEn:
      "A guidance indicator based on data completeness and actual usage, not a scientific measure of business success.",
  };

  if (persist) {
    await db.businessScoreSnapshot.create({
      data: {
        organizationId,
        ...result,
      },
    });
  }

  return result;
}

export async function deriveBusinessRecommendations(organizationId: string) {
  const [knowledge, activations, completedTasks] = await Promise.all([
    db.knowledgeEntry.groupBy({
      by: ["kind"],
      where: { organizationId, approved: true },
      _count: true,
    }),
    db.organizationAiEmployee.findMany({
      where: { organizationId, status: "ACTIVE" },
      select: { aiEmployee: { select: { slug: true } } },
    }),
    db.businessTask.count({
      where: { organizationId, status: "COMPLETED" },
    }),
  ]);
  const kinds = new Set(knowledge.map((item) => item.kind));
  const employees = new Set(activations.map((item) => item.aiEmployee.slug));
  const recommendations = [
    kinds.has("PRODUCT") && !kinds.has("CUSTOMER")
      ? {
          key: "customer-context",
          titleAr: "أضف معرفة الجمهور",
          titleEn: "Add customer knowledge",
          bodyAr:
            "لديك معلومات منتجات معتمدة، لكن لا توجد معرفة معتمدة بالجمهور حتى الآن.",
          bodyEn:
            "Approved product knowledge exists, but approved customer knowledge is still missing.",
          evidence: { productKnowledge: true, customerKnowledge: false },
          priority: 90,
        }
      : null,
    employees.has("customer-service-manager") && !kinds.has("FAQ")
      ? {
          key: "support-faq",
          titleAr: "جهّز الأسئلة الشائعة",
          titleEn: "Prepare your FAQ",
          bodyAr:
            "مدير خدمة العملاء مفعل، وإضافة أسئلة شائعة معتمدة ستجعله أكثر دقة.",
          bodyEn:
            "The customer service manager is active; approved FAQs will improve response accuracy.",
          evidence: { employeeActive: true, faqKnowledge: false },
          priority: 85,
        }
      : null,
    employees.has("content-creator") && !kinds.has("BRAND_VOICE")
      ? {
          key: "content-brand-voice",
          titleAr: "اعتمد نبرة العلامة",
          titleEn: "Approve a brand voice",
          bodyAr:
            "صانع المحتوى مفعل دون نبرة علامة معتمدة، ما قد يقلل اتساق المحتوى.",
          bodyEn:
            "The content creator is active without an approved brand voice, which can reduce consistency.",
          evidence: { employeeActive: true, brandVoiceKnowledge: false },
          priority: 80,
        }
      : null,
    completedTasks === 0
      ? {
          key: "first-business-task",
          titleAr: "ابدأ أول مهمة",
          titleEn: "Run your first task",
          bodyAr:
            "لم تكتمل مهمة بعد. اختر موظفاً وامنحه هدفاً عملياً قابلاً للمراجعة.",
          bodyEn:
            "No task has completed yet. Choose an employee and assign a reviewable business outcome.",
          evidence: { completedTasks: 0 },
          priority: 70,
        }
      : null,
  ].filter((item): item is NonNullable<typeof item> => Boolean(item));

  return recommendations;
}
