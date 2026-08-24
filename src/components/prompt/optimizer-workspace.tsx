"use client";

import { useState } from "react";
import {
  ArrowDown,
  Check,
  Clipboard,
  LoaderCircle,
  Sparkles,
  Wand2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, Select, Textarea } from "@/components/ui/field";

type OptimizerResult = {
  content: string;
  before: { total: number };
  score: { total: number };
  improvements: string[];
};

export function OptimizerWorkspace({ locale }: { locale: "ar" | "en" }) {
  const ar = locale === "ar";
  const [prompt, setPrompt] = useState("");
  const [mode, setMode] = useState("professional");
  const [result, setResult] = useState<OptimizerResult>();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  async function optimize() {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/prompts/optimize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, mode, locale }),
      });
      const payload = (await response.json()) as OptimizerResult & {
        error?: { code?: string };
      };
      if (!response.ok) throw new Error(payload.error?.code);
      setResult(payload);
    } catch {
      setError(
        ar
          ? "تعذر تحسين البرومبت. تحقق من أن النص واضح بما يكفي."
          : "The prompt could not be optimized. Check that the input is clear enough.",
      );
    } finally {
      setLoading(false);
    }
  }

  async function copy() {
    if (!result) return;
    await navigator.clipboard.writeText(result.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 1_800);
  }

  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <section className="premium-card overflow-hidden">
        <div className="flex min-h-16 items-center justify-between border-b px-5">
          <div>
            <h2 className="font-bold">{ar ? "البرومبت الحالي" : "Current prompt"}</h2>
            <p className="text-xs text-muted">
              {result ? `${ar ? "المؤشر" : "Score"}: ${result.before.total}/100` : ar ? "الصق أي برومبت" : "Paste any prompt"}
            </p>
          </div>
          <Wand2 className="size-5 text-muted" />
        </div>
        <div className="p-5 sm:p-7">
          <Field label={ar ? "النص" : "Prompt"} htmlFor="prompt" hint={`${prompt.length}/10000`}>
            <Textarea
              id="prompt"
              value={prompt}
              onChange={(event) => setPrompt(event.target.value)}
              maxLength={10_000}
              className="min-h-80 border-0 bg-surface-soft/60 shadow-none"
              placeholder={
                ar
                  ? "مثال: اكتب لي خطة تسويق لمتجري..."
                  : "e.g. Write a marketing plan for my store..."
              }
            />
          </Field>
          <div className="mt-5 grid gap-4 sm:grid-cols-[1fr_auto] sm:items-end">
            <Field label={ar ? "مستوى التحسين" : "Optimization mode"} htmlFor="mode">
              <Select id="mode" value={mode} onChange={(event) => setMode(event.target.value)}>
                <option value="basic">{ar ? "أساسي" : "Basic"}</option>
                <option value="professional">{ar ? "احترافي" : "Professional"}</option>
                <option value="expert">{ar ? "خبير" : "Expert"}</option>
                <option value="maximum">{ar ? "أقصى دقة" : "Maximum precision"}</option>
              </Select>
            </Field>
            <Button
              type="button"
              variant="accent"
              size="lg"
              onClick={optimize}
              disabled={prompt.trim().length < 8 || loading}
            >
              {loading ? <LoaderCircle className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
              {ar ? "حسّن البرومبت" : "Improve prompt"}
            </Button>
          </div>
          {error ? (
            <p className="mt-4 text-sm text-danger" role="alert">
              {error}
            </p>
          ) : null}
        </div>
      </section>

      <section className="premium-card overflow-hidden" aria-live="polite">
        <div className="flex min-h-16 items-center justify-between border-b px-5">
          <div>
            <h2 className="font-bold">{ar ? "النسخة المحسّنة" : "Optimized version"}</h2>
            <p className="text-xs text-muted">
              {result ? `${ar ? "المؤشر" : "Score"}: ${result.score.total}/100` : ar ? "تحافظ على نيتك الأصلية" : "Preserves your original intent"}
            </p>
          </div>
          <Button type="button" variant="outline" size="sm" onClick={copy} disabled={!result}>
            {copied ? <Check className="size-4 text-success" /> : <Clipboard className="size-4" />}
            {copied ? (ar ? "تم" : "Copied") : ar ? "نسخ" : "Copy"}
          </Button>
        </div>
        {result ? (
          <div>
            <div className="grid grid-cols-[auto_1fr_auto] items-center gap-3 border-b bg-surface-soft/50 px-5 py-4 text-xs">
              <span className="font-semibold">{result.before.total}</span>
              <div className="relative h-1.5 overflow-hidden rounded-full bg-line">
                <div
                  className="absolute inset-y-0 start-0 rounded-full bg-success"
                  style={{ width: `${result.score.total}%` }}
                />
              </div>
              <span className="font-semibold text-success">{result.score.total}</span>
            </div>
            <pre className="max-h-[34rem] overflow-y-auto whitespace-pre-wrap p-5 font-[inherit] text-sm leading-8 sm:p-7">
              {result.content}
            </pre>
            <div className="border-t p-5">
              <h3 className="text-sm font-bold">{ar ? "ما الذي تحسّن؟" : "What changed?"}</h3>
              <ul className="mt-3 grid gap-2">
                {result.improvements.map((item) => (
                  <li key={item} className="flex items-center gap-2 text-xs text-muted">
                    <Check className="size-3.5 text-success" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ) : (
          <div className="grid min-h-[35rem] place-items-center p-8 text-center">
            <div>
              <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-surface-soft">
                <ArrowDown className="size-6 text-muted lg:-rotate-90 rtl:lg:rotate-90" />
              </span>
              <p className="mt-4 max-w-xs text-sm leading-7 text-muted">
                {ar
                  ? "سنكشف الغموض والفجوات والتناقضات، ثم نعيد بناء البرومبت مع شرح التغييرات."
                  : "We detect ambiguity, gaps and contradictions, then rebuild the prompt and explain the changes."}
              </p>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
