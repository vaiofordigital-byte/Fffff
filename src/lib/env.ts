import { z } from "zod";

const serverSchema = z.object({
  DATABASE_HOST: z.string().min(1).default("127.0.0.1"),
  DATABASE_PORT: z.coerce.number().int().positive().default(3306),
  DATABASE_USER: z.string().min(1).default("promptx"),
  DATABASE_PASSWORD: z.string().default(""),
  DATABASE_NAME: z.string().min(1).default("promptx"),
  DATABASE_CONNECTION_LIMIT: z.coerce.number().int().min(1).max(50).default(10),
  SESSION_COOKIE_NAME: z.string().default("promptx_session"),
  SESSION_TTL_DAYS: z.coerce.number().int().min(1).max(90).default(30),
  SECURITY_HASH_PEPPER: z.string().min(32).optional(),
  ENCRYPTION_KEY: z.string().min(40).optional(),
  AI_PROVIDER: z.string().default("openai-compatible"),
  AI_API_BASE_URL: z.url().optional(),
  AI_API_KEY: z.string().min(1).optional(),
  AI_MODEL: z.string().min(1).optional(),
  AI_FALLBACK_API_BASE_URL: z.url().optional(),
  AI_FALLBACK_API_KEY: z.string().min(1).optional(),
  AI_FALLBACK_MODEL: z.string().min(1).optional(),
  PAYMENT_PROVIDER: z.string().default("none"),
  PAYMENT_API_BASE_URL: z.url().optional(),
  PAYMENT_API_KEY: z.string().min(1).optional(),
  PAYMENT_WEBHOOK_SECRET: z.string().min(24).optional(),
  SMTP_HOST: z.string().min(1).optional(),
  SMTP_PORT: z.coerce.number().int().positive().default(587),
  SMTP_SECURE: z
    .enum(["true", "false"])
    .default("false")
    .transform((value) => value === "true"),
  SMTP_USER: z.string().min(1).optional(),
  SMTP_PASSWORD: z.string().min(1).optional(),
  SMTP_FROM: z.string().default("PROMPTX <no-reply@example.com>"),
});

let cached: z.infer<typeof serverSchema> | undefined;

export function env() {
  if (!cached) cached = serverSchema.parse(process.env);
  return cached;
}

export const publicEnv = {
  appUrl: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
  appName: process.env.APP_NAME ?? "PROMPTX",
};
