import { z } from "zod";

export const promptArchitectSchema = z.object({
  idea: z.string().trim().min(12).max(5_000),
  locale: z.enum(["ar", "en"]).default("ar"),
  objective: z.string().trim().max(500).optional(),
  industry: z.string().trim().max(120).optional(),
  country: z.string().trim().max(120).optional(),
  audience: z.string().trim().max(500).optional(),
  brand: z.string().trim().max(300).optional(),
  platform: z.string().trim().max(120).optional(),
  tone: z.string().trim().max(120).optional(),
  outputFormat: z.string().trim().max(500).optional(),
  constraints: z.string().trim().max(1_000).optional(),
  projectId: z.string().cuid().optional(),
});

export type PromptArchitectInput = z.infer<typeof promptArchitectSchema>;

export type PromptScore = {
  total: number;
  dimensions: {
    objective: number;
    context: number;
    specificity: number;
    role: number;
    constraints: number;
    output: number;
    reusability: number;
    depth: number;
    ambiguity: number;
  };
  disclaimer: string;
};

const industrySignals = [
  { value: "E-commerce", signals: ["متجر", "منتج", "مبيعات", "ecommerce", "store", "sales"] },
  { value: "Marketing", signals: ["تسويق", "حملة", "إعلان", "marketing", "campaign", "ads"] },
  { value: "Technology", signals: ["برمجة", "تطبيق", "تقنية", "code", "software", "app"] },
  { value: "Education", signals: ["تعليم", "دراسة", "طلاب", "education", "study", "students"] },
  { value: "HR", signals: ["توظيف", "موارد بشرية", "مقابلة", "hiring", "hr", "interview"] },
] as const;

function inferIndustry(idea: string) {
  const normalized = idea.toLocaleLowerCase();
  return (
    industrySignals.find(({ signals }) =>
      signals.some((signal) => normalized.includes(signal)),
    )?.value ?? "Business"
  );
}

function inferCountry(idea: string) {
  const normalized = idea.toLocaleLowerCase();
  if (/(السعودية|السعودي|saudi|ksa)/.test(normalized)) return "Saudi Arabia";
  if (/(الإمارات|الامارات|uae|emirates)/.test(normalized)) return "United Arab Emirates";
  if (/(مصر|egypt)/.test(normalized)) return "Egypt";
  return undefined;
}

function valueOrVariable(value: string | undefined, variable: string) {
  return value?.trim() || `{{${variable}}}`;
}

export function architectPrompt(rawInput: PromptArchitectInput) {
  const input = promptArchitectSchema.parse(rawInput);
  const isArabic = input.locale === "ar";
  const industry = input.industry || inferIndustry(input.idea);
  const country = input.country || inferCountry(input.idea);
  const variables = [
    "BRAND",
    "PRODUCT",
    "COUNTRY",
    "AUDIENCE",
    "GOAL",
    "PLATFORM",
  ];

  const sections = isArabic
    ? [
        ["الدور", `أنت خبير استراتيجي أول في ${industry} ومتخصص في تحويل أهداف الأعمال إلى خطط قابلة للتنفيذ.`],
        ["الهدف", input.objective || input.idea],
        [
          "السياق",
          `العلامة: ${valueOrVariable(input.brand, "BRAND")}\nالسوق: ${valueOrVariable(country, "COUNTRY")}\nالقطاع: ${industry}\nالمنصة: ${valueOrVariable(input.platform, "PLATFORM")}`,
        ],
        ["بيانات الإدخال", `الفكرة الأصلية: ${input.idea}\nالمنتج أو الخدمة: {{PRODUCT}}\nأي بيانات إضافية: {{INPUT_DATA}}`],
        ["الجمهور", valueOrVariable(input.audience, "AUDIENCE")],
        [
          "خطوات التنفيذ",
          "1. حلّل الهدف والسياق وحدد أي افتراضات بوضوح.\n2. استخرج أهم الفرص والمخاطر ورتبها حسب الأثر.\n3. ابنِ توصيات عملية ومحددة وقابلة للقياس.\n4. اربط كل توصية بسببها وخطوة تنفيذها ومؤشر نجاحها.\n5. راجع الاتساق واكتشف أي فجوات قبل تقديم الإجابة.",
        ],
        [
          "متطلبات الجودة",
          "قدّم عمقاً مهنياً، أمثلة مرتبطة بالسوق، أولويات واضحة، ومنطقاً يمكن التحقق منه. افصل الحقائق عن الافتراضات.",
        ],
        ["القيود", input.constraints || "لا تخترع بيانات أو مصادر. لا تستخدم نصائح عامة. اطلب فقط المعلومات التي ستغير النتيجة مادياً."],
        ["متطلبات سلبية", "تجنب التكرار والمبالغة والوعود غير المثبتة والمصطلحات الغامضة. لا تعرض بيانات شخصية أو سرية."],
        [
          "صيغة المخرجات",
          input.outputFormat ||
            "1. ملخص تنفيذي\n2. تحليل الوضع\n3. التوصيات مرتبة بالأولوية\n4. خطة تنفيذ\n5. مؤشرات القياس\n6. المخاطر والافتراضات",
        ],
        ["اللغة والنبرة", `اكتب بالعربية الطبيعية الواضحة بنبرة ${input.tone || "خبيرة وواثقة ومباشرة"}.`],
        ["ضبط الجودة", "قبل الإجابة النهائية، راجع اكتمال الهدف واتساق التوصيات وقابلية التنفيذ، ثم صحح أي نقص بصمت."],
        ["المتغيرات", variables.map((item) => `{{${item}}}`).join(" · ")],
      ]
    : [
        ["ROLE", `Act as a senior ${industry} strategist who turns business goals into executable systems.`],
        ["OBJECTIVE", input.objective || input.idea],
        [
          "CONTEXT",
          `Brand: ${valueOrVariable(input.brand, "BRAND")}\nMarket: ${valueOrVariable(country, "COUNTRY")}\nIndustry: ${industry}\nPlatform: ${valueOrVariable(input.platform, "PLATFORM")}`,
        ],
        ["INPUT DATA", `Original idea: ${input.idea}\nProduct or service: {{PRODUCT}}\nAdditional data: {{INPUT_DATA}}`],
        ["AUDIENCE", valueOrVariable(input.audience, "AUDIENCE")],
        [
          "EXECUTION STEPS",
          "1. Analyze the objective and context; state assumptions.\n2. Rank opportunities and risks by impact.\n3. Develop specific, measurable recommendations.\n4. Give each recommendation a rationale, action and success measure.\n5. Check consistency and gaps before the final answer.",
        ],
        [
          "QUALITY REQUIREMENTS",
          "Provide professional depth, market-relevant examples, clear priorities and verifiable reasoning. Separate facts from assumptions.",
        ],
        ["CONSTRAINTS", input.constraints || "Do not invent facts or sources. Avoid generic advice. Ask only questions that materially change the outcome."],
        ["NEGATIVE REQUIREMENTS", "Avoid repetition, hype, unsupported claims and vague terminology. Do not reveal private or confidential data."],
        [
          "OUTPUT FORMAT",
          input.outputFormat ||
            "1. Executive summary\n2. Situation analysis\n3. Prioritized recommendations\n4. Execution plan\n5. Success metrics\n6. Risks and assumptions",
        ],
        ["LANGUAGE AND TONE", `Write in precise professional English with a ${input.tone || "confident and direct"} tone.`],
        ["QUALITY CONTROL", "Before responding, silently check completeness, consistency and actionability, then correct any gaps."],
        ["VARIABLES", variables.map((item) => `{{${item}}}`).join(" · ")],
      ];

  const content = sections
    .map(([heading, body]) => `## ${heading}\n${body}`)
    .join("\n\n");

  return {
    content,
    score: scorePrompt(content),
    inferred: { industry, country: country ?? null },
    variables,
  };
}

export function scorePrompt(content: string): PromptScore {
  const normalized = content.toLocaleLowerCase();
  const bounded = (value: number, max: number) => Math.min(value, max);
  const role = /(الدور|role|act as|أنت خبير)/.test(normalized) ? 10 : 3;
  const objective = /(الهدف|objective|goal)/.test(normalized) ? 14 : 5;
  const context = bounded(
    4 + ["السياق", "context", "السوق", "market", "الجمهور", "audience"].filter((token) =>
      normalized.includes(token),
    ).length * 2,
    14,
  );
  const constraints = /(القيود|constraints|تجنب|avoid|do not|لا )/.test(normalized) ? 12 : 3;
  const output = /(صيغة المخرجات|output format|json|جدول|table)/.test(normalized) ? 12 : 4;
  const reusability = /\{\{[A-Z_]+\}\}/.test(content) ? 10 : 4;
  const depth = bounded(Math.floor(content.length / 180), 12);
  const specificity = bounded(
    5 + (content.match(/\d+\./g)?.length ?? 0),
    10,
  );
  const ambiguity = content.length > 500 ? 8 : content.length > 250 ? 5 : 2;
  const dimensions = {
    objective,
    context,
    specificity,
    role,
    constraints,
    output,
    reusability,
    depth,
    ambiguity,
  };

  return {
    total: Math.min(
      100,
      Object.values(dimensions).reduce((sum, value) => sum + value, 0),
    ),
    dimensions,
    disclaimer:
      "Structural quality indicator, not a scientific measure or a guarantee of output accuracy.",
  };
}

export function optimizePrompt(
  prompt: string,
  mode: "basic" | "professional" | "expert" | "maximum",
  locale: "ar" | "en",
) {
  const detail =
    mode === "maximum"
      ? "maximum precision"
      : mode === "expert"
        ? "expert depth"
        : mode === "professional"
          ? "professional depth"
          : "clear essentials";

  const result = architectPrompt({
    idea: prompt,
    locale,
    constraints:
      locale === "ar"
        ? `حافظ على نية النص الأصلية، وطبّق مستوى ${detail} دون إضافة ادعاءات غير متاحة.`
        : `Preserve the original intent and apply ${detail} without adding unsupported claims.`,
  });

  const before = scorePrompt(prompt);
  const improvements =
    locale === "ar"
      ? [
          "توضيح الدور والهدف",
          "إضافة سياق ومتغيرات قابلة لإعادة الاستخدام",
          "تحديد خطوات التنفيذ والقيود",
          "تعريف صيغة المخرجات وضبط الجودة",
        ]
      : [
          "Clarified role and objective",
          "Added reusable context and variables",
          "Defined execution steps and constraints",
          "Specified output format and quality control",
        ];

  return { ...result, before, improvements };
}
