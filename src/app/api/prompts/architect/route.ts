import { randomUUID } from "node:crypto";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { apiError } from "@/lib/http";
import { architectPrompt, promptArchitectSchema } from "@/lib/prompt-engine";
import { assertSameOrigin, enforceRateLimit } from "@/lib/security";

export async function POST(request: Request) {
  try {
    await assertSameOrigin();
    const requestHeaders = await headers();
    const clientKey =
      requestHeaders.get("x-forwarded-for")?.split(",")[0]?.trim() ??
      requestHeaders.get("x-real-ip") ??
      "unknown";
    await enforceRateLimit("prompt-architect", clientKey, 20, 60 * 60);

    const input = promptArchitectSchema.parse(await request.json());
    const result = architectPrompt(input);
    const user = await getCurrentUser();

    if (user) {
      const projectId = input.projectId
        ? (
            await db.project.findFirst({
              where: { id: input.projectId, userId: user.id },
              select: { id: true },
            })
          )?.id
        : undefined;
      await db.generatedPrompt.create({
        data: {
          userId: user.id,
          projectId,
          title: input.idea.slice(0, 160),
          intent: input.idea.slice(0, 2_000),
          input,
          content: result.content,
          locale: input.locale === "ar" ? "AR" : "EN",
          mode: "architect",
          status: "COMPLETED",
          qualityScore: result.score.total,
          idempotencyKey: `architect:${user.id}:${randomUUID()}`,
        },
      });
    }

    return NextResponse.json(result, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    return apiError(error);
  }
}
