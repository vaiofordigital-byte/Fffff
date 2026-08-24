"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Check,
  Clipboard,
  Gauge,
  LoaderCircle,
  RotateCcw,
  Save,
  SlidersHorizontal,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, Input, Select, Textarea } from "@/components/ui/field";

type ArchitectResult = {
  content: string;
  score: {
    total: number;
    dimensions: Record<string, number>;
    disclaimer: string;
  };
  inferred: { industry: string; country: string | null };
  variables: string[];
};

export function ArchitectWorkspace({
  locale,
  projectId,
}: {
  locale: "ar" | "en";
  projectId?: string;
}) {
  const ar = locale === "ar";
  const storageKey = `promptx:architect-draft:${locale}`;
  const [idea, setIdea] = useState("");
  const [industry, setIndustry] = useState("");
  const [audience, setAudience] = useState("");
  const [country, setCountry] = useState("");
  const [tone, setTone] = useState("");
  const [outputFormat, setOutputFormat] = useState("");
  const [showDetails, setShowDetails] = useState(false);
  const [state, setState] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [result, setResult] = useState<ArchitectResult>();
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const draft = window.localStorage.getItem(storageKey);
    if (draft) setIdea(draft);
  }, [storageKey]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      if (idea) window.localStorage.setItem(storageKey, idea);
    }, 500);
    return () => window.clearTimeout(timer);
  }, [idea, storageKey]);

  const isValid = useMemo(() => idea.trim().length >= 12, [idea]);

  async function buildPrompt() {
    if (!isValid) return;
    setState("loading");
    setError("");

    try {
      const response = await fetch("/api/prompts/architect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          idea,
          locale,
          industry: industry || undefined,
          audience: audience || undefined,
          country: country || undefined,
          tone: tone || undefined,
          outputFormat: outputFormat || undefined,
          projectId,
        }),
      });
      const payload = (await response.json()) as ArchitectResult & {
        error?: { code?: string };
      };
      if (!response.ok) throw new Error(payload.error?.code ?? "REQUEST_FAILED");
      setResult(payload);
      setState("success");
    } catch {
      setError(
        ar
          ? "تعذر بناء البرومبت الآن. تحقق من البيانات وحاول مجدداً."
          : "The prompt could not be built. Check your input and try again.",
      );
      setState("error");
    }
  }

  async function copyResult() {
    if (!result) return;
    await navigator.clipboard.writeText(result.content);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1_800);
  }

  function reset() {
    setIdea("");
    setIndustry("");
    setAudience("");
    setCountry("");
    setTone("");
    setOutputFormat("");
    setResult(undefined);
    setState("idle");
    window.localStorage.removeItem(storageKey);
  }

  return (
    <div className="grid gap-5 xl:grid-cols-[20rem_minmax(0,1fr)_18rem]">
      <aside className="premium-card h-fit p-5 xl:sticky xl:top-24">
        <div className="flex items-center justify-between">
          <h2 className="font-bold">{ar ? "الفكرة والسياق" : "Idea & context"}</h2>
          <span className="inline-flex items-center gap-1 text-[0.68rem] text-success">
            <Save className="size-3" />
            {ar ? "حفظ تلقائي" : "Autosaved"}
          </span>
        </div>
        <div className="mt-5 grid gap-5">
          <Field
            label={ar ? "ماذا تريد أن تحقق؟" : "What do you want to achieve?"}
            htmlFor="idea"
            hint={`${idea.length}/5000`}
          >
            <Textarea
              id="idea"
              value={idea}
              onChange={(event) => setIdea(event.target.value)}
              maxLength={5_000}
              placeholder={
                ar
                  ? "مثال: أريد إطلاق متجر عطور فاخرة في السعودية وبناء خطة تسويق..."
                  : "e.g. I want to launch a luxury perfume store in Saudi Arabia..."
              }
              className="min-h-44"
            />
          </Field>

          <button
            type="button"
            className="flex min-h-11 items-center justify-between rounded-xl border px-4 text-sm font-semibold hover:bg-surface-soft"
            onClick={() => setShowDetails((value) => !value)}
            aria-expanded={showDetails}
          >
            <span className="inline-flex items-center gap-2">
              <SlidersHorizontal className="size-4" />
              {ar ? "تفاصيل تحسّن النتيجة" : "Details that improve the result"}
            </span>
            <span>{showDetails ? "−" : "+"}</span>
          </button>

          {showDetails ? (
            <div className="grid gap-4">
              <Field label={ar ? "القطاع" : "Industry"} htmlFor="industry">
                <Input
                  id="industry"
                  value={industry}
                  onChange={(event) => setIndustry(event.target.value)}
                  placeholder={ar ? "التجارة الإلكترونية" : "E-commerce"}
                />
              </Field>
              <Field label={ar ? "الجمهور" : "Audience"} htmlFor="audience">
                <Input
                  id="audience"
                  value={audience}
                  onChange={(event) => setAudience(event.target.value)}
                  placeholder={ar ? "نساء 25–45" : "Women aged 25–45"}
                />
              </Field>
              <Field label={ar ? "السوق" : "Market"} htmlFor="country">
                <Input
                  id="country"
                  value={country}
                  onChange={(event) => setCountry(event.target.value)}
                  placeholder={ar ? "السعودية" : "Saudi Arabia"}
                />
              </Field>
              <Field label={ar ? "النبرة" : "Tone"} htmlFor="tone">
                <Select
                  id="tone"
                  value={tone}
                  onChange={(event) => setTone(event.target.value)}
                >
                  <option value="">{ar ? "اختيار ذكي" : "Smart default"}</option>
                  <option value={ar ? "مهنية ومباشرة" : "professional and direct"}>
                    {ar ? "مهنية ومباشرة" : "Professional & direct"}
                  </option>
                  <option value={ar ? "فاخرة ومقنعة" : "premium and persuasive"}>
                    {ar ? "فاخرة ومقنعة" : "Premium & persuasive"}
                  </option>
                  <option value={ar ? "تقنية ودقيقة" : "technical and precise"}>
                    {ar ? "تقنية ودقيقة" : "Technical & precise"}
                  </option>
                </Select>
              </Field>
              <Field label={ar ? "شكل المخرجات" : "Output format"} htmlFor="output">
                <Input
                  id="output"
                  value={outputFormat}
                  onChange={(event) => setOutputFormat(event.target.value)}
                  placeholder={ar ? "خطة من 30 يوماً في جدول" : "30-day plan in a table"}
                />
              </Field>
            </div>
          ) : null}

          <Button
            type="button"
            variant="accent"
            size="lg"
            onClick={buildPrompt}
            disabled={!isValid || state === "loading"}
          >
            {state === "loading" ? (
              <LoaderCircle className="size-4 animate-spin" />
            ) : (
              <Sparkles className="size-4" />
            )}
            {ar ? "ابنِ البرومبت" : "Build prompt"}
          </Button>
        </div>
      </aside>

      <section className="premium-card min-h-[42rem] overflow-hidden" aria-live="polite">
        <div className="flex min-h-16 items-center justify-between gap-4 border-b px-5">
          <div>
            <h2 className="font-bold">{ar ? "البرومبت الاحترافي" : "Professional prompt"}</h2>
            {result ? (
              <p className="text-xs text-muted">
                {result.inferred.industry}
                {result.inferred.country ? ` · ${result.inferred.country}` : ""}
              </p>
            ) : null}
          </div>
          <div className="flex items-center gap-2">
            <Button type="button" variant="ghost" size="sm" onClick={reset}>
              <RotateCcw className="size-4" />
              <span className="hidden sm:inline">{ar ? "جديد" : "New"}</span>
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={copyResult}
              disabled={!result}
            >
              {copied ? <Check className="size-4 text-success" /> : <Clipboard className="size-4" />}
              {copied ? (ar ? "تم النسخ" : "Copied") : ar ? "نسخ" : "Copy"}
            </Button>
          </div>
        </div>

        {result ? (
          <pre
            className="whitespace-pre-wrap p-5 font-[inherit] text-sm leading-8 sm:p-8"
            dir={locale === "ar" ? "rtl" : "ltr"}
          >
            {result.content}
          </pre>
        ) : (
          <div className="grid min-h-[35rem] place-items-center p-8 text-center">
            <div className="max-w-md">
              <span className="mx-auto grid size-16 place-items-center rounded-2xl bg-surface-soft">
                <Sparkles className="size-7 text-accent-strong" />
              </span>
              <h2 className="mt-5 text-xl font-bold">
                {ar ? "ابدأ بالنتيجة التي تريدها" : "Start with the outcome you need"}
              </h2>
              <p className="mt-2 text-sm leading-7 text-muted">
                {ar
                  ? "سنستخرج الهدف والسياق ونضيف الهيكل والقيود وصيغة المخرجات تلقائياً."
                  : "We will extract the objective and context, then add structure, constraints and output format."}
              </p>
              {error ? (
                <p className="mt-4 text-sm text-danger" role="alert">
                  {error}
                </p>
              ) : null}
            </div>
          </div>
        )}
      </section>

      <aside className="premium-card h-fit overflow-hidden xl:sticky xl:top-24">
        <div className="flex items-center gap-3 border-b p-5">
          <span className="grid size-10 place-items-center rounded-xl bg-[#ecf0ff] text-intelligence">
            <Gauge className="size-5" />
          </span>
          <div>
            <h2 className="font-bold">{ar ? "جودة البرومبت" : "Prompt quality"}</h2>
            <p className="text-xs text-muted">{ar ? "تقييم بنيوي" : "Structural measure"}</p>
          </div>
        </div>
        <div className="p-5">
          <div className="flex items-end gap-1">
            <strong className="text-4xl">{result?.score.total ?? "—"}</strong>
            <span className="mb-1 text-sm text-muted">/100</span>
          </div>
          <div className="mt-4 h-2 overflow-hidden rounded-full bg-surface-soft">
            <div
              className="h-full rounded-full bg-gradient-to-r from-intelligence to-accent transition-all duration-700"
              style={{ width: `${result?.score.total ?? 0}%` }}
            />
          </div>
          <div className="mt-6 grid gap-3">
            {(ar
              ? ["وضوح الهدف", "السياق", "الدور", "القيود", "المخرجات", "إعادة الاستخدام"]
              : ["Objective", "Context", "Role", "Constraints", "Output", "Reusability"]
            ).map((label, index) => {
              const keys = ["objective", "context", "role", "constraints", "output", "reusability"];
              const score = result?.score.dimensions[keys[index]];
              return (
                <div key={label} className="flex items-center justify-between text-xs">
                  <span className="text-muted">{label}</span>
                  <span className="font-semibold">{score ?? "—"}</span>
                </div>
              );
            })}
          </div>
          <p className="mt-6 border-t pt-4 text-[0.68rem] leading-5 text-muted">
            {ar
              ? "هذا مؤشر جودة بنيوي، وليس مقياساً علمياً أو ضماناً لدقة مخرجات الذكاء الاصطناعي."
              : "This is a structural indicator, not a scientific measure or a guarantee of AI output accuracy."}
          </p>
        </div>
      </aside>
    </div>
  );
}
