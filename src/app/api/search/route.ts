import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { apiError } from "@/lib/http";
import { getOrganizationMembership } from "@/lib/organizations";
import { enforceRateLimit, sha256 } from "@/lib/security";

const schema = z.object({
  q: z.string().trim().min(2).max(300),
  locale: z.enum(["ar", "en"]).default("ar"),
});

function expandIntent(query: string) {
  const terms = new Set([query]);
  const normalized = query.toLocaleLowerCase();
  if (/(مبيعات|تحويل|sales|conversion)/iu.test(normalized)) {
    ["مبيعات", "تسويق", "sales", "marketing"].forEach((term) => terms.add(term));
  }
  if (/(متجر|تجارة|ecommerce|store)/iu.test(normalized)) {
    ["تجارة إلكترونية", "e-commerce", "marketing"].forEach((term) => terms.add(term));
  }
  if (/(خدمة العملاء|دعم|customer service|support)/iu.test(normalized)) {
    ["خدمة العملاء", "customer service", "FAQ"].forEach((term) => terms.add(term));
  }
  return [...terms].slice(0, 8);
}

export async function GET(request: Request) {
  try {
    const parsed = schema.parse({
      q: new URL(request.url).searchParams.get("q"),
      locale: new URL(request.url).searchParams.get("locale") ?? "ar",
    });
    const terms = expandIntent(parsed.q);
    const requestHeaders = await headers();
    const clientKey =
      requestHeaders.get("x-forwarded-for")?.split(",")[0]?.trim() ??
      requestHeaders.get("x-real-ip") ??
      "unknown";
    await enforceRateLimit("business-search", clientKey, 60, 60 * 60);
    const user = await getCurrentUser();
    const membership = user ? await getOrganizationMembership(user.id) : null;
    const [employees, workflows, reports, knowledge, tasks] = await Promise.all([
      db.aiEmployee.findMany({
        where: {
          active: true,
          OR: terms.flatMap((term) => [
            { nameAr: { contains: term } },
            { nameEn: { contains: term } },
            { purposeAr: { contains: term } },
            { purposeEn: { contains: term } },
          ]),
        },
        take: 10,
        select: {
          id: true,
          slug: true,
          nameAr: true,
          nameEn: true,
          purposeAr: true,
          purposeEn: true,
        },
      }),
      db.workflow.findMany({
        where: {
          status: "PUBLISHED",
          OR: terms.flatMap((term) => [
            { nameAr: { contains: term } },
            { nameEn: { contains: term } },
            { descriptionAr: { contains: term } },
            { descriptionEn: { contains: term } },
          ]),
        },
        take: 10,
        select: {
          id: true,
          slug: true,
          nameAr: true,
          nameEn: true,
          descriptionAr: true,
          descriptionEn: true,
        },
      }),
      membership
        ? db.businessReport.findMany({
            where: {
              organizationId: membership.organizationId,
              status: "READY",
              OR: terms.flatMap((term) => [
                { titleAr: { contains: term } },
                { titleEn: { contains: term } },
              ]),
            },
            take: 10,
            select: { id: true, titleAr: true, titleEn: true, type: true },
          })
        : [],
      membership
        ? db.knowledgeEntry.findMany({
            where: {
              organizationId: membership.organizationId,
              OR: terms.flatMap((term) => [
                { titleAr: { contains: term } },
                { titleEn: { contains: term } },
              ]),
            },
            take: 10,
            select: {
              id: true,
              titleAr: true,
              titleEn: true,
              kind: true,
              approved: true,
            },
          })
        : [],
      membership
        ? db.businessTask.findMany({
            where: {
              organizationId: membership.organizationId,
              title: { contains: parsed.q },
            },
            take: 10,
            select: { id: true, title: true, status: true },
          })
        : [],
    ]);
    const resultCount =
      employees.length +
      workflows.length +
      reports.length +
      knowledge.length +
      tasks.length;
    await db.searchEvent.create({
      data: {
        userId: user?.id,
        queryHash: sha256(parsed.q.normalize("NFKC").toLocaleLowerCase()),
        normalizedQuery: /@|\d{5,}|https?:\/\//i.test(parsed.q)
          ? null
          : parsed.q.normalize("NFKC").toLocaleLowerCase(),
        locale: parsed.locale === "ar" ? "AR" : "EN",
        resultCount,
        filters: { scope: membership ? "organization" : "public" },
      },
    });

    return NextResponse.json(
      { intentTerms: terms, employees, workflows, reports, knowledge, tasks },
      {
        headers: {
          "Cache-Control": membership ? "private, no-store" : "public, max-age=30",
        },
      },
    );
  } catch (error) {
    return apiError(error);
  }
}
