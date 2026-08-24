"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CheckCircle2, Eye, EyeOff, LoaderCircle, LockKeyhole } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";

type AuthFormProps = {
  locale: "ar" | "en";
  mode: "login" | "register";
  nextPath?: string;
  verified?: string;
};

export function AuthForm({ locale, mode, nextPath, verified }: AuthFormProps) {
  const ar = locale === "ar";
  const register = mode === "register";
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [registered, setRegistered] = useState<{
    emailDelivered: boolean;
    developmentVerificationUrl?: string;
  }>();

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");
    const form = new FormData(event.currentTarget);
    const payload = {
      name: form.get("name"),
      email: form.get("email"),
      password: form.get("password"),
      locale,
    };

    try {
      const response = await fetch(`/api/auth/${register ? "register" : "login"}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = (await response.json()) as {
        emailDelivered?: boolean;
        developmentVerificationUrl?: string;
        mfaRequired?: boolean;
        error?: { code?: string; fields?: unknown };
      };
      if (!response.ok) throw new Error(data.error?.code ?? "REQUEST_FAILED");

      if (register) {
        setRegistered({
          emailDelivered: Boolean(data.emailDelivered),
          developmentVerificationUrl: data.developmentVerificationUrl,
        });
      } else {
        router.push(
          data.mfaRequired
            ? `/${locale}/mfa?next=${encodeURIComponent(nextPath || `/${locale}/dashboard`)}`
            : nextPath || `/${locale}/dashboard`,
        );
        router.refresh();
      }
    } catch (cause) {
      const code = cause instanceof Error ? cause.message : "REQUEST_FAILED";
      const messages: Record<string, [string, string]> = {
        INVALID_CREDENTIALS: ["البريد أو كلمة المرور غير صحيحة.", "Email or password is incorrect."],
        EMAIL_VERIFICATION_REQUIRED: ["فعّل بريدك قبل تسجيل الدخول.", "Verify your email before signing in."],
        EMAIL_UNAVAILABLE: ["تعذر استخدام هذا البريد.", "This email cannot be used."],
        RATE_LIMITED: ["محاولات كثيرة. انتظر قليلاً ثم أعد المحاولة.", "Too many attempts. Wait before trying again."],
        VALIDATION_ERROR: ["راجع الحقول وكلمة المرور.", "Review the fields and password requirements."],
      };
      setError(messages[code]?.[ar ? 0 : 1] ?? (ar ? "تعذر إكمال الطلب." : "The request could not be completed."));
    } finally {
      setLoading(false);
    }
  }

  if (registered) {
    return (
      <div className="premium-card p-7 text-center sm:p-9">
        <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-[#e8f3ed] text-success">
          <CheckCircle2 className="size-7" />
        </span>
        <h1 className="mt-5 text-2xl font-bold">
          {ar ? "تحقق من بريدك الإلكتروني" : "Check your email"}
        </h1>
        <p className="mt-3 text-sm leading-7 text-muted">
          {registered.emailDelivered
            ? ar
              ? "أرسلنا رابط تفعيل صالحاً لمدة ساعة. افتحه لإكمال إنشاء الحساب."
              : "We sent a verification link valid for one hour. Open it to finish setup."
            : ar
              ? "تم إنشاء الحساب، لكن البريد غير مهيأ للإرسال حالياً. اطلب من المسؤول ضبط SMTP."
              : "Your account was created, but email delivery is not configured. Ask an administrator to configure SMTP."}
        </p>
        {registered.developmentVerificationUrl ? (
          <a
            className="mt-4 block break-all rounded-xl border bg-surface-soft p-3 text-xs text-intelligence"
            href={registered.developmentVerificationUrl}
          >
            Development verification link
          </a>
        ) : null}
        <Button asChild variant="outline" className="mt-6 w-full">
          <Link href={`/${locale}/login`}>{ar ? "العودة لتسجيل الدخول" : "Back to sign in"}</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="premium-card p-6 sm:p-8">
      <div className="text-center">
        <span className="mx-auto grid size-12 place-items-center rounded-2xl bg-foreground text-white">
          <LockKeyhole className="size-5" />
        </span>
        <h1 className="mt-5 text-2xl font-bold">
          {register
            ? ar
              ? "أنشئ مساحة عملك"
              : "Create your workspace"
            : ar
              ? "مرحباً بعودتك"
              : "Welcome back"}
        </h1>
        <p className="mt-2 text-sm text-muted">
          {register
            ? ar
              ? "ابدأ مجاناً، وطوّر خطتك عندما تحتاج."
              : "Start free and upgrade when you need to."
            : ar
              ? "ادخل إلى خزنتك ومشاريعك."
              : "Access your Vault and projects."}
        </p>
      </div>

      {verified === "true" ? (
        <p className="mt-5 rounded-xl bg-[#e8f3ed] p-3 text-sm text-success">
          {ar ? "تم تفعيل البريد. يمكنك الدخول الآن." : "Email verified. You can sign in now."}
        </p>
      ) : null}

      <form onSubmit={submit} className="mt-7 grid gap-5">
        {register ? (
          <Field label={ar ? "الاسم" : "Name"} htmlFor="name">
            <Input id="name" name="name" autoComplete="name" required minLength={2} />
          </Field>
        ) : null}
        <Field label={ar ? "البريد الإلكتروني" : "Email"} htmlFor="email">
          <Input id="email" name="email" type="email" autoComplete="email" required inputMode="email" dir="ltr" />
        </Field>
        <Field
          label={ar ? "كلمة المرور" : "Password"}
          htmlFor="password"
          hint={
            register
              ? ar
                ? "12 حرفاً، تتضمن رقماً"
                : "12+ characters, including a number"
              : undefined
          }
        >
          <div className="relative">
            <Input
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              autoComplete={register ? "new-password" : "current-password"}
              required
              minLength={register ? 12 : 1}
              maxLength={128}
              dir="ltr"
              className="pe-12"
            />
            <button
              type="button"
              onClick={() => setShowPassword((value) => !value)}
              className="absolute end-1 top-1 grid size-10 place-items-center rounded-lg text-muted hover:bg-surface-soft"
              aria-label={showPassword ? (ar ? "إخفاء كلمة المرور" : "Hide password") : ar ? "إظهار كلمة المرور" : "Show password"}
            >
              {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </button>
          </div>
        </Field>

        {!register ? (
          <Link href={`/${locale}/forgot-password`} className="text-end text-xs font-semibold text-intelligence">
            {ar ? "نسيت كلمة المرور؟" : "Forgot password?"}
          </Link>
        ) : null}

        {error ? (
          <p className="text-sm text-danger" role="alert">
            {error}
          </p>
        ) : null}

        <Button type="submit" variant="accent" size="lg" disabled={loading}>
          {loading ? <LoaderCircle className="size-4 animate-spin" /> : null}
          {register ? (ar ? "إنشاء الحساب" : "Create account") : ar ? "تسجيل الدخول" : "Sign in"}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-muted">
        {register ? (ar ? "لديك حساب؟" : "Already have an account?") : ar ? "ليس لديك حساب؟" : "New to EVELIA?"}{" "}
        <Link href={`/${locale}/${register ? "login" : "register"}`} className="font-semibold text-foreground underline-offset-4 hover:underline">
          {register ? (ar ? "سجّل الدخول" : "Sign in") : ar ? "ابدأ مجاناً" : "Start free"}
        </Link>
      </p>
    </div>
  );
}
