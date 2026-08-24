"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, LoaderCircle, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, Input, Select } from "@/components/ui/field";

export function OnboardingForm({ locale }: { locale: "ar" | "en" }) {
  const ar = locale === "ar";
  const Arrow = ar ? ArrowLeft : ArrowRight;
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function submit(formElement: HTMLFormElement, skip = false) {
    setLoading(true);
    const form = new FormData(formElement);
    const response = await fetch("/api/onboarding", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        skip,
        companyName: skip ? undefined : form.get("companyName"),
        businessType: skip ? undefined : form.get("businessType"),
        primaryUse: skip ? undefined : form.get("primaryUse"),
        industry: skip ? undefined : form.get("industry"),
        experience: skip ? undefined : form.get("experience"),
        goals: skip ? [] : form.getAll("goals"),
        preferredLocale: locale,
      }),
    });
    setLoading(false);
    if (!response.ok) return;
    router.push(`/${locale}/dashboard`);
    router.refresh();
  }

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        submit(event.currentTarget);
      }}
      className="premium-card p-6 sm:p-9"
    >
      <span className="grid size-12 place-items-center rounded-2xl bg-foreground text-white">
        <Sparkles className="size-5" />
      </span>
      <h1 className="mt-6 text-3xl font-bold">
        {ar ? "عرّف EVELIA على عملك" : "Introduce EVELIA to your business"}
      </h1>
      <p className="mt-3 text-sm leading-7 text-muted">
        {ar
          ? "تساعد هذه الإجابات في ترتيب الأدوات والتوصيات. يمكنك تخطيها."
          : "These answers personalize tools and recommendations. You can skip them."}
      </p>
      <div className="mt-7 grid gap-5">
        <Field label={ar ? "اسم الشركة" : "Company name"} htmlFor="company-name">
          <Input
            id="company-name"
            name="companyName"
            required
            minLength={2}
            maxLength={191}
            placeholder={ar ? "مثال: عطور نجد" : "e.g. Najd Perfumes"}
          />
        </Field>
        <Field label={ar ? "نوع النشاط" : "Business type"} htmlFor="business-type">
          <Select id="business-type" name="businessType" required defaultValue="">
            <option value="" disabled>{ar ? "اختر" : "Select"}</option>
            <option value="store">{ar ? "متجر" : "Store"}</option>
            <option value="restaurant">{ar ? "مطعم" : "Restaurant"}</option>
            <option value="agency">{ar ? "وكالة" : "Agency"}</option>
            <option value="services">{ar ? "خدمات" : "Services"}</option>
            <option value="other">{ar ? "نشاط آخر" : "Other"}</option>
          </Select>
        </Field>
        <Field label={ar ? "استخدامك الرئيسي للذكاء الاصطناعي" : "Primary AI use"} htmlFor="primary-use">
          <Select id="primary-use" name="primaryUse" required defaultValue="">
            <option value="" disabled>{ar ? "اختر" : "Select"}</option>
            <option value="business">{ar ? "إدارة وتطوير الأعمال" : "Business management and growth"}</option>
            <option value="marketing">{ar ? "التسويق والمحتوى" : "Marketing and content"}</option>
            <option value="development">{ar ? "البرمجة والتقنية" : "Development and technology"}</option>
            <option value="research">{ar ? "البحث والتعليم" : "Research and education"}</option>
          </Select>
        </Field>
        <Field label={ar ? "القطاع" : "Industry"} htmlFor="industry">
          <Select id="industry" name="industry" required defaultValue="">
            <option value="" disabled>{ar ? "اختر" : "Select"}</option>
            <option value="ecommerce">{ar ? "التجارة الإلكترونية" : "E-commerce"}</option>
            <option value="services">{ar ? "الخدمات والاستشارات" : "Services and consulting"}</option>
            <option value="technology">{ar ? "التقنية" : "Technology"}</option>
            <option value="education">{ar ? "التعليم" : "Education"}</option>
            <option value="other">{ar ? "قطاع آخر" : "Other"}</option>
          </Select>
        </Field>
        <Field label={ar ? "خبرتك مع AI" : "AI experience"} htmlFor="experience">
          <Select id="experience" name="experience" required defaultValue="">
            <option value="" disabled>{ar ? "اختر" : "Select"}</option>
            <option value="beginner">{ar ? "مبتدئ" : "Beginner"}</option>
            <option value="intermediate">{ar ? "متوسط" : "Intermediate"}</option>
            <option value="advanced">{ar ? "متقدم" : "Advanced"}</option>
          </Select>
        </Field>
        <fieldset>
          <legend className="text-sm font-semibold">
            {ar ? "أهم أهدافك" : "Main goals"}
          </legend>
          <div className="mt-3 grid grid-cols-2 gap-2">
            {[
              ["increase-sales", ar ? "زيادة المبيعات" : "Increase sales"],
              ["save-time", ar ? "توفير الوقت" : "Save time"],
              ["customer-service", ar ? "تحسين خدمة العملاء" : "Customer service"],
              ["marketing", ar ? "تطوير التسويق" : "Marketing"],
              ["analysis", ar ? "تحليل الأعمال" : "Business analysis"],
            ].map(([value, label]) => (
              <label
                key={value}
                className="flex min-h-11 items-center gap-2 rounded-xl border bg-white px-3 text-sm"
              >
                <input
                  type="checkbox"
                  name="goals"
                  value={value}
                  className="size-4 accent-intelligence"
                />
                {label}
              </label>
            ))}
          </div>
        </fieldset>
      </div>
      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <Button type="submit" variant="accent" size="lg" className="flex-1" disabled={loading}>
          {loading ? <LoaderCircle className="size-4 animate-spin" /> : <Arrow className="size-4" />}
          {ar ? "إنهاء الإعداد" : "Finish setup"}
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="lg"
          onClick={(event) => {
            if (event.currentTarget.form) submit(event.currentTarget.form, true);
          }}
          disabled={loading}
        >
          {ar ? "تخطي الآن" : "Skip for now"}
        </Button>
      </div>
    </form>
  );
}
