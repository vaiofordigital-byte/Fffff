"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { LoaderCircle, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export function BillingManager({
  locale,
  organizationId,
  canCancel,
  cancelAtPeriodEnd,
}: {
  locale: "ar" | "en";
  organizationId: string;
  canCancel: boolean;
  cancelAtPeriodEnd: boolean;
}) {
  const ar = locale === "ar";
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  async function cancel() {
    setLoading(true);
    setError("");
    const response = await fetch("/api/billing/subscriptions/cancel", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Idempotency-Key": crypto.randomUUID(),
      },
      body: JSON.stringify({ organizationId }),
    });
    setLoading(false);
    if (!response.ok) {
      setError(
        ar
          ? "تعذر جدولة الإلغاء. تأكد من تهيئة مزود الدفع."
          : "Cancellation could not be scheduled. Confirm payment-provider configuration.",
      );
      return;
    }
    router.refresh();
  }

  return (
    <div className="flex flex-wrap gap-3">
      <Button asChild variant="accent">
        <Link href={`/${locale}/pricing`}>
          {ar ? "ترقية أو تغيير الخطة" : "Upgrade or change plan"}
        </Link>
      </Button>
      {canCancel && !cancelAtPeriodEnd ? (
        <Button type="button" variant="outline" onClick={cancel} disabled={loading}>
          {loading ? <LoaderCircle className="size-4 animate-spin" /> : <XCircle className="size-4" />}
          {ar ? "إلغاء عند نهاية الفترة" : "Cancel at period end"}
        </Button>
      ) : null}
      {error ? <p className="w-full text-sm text-danger">{error}</p> : null}
    </div>
  );
}
