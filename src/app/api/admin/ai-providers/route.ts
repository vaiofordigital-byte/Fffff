import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser, hasRole } from "@/lib/auth";
import { db } from "@/lib/db";
import { encrypt } from "@/lib/encryption";
import { apiError, AppError } from "@/lib/http";
import { assertSameOrigin, requestFingerprint } from "@/lib/security";

const schema = z.object({
  key: z.string().trim().min(2).max(80).regex(/^[a-z0-9-]+$/),
  displayName: z.string().trim().min(2).max(120),
  baseUrl: z.url(),
  apiKey: z.string().min(8).max(1_000).optional(),
  defaultModel: z.string().trim().min(1).max(120),
  enabled: z.boolean().default(false),
  isFallback: z.boolean().default(false),
  limits: z.record(z.string(), z.unknown()).optional(),
  pricing: z.record(z.string(), z.unknown()).optional(),
});

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) throw new AppError("AUTHENTICATION_REQUIRED", 401);
    if (!hasRole(user.role, "ADMINISTRATOR")) throw new AppError("FORBIDDEN", 403);
    const providers = await db.aiProviderConfiguration.findMany({
      orderBy: [{ isFallback: "asc" }, { createdAt: "asc" }],
      select: {
        id: true,
        key: true,
        displayName: true,
        baseUrl: true,
        defaultModel: true,
        enabled: true,
        isFallback: true,
        limits: true,
        pricing: true,
        apiKeyCiphertext: true,
        updatedAt: true,
      },
    });
    return NextResponse.json(
      providers.map(({ apiKeyCiphertext, ...provider }) => ({
        ...provider,
        hasApiKey: Boolean(apiKeyCiphertext),
      })),
      { headers: { "Cache-Control": "private, no-store" } },
    );
  } catch (error) {
    return apiError(error);
  }
}

export async function PUT(request: Request) {
  try {
    await assertSameOrigin();
    const user = await getCurrentUser();
    if (!user) throw new AppError("AUTHENTICATION_REQUIRED", 401);
    if (!hasRole(user.role, "ADMINISTRATOR")) throw new AppError("FORBIDDEN", 403);
    const input = schema.parse(await request.json());
    const current = await db.aiProviderConfiguration.findUnique({
      where: { key: input.key },
      select: { apiKeyCiphertext: true },
    });
    if (input.enabled && !input.apiKey && !current?.apiKeyCiphertext) {
      throw new AppError("AI_PROVIDER_API_KEY_REQUIRED", 422);
    }
    const fingerprint = await requestFingerprint();
    const provider = await db.$transaction(async (tx) => {
      const saved = await tx.aiProviderConfiguration.upsert({
        where: { key: input.key },
        create: {
          key: input.key,
          displayName: input.displayName,
          baseUrl: input.baseUrl,
          apiKeyCiphertext: input.apiKey ? encrypt(input.apiKey) : null,
          defaultModel: input.defaultModel,
          enabled: input.enabled,
          isFallback: input.isFallback,
          limits: input.limits
            ? JSON.parse(JSON.stringify(input.limits))
            : undefined,
          pricing: input.pricing
            ? JSON.parse(JSON.stringify(input.pricing))
            : undefined,
        },
        update: {
          displayName: input.displayName,
          baseUrl: input.baseUrl,
          ...(input.apiKey
            ? { apiKeyCiphertext: encrypt(input.apiKey) }
            : {}),
          defaultModel: input.defaultModel,
          enabled: input.enabled,
          isFallback: input.isFallback,
          limits: input.limits
            ? JSON.parse(JSON.stringify(input.limits))
            : undefined,
          pricing: input.pricing
            ? JSON.parse(JSON.stringify(input.pricing))
            : undefined,
        },
        select: {
          id: true,
          key: true,
          displayName: true,
          defaultModel: true,
          enabled: true,
          isFallback: true,
        },
      });
      await tx.auditLog.create({
        data: {
          actorId: user.id,
          action: "AI_PROVIDER_CONFIGURATION_CHANGED",
          entityType: "AiProviderConfiguration",
          entityId: saved.id,
          changes: {
            key: saved.key,
            model: saved.defaultModel,
            enabled: saved.enabled,
            isFallback: saved.isFallback,
            apiKeyChanged: Boolean(input.apiKey),
          },
          ...fingerprint,
        },
      });
      return saved;
    });
    return NextResponse.json(provider);
  } catch (error) {
    return apiError(error);
  }
}
