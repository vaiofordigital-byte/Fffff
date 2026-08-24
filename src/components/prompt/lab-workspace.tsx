"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  Check,
  Clipboard,
  Download,
  Eye,
  Heart,
  Languages,
  Redo2,
  Save,
  Sparkles,
  Undo2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/field";
import { scorePrompt } from "@/lib/prompt-engine";

type Snapshot = { content: string; createdAt: string };

export function LabWorkspace({ locale }: { locale: "ar" | "en" }) {
  const ar = locale === "ar";
  const [title, setTitle] = useState(ar ? "برومبت جديد" : "Untitled prompt");
  const [content, setContent] = useState("");
  const [undoStack, setUndoStack] = useState<string[]>([]);
  const [redoStack, setRedoStack] = useState<string[]>([]);
  const [versions, setVersions] = useState<Snapshot[]>([]);
  const [favorite, setFavorite] = useState(false);
  const [copied, setCopied] = useState(false);
  const [preview, setPreview] = useState(false);
  const [previewDirection, setPreviewDirection] = useState<"rtl" | "ltr">(
    ar ? "rtl" : "ltr",
  );
  const [mobileTab, setMobileTab] = useState<"variables" | "editor" | "quality">("editor");
  const valueRef = useRef(content);

  useEffect(() => {
    const saved = localStorage.getItem(`promptx:lab:${locale}`);
    if (!saved) return;
    const draft = JSON.parse(saved) as { title?: string; content?: string; versions?: Snapshot[] };
    queueMicrotask(() => {
      const recoveredContent = draft.content ?? "";
      setTitle(draft.title ?? (ar ? "برومبت جديد" : "Untitled prompt"));
      setContent(recoveredContent);
      valueRef.current = recoveredContent;
      setVersions(draft.versions ?? []);
    });
  }, [ar, locale]);

  useEffect(() => {
    const timer = setTimeout(() => {
      localStorage.setItem(
        `promptx:lab:${locale}`,
        JSON.stringify({ title, content, versions }),
      );
    }, 600);
    return () => clearTimeout(timer);
  }, [content, locale, title, versions]);

  const variables = useMemo(
    () => [...new Set(content.match(/\{\{[A-Z0-9_]+\}\}/g) ?? [])],
    [content],
  );
  const score = useMemo(() => scorePrompt(content), [content]);

  function updateContent(value: string) {
    if (valueRef.current !== value) {
      setUndoStack((stack) => [...stack.slice(-49), valueRef.current]);
      setRedoStack([]);
      valueRef.current = value;
      setContent(value);
    }
  }

  function undo() {
    const previous = undoStack.at(-1);
    if (previous === undefined) return;
    setRedoStack((stack) => [...stack, content]);
    setUndoStack((stack) => stack.slice(0, -1));
    valueRef.current = previous;
    setContent(previous);
  }

  function redo() {
    const next = redoStack.at(-1);
    if (next === undefined) return;
    setUndoStack((stack) => [...stack, content]);
    setRedoStack((stack) => stack.slice(0, -1));
    valueRef.current = next;
    setContent(next);
  }

  function saveVersion() {
    if (!content.trim()) return;
    setVersions((items) => [
      { content, createdAt: new Date().toISOString() },
      ...items,
    ].slice(0, 20));
  }

  async function optimize() {
    if (content.trim().length < 8) return;
    const response = await fetch("/api/prompts/optimize", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt: content, mode: "professional", locale }),
    });
    if (!response.ok) return;
    const result = (await response.json()) as { content: string };
    saveVersion();
    updateContent(result.content);
  }

  function exportPrompt() {
    const blob = new Blob(
      [JSON.stringify({ title, content, variables, score: score.total }, null, 2)],
      { type: "application/json" },
    );
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${title.replace(/[^\p{L}\p{N}-]+/gu, "-") || "prompt"}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  async function copy() {
    await navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 1_500);
  }

  return (
    <div className="overflow-hidden rounded-[1.5rem] border bg-white shadow-xl">
      <div className="flex min-h-16 flex-wrap items-center gap-2 border-b px-3 sm:px-5">
        <Input
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          className="min-h-9 min-w-32 flex-1 border-0 px-2 font-semibold shadow-none"
          aria-label={ar ? "اسم البرومبت" : "Prompt name"}
        />
        <div className="flex items-center gap-1">
          <Button type="button" variant="ghost" size="icon" onClick={undo} disabled={!undoStack.length} aria-label={ar ? "تراجع" : "Undo"}>
            <Undo2 className="size-4" />
          </Button>
          <Button type="button" variant="ghost" size="icon" onClick={redo} disabled={!redoStack.length} aria-label={ar ? "إعادة" : "Redo"}>
            <Redo2 className="size-4" />
          </Button>
          <Button type="button" variant="ghost" size="icon" onClick={() => setFavorite((value) => !value)} aria-label={ar ? "مفضلة" : "Favorite"}>
            <Heart className={`size-4 ${favorite ? "fill-danger text-danger" : ""}`} />
          </Button>
          <Button type="button" variant="ghost" size="icon" onClick={() => setPreview((value) => !value)} aria-label={ar ? "معاينة" : "Preview"}>
            <Eye className="size-4" />
          </Button>
          <Button type="button" variant="ghost" size="icon" onClick={exportPrompt} aria-label={ar ? "تصدير" : "Export"}>
            <Download className="size-4" />
          </Button>
          <Button type="button" variant="outline" size="sm" onClick={copy} disabled={!content}>
            {copied ? <Check className="size-4 text-success" /> : <Clipboard className="size-4" />}
            <span className="hidden sm:inline">{copied ? (ar ? "تم" : "Copied") : ar ? "نسخ" : "Copy"}</span>
          </Button>
          <Button type="button" size="sm" onClick={saveVersion} disabled={!content}>
            <Save className="size-4" />
            <span className="hidden sm:inline">{ar ? "حفظ نسخة" : "Save version"}</span>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-3 border-b lg:hidden">
        {[
          ["variables", ar ? "المتغيرات" : "Variables"],
          ["editor", ar ? "المحرر" : "Editor"],
          ["quality", ar ? "الجودة" : "Quality"],
        ].map(([key, label]) => (
          <button
            key={key}
            type="button"
            onClick={() => setMobileTab(key as typeof mobileTab)}
            className={`min-h-11 text-xs font-semibold ${mobileTab === key ? "border-b-2 border-accent text-foreground" : "text-muted"}`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="grid min-h-[39rem] lg:grid-cols-[16rem_minmax(0,1fr)_17rem]">
        <aside className={`${mobileTab === "variables" ? "block" : "hidden"} border-e bg-surface-soft/45 p-5 lg:block`}>
          <h2 className="text-sm font-bold">{ar ? "المتغيرات والسياق" : "Variables & context"}</h2>
          <p className="mt-1 text-xs leading-5 text-muted">
            {ar ? "تُكتشف المتغيرات تلقائياً من المحرر." : "Variables are detected automatically from the editor."}
          </p>
          <div className="mt-5 grid gap-2">
            {variables.length ? (
              variables.map((variable) => (
                <button
                  key={variable}
                  type="button"
                  onClick={() => updateContent(`${content}\n${variable}`)}
                  className="rounded-lg border bg-white px-3 py-2 text-start font-mono text-xs hover:border-accent"
                >
                  {variable}
                </button>
              ))
            ) : (
              <p className="rounded-xl border border-dashed p-4 text-xs leading-6 text-muted">
                {ar ? "اكتب متغيراً مثل {{BRAND}} داخل النص." : "Add a variable such as {{BRAND}} in the prompt."}
              </p>
            )}
          </div>
          {versions.length ? (
            <div className="mt-8 border-t pt-5">
              <h3 className="text-xs font-bold">{ar ? "سجل النسخ" : "Version history"}</h3>
              <div className="mt-3 grid gap-2">
                {versions.map((version, index) => (
                  <button
                    key={version.createdAt}
                    type="button"
                    onClick={() => updateContent(version.content)}
                    className="rounded-lg bg-white px-3 py-2 text-start text-xs hover:ring-1 hover:ring-accent"
                  >
                    v{versions.length - index} ·{" "}
                    {new Intl.DateTimeFormat(ar ? "ar-SA" : "en", {
                      hour: "2-digit",
                      minute: "2-digit",
                    }).format(new Date(version.createdAt))}
                  </button>
                ))}
              </div>
            </div>
          ) : null}
        </aside>

        <section
          className={`${mobileTab === "editor" ? "block" : "hidden"} min-w-0 lg:block`}
          dir={previewDirection}
        >
          {preview ? (
            <pre className="min-h-[39rem] whitespace-pre-wrap p-6 font-[inherit] text-sm leading-8">
              {content || (ar ? "لا يوجد محتوى للمعاينة." : "Nothing to preview.")}
            </pre>
          ) : (
            <Textarea
              value={content}
              onChange={(event) => updateContent(event.target.value)}
              className="min-h-[39rem] resize-none rounded-none border-0 p-6 text-sm leading-8 shadow-none focus:ring-0"
              placeholder={
                ar
                  ? "## الدور\nأنت خبير في...\n\n## الهدف\n...\n\n## السياق\nالعلامة: {{BRAND}}"
                  : "## ROLE\nAct as an expert in...\n\n## OBJECTIVE\n...\n\n## CONTEXT\nBrand: {{BRAND}}"
              }
              aria-label={ar ? "محرر البرومبت" : "Prompt editor"}
            />
          )}
        </section>

        <aside className={`${mobileTab === "quality" ? "block" : "hidden"} border-s bg-surface-soft/45 p-5 lg:block`}>
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold">{ar ? "مؤشر الجودة" : "Quality score"}</h2>
            <strong className="text-xl">{score.total}</strong>
          </div>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-line">
            <div className="h-full rounded-full bg-intelligence" style={{ width: `${score.total}%` }} />
          </div>
          <p className="mt-3 text-[0.68rem] leading-5 text-muted">
            {ar ? "تقييم بنيوي غير علمي، ولا يضمن دقة مخرجات AI." : "A non-scientific structural indicator; it does not guarantee AI accuracy."}
          </p>
          <Button type="button" variant="accent" className="mt-6 w-full" onClick={optimize} disabled={content.length < 8}>
            <Sparkles className="size-4" />
            {ar ? "تحسين احترافي" : "Professional optimize"}
          </Button>
          <Button
            type="button"
            variant="outline"
            className="mt-2 w-full"
            onClick={() =>
              setPreviewDirection((value) => (value === "rtl" ? "ltr" : "rtl"))
            }
          >
            <Languages className="size-4" />
            {ar ? "تبديل اتجاه المعاينة" : "Switch preview direction"}
          </Button>
          <div className="mt-7 grid gap-3">
            {Object.entries(score.dimensions).map(([key, value]) => (
              <div key={key} className="flex items-center justify-between text-xs">
                <span className="capitalize text-muted">{key}</span>
                <span className="font-semibold">{value}</span>
              </div>
            ))}
          </div>
        </aside>
      </div>
    </div>
  );
}
