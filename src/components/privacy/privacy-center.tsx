"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Bell, Database, LoaderCircle, ShieldCheck, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";

type Preferences = {
  purchasesEmail: boolean;
  promptUpdatesEmail: boolean;
  creditsEmail: boolean;
  subscriptionsEmail: boolean;
  securityEmail: boolean;
  taskCompletedEmail: boolean;
  reportsEmail: boolean;
  recommendationsEmail: boolean;
  marketingEmail: boolean;
  inAppEnabled: boolean;
};

export function PrivacyCenter({
  locale,
  organizationId,
  initialPreferences,
}: {
  locale: "ar" | "en";
  organizationId: string;
  initialPreferences: Preferences;
}) {
  const ar = locale === "ar";
  const [preferences, setPreferences] = useState(initialPreferences);
  const [loading, setLoading] = useState("");
  const [message, setMessage] = useState("");
  const router = useRouter();

  async function savePreferences() {
    setLoading("preferences");
    const response = await fetch("/api/notifications/preferences", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...preferences, securityEmail: true }),
    });
    setLoading("");
    setMessage(
      response.ok
        ? ar
          ? "تم حفظ التفضيلات."
          : "Preferences saved."
        : ar
          ? "تعذر الحفظ."
          : "Could not save.",
    );
  }

  async function deleteHistory(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setLoading("history");
    const response = await fetch("/api/privacy/task-history", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        organizationId,
        confirmation: form.get("confirmation"),
      }),
    });
    const payload = (await response.json()) as { deleted?: number };
    setLoading("");
    setMessage(
      response.ok
        ? ar
          ? `حُذفت ${payload.deleted ?? 0} مهمة من سجلك.`
          : `${payload.deleted ?? 0} tasks were deleted from your history.`
        : ar
          ? "اكتب DELETE للتأكيد."
          : "Enter DELETE to confirm.",
    );
    if (response.ok) router.refresh();
  }

  async function deleteAccount(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setLoading("account");
    const response = await fetch("/api/privacy/account", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        password: form.get("password"),
        confirmation: form.get("confirmation"),
      }),
    });
    const payload = (await response.json()) as { error?: { code?: string } };
    setLoading("");
    if (response.ok) {
      router.push(`/${locale}`);
      router.refresh();
      return;
    }
    setMessage(
      payload.error?.code === "TRANSFER_ORGANIZATION_BEFORE_DELETION"
        ? ar
          ? "انقل ملكية الشركة أو أزل الأعضاء قبل حذف الحساب."
          : "Transfer company ownership or remove members before deleting the account."
        : ar
          ? "تعذر حذف الحساب. راجع كلمة المرور وعبارة التأكيد."
          : "Account deletion failed. Check the password and confirmation phrase.",
    );
  }

  const preferenceItems: Array<[keyof Preferences, string]> = [
    ["taskCompletedEmail", ar ? "اكتمال المهام" : "Task completion"],
    ["reportsEmail", ar ? "التقارير" : "Reports"],
    ["recommendationsEmail", ar ? "التوصيات" : "Recommendations"],
    ["subscriptionsEmail", ar ? "الاشتراك والدفع" : "Subscription and billing"],
    ["creditsEmail", ar ? "تنبيهات الرصيد" : "Credit warnings"],
    ["marketingEmail", ar ? "أخبار المنتج" : "Product news"],
    ["inAppEnabled", ar ? "الإشعارات داخل التطبيق" : "In-app notifications"],
  ];

  return (
    <div className="grid gap-6">
      <section className="premium-card p-6 sm:p-8">
        <div className="flex items-center gap-3">
          <Bell className="size-5 text-intelligence" />
          <div>
            <h2 className="font-bold">{ar ? "تفضيلات الإشعارات" : "Notification preferences"}</h2>
            <p className="text-xs text-muted">{ar ? "تنبيهات الأمان تبقى مفعلة دائماً." : "Security alerts always remain enabled."}</p>
          </div>
        </div>
        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          {preferenceItems.map(([key, label]) => (
            <label key={key} className="flex min-h-12 items-center justify-between gap-4 rounded-xl border p-3 text-sm">
              <span>{label}</span>
              <input
                type="checkbox"
                checked={preferences[key]}
                onChange={(event) =>
                  setPreferences((current) => ({
                    ...current,
                    [key]: event.target.checked,
                  }))
                }
                className="size-4 accent-intelligence"
              />
            </label>
          ))}
        </div>
        <Button type="button" className="mt-5" onClick={savePreferences} disabled={loading === "preferences"}>
          {loading === "preferences" ? <LoaderCircle className="size-4 animate-spin" /> : null}
          {ar ? "حفظ التفضيلات" : "Save preferences"}
        </Button>
      </section>

      <section className="premium-card p-6 sm:p-8">
        <div className="flex items-center gap-3">
          <Database className="size-5 text-intelligence" />
          <div>
            <h2 className="font-bold">{ar ? "سجل استخدام AI" : "AI usage history"}</h2>
            <p className="text-xs text-muted">
              {ar ? "يحذف مهامك ونتائجها، مع إبقاء السجلات المالية والتجميعية اللازمة." : "Deletes your tasks and outputs while retaining required financial and aggregate records."}
            </p>
          </div>
        </div>
        <form onSubmit={deleteHistory} className="mt-5 flex flex-col gap-3 sm:flex-row">
          <Input name="confirmation" placeholder="DELETE" required dir="ltr" />
          <Button type="submit" variant="outline" disabled={loading === "history"}>
            {loading === "history" ? <LoaderCircle className="size-4 animate-spin" /> : <Trash2 className="size-4" />}
            {ar ? "حذف سجل مهامي" : "Delete my task history"}
          </Button>
        </form>
      </section>

      <section className="rounded-2xl border border-danger/25 bg-red-50/40 p-6 sm:p-8">
        <div className="flex items-center gap-3">
          <ShieldCheck className="size-5 text-danger" />
          <div>
            <h2 className="font-bold">{ar ? "حذف الحساب" : "Delete account"}</h2>
            <p className="text-xs leading-6 text-muted">
              {ar
                ? "يلغي الاشتراكات النشطة ويزيل بيانات العمل القابلة للحذف. تُحفظ سجلات مالية وقانونية بعد إخفاء الهوية عند الحاجة."
                : "Cancels active subscriptions and removes deletable business data. Required financial and legal records remain pseudonymized."}
            </p>
          </div>
        </div>
        <form onSubmit={deleteAccount} className="mt-5 grid max-w-md gap-4">
          <Field label={ar ? "كلمة المرور" : "Password"} htmlFor="delete-password">
            <Input id="delete-password" name="password" type="password" required autoComplete="current-password" />
          </Field>
          <Field label={ar ? "اكتب DELETE MY ACCOUNT" : "Enter DELETE MY ACCOUNT"} htmlFor="delete-confirmation">
            <Input id="delete-confirmation" name="confirmation" required dir="ltr" />
          </Field>
          <Button type="submit" variant="danger" disabled={loading === "account"}>
            {loading === "account" ? <LoaderCircle className="size-4 animate-spin" /> : <Trash2 className="size-4" />}
            {ar ? "حذف حسابي نهائياً" : "Permanently delete my account"}
          </Button>
        </form>
      </section>

      {message ? (
        <p className="rounded-xl border bg-white p-4 text-sm" role="status">
          {message}
        </p>
      ) : null}
    </div>
  );
}
