"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  CheckCircle2,
  FileText,
  LoaderCircle,
  Plus,
  Upload,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, Input, Select, Textarea } from "@/components/ui/field";

type Entry = {
  id: string;
  kind: string;
  titleAr: string;
  titleEn: string;
  approved: boolean;
  privateMode: boolean;
  source: string;
  updatedAt: Date;
};

export function BrainManager({
  locale,
  organizationId,
  entries,
}: {
  locale: "ar" | "en";
  organizationId: string;
  entries: Entry[];
}) {
  const ar = locale === "ar";
  const [mode, setMode] = useState<"closed" | "entry" | "upload">("closed");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  async function createEntry(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");
    const form = new FormData(event.currentTarget);
    const response = await fetch("/api/brain/knowledge", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        organizationId,
        kind: form.get("kind"),
        titleAr: form.get("titleAr"),
        titleEn: form.get("titleEn"),
        content: form.get("content"),
        approved: true,
        privateMode: form.get("privateMode") === "on",
      }),
    });
    setLoading(false);
    if (!response.ok) {
      setError(ar ? "تعذر حفظ المعرفة." : "Knowledge could not be saved.");
      return;
    }
    setMode("closed");
    router.refresh();
  }

  async function uploadDocument(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");
    const form = new FormData(event.currentTarget);
    form.set("organizationId", organizationId);
    form.set("privateMode", form.get("privateMode") === "on" ? "true" : "false");
    const response = await fetch("/api/brain/documents", {
      method: "POST",
      body: form,
    });
    setLoading(false);
    if (!response.ok) {
      const payload = (await response.json()) as { error?: { code?: string } };
      setError(
        payload.error?.code === "DOCUMENT_TYPE_UNSUPPORTED"
          ? ar
            ? "استخدم PDF أو DOCX أو TXT أو Markdown."
            : "Use PDF, DOCX, TXT or Markdown."
          : ar
            ? "تعذر استخراج نص المستند."
            : "Document text could not be extracted.",
      );
      return;
    }
    setMode("closed");
    router.refresh();
  }

  return (
    <>
      <div className="flex flex-wrap gap-2">
        <Button type="button" variant="accent" onClick={() => setMode("entry")}>
          <Plus className="size-4" />
          {ar ? "إضافة معرفة" : "Add knowledge"}
        </Button>
        <Button type="button" variant="outline" onClick={() => setMode("upload")}>
          <Upload className="size-4" />
          {ar ? "رفع مستند" : "Upload document"}
        </Button>
      </div>

      {entries.length ? (
        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {entries.map((entry) => (
            <article key={entry.id} className="premium-card p-5">
              <div className="flex items-center justify-between">
                <span className="grid size-10 place-items-center rounded-xl bg-[#eaf0ff] text-intelligence">
                  <FileText className="size-4" />
                </span>
                <span className="inline-flex items-center gap-1 text-[0.68rem] text-success">
                  <CheckCircle2 className="size-3.5" />
                  {entry.approved ? (ar ? "معتمد" : "Approved") : ar ? "مراجعة" : "Review"}
                </span>
              </div>
              <p className="mt-5 text-[0.68rem] font-semibold text-intelligence">
                {entry.kind.replaceAll("_", " ")}
              </p>
              <h2 className="mt-1 font-bold">{ar ? entry.titleAr : entry.titleEn}</h2>
              <div className="mt-4 flex items-center justify-between text-[0.68rem] text-muted">
                <span>{entry.source}</span>
                <span>{entry.privateMode ? (ar ? "يدوي فقط" : "Manual use only") : ar ? "سياق تلقائي" : "Automatic context"}</span>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="mt-6 rounded-2xl border border-dashed p-10 text-center">
          <FileText className="mx-auto size-10 text-muted" />
          <h2 className="mt-4 text-xl font-bold">
            {ar ? "عقل شركتك جاهز للتعلّم" : "Your Company Brain is ready"}
          </h2>
          <p className="mx-auto mt-2 max-w-md text-sm leading-7 text-muted">
            {ar
              ? "أضف وصف الشركة والمنتجات والسياسات والجمهور ليعمل الموظفون وفق حقائق معتمدة."
              : "Add company, product, policy and customer knowledge so employees work from approved facts."}
          </p>
        </div>
      )}

      {mode !== "closed" ? (
        <div className="fixed inset-0 z-[80] grid place-items-center bg-black/45 p-4 backdrop-blur-sm">
          <form
            onSubmit={mode === "entry" ? createEntry : uploadDocument}
            className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold">
                {mode === "entry"
                  ? ar
                    ? "معرفة شركة جديدة"
                    : "New company knowledge"
                  : ar
                    ? "رفع مستند شركة"
                    : "Upload company document"}
              </h2>
              <button
                type="button"
                onClick={() => setMode("closed")}
                className="grid size-9 place-items-center rounded-lg hover:bg-surface-soft"
                aria-label={ar ? "إغلاق" : "Close"}
              >
                <X className="size-4" />
              </button>
            </div>

            {mode === "entry" ? (
              <div className="mt-6 grid gap-5">
                <Field label={ar ? "نوع المعرفة" : "Knowledge type"} htmlFor="knowledge-kind">
                  <Select id="knowledge-kind" name="kind" defaultValue="COMPANY_PROFILE">
                    {[
                      "COMPANY_PROFILE",
                      "PRODUCT",
                      "SERVICE",
                      "POLICY",
                      "CUSTOMER",
                      "FAQ",
                      "BRAND_VOICE",
                      "PROCEDURE",
                    ].map((kind) => (
                      <option key={kind} value={kind}>{kind.replaceAll("_", " ")}</option>
                    ))}
                  </Select>
                </Field>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label={ar ? "العنوان العربي" : "Arabic title"} htmlFor="knowledge-title-ar">
                    <Input id="knowledge-title-ar" name="titleAr" required minLength={2} dir="rtl" />
                  </Field>
                  <Field label={ar ? "العنوان الإنجليزي" : "English title"} htmlFor="knowledge-title-en">
                    <Input id="knowledge-title-en" name="titleEn" required minLength={2} dir="ltr" />
                  </Field>
                </div>
                <Field label={ar ? "المعلومات المعتمدة" : "Approved information"} htmlFor="knowledge-content">
                  <Textarea id="knowledge-content" name="content" required minLength={10} className="min-h-52" />
                </Field>
              </div>
            ) : (
              <div className="mt-6 grid gap-5">
                <Field label={ar ? "المستند" : "Document"} htmlFor="brain-file" hint="PDF · DOCX · TXT · MD · 10MB">
                  <Input
                    id="brain-file"
                    name="file"
                    type="file"
                    accept=".pdf,.docx,.txt,.md,application/pdf,text/plain,text/markdown,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                    required
                    className="pt-3"
                  />
                </Field>
                <p className="rounded-xl bg-surface-soft p-4 text-xs leading-6 text-muted">
                  {ar
                    ? "يُستخرج النص داخل الطلب نفسه؛ لا يحتاج النظام إلى عامل خلفي دائم، ولا يُنشر الملف للعامة."
                    : "Text is extracted within the request; no permanent background worker is required and the file is never made public."}
                </p>
              </div>
            )}

            <label className="mt-5 flex items-start gap-2 text-sm">
              <input type="checkbox" name="privateMode" className="mt-1 size-4 accent-intelligence" />
              <span>
                {ar ? "استخدام يدوي فقط" : "Manual use only"}
                <span className="block text-xs leading-5 text-muted">
                  {ar
                    ? "لا تُضاف هذه المعرفة تلقائياً إلى مهام الموظفين."
                    : "This knowledge is excluded from employees' automatic task context."}
                </span>
              </span>
            </label>
            {error ? <p className="mt-4 text-sm text-danger">{error}</p> : null}
            <Button type="submit" variant="accent" className="mt-6 w-full" disabled={loading}>
              {loading ? <LoaderCircle className="size-4 animate-spin" /> : null}
              {mode === "entry" ? (ar ? "حفظ واعتماد" : "Save and approve") : ar ? "رفع واستخراج" : "Upload and extract"}
            </Button>
          </form>
        </div>
      ) : null}
    </>
  );
}
