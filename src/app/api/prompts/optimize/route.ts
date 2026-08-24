import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { z } from "zod";
import { apiError } from "@/lib/http";
import { optimizePrompt } from "@/lib/prompt-engine";
import { assertSameOrigin, enforceRateLimit } from "@/lib/security";

const schema = z.object({
  prompt: z.string().trim().min(8).max(10_000),
  mode: z.enum(["basic", "professional", "expert", "maximum"]),
  locale: z.enum(["ar", "en"]).default("ar"),
});

export async function POST(request: Request) {
  try {
    await assertSameOrigin();
    const requestHeaders = await headers();
    const clientKey =
      requestHeaders.get("x-forwarded-for")?.split(",")[0]?.trim() ??
      requestHeaders.get("x-real-ip") ??
      "unknown";
    await enforceRateLimit("prompt-optimizer", clientKey, 20, 60 * 60);

    const input = schema.parse(await request.json());
    const result = optimizePrompt(input.prompt, input.mode, input.locale);
    return NextResponse.json(result, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    return apiError(error);
  }
}
