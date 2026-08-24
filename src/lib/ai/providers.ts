import { env } from "@/lib/env";
import { AppError } from "@/lib/http";
import { db } from "@/lib/db";
import { decrypt } from "@/lib/encryption";

export type GenerationRequest = {
  system: string;
  prompt: string;
  temperature?: number;
  maxTokens?: number;
  signal?: AbortSignal;
};

export type GenerationResult = {
  content: string;
  provider: string;
  model: string;
  usage?: { inputTokens?: number; outputTokens?: number };
};

export interface AiProvider {
  readonly key: string;
  generate(request: GenerationRequest): Promise<GenerationResult>;
}

type OpenAiCompatibleConfig = {
  key: string;
  baseUrl: string;
  apiKey: string;
  model: string;
};

export class OpenAiCompatibleProvider implements AiProvider {
  readonly key: string;

  constructor(private readonly config: OpenAiCompatibleConfig) {
    this.key = config.key;
  }

  async generate(request: GenerationRequest): Promise<GenerationResult> {
    const response = await fetch(
      `${this.config.baseUrl.replace(/\/$/, "")}/chat/completions`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.config.apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: this.config.model,
          messages: [
            { role: "system", content: request.system },
            { role: "user", content: request.prompt },
          ],
          temperature: request.temperature ?? 0.3,
          max_tokens: request.maxTokens ?? 2_000,
        }),
        signal: request.signal,
      },
    );

    if (!response.ok) {
      throw new ProviderError(
        this.key,
        response.status >= 500 ? "PROVIDER_UNAVAILABLE" : "PROVIDER_REJECTED",
      );
    }

    const payload = (await response.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
      usage?: { prompt_tokens?: number; completion_tokens?: number };
    };
    const content = payload.choices?.[0]?.message?.content?.trim();
    if (!content) throw new ProviderError(this.key, "EMPTY_RESPONSE");

    return {
      content,
      provider: this.key,
      model: this.config.model,
      usage: {
        inputTokens: payload.usage?.prompt_tokens,
        outputTokens: payload.usage?.completion_tokens,
      },
    };
  }
}

export class ProviderError extends Error {
  constructor(
    public readonly provider: string,
    public readonly code: string,
  ) {
    super(code);
    this.name = "ProviderError";
  }
}

export async function configuredProviders(): Promise<AiProvider[]> {
  const config = env();
  const providers: AiProvider[] = [];
  const databaseProviders = await db.aiProviderConfiguration.findMany({
    where: { enabled: true, apiKeyCiphertext: { not: null }, defaultModel: { not: null } },
    orderBy: [{ isFallback: "asc" }, { createdAt: "asc" }],
  });

  for (const provider of databaseProviders) {
    if (!provider.apiKeyCiphertext || !provider.defaultModel) continue;
    providers.push(
      new OpenAiCompatibleProvider({
        key: provider.key,
        baseUrl: provider.baseUrl,
        apiKey: decrypt(provider.apiKeyCiphertext),
        model: provider.defaultModel,
      }),
    );
  }

  if (
    providers.length === 0 &&
    config.AI_API_BASE_URL &&
    config.AI_API_KEY &&
    config.AI_MODEL
  ) {
    providers.push(
      new OpenAiCompatibleProvider({
        key: config.AI_PROVIDER,
        baseUrl: config.AI_API_BASE_URL,
        apiKey: config.AI_API_KEY,
        model: config.AI_MODEL,
      }),
    );
  }

  if (
    config.AI_FALLBACK_API_BASE_URL &&
    config.AI_FALLBACK_API_KEY &&
    config.AI_FALLBACK_MODEL
  ) {
    providers.push(
      new OpenAiCompatibleProvider({
        key: "fallback",
        baseUrl: config.AI_FALLBACK_API_BASE_URL,
        apiKey: config.AI_FALLBACK_API_KEY,
        model: config.AI_FALLBACK_MODEL,
      }),
    );
  }

  if (providers.length === 0) throw new AppError("AI_NOT_CONFIGURED", 503);
  return providers;
}
