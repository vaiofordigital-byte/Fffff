"use client";

import { useState } from "react";
import Link from "next/link";
import { CheckCircle2, LoaderCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";

export function RecoveryForm({
  locale,
  token,
}: {
  locale: "ar" | "en";
  token?: string;
}) {
  const ar = locale === "ar";
  const reset = Boolean(token);
  const [state, setState] = useState<"idle" | "loading" | "done" | "error">("idle");

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setState("loading");
    const form = new FormData(event.currentTarget);
    const response = await fetch(
      `/api/auth/${reset ? "reset-password" : "forgot-password"}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          reset
            ? { token, password: form.get("password") }
            : { email: form.get("email"), locale },
        ),
      },
    );
    setState(response.ok ? "done" : "error");
  }

  if (state === "done") {
    return (
      <div className="premium-card p-8 text-center">
        <CheckCircle2 className="mx-auto size-12 text-success" />
        <h1 className="mt-5 text-2xl font-bold">
          {reset
            ? ar
              ? "تم تحديث كلمة المرور"
              : "Password updated"
            : ar
              ? "تحقق من بريدك"
              : "Check your email"}
        </h1>
        <p className="mt-3 text-sm leading-7 text-muted">
          {reset
            ? ar
              ? "أُغلقت جلساتك السابقة. استخدم كلمة المرور الجديدة للدخول."
              : "Previous sessions were closed. Sign in with your new password."
            : ar
              ? "إذا كان الحساب موجوداً، أرسلنا رابطاً صالحاً لمدة 30 دقيقة."
              : "If the account exists, we sent a link valid for 30 minutes."}
        </p>
        <Button asChild className="mt-6 w-full">
          <Link href={`/${locale}/login`}>{ar ? "تسجيل الدخول" : "Sign in"}</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="premium-card p-7 sm:p-8">
      <h1 className="text-2xl font-bold">
        {reset
          ? ar
            ? "اختر كلمة مرور جديدة"
            : "Choose a new password"
          : ar
            ? "استعادة الحساب"
            : "Recover your account"}
      </h1>
      <p className="mt-2 text-sm leading-7 text-muted">
        {reset
          ? ar
            ? "استخدم 12 حرفاً على الأقل، تتضمن رقماً."
            : "Use at least 12 characters, including a number."
          : ar
            ? "سنرسل رابطاً آمناً إذا كان البريد مرتبطاً بحساب."
            : "We will send a secure link if the email belongs to an account."}
      </p>
      <form onSubmit={submit} className="mt-6 grid gap-5">
        {reset ? (
          <Field label={ar ? "كلمة المرور الجديدة" : "New password"} htmlFor="password">
            <Input id="password" name="password" type="password" autoComplete="new-password" minLength={12} maxLength={128} required dir="ltr" />
          </Field>
        ) : (
          <Field label={ar ? "البريد الإلكتروني" : "Email"} htmlFor="email">
            <Input id="email" name="email" type="email" autoComplete="email" required dir="ltr" />
          </Field>
        )}
        {state === "error" ? (
          <p className="text-sm text-danger" role="alert">
            {ar ? "الرابط غير صالح أو البيانات غير مكتملة." : "The link is invalid or the data is incomplete."}
          </p>
        ) : null}
        <Button type="submit" variant="accent" size="lg" disabled={state === "loading"}>
          {state === "loading" ? <LoaderCircle className="size-4 animate-spin" /> : null}
          {reset ? (ar ? "تحديث كلمة المرور" : "Update password") : ar ? "إرسال الرابط" : "Send recovery link"}
        </Button>
      </form>
    </div>
  );
}
