import { randomBytes } from "node:crypto";
import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { apiError, AppError } from "@/lib/http";
import { assertSameOrigin } from "@/lib/security";

const schema = z
  .object({
    skip: z.boolean().default(false),
    companyName: z.string().trim().min(2).max(191).optional(),
    businessType: z.string().trim().max(120).optional(),
    primaryUse: z.string().trim().max(160).optional(),
    industry: z.string().trim().max(120).optional(),
    experience: z.string().trim().max(80).optional(),
    goals: z.array(z.string().trim().max(120)).max(8).default([]),
    preferredLocale: z.enum(["ar", "en"]),
  })
  .refine(
    (input) =>
      input.skip ||
      Boolean(
        input.companyName &&
          input.businessType &&
          input.primaryUse &&
          input.industry &&
          input.experience,
      ),
    "ONBOARDING_FIELDS_REQUIRED",
  );

export async function PUT(request: Request) {
  try {
    await assertSameOrigin();
    const user = await getCurrentUser();
    if (!user) throw new AppError("AUTHENTICATION_REQUIRED", 401);
    const input = schema.parse(await request.json());
    const existingMembership = await db.organizationMember.findFirst({
      where: { userId: user.id, active: true },
      select: { organizationId: true },
    });
    const fallbackName =
      user.profile?.displayName || user.email.split("@")[0] || "EVELIA Workspace";
    const companyName = input.companyName || fallbackName;
    const slugBase =
      companyName
        .normalize("NFKD")
        .toLocaleLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "")
        .slice(0, 48) || "company";
    const slug = `${slugBase}-${randomBytes(3).toString("hex")}`;

    await db.$transaction(async (tx) => {
      await tx.profile.upsert({
        where: { userId: user.id },
        create: {
          userId: user.id,
          company: companyName,
          primaryUse: input.primaryUse,
          industry: input.industry,
          experience: input.experience,
          onboardingDone: true,
        },
        update: {
          company: companyName,
          primaryUse: input.primaryUse,
          industry: input.industry,
          experience: input.experience,
          onboardingDone: true,
        },
      });
      await tx.user.update({
        where: { id: user.id },
        data: { preferredLocale: input.preferredLocale === "ar" ? "AR" : "EN" },
      });
      if (!existingMembership) {
        const organization = await tx.organization.create({
          data: {
            name: companyName,
            slug,
            businessType: input.businessType,
            industry: input.industry,
            goals: input.goals,
            settings: {
              preferredLocale: input.preferredLocale,
              automaticContext: true,
            },
            members: {
              create: {
                userId: user.id,
                role: "OWNER",
                permissions: { all: true },
              },
            },
          },
        });
        const freePlan = await tx.plan.findUnique({ where: { slug: "free" } });
        if (freePlan) {
          const periodEnd = new Date();
          periodEnd.setUTCFullYear(periodEnd.getUTCFullYear() + 10);
          await tx.subscription.create({
            data: {
              userId: user.id,
              organizationId: organization.id,
              planId: freePlan.id,
              status: "ACTIVE",
              interval: "YEARLY",
              currentPeriodStart: new Date(),
              currentPeriodEnd: periodEnd,
            },
          });
          if (freePlan.monthlyCredits > 0) {
            const account = await tx.creditAccount.update({
              where: { userId: user.id },
              data: {
                balance: { increment: freePlan.monthlyCredits },
                lifetimeIn: { increment: freePlan.monthlyCredits },
              },
            });
            await tx.creditTransaction.create({
              data: {
                accountId: account.id,
                type: "SUBSCRIPTION_ALLOCATION",
                amount: freePlan.monthlyCredits,
                balanceAfter: account.balance,
                reason: "Free plan initial allocation",
                relatedType: "Organization",
                relatedId: organization.id,
                idempotencyKey: `onboarding:${organization.id}:credits`,
              },
            });
          }
        }
      }
    });

    const goalText = `${input.primaryUse ?? ""} ${input.goals.join(" ")}`;
    const recommendedEmployeeSlugs = [
      /(sales|مبيعات|conversion)/i.test(goalText) ? "sales-assistant" : null,
      /(support|customer|خدمة|عملاء)/i.test(goalText)
        ? "customer-service-manager"
        : null,
      /(analysis|تحليل|decision)/i.test(goalText) ? "business-analyst" : null,
      /(content|محتوى)/i.test(goalText) ? "content-creator" : null,
      "marketing-manager",
    ].filter((value): value is string => Boolean(value));

    return NextResponse.json({
      completed: true,
      recommendedEmployeeSlugs: [...new Set(recommendedEmployeeSlugs)].slice(0, 3),
    });
  } catch (error) {
    return apiError(error);
  }
}
