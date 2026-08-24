import { createHmac } from "node:crypto";
import { env } from "@/lib/env";
import { AppError } from "@/lib/http";
import { secureEqual } from "@/lib/security";

export type CheckoutSessionRequest = {
  orderId: string;
  orderNumber: string;
  amount: number;
  currency: string;
  customerEmail: string;
  successUrl: string;
  cancelUrl: string;
  idempotencyKey: string;
};

export type CheckoutSession = {
  providerPaymentId: string;
  checkoutUrl: string;
};

export type VerifiedPaymentEvent = {
  id: string;
  type: "payment.paid" | "payment.failed" | "payment.refunded";
  providerPaymentId: string;
  amount?: number;
  currency?: string;
};

export interface PaymentAdapter {
  readonly key: string;
  readonly available: boolean;
  createCheckoutSession(request: CheckoutSessionRequest): Promise<CheckoutSession>;
  verifyWebhook(rawBody: string, signature: string): Promise<VerifiedPaymentEvent>;
}

class DisabledPaymentAdapter implements PaymentAdapter {
  readonly key = "none";
  readonly available = false;

  async createCheckoutSession(): Promise<CheckoutSession> {
    throw new AppError("PAYMENTS_NOT_CONFIGURED", 503);
  }

  async verifyWebhook(): Promise<VerifiedPaymentEvent> {
    throw new AppError("PAYMENTS_NOT_CONFIGURED", 503);
  }
}

class HostedPaymentAdapter implements PaymentAdapter {
  readonly available = true;
  readonly key: string;
  private readonly baseUrl: string;
  private readonly apiKey: string;
  private readonly webhookSecret: string;

  constructor() {
    const config = env();
    if (
      !config.PAYMENT_API_BASE_URL ||
      !config.PAYMENT_API_KEY ||
      !config.PAYMENT_WEBHOOK_SECRET
    ) {
      throw new AppError("PAYMENTS_NOT_CONFIGURED", 503);
    }
    this.key = config.PAYMENT_PROVIDER;
    this.baseUrl = config.PAYMENT_API_BASE_URL;
    this.apiKey = config.PAYMENT_API_KEY;
    this.webhookSecret = config.PAYMENT_WEBHOOK_SECRET;
  }

  async createCheckoutSession(
    request: CheckoutSessionRequest,
  ): Promise<CheckoutSession> {
    const response = await fetch(
      `${this.baseUrl.replace(/\/$/, "")}/checkout-sessions`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          "Content-Type": "application/json",
          "Idempotency-Key": request.idempotencyKey,
        },
        body: JSON.stringify(request),
        signal: AbortSignal.timeout(20_000),
      },
    );

    if (!response.ok) throw new AppError("PAYMENT_PROVIDER_ERROR", 502);
    const payload = (await response.json()) as {
      id?: string;
      checkoutUrl?: string;
    };
    if (!payload.id || !payload.checkoutUrl) {
      throw new AppError("INVALID_PAYMENT_PROVIDER_RESPONSE", 502);
    }
    return {
      providerPaymentId: payload.id,
      checkoutUrl: payload.checkoutUrl,
    };
  }

  async verifyWebhook(
    rawBody: string,
    signature: string,
  ): Promise<VerifiedPaymentEvent> {
    const expected = createHmac("sha256", this.webhookSecret)
      .update(rawBody)
      .digest("hex");
    if (!secureEqual(expected, signature)) {
      throw new AppError("INVALID_WEBHOOK_SIGNATURE", 401);
    }

    const payload = JSON.parse(rawBody) as Partial<VerifiedPaymentEvent>;
    if (
      !payload.id ||
      !payload.providerPaymentId ||
      !["payment.paid", "payment.failed", "payment.refunded"].includes(
        payload.type ?? "",
      )
    ) {
      throw new AppError("INVALID_WEBHOOK_PAYLOAD", 422);
    }
    return payload as VerifiedPaymentEvent;
  }
}

export function paymentAdapter(): PaymentAdapter {
  return env().PAYMENT_PROVIDER === "none"
    ? new DisabledPaymentAdapter()
    : new HostedPaymentAdapter();
}
