import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { emailAvailable } from "@/lib/email";
import { env } from "@/lib/env";

export async function GET() {
  const checks = {
    database: false,
    emailConfigured: false,
    aiConfigured: false,
    paymentsConfigured: false,
  };
  try {
    await db.$queryRaw`SELECT 1`;
    checks.database = true;
    checks.emailConfigured = emailAvailable();
    checks.aiConfigured =
      (await db.aiProviderConfiguration.count({
        where: {
          enabled: true,
          apiKeyCiphertext: { not: null },
          defaultModel: { not: null },
        },
      })) > 0 ||
      Boolean(env().AI_API_BASE_URL && env().AI_API_KEY && env().AI_MODEL);
    checks.paymentsConfigured =
      env().PAYMENT_PROVIDER !== "none" &&
      Boolean(
        env().PAYMENT_API_BASE_URL &&
          env().PAYMENT_API_KEY &&
          env().PAYMENT_WEBHOOK_SECRET,
      );
  } catch {
    // No secret values or private business content are logged by health checks.
  }

  return NextResponse.json(
    {
      status: checks.database ? "ok" : "degraded",
      checks,
      timestamp: new Date().toISOString(),
    },
    {
      status: checks.database ? 200 : 503,
      headers: { "Cache-Control": "no-store" },
    },
  );
}
