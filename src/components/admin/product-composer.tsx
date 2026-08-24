"use client";

import { useState } from "react";
import { CheckCircle2, LoaderCircle, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, Input, Select, Textarea } from "@/components/ui/field";

type Variable = { key: string; labelAr: string; labelEn: string };

export function ProductComposer({
  locale,
  categories,
  canPublish,
}: {
  locale: "ar" | "en";
  categories: Array<{ id: string; nameAr: string; nameEn: string }>;
  canPublish: boolean;
}) {
  const ar = locale === "ar";
  const [variables, setVariables] = useState<Variable[]>([]);
  const [state, setState] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [result, setResult] = useState<{ id: string; status: string }>();

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setState("loading");
    const form = new FormData(event.currentTarget);
    const payload = {
      slug: form.get("slug"),
      categoryId: form.get("categoryId"),
      titleAr: form.get("titleAr"),
      titleEn: form.get("titleEn"),
      shortDescriptionAr: form.get("shortDescriptionAr"),
      shortDescriptionEn: form.get("shortDescriptionEn"),
      descriptionAr: form.get("descriptionAr"),
      descriptionEn: form.get("descriptionEn"),
      previewAr: form.get("previewAr") || undefined,
      previewEn: form.get("previewEn") || undefined,
      industry: form.get("industry") || undefined,
      difficulty: form.get("difficulty"),
      price: Number(form.get("price")),
      salePrice: form.get("salePrice") ? Number(form.get("salePrice")) : undefined,
      currency: form.get("currency"),
      licenseType: form.get("licenseType"),
      subscriptionEligible: form.get("subscriptionEligible") === "on",
      status: form.get("status"),
      version: form.get("version"),
      premiumContent: form.get("premiumContent"),
      changelogAr: form.get("changelogAr") || undefined,
      changelogEn: form.get("changelogEn") || undefined,
      compatibility: String(form.get("compatibility"))
        .split(",")
        .map((value) => value.trim())
        .filter(Boolean),
      variables: variables
        .filter((variable) => variable.key && variable.labelAr && variable.labelEn)
        .map((variable) => ({ ...variable, required: true })),
    };
    const response = await fetch("/api/admin/products", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = (await response.json()) as {
      id?: string;
      status?: string;
    };
    if (!response.ok || !data.id || !data.status) {
      setState("error");
      return;
    }
    setResult({ id: data.id, status: data.status });
    setState("done");
  }

  if (state === "done" && result) {
    return (
      <div className="premium-card p-10 text-center">
        <CheckCircle2 className="mx-auto size-12 text-success" />
        <h2 className="mt-5 text-2xl font-bold">
          {ar ? "تم إنشاء المنتج" : "Product created"}
        </h2>
        <p className="mt-2 text-sm text-muted">
          {ar ? "الحالة" : "Status"}: {result.status}
        </p>
        <Button type="button" variant="outline" className="mt-6" onClick={() => setState("idle")}>
          {ar ? "إنشاء منتج آخر" : "Create another"}
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="grid gap-6">
      <section className="premium-card p-5 sm:p-7">
        <h2 className="text-lg font-bold">{ar ? "بيانات المنتج" : "Product information"}</h2>
        <div className="mt-5 grid gap-5 md:grid-cols-2">
          <Field label="Slug" htmlFor="slug">
            <Input id="slug" name="slug" required pattern="[a-z0-9-]+" dir="ltr" />
          </Field>
          <Field label={ar ? "التصنيف" : "Category"} htmlFor="category">
            <Select id="category" name="categoryId" required defaultValue="">
              <option value="" disabled>{ar ? "اختر" : "Select"}</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {ar ? category.nameAr : category.nameEn}
                </option>
              ))}
            </Select>
          </Field>
          <Field label={ar ? "العنوان العربي" : "Arabic title"} htmlFor="title-ar">
            <Input id="title-ar" name="titleAr" required dir="rtl" />
          </Field>
          <Field label={ar ? "العنوان الإنجليزي" : "English title"} htmlFor="title-en">
            <Input id="title-en" name="titleEn" required dir="ltr" />
          </Field>
          <Field label={ar ? "الوصف المختصر العربي" : "Arabic short description"} htmlFor="short-ar">
            <Textarea id="short-ar" name="shortDescriptionAr" required minLength={10} dir="rtl" className="min-h-24" />
          </Field>
          <Field label={ar ? "الوصف المختصر الإنجليزي" : "English short description"} htmlFor="short-en">
            <Textarea id="short-en" name="shortDescriptionEn" required minLength={10} dir="ltr" className="min-h-24" />
          </Field>
          <Field label={ar ? "الوصف الكامل العربي" : "Arabic full description"} htmlFor="description-ar">
            <Textarea id="description-ar" name="descriptionAr" required minLength={20} dir="rtl" />
          </Field>
          <Field label={ar ? "الوصف الكامل الإنجليزي" : "English full description"} htmlFor="description-en">
            <Textarea id="description-en" name="descriptionEn" required minLength={20} dir="ltr" />
          </Field>
          <Field label={ar ? "المعاينة العربية" : "Arabic preview"} htmlFor="preview-ar">
            <Textarea id="preview-ar" name="previewAr" dir="rtl" />
          </Field>
          <Field label={ar ? "المعاينة الإنجليزية" : "English preview"} htmlFor="preview-en">
            <Textarea id="preview-en" name="previewEn" dir="ltr" />
          </Field>
        </div>
      </section>

      <section className="premium-card p-5 sm:p-7">
        <h2 className="text-lg font-bold">{ar ? "التسعير والنشر" : "Pricing and publishing"}</h2>
        <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <Field label={ar ? "السعر" : "Price"} htmlFor="price">
            <Input id="price" name="price" type="number" min="0" step="0.01" required dir="ltr" />
          </Field>
          <Field label={ar ? "سعر التخفيض" : "Sale price"} htmlFor="sale-price">
            <Input id="sale-price" name="salePrice" type="number" min="0" step="0.01" dir="ltr" />
          </Field>
          <Field label={ar ? "العملة" : "Currency"} htmlFor="currency">
            <Input id="currency" name="currency" defaultValue="SAR" minLength={3} maxLength={3} required dir="ltr" />
          </Field>
          <Field label={ar ? "الترخيص" : "License"} htmlFor="license">
            <Select id="license" name="licenseType">
              <option value="PERSONAL">Personal</option>
              <option value="PROFESSIONAL">Professional</option>
              <option value="COMMERCIAL">Commercial</option>
              <option value="AGENCY">Agency</option>
            </Select>
          </Field>
          <Field label={ar ? "الصعوبة" : "Difficulty"} htmlFor="difficulty">
            <Select id="difficulty" name="difficulty">
              <option value="BEGINNER">Beginner</option>
              <option value="INTERMEDIATE">Intermediate</option>
              <option value="ADVANCED">Advanced</option>
              <option value="EXPERT">Expert</option>
            </Select>
          </Field>
          <Field label={ar ? "الحالة" : "Status"} htmlFor="status">
            <Select id="status" name="status">
              <option value="DRAFT">Draft</option>
              <option value="REVIEW">Review</option>
              {canPublish ? <option value="PUBLISHED">Published</option> : null}
            </Select>
          </Field>
          <Field label={ar ? "القطاع" : "Industry"} htmlFor="industry">
            <Input id="industry" name="industry" />
          </Field>
          <label className="flex items-center gap-2 self-end pb-3 text-sm">
            <input type="checkbox" name="subscriptionEligible" className="size-4 accent-foreground" />
            {ar ? "متاح للاشتراكات" : "Subscription eligible"}
          </label>
        </div>
      </section>

      <section className="premium-card p-5 sm:p-7">
        <h2 className="text-lg font-bold">{ar ? "محتوى البرومبت المحمي" : "Protected prompt content"}</h2>
        <p className="mt-2 text-xs leading-6 text-muted">
          {ar ? "لا يظهر هذا المحتوى في صفحة المنتج أو استجابات المتجر العامة." : "This content is excluded from public product pages and catalog responses."}
        </p>
        <div className="mt-5 grid gap-5">
          <Field label={ar ? "الإصدار" : "Version"} htmlFor="version">
            <Input id="version" name="version" defaultValue="1.0" required pattern="[0-9]+\.[0-9]+(\.[0-9]+)?" dir="ltr" />
          </Field>
          <Field label={ar ? "المحتوى الكامل" : "Full content"} htmlFor="premium">
            <Textarea id="premium" name="premiumContent" required minLength={20} className="min-h-80 font-mono" />
          </Field>
          <div className="grid gap-5 md:grid-cols-2">
            <Field label={ar ? "سجل التغيير العربي" : "Arabic changelog"} htmlFor="changelog-ar">
              <Textarea id="changelog-ar" name="changelogAr" dir="rtl" className="min-h-24" />
            </Field>
            <Field label={ar ? "سجل التغيير الإنجليزي" : "English changelog"} htmlFor="changelog-en">
              <Textarea id="changelog-en" name="changelogEn" dir="ltr" className="min-h-24" />
            </Field>
          </div>
          <Field label={ar ? "التوافق (افصل بفاصلة)" : "Compatibility (comma-separated)"} htmlFor="compatibility">
            <Input id="compatibility" name="compatibility" defaultValue="General AI" required />
          </Field>
        </div>
      </section>

      <section className="premium-card p-5 sm:p-7">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-lg font-bold">{ar ? "المتغيرات التفاعلية" : "Interactive variables"}</h2>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setVariables((items) => [...items, { key: "", labelAr: "", labelEn: "" }])}
          >
            <Plus className="size-4" />
            {ar ? "متغير" : "Variable"}
          </Button>
        </div>
        <div className="mt-5 grid gap-3">
          {variables.map((variable, index) => (
            <div key={index} className="grid gap-3 rounded-xl border p-3 sm:grid-cols-[1fr_1fr_1fr_auto]">
              <Input
                value={variable.key}
                onChange={(event) =>
                  setVariables((items) => items.map((item, itemIndex) => itemIndex === index ? { ...item, key: event.target.value.toUpperCase() } : item))
                }
                placeholder="BRAND"
                dir="ltr"
              />
              <Input
                value={variable.labelAr}
                onChange={(event) =>
                  setVariables((items) => items.map((item, itemIndex) => itemIndex === index ? { ...item, labelAr: event.target.value } : item))
                }
                placeholder="العلامة"
                dir="rtl"
              />
              <Input
                value={variable.labelEn}
                onChange={(event) =>
                  setVariables((items) => items.map((item, itemIndex) => itemIndex === index ? { ...item, labelEn: event.target.value } : item))
                }
                placeholder="Brand"
                dir="ltr"
              />
              <Button type="button" variant="ghost" size="icon" onClick={() => setVariables((items) => items.filter((_, itemIndex) => itemIndex !== index))}>
                <Trash2 className="size-4 text-danger" />
              </Button>
            </div>
          ))}
        </div>
      </section>

      {state === "error" ? (
        <p className="rounded-xl bg-red-50 p-4 text-sm text-danger" role="alert">
          {ar ? "تعذر الحفظ. راجع الحقول والصلاحيات." : "Could not save. Review fields and permissions."}
        </p>
      ) : null}
      <Button type="submit" variant="accent" size="lg" className="justify-self-end" disabled={state === "loading"}>
        {state === "loading" ? <LoaderCircle className="size-4 animate-spin" /> : null}
        {ar ? "حفظ المنتج" : "Save product"}
      </Button>
    </form>
  );
}
