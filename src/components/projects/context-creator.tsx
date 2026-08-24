"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LoaderCircle, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, Input, Textarea } from "@/components/ui/field";

export function ContextCreator({
  projectId,
  organizationId,
  locale,
}: {
  projectId: string;
  organizationId: string;
  locale: "ar" | "en";
}) {
  const ar = locale === "ar";
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function create(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    const form = new FormData(event.currentTarget);
    const response = await fetch("/api/contexts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        organizationId,
        projectId,
        name: form.get("name"),
        description: form.get("description") || undefined,
        data: {
          brand: form.get("brand") || "",
          audience: form.get("audience") || "",
          tone: form.get("tone") || "",
          market: form.get("market") || "",
        },
        privateMode: form.get("privateMode") === "on",
      }),
    });
    setLoading(false);
    if (!response.ok) return;
    setOpen(false);
    router.refresh();
  }

  if (!open) {
    return (
      <Button type="button" variant="outline" size="sm" onClick={() => setOpen(true)}>
        <Plus className="size-4" />
        {ar ? "إضافة سياق" : "Add context"}
      </Button>
    );
  }

  return (
    <form onSubmit={create} className="premium-card mt-5 grid gap-4 p-5 sm:grid-cols-2">
      <Field label={ar ? "اسم السياق" : "Context name"} htmlFor="context-name" className="sm:col-span-2">
        <Input id="context-name" name="name" required minLength={2} maxLength={160} />
      </Field>
      <Field label={ar ? "وصف العلامة" : "Brand description"} htmlFor="context-brand">
        <Textarea id="context-brand" name="brand" className="min-h-24" />
      </Field>
      <Field label={ar ? "الجمهور" : "Audience"} htmlFor="context-audience">
        <Textarea id="context-audience" name="audience" className="min-h-24" />
      </Field>
      <Field label={ar ? "النبرة" : "Tone"} htmlFor="context-tone">
        <Input id="context-tone" name="tone" />
      </Field>
      <Field label={ar ? "السوق" : "Market"} htmlFor="context-market">
        <Input id="context-market" name="market" />
      </Field>
      <label className="flex items-center gap-2 text-sm sm:col-span-2">
        <input type="checkbox" name="privateMode" className="size-4 accent-foreground" />
        {ar ? "خاص: استبعده من إعادة الاستخدام التلقائي" : "Private: exclude from automatic reuse"}
      </label>
      <div className="flex gap-2 sm:col-span-2">
        <Button type="submit" disabled={loading}>
          {loading ? <LoaderCircle className="size-4 animate-spin" /> : null}
          {ar ? "حفظ السياق" : "Save context"}
        </Button>
        <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
          {ar ? "إلغاء" : "Cancel"}
        </Button>
      </div>
    </form>
  );
}
