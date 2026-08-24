import { describe, expect, it } from "vitest";
import { architectPrompt, optimizePrompt, scorePrompt } from "@/lib/prompt-engine";

describe("prompt architect", () => {
  it("turns a short Arabic business idea into a professional structure", () => {
    const result = architectPrompt({
      idea: "أريد إطلاق متجر عطور فاخرة في السعودية وزيادة المبيعات",
      locale: "ar",
    });

    expect(result.content).toContain("## الدور");
    expect(result.content).toContain("## الهدف");
    expect(result.content).toContain("## القيود");
    expect(result.content).toContain("## صيغة المخرجات");
    expect(result.content).toContain("{{BRAND}}");
    expect(result.inferred.industry).toBe("E-commerce");
    expect(result.inferred.country).toBe("Saudi Arabia");
    expect(result.score.total).toBeGreaterThan(70);
    expect(result.score.total).toBeLessThanOrEqual(100);
  });

  it("builds the equivalent English professional structure", () => {
    const result = architectPrompt({
      idea: "Launch a professional software consulting service for Saudi companies",
      locale: "en",
      audience: "Operations leaders in mid-market companies",
    });

    expect(result.content).toContain("## ROLE");
    expect(result.content).toContain("## OBJECTIVE");
    expect(result.content).toContain("## QUALITY CONTROL");
    expect(result.content).toContain("Operations leaders");
  });
});

describe("prompt scoring and optimization", () => {
  it("scores a vague prompt lower than a structured prompt", () => {
    const vague = scorePrompt("Write a marketing plan");
    const structured = architectPrompt({
      idea: "Build a measurable marketing plan for a Saudi perfume store",
      locale: "en",
    }).score;

    expect(structured.total).toBeGreaterThan(vague.total);
  });

  it("preserves original intent while adding reusable structure", () => {
    const result = optimizePrompt(
      "اكتب خطة تسويق لمتجر العطور الخاص بي",
      "professional",
      "ar",
    );

    expect(result.content).toContain("اكتب خطة تسويق لمتجر العطور الخاص بي");
    expect(result.content).toContain("{{BRAND}}");
    expect(result.score.total).toBeGreaterThan(result.before.total);
    expect(result.improvements).toHaveLength(4);
  });
});
