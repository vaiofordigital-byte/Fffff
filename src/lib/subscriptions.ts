import { db } from "@/lib/db";
import { publicEnv } from "@/lib/env";
import { AppError } from "@/lib/http";
import { requireOrganizationMembership } from "@/lib/organizations";
import { paymentAdapter } from "@/lib/payments/adapter";

export async function createSubscriptionCheckout(input: {
  userId: string;
  email: string;
  organizationId: string;
  planId: string;
  interval: "MONTHLY" | "YEARLY";
  locale: "ar" | "en";
  idempotencyKey: string;
}) {
  await requireOrganizationMembership(input.userId, input.organizationId, "OWNER");
  const adapter = paymentAdapter();
  if (!adapter.available) throw new AppError("PAYMENTS_NOT_CONFIGURED", 503);

  const existing = await db.subscriptionCheckout.findUnique({
    where: { idempotencyKey: input.idempotencyKey },
  });
  if (existing) {
    if (existing.userId !== input.userId) throw new AppError("IDEMPOTENCY_CONFLICT", 409);
    if (existing.checkoutUrl) {
      return { id: existing.id, checkoutUrl: existing.checkoutUrl, replayed: true };
    }
    throw new AppError("SUBSCRIPTION_CHECKOUT_ALREADY_STARTED", 409);
  }

  const plan = await db.plan.findFirst({
    where: { id: input.planId, active: true },
  });
  if (!plan) throw new AppError("PLAN_NOT_FOUND", 404);
  const amount = Number(
    input.interval === "MONTHLY" ? plan.monthlyPrice : plan.yearlyPrice,
  );
  if (amount <= 0) throw new AppError("FREE_PLAN_REQUIRES_NO_CHECKOUT", 422);

  const checkout = await db.subscriptionCheckout.create({
    data: {
      userId: input.userId,
      organizationId: input.organizationId,
      planId: plan.id,
      interval: input.interval,
      provider: adapter.key,
      idempotencyKey: input.idempotencyKey,
      amount,
      currency: plan.currency,
    },
  });

  try {
    const session = await adapter.createCheckoutSession({
      orderId: checkout.id,
      orderNumber: `SUB-${checkout.id}`,
      amount,
      currency: plan.currency,
      customerEmail: input.email,
      successUrl: `${publicEnv.appUrl}/${input.locale}/billing/success?subscription=${checkout.id}`,
      cancelUrl: `${publicEnv.appUrl}/${input.locale}/pricing`,
      idempotencyKey: input.idempotencyKey,
      mode: "subscription",
      billingInterval: input.interval,
      metadata: {
        subscriptionCheckoutId: checkout.id,
        organizationId: input.organizationId,
        planId: plan.id,
      },
    });
    await db.subscriptionCheckout.update({
      where: { id: checkout.id },
      data: {
        providerCheckoutId: session.providerPaymentId,
        providerSubscriptionId: session.providerSubscriptionId,
        checkoutUrl: session.checkoutUrl,
      },
    });
    return { id: checkout.id, checkoutUrl: session.checkoutUrl, replayed: false };
  } catch (error) {
    await db.subscriptionCheckout.update({
      where: { id: checkout.id },
      data: { status: "FAILED" },
    });
    throw error;
  }
}

export async function cancelOrganizationSubscription(input: {
  userId: string;
  organizationId: string;
  idempotencyKey: string;
}) {
  await requireOrganizationMembership(input.userId, input.organizationId, "OWNER");
  const subscription = await db.subscription.findFirst({
    where: {
      organizationId: input.organizationId,
      status: { in: ["ACTIVE", "TRIALING", "PAST_DUE"] },
    },
  });
  if (!subscription) throw new AppError("ACTIVE_SUBSCRIPTION_NOT_FOUND", 404);
  if (!subscription.providerSubscriptionId) {
    throw new AppError("SUBSCRIPTION_PROVIDER_REFERENCE_MISSING", 409);
  }
  const adapter = paymentAdapter();
  await adapter.cancelSubscription(
    subscription.providerSubscriptionId,
    input.idempotencyKey,
  );
  await db.subscription.update({
    where: { id: subscription.id },
    data: { cancelAtPeriodEnd: true },
  });
  return { cancelAtPeriodEnd: true, currentPeriodEnd: subscription.currentPeriodEnd };
}
