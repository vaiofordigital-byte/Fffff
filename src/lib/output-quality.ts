export type OutputQualityScore = {
  total: number;
  dimensions: {
    completeness: number;
    actionability: number;
    structure: number;
    evidenceDiscipline: number;
    clarity: number;
  };
  disclaimer: string;
};

export function scoreBusinessOutput(content: string): OutputQualityScore {
  const normalized = content.toLocaleLowerCase();
  const completeness = Math.min(20, Math.floor(content.length / 120));
  const actionability = Math.min(
    20,
    6 +
      (content.match(/(?:^|\n)\s*(?:\d+\.|-|•)/g)?.length ?? 0) * 2 +
      (/(next step|action|تنفيذ|خطوة|إجراء)/iu.test(normalized) ? 4 : 0),
  );
  const structure = Math.min(
    20,
    5 +
      (content.match(/(?:^|\n)#{1,3}\s|(?:^|\n)[^\n]{2,80}:\s*$/g)?.length ??
        0) *
        3,
  );
  const evidenceDiscipline = Math.min(
    20,
    6 +
      (/(assumption|evidence|data gap|افتراض|دليل|فجوة|بيانات غير)/iu.test(
        normalized,
      )
        ? 8
        : 0) +
      (/(risk|constraint|مخاطر|قيود)/iu.test(normalized) ? 6 : 0),
  );
  const clarity = Math.min(
    20,
    content.length >= 300 ? 15 + (content.length <= 8_000 ? 5 : 0) : 8,
  );
  const dimensions = {
    completeness,
    actionability,
    structure,
    evidenceDiscipline,
    clarity,
  };

  return {
    total: Math.min(
      100,
      Object.values(dimensions).reduce((sum, value) => sum + value, 0),
    ),
    dimensions,
    disclaimer:
      "A structural output indicator, not a scientific measure or a guarantee of business accuracy.",
  };
}
