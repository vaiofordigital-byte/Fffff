import { sha256 } from "@/lib/security";

type ModerationResult = {
  decision: "ALLOW" | "REVIEW" | "BLOCK";
  categories: string[];
  normalized: string;
  inputHash: string;
};

const blockedPatterns = [
  { category: "credential_theft", pattern: /(steal|سرقة).{0,30}(password|api key|كلمة المرور|مفتاح)/iu },
  { category: "malware", pattern: /(ransomware|keylogger|برمجية فدية|مسجل مفاتيح)/iu },
  { category: "sexual_minors", pattern: /(child sexual|sexual.{0,15}minor|استغلال جنسي.{0,15}طفل)/iu },
];

const reviewPatterns = [
  { category: "prompt_injection", pattern: /(ignore previous|reveal system prompt|تجاهل التعليمات السابقة|اكشف تعليمات النظام)/iu },
  { category: "personal_data", pattern: /(credit card|national id|بطاقة ائتمانية|رقم الهوية)/iu },
];

export function moderateInput(input: string): ModerationResult {
  const normalized = input.normalize("NFKC").replace(/\u0000/g, "").trim();
  const blocked = blockedPatterns
    .filter(({ pattern }) => pattern.test(normalized))
    .map(({ category }) => category);
  const review = reviewPatterns
    .filter(({ pattern }) => pattern.test(normalized))
    .map(({ category }) => category);

  return {
    decision: blocked.length ? "BLOCK" : review.length ? "REVIEW" : "ALLOW",
    categories: [...blocked, ...review],
    normalized,
    inputHash: sha256(normalized),
  };
}
