import { randomBytes } from "node:crypto";
import { db } from "@/lib/db";
import { publicEnv } from "@/lib/env";
import { AppError } from "@/lib/http";
import { sha256 } from "@/lib/security";
import { paymentAdapter, type VerifiedPaymentEvent } from "@/lib/payments/adapter";

type CheckoutItem = {
  productId: string;
  quantity?: number;
};

export async function createCheckout(input: {
  userId: string;
  email: string;
  locale: "ar" | "en";
  items: CheckoutItem[];
  idempotencyKey: string;
}) {
  const adapter = paymentAdapter();
  if (!adapter.available) throw new AppError("PAYMENTS_NOT_CONFIGURED", 503);

  const existing = await db.order.findUnique({
    where: { idempotencyKey: input.idempotencyKey },
    include: { payments: true },
  });
  if (existing) {
    if (existing.userId !== input.userId) throw new AppError("IDEMPOTENCY_CONFLICT", 409);
    const metadata = existing.payments[0]?.metadata as { checkoutUrl?: string } | null;
    if (metadata?.checkoutUrl) {
      return { orderId: existing.id, checkoutUrl: metadata.checkoutUrl, replayed: true };
    }
    throw new AppError("CHECKOUT_ALREADY_STARTED", 409);
  }

  const requested = new Map<string, number>();
  for (const item of input.items) {
    const quantity = Math.max(1, Math.min(item.quantity ?? 1, 10));
    requested.set(item.productId, (requested.get(item.productId) ?? 0) + quantity);
  }
  if (requested.size === 0) throw new AppError("EMPTY_CART", 422);

  const products = await db.product.findMany({
    where: {
      id: { in: [...requested.keys()] },
      status: "PUBLISHED",
      type: { in: ["PROMPT", "BUNDLE", "WORKFLOW", "CREDIT_PACK"] },
    },
  });
  if (products.length !== requested.size) throw new AppError("PRODUCT_UNAVAILABLE", 409);

  const currencies = new Set(products.map((product) => product.currency));
  if (currencies.size !== 1) throw new AppError("MIXED_CURRENCIES", 422);
  const currency = products[0].currency;

  const pricedItems = products.map((product) => {
    const quantity = requested.get(product.id) ?? 1;
    const unitPrice = Number(product.salePrice ?? product.price);
    return {
      product,
      quantity,
      unitPrice,
      total: unitPrice * quantity,
    };
  });
  const subtotal = pricedItems.reduce((sum, item) => sum + item.total, 0);

  const taxSetting = await db.setting.findUnique({ where: { key: "checkout.taxRate" } });
  const configuredRate = Number(taxSetting?.value ?? 0);
  const taxRate =
    Number.isFinite(configuredRate) && configuredRate >= 0 && configuredRate <= 1
      ? configuredRate
      : 0;
  const tax = Number((subtotal * taxRate).toFixed(2));
  const total = Number((subtotal + tax).toFixed(2));
  const number = `PX-${Date.now().toString(36).toUpperCase()}-${randomBytes(3)
    .toString("hex")
    .toUpperCase()}`;

  const order = await db.order.create({
    data: {
      userId: input.userId,
      number,
      idempotencyKey: input.idempotencyKey,
      status: "PENDING",
      currency,
      subtotal,
      tax,
      total,
      items: {
        create: pricedItems.map(({ product, quantity, unitPrice, total: itemTotal }) => ({
          productId: product.id,
          titleSnapshot: input.locale === "ar" ? product.titleAr : product.titleEn,
          unitPrice,
          quantity,
          tax: Number((itemTotal * taxRate).toFixed(2)),
          total: Number((itemTotal * (1 + taxRate)).toFixed(2)),
          licenseType: product.licenseType,
        })),
      },
      payments: {
        create: {
          provider: adapter.key,
          idempotencyKey: `payment:${input.idempotencyKey}`,
          amount: total,
          currency,
          status: "PENDING",
        },
      },
    },
    include: { payments: true },
  });

  try {
    const session = await adapter.createCheckoutSession({
      orderId: order.id,
      orderNumber: order.number,
      amount: total,
      currency,
      customerEmail: input.email,
      successUrl: `${publicEnv.appUrl}/${input.locale}/checkout/success?order=${order.id}`,
      cancelUrl: `${publicEnv.appUrl}/${input.locale}/checkout/cancel?order=${order.id}`,
      idempotencyKey: input.idempotencyKey,
    });

    await db.payment.update({
      where: { id: order.payments[0].id },
      data: {
        providerPaymentId: session.providerPaymentId,
        metadata: { checkoutUrl: session.checkoutUrl },
      },
    });

    return { orderId: order.id, checkoutUrl: session.checkoutUrl, replayed: false };
  } catch (error) {
    await db.payment.update({
      where: { id: order.payments[0].id },
      data: { status: "FAILED", failureCode: "CHECKOUT_SESSION_FAILED" },
    });
    await db.order.update({ where: { id: order.id }, data: { status: "FAILED" } });
    throw error;
  }
}

export async function processPaymentEvent(
  provider: string,
  rawBody: string,
  signature: string,
) {
  const adapter = paymentAdapter();
  if (adapter.key !== provider) throw new AppError("UNKNOWN_PAYMENT_PROVIDER", 404);
  const event = await adapter.verifyWebhook(rawBody, signature);

  const prior = await db.paymentEvent.findUnique({
    where: {
      provider_providerEventId: {
        provider,
        providerEventId: event.id,
      },
    },
  });
  if (prior?.processedAt) return { processed: true, replayed: true };

  const payment = await db.payment.findUnique({
    where: { providerPaymentId: event.providerPaymentId },
    include: {
      order: {
        include: {
          items: {
            include: {
              product: {
                include: {
                  prompt: {
                    include: { versions: { where: { isCurrent: true }, take: 1 } },
                  },
                  bundleItems: {
                    include: {
                      product: {
                        include: {
                          prompt: {
                            include: { versions: { where: { isCurrent: true }, take: 1 } },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  });
  if (!payment) throw new AppError("PAYMENT_NOT_FOUND", 404);

  if (
    event.amount !== undefined &&
    Math.abs(event.amount - Number(payment.amount)) > 0.001
  ) {
    throw new AppError("PAYMENT_AMOUNT_MISMATCH", 422);
  }
  if (event.currency && event.currency !== payment.currency) {
    throw new AppError("PAYMENT_CURRENCY_MISMATCH", 422);
  }

  await db.$transaction(async (tx) => {
    await tx.paymentEvent.upsert({
      where: {
        provider_providerEventId: {
          provider,
          providerEventId: event.id,
        },
      },
      create: {
        paymentId: payment.id,
        provider,
        providerEventId: event.id,
        type: event.type,
        payloadHash: sha256(rawBody),
      },
      update: {},
    });

    if (event.type === "payment.paid") {
      if (payment.status === "PAID") return;
      await tx.payment.update({ where: { id: payment.id }, data: { status: "PAID" } });
      await tx.order.update({
        where: { id: payment.orderId },
        data: { status: "PAID", paidAt: new Date() },
      });

      for (const item of payment.order.items) {
        const products = [
          item.product,
          ...item.product.bundleItems.map((bundleItem) => bundleItem.product),
        ];

        for (const product of products) {
          const source = product.id === item.productId ? "PURCHASE" : "BUNDLE";
          await tx.entitlement.upsert({
            where: {
              userId_productId_source_orderId: {
                userId: payment.order.userId,
                productId: product.id,
                source,
                orderId: payment.order.id,
              },
            },
            create: {
              userId: payment.order.userId,
              productId: product.id,
              orderId: payment.order.id,
              orderItemId: product.id === item.productId ? item.id : undefined,
              promptVersionId: product.prompt?.versions[0]?.id,
              source,
              licenseType: item.licenseType,
            },
            update: {},
          });
          await tx.product.update({
            where: { id: product.id },
            data: { purchaseCount: { increment: 1 } },
          });
        }
      }
    } else if (event.type === "payment.failed") {
      await tx.payment.update({ where: { id: payment.id }, data: { status: "FAILED" } });
      await tx.order.update({ where: { id: payment.orderId }, data: { status: "FAILED" } });
    } else {
      await tx.payment.update({
        where: { id: payment.id },
        data: {
          status: "REFUNDED",
          refundedAmount: payment.amount,
        },
      });
      await tx.order.update({
        where: { id: payment.orderId },
        data: { status: "REFUNDED", refundedAt: new Date() },
      });
      await tx.entitlement.updateMany({
        where: { orderId: payment.orderId, revokedAt: null },
        data: { revokedAt: new Date() },
      });
    }

    await tx.paymentEvent.update({
      where: {
        provider_providerEventId: {
          provider,
          providerEventId: event.id,
        },
      },
      data: { processedAt: new Date() },
    });
  });

  return { processed: true, replayed: false };
}

export type { VerifiedPaymentEvent };
