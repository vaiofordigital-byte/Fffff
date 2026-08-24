import { createHash, createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { headers } from "next/headers";
import { db } from "@/lib/db";
import { env, publicEnv } from "@/lib/env";

export function randomToken(bytes = 32) {
  return randomBytes(bytes).toString("base64url");
}

export function sha256(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

export function securityHash(value: string) {
  const pepper = env().SECURITY_HASH_PEPPER;
  if (!pepper && process.env.NODE_ENV === "production") {
    throw new Error("SECURITY_HASH_PEPPER must be configured in production");
  }
  return createHmac("sha256", pepper ?? "development-only-pepper")
    .update(value)
    .digest("hex");
}

export function secureEqual(left: string, right: string) {
  const a = Buffer.from(left);
  const b = Buffer.from(right);
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function requestFingerprint() {
  const requestHeaders = await headers();
  const forwarded = requestHeaders.get("x-forwarded-for")?.split(",")[0]?.trim();
  const ip = forwarded ?? requestHeaders.get("x-real-ip") ?? "unknown";
  return {
    ipHash: securityHash(ip),
    userAgent: requestHeaders.get("user-agent")?.slice(0, 500) ?? null,
  };
}

export async function assertSameOrigin() {
  const requestHeaders = await headers();
  const origin = requestHeaders.get("origin");
  if (!origin) return;

  const expected = new URL(publicEnv.appUrl).origin;
  if (origin !== expected) {
    throw new SecurityError("INVALID_ORIGIN");
  }
}

export async function enforceRateLimit(
  action: string,
  rawKey: string,
  limit: number,
  windowSeconds: number,
) {
  const keyHash = securityHash(rawKey);
  const since = new Date(Date.now() - windowSeconds * 1000);

  const count = await db.rateLimitAttempt.count({
    where: { keyHash, action, occurredAt: { gte: since } },
  });

  if (count >= limit) throw new SecurityError("RATE_LIMITED");

  await db.rateLimitAttempt.create({ data: { keyHash, action } });
}

export class SecurityError extends Error {
  constructor(public readonly code: string) {
    super(code);
    this.name = "SecurityError";
  }
}
