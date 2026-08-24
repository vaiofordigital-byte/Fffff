"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Bot, KeyRound, LoaderCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";

type Provider = {
  id: string;
  key: string;
  displayName: string;
  baseUrl: string;
  defaultModel: string | null;
  enabled: boolean;
  isFallback: boolean;
  hasApiKey: boolean;
};

type Employee = {
  id: string;
  slug: string;
  nameAr: string;
  nameEn: string;
  defaultCreditCost: number;
  active: boolean;
};

export function AiControlCenter({
  locale,
  providers,
  employees,
}: {
  locale: "ar" | "en";
  providers: Provider[];
  employees: Employee[];
}) {
  const ar = locale === "ar";
  const [loading, setLoading] = useState("");
  const [message, setMessage] = useState("");
  const router = useRouter();

  async function saveProvider(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setLoading("provider");
    const response = await fetch("/api/admin/ai-providers", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        key: form.get("key"),
        displayName: form.get("displayName"),
        baseUrl: form.get("baseUrl"),
        apiKey: form.get("apiKey") || undefined,
        defaultModel: form.get("defaultModel"),
        enabled: form.get("enabled") === "on",
        isFallback: form.get("isFallback") === "on",
      }),
    });
    setLoading("");
    setMessage(response.ok ? (ar ? "تم حفظ المزود." : "Provider saved.") : ar ? "تعذر حفظ المزود." : "Provider could not be saved.");
    if (response.ok) router.refresh();
  }

  async function updateEmployee(
    employee: Employee,
    input: { active?: boolean; defaultCreditCost?: number },
  ) {
    setLoading(employee.id);
    const response = await fetch(`/api/admin/ai-employees/${employee.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
    setLoading("");
    setMessage(response.ok ? (ar ? "تم تحديث الموظف." : "Employee updated.") : ar ? "تعذر التحديث." : "Update failed.");
    if (response.ok) router.refresh();
  }

  return (
    <div className="grid gap-6">
      <section className="premium-card p-6 sm:p-8">
        <div className="flex items-center gap-3">
          <KeyRound className="size-5 text-intelligence" />
          <div>
            <h2 className="font-bold">{ar ? "مزودو الذكاء الاصطناعي" : "AI providers"}</h2>
            <p className="text-xs text-muted">{ar ? "المفاتيح مشفرة ولا تُعاد إلى الواجهة." : "Keys are encrypted and never returned to the browser."}</p>
          </div>
        </div>
        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          {providers.map((provider) => (
            <div key={provider.id} className="rounded-xl border p-4 text-sm">
              <div className="flex items-center justify-between">
                <strong>{provider.displayName}</strong>
                <span className={provider.enabled ? "text-success" : "text-muted"}>
                  {provider.enabled ? "ACTIVE" : "DISABLED"}
                </span>
              </div>
              <p className="mt-2 text-xs text-muted">{provider.defaultModel}</p>
              <p className="mt-1 text-[0.68rem] text-muted">
                {provider.hasApiKey ? (ar ? "المفتاح محفوظ" : "Key stored") : ar ? "لا يوجد مفتاح" : "No key"}
              </p>
            </div>
          ))}
        </div>
        <form onSubmit={saveProvider} className="mt-6 grid gap-4 border-t pt-6 sm:grid-cols-2">
          <Field label="Key" htmlFor="provider-key">
            <Input id="provider-key" name="key" required pattern="[a-z0-9-]+" dir="ltr" />
          </Field>
          <Field label={ar ? "الاسم" : "Display name"} htmlFor="provider-name">
            <Input id="provider-name" name="displayName" required />
          </Field>
          <Field label="Base URL" htmlFor="provider-url">
            <Input id="provider-url" name="baseUrl" type="url" required dir="ltr" />
          </Field>
          <Field label={ar ? "النموذج" : "Model"} htmlFor="provider-model">
            <Input id="provider-model" name="defaultModel" required dir="ltr" />
          </Field>
          <Field label={ar ? "مفتاح API (لاستبداله فقط)" : "API key (only to replace)"} htmlFor="provider-api-key">
            <Input id="provider-api-key" name="apiKey" type="password" autoComplete="new-password" dir="ltr" />
          </Field>
          <div className="flex items-end gap-5 pb-3 text-sm">
            <label className="flex items-center gap-2"><input type="checkbox" name="enabled" /> {ar ? "مفعل" : "Enabled"}</label>
            <label className="flex items-center gap-2"><input type="checkbox" name="isFallback" /> {ar ? "احتياطي" : "Fallback"}</label>
          </div>
          <Button type="submit" variant="accent" disabled={loading === "provider"}>
            {loading === "provider" ? <LoaderCircle className="size-4 animate-spin" /> : null}
            {ar ? "حفظ المزود" : "Save provider"}
          </Button>
        </form>
      </section>

      <section className="premium-card overflow-hidden">
        <div className="flex items-center gap-3 border-b p-5">
          <Bot className="size-5 text-intelligence" />
          <h2 className="font-bold">{ar ? "تكلفة وتوفر الموظفين" : "Employee availability and cost"}</h2>
        </div>
        <div className="divide-y">
          {employees.map((employee) => (
            <div key={employee.id} className="flex flex-wrap items-center gap-4 p-5">
              <div className="min-w-48 flex-1">
                <h3 className="text-sm font-semibold">{ar ? employee.nameAr : employee.nameEn}</h3>
                <p className="mt-1 text-xs text-muted">{employee.slug}</p>
              </div>
              <Input
                key={`${employee.id}-${employee.defaultCreditCost}`}
                className="w-24"
                type="number"
                min={1}
                max={1_000}
                defaultValue={employee.defaultCreditCost}
                aria-label={ar ? "تكلفة الرصيد" : "Credit cost"}
                onBlur={(event) => {
                  const value = Number(event.target.value);
                  if (value !== employee.defaultCreditCost) {
                    updateEmployee(employee, { defaultCreditCost: value });
                  }
                }}
              />
              <Button
                type="button"
                variant={employee.active ? "outline" : "accent"}
                size="sm"
                disabled={loading === employee.id}
                onClick={() => updateEmployee(employee, { active: !employee.active })}
              >
                {employee.active ? (ar ? "تعطيل" : "Disable") : ar ? "تفعيل" : "Enable"}
              </Button>
            </div>
          ))}
        </div>
      </section>

      {message ? <p className="rounded-xl border bg-white p-4 text-sm">{message}</p> : null}
    </div>
  );
}
