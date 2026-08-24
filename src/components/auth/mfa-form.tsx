"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Copy, LoaderCircle, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";

export function MfaForm({
  locale,
  setup,
  nextPath,
}: {
  locale: "ar" | "en";
  setup?: boolean;
  nextPath?: string;
}) {
  const ar = locale === "ar";
  const [secret, setSecret] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  async function beginSetup() {
    setLoading(true);
    const response = await fetch("/api/auth/mfa/setup", { method: "POST" });
    const payload = (await response.json()) as { secret?: string };
    setLoading(false);
    if (!response.ok || !payload.secret) {
      setError(ar ? "تعذر بدء الإعداد." : "Setup could not be started.");
      return;
    }
    setSecret(payload.secret);
  }

  async function verify(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");
    const form = new FormData(event.currentTarget);
    const response = await fetch("/api/auth/mfa/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token: form.get("token") }),
    });
    setLoading(false);
    if (!response.ok) {
      setError(ar ? "الرمز غير صالح أو انتهت الجلسة." : "The code is invalid or the session expired.");
      return;
    }
    router.push(nextPath || `/${locale}/dashboard`);
    router.refresh();
  }

  if (setup && !secret) {
    return (
      <div className="premium-card p-8 text-center">
        <ShieldCheck className="mx-auto size-12 text-intelligence" />
        <h1 className="mt-5 text-2xl font-bold">
          {ar ? "فعّل المصادقة متعددة العوامل" : "Enable multifactor authentication"}
        </h1>
        <p className="mt-3 text-sm leading-7 text-muted">
          {ar
            ? "مطلوبة لحسابات الإدارة. استخدم تطبيقاً متوافقاً مع TOTP."
            : "Required for administrative accounts. Use any TOTP-compatible authenticator."}
        </p>
        <Button type="button" variant="accent" className="mt-6 w-full" onClick={beginSetup} disabled={loading}>
          {loading ? <LoaderCircle className="size-4 animate-spin" /> : null}
          {ar ? "إنشاء مفتاح آمن" : "Create secure key"}
        </Button>
        {error ? <p className="mt-3 text-sm text-danger">{error}</p> : null}
      </div>
    );
  }

  return (
    <div className="premium-card p-7 sm:p-8">
      <ShieldCheck className="size-10 text-intelligence" />
      <h1 className="mt-5 text-2xl font-bold">
        {setup ? (ar ? "أضف المفتاح إلى تطبيقك" : "Add the key to your app") : ar ? "تحقق من هويتك" : "Verify your identity"}
      </h1>
      {secret ? (
        <div className="mt-5 rounded-xl border bg-surface-soft p-4">
          <p className="text-xs text-muted">{ar ? "المفتاح اليدوي" : "Manual setup key"}</p>
          <div className="mt-2 flex items-center gap-2">
            <code className="min-w-0 flex-1 break-all text-sm" dir="ltr">{secret}</code>
            <button type="button" onClick={() => navigator.clipboard.writeText(secret)} aria-label={ar ? "نسخ" : "Copy"}>
              <Copy className="size-4" />
            </button>
          </div>
        </div>
      ) : (
        <p className="mt-3 text-sm leading-7 text-muted">
          {ar ? "أدخل الرمز المكون من ستة أرقام من تطبيق المصادقة." : "Enter the six-digit code from your authenticator app."}
        </p>
      )}
      <form onSubmit={verify} className="mt-6 grid gap-5">
        <Field label={ar ? "رمز المصادقة" : "Authentication code"} htmlFor="mfa-token">
          <Input
            id="mfa-token"
            name="token"
            inputMode="numeric"
            pattern="[0-9]{6}"
            minLength={6}
            maxLength={6}
            autoComplete="one-time-code"
            required
            dir="ltr"
            className="text-center text-xl tracking-[0.4em]"
          />
        </Field>
        {error ? <p className="text-sm text-danger">{error}</p> : null}
        <Button type="submit" variant="accent" size="lg" disabled={loading}>
          {loading ? <LoaderCircle className="size-4 animate-spin" /> : <CheckCircle2 className="size-4" />}
          {ar ? "تحقق" : "Verify"}
        </Button>
      </form>
    </div>
  );
}
