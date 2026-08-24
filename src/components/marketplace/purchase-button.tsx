"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LoaderCircle, LockKeyhole } from "lucide-react";
import { Button } from "@/components/ui/button";

export function PurchaseButton({
  productId,
  locale,
}: {
  productId: string;
  locale: "ar" | "en";
}) {
  const [state, setState] = useState<"idle" | "loading" | "error">("idle");
  const [error, setError] = useState<string>();
  const router = useRouter();
  const ar = locale === "ar";

  async function checkout() {
    setState("loading");
    setError(undefined);

    try {
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Idempotency-Key": crypto.randomUUID(),
        },
        body: JSON.stringify({ items: [{ productId }], locale }),
      });
      const payload = (await response.json()) as {
        checkoutUrl?: string;
        error?: { code?: string };
      };

      if (response.status === 401) {
        router.push(`/${locale}/login?next=/${locale}/marketplace`);
        return;
      }
      if (!response.ok || !payload.checkoutUrl) {
        throw new Error(payload.error?.code ?? "CHECKOUT_FAILED");
      }

      window.location.assign(payload.checkoutUrl);
    } catch (cause) {
      const code = cause instanceof Error ? cause.message : "CHECKOUT_FAILED";
      setError(
        code === "PAYMENTS_NOT_CONFIGURED"
          ? ar
            ? "الدفع غير متاح حتى يضبط المسؤول بوابة دفع حقيقية."
            : "Checkout is unavailable until an administrator configures a payment gateway."
          : ar
            ? "تعذر بدء الدفع. حاول مرة أخرى."
            : "Checkout could not be started. Please try again.",
      );
      setState("error");
    }
  }

  return (
    <div>
      <Button
        type="button"
        variant="accent"
        size="lg"
        className="w-full"
        onClick={checkout}
        disabled={state === "loading"}
      >
        {state === "loading" ? (
          <LoaderCircle className="size-4 animate-spin" />
        ) : (
          <LockKeyhole className="size-4" />
        )}
        {ar ? "شراء والوصول الآمن" : "Buy with secure access"}
      </Button>
      {error ? (
        <p className="mt-3 text-sm leading-6 text-danger" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
