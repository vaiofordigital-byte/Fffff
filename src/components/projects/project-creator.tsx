"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LoaderCircle, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, Input, Textarea } from "@/components/ui/field";

export function ProjectCreator({ locale }: { locale: "ar" | "en" }) {
  const ar = locale === "ar";
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function create(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    const form = new FormData(event.currentTarget);
    const response = await fetch("/api/projects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: form.get("name"),
        description: form.get("description") || undefined,
      }),
    });
    setLoading(false);
    if (!response.ok) return;
    setOpen(false);
    router.refresh();
  }

  return (
    <>
      <Button type="button" variant="accent" onClick={() => setOpen(true)}>
        <Plus className="size-4" />
        {ar ? "مشروع جديد" : "New project"}
      </Button>
      {open ? (
        <div className="fixed inset-0 z-[80] grid place-items-center bg-black/45 p-4 backdrop-blur-sm" role="dialog" aria-modal="true">
          <form onSubmit={create} className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold">{ar ? "إنشاء مشروع" : "Create project"}</h2>
              <button type="button" className="grid size-9 place-items-center rounded-lg hover:bg-surface-soft" onClick={() => setOpen(false)} aria-label={ar ? "إغلاق" : "Close"}>
                <X className="size-4" />
              </button>
            </div>
            <div className="mt-6 grid gap-5">
              <Field label={ar ? "اسم المشروع" : "Project name"} htmlFor="project-name">
                <Input id="project-name" name="name" minLength={2} maxLength={160} required autoFocus />
              </Field>
              <Field label={ar ? "الوصف" : "Description"} htmlFor="project-description">
                <Textarea id="project-description" name="description" maxLength={1_000} className="min-h-28" />
              </Field>
              <Button type="submit" variant="accent" disabled={loading}>
                {loading ? <LoaderCircle className="size-4 animate-spin" /> : null}
                {ar ? "إنشاء مساحة المشروع" : "Create workspace"}
              </Button>
            </div>
          </form>
        </div>
      ) : null}
    </>
  );
}
