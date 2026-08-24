import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { apiError } from "@/lib/http";
import { assertSameOrigin, enforceRateLimit, sha256 } from "@/lib/security";

const schema = z.object({
  query: z.string().trim().min(1).max(500),
  locale: z.enum(["ar", "en"]),
  resultCount: z.number().int().min(0).max(100_000),
});

function safeAggregateTerm(query: string) {
  const normalized = query.normalize("NFKC").toLocaleLowerCase().replace(/\s+/g, " ");
  if (
    /[\w.+-]+@[\w.-]+\.[a-z]{2,}/i.test(normalized) ||
    /\d{5,}/.test(normalized) ||
    /https?:\/\//i.test(normalized)
  ) {
    return null;
  }
  return normalized;
}

export async function POST(request: Request) {
  try {
    await assertSameOrigin();
    const input = schema.parse(await request.json());
    const requestHeaders = await headers();
    const ip =
      requestHeaders.get("x-forwarded-for")?.split(",")[0]?.trim() ??
      requestHeaders.get("x-real-ip") ??
      "unknown";
    await enforceRateLimit("search-analytics", ip, 60, 60 * 60);
    const user = await getCurrentUser();
    const aggregateTerm = safeAggregateTerm(input.query);
    await db.searchEvent.create({
      data: {
        userId: user?.id,
        queryHash: sha256(input.query.normalize("NFKC").toLocaleLowerCase()),
        normalizedQuery: aggregateTerm,
        locale: input.locale === "ar" ? "AR" : "EN",
        resultCount: input.resultCount,
      },
    });
    return NextResponse.json({ tracked: true }, { status: 202 });
  } catch (error) {
    return apiError(error);
  }
}
