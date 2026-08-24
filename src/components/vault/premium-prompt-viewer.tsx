"use client";

import { useEffect, useMemo, useState } from "react";
import { Check, Clipboard, Download, LoaderCircle, LockKeyhole } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";

type PremiumPrompt = {
  titleAr: string;
  titleEn: string;
  version: string;
  content: string;
  license: string;
  variables: Array<{
    key: string;
    labelAr: string;
    labelEn: string;
    descriptionAr: string | null;
    descriptionEn: string | null;
    required: boolean;
  }>;
};

export function PremiumPromptViewer({
  productId,
  locale,
}: {
  productId: string;
  locale: "ar" | "en";
}) {
  const ar = locale === "ar";
  const [prompt, setPrompt] = useState<PremiumPrompt>();
  const [values, setValues] = useState<Record<string, string>>({});
  const [error, setError] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    fetch(`/api/products/${productId}/content`, {
      cache: "no-store",
      signal: controller.signal,
    })
      .then(async (response) => {
        if (!response.ok) throw new Error("ACCESS_DENIED");
        return (await response.json()) as PremiumPrompt;
      })
      .then(setPrompt)
      .catch((cause) => {
        if (cause instanceof DOMException && cause.name === "AbortError") return;
        setError(true);
      });
    return () => controller.abort();
  }, [productId]);

  const customized = useMemo(() => {
    if (!prompt) return "";
    return Object.entries(values).reduce(
      (content, [key, value]) =>
        value ? content.replaceAll(`{{${key}}}`, value) : content,
      prompt.content,
    );
  }, [prompt, values]);

  async function copy() {
    await navigator.clipboard.writeText(customized);
    setCopied(true);
    setTimeout(() => setCopied(false), 1_500);
  }

  function download() {
    if (!prompt) return;
    const blob = new Blob([customized], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `PROMPTX-${prompt.version}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  }

  if (error) {
    return (
      <div className="premium-card p-10 text-center">
        <LockKeyhole className="mx-auto size-9 text-danger" />
        <h1 className="mt-4 text-xl font-bold">
          {ar ? "تعذر التحقق من الاستحقاق" : "Entitlement could not be verified"}
        </h1>
        <p className="mt-2 text-sm text-muted">
          {ar ? "تأكد من أن الشراء مكتمل وأن جلستك ما زالت صالحة." : "Confirm that payment completed and your session is still valid."}
        </p>
      </div>
    );
  }

  if (!prompt) {
    return (
      <div className="premium-card grid min-h-96 place-items-center">
        <div className="text-center">
          <LoaderCircle className="mx-auto size-8 animate-spin text-accent" />
          <p className="mt-3 text-sm text-muted">
            {ar ? "جارٍ التحقق من الاستحقاق..." : "Verifying entitlement..."}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="grid gap-5 lg:grid-cols-[18rem_minmax(0,1fr)]">
      <aside className="premium-card h-fit p-5 lg:sticky lg:top-24">
        <p className="text-xs font-semibold text-success">
          {ar ? "أصل رسمي محمي" : "Protected official asset"}
        </p>
        <h1 className="mt-2 text-xl font-bold">{ar ? prompt.titleAr : prompt.titleEn}</h1>
        <div className="mt-3 flex gap-2 text-xs text-muted">
          <span dir="ltr">v{prompt.version}</span>
          <span>·</span>
          <span>{prompt.license}</span>
        </div>

        {prompt.variables.length ? (
          <div className="mt-6 grid gap-4 border-t pt-5">
            <h2 className="text-sm font-bold">{ar ? "خصّص نسختك" : "Customize your copy"}</h2>
            {prompt.variables.map((variable) => (
              <Field
                key={variable.key}
                label={ar ? variable.labelAr : variable.labelEn}
                htmlFor={`variable-${variable.key}`}
                hint={variable.required ? (ar ? "مطلوب" : "Required") : undefined}
              >
                <Input
                  id={`variable-${variable.key}`}
                  value={values[variable.key] ?? ""}
                  onChange={(event) =>
                    setValues((current) => ({
                      ...current,
                      [variable.key]: event.target.value,
                    }))
                  }
                />
              </Field>
            ))}
          </div>
        ) : null}
      </aside>

      <section className="premium-card overflow-hidden">
        <div className="flex min-h-16 items-center justify-between gap-3 border-b px-5">
          <div>
            <h2 className="font-bold">{ar ? "نسختك المخصصة" : "Your customized copy"}</h2>
            <p className="text-xs text-muted">
              {ar ? "الأصل الرسمي لا يتغير" : "The official asset remains unchanged"}
            </p>
          </div>
          <div className="flex gap-2">
            <Button type="button" variant="ghost" size="sm" onClick={download}>
              <Download className="size-4" />
              <span className="hidden sm:inline">{ar ? "تصدير" : "Export"}</span>
            </Button>
            <Button type="button" variant="outline" size="sm" onClick={copy}>
              {copied ? <Check className="size-4 text-success" /> : <Clipboard className="size-4" />}
              {copied ? (ar ? "تم" : "Copied") : ar ? "نسخ" : "Copy"}
            </Button>
          </div>
        </div>
        <pre className="min-h-[32rem] whitespace-pre-wrap p-5 font-[inherit] text-sm leading-8 sm:p-8">
          {customized}
        </pre>
      </section>
    </div>
  );
}
