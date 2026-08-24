"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CreditCard, LoaderCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export function SubscribeButton({
  locale,
  planId,
  organizationId,
  free,
  paymentsAvailable,
  featured,
}: {
  locale: "ar" | "en";
  planId: string;
  organizationId?: string;
  free: boolean;
  paymentsAvailable: boolean;
  featured?: boolean;
}) {
  const ar = locale === "ar";
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  async function subscribe() {
    if (!organizationId) {
      router.push(`/${locale}/register`);
      return;
    }
    if (free) {
      router.push(`/${locale}/dashboard`);
      return;
    }
    setLoading(true);
    setError("");
    const response = await fetch("/api/billing/subscriptions/checkout", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Idempotency-Key": crypto.randomUUID(),
      },
      body: JSON.stringify({
        organizationId,
        planId,
        interval: "MONTHLY",
        locale,
      }),
    });
    const payload = (await response.json()) as {
      checkoutUrl?: string;
      error?: { code?: string };
    };
    setLoading(false);
    if (!response.ok || !payload.checkoutUrl) {
      setError(
        payload.error?.code === "PAYMENTS_NOT_CONFIGURED"
          ? ar
            ? "الدفع غير متاح حتى يهيئ المسؤول مزوداً حقيقياً."
            : "Billing stays unavailable until a real payment provider is configured."
          : ar
            ? "تعذر بدء الاشتراك."
            : "Subscription checkout could not be started.",
      );
      return;
    }
    window.location.assign(payload.checkoutUrl);
  }

  if (!free && !paymentsAvailable) {
    return (
      <div className={`rounded-xl border px-4 py-3 text-center text-sm ${featured ? "border-white/15 text-white/60" : "text-muted"}`}>
        {ar ? "الدفع غير مهيأ" : "Billing not configured"}
      </div>
    );
  }

  return (
    <div>
      <Button
        type="button"
        variant={featured ? "accent" : "outline"}
        className="w-full"
        onClick={subscribe}
        disabled={loading}
      >
        {loading ? <LoaderCircle className="size-4 animate-spin" /> : <CreditCard className="size-4" />}
        {free ? (ar ? "ابدأ مجاناً" : "Start free") : ar ? "اشترك" : "Subscribe"}
      </Button>
      {error ? <p className="mt-2 text-xs leading-5 text-danger">{error}</p> : null}
    </div>
  );
}
