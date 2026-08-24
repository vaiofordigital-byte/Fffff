import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { apiError, AppError } from "@/lib/http";
import { assertSameOrigin } from "@/lib/security";

const schema = z
  .object({
    skip: z.boolean().default(false),
    primaryUse: z.string().trim().max(160).optional(),
    industry: z.string().trim().max(120).optional(),
    experience: z.string().trim().max(80).optional(),
    preferredLocale: z.enum(["ar", "en"]),
  })
  .refine(
    (input) =>
      input.skip ||
      Boolean(input.primaryUse && input.industry && input.experience),
    "ONBOARDING_FIELDS_REQUIRED",
  );

export async function PUT(request: Request) {
  try {
    await assertSameOrigin();
    const user = await getCurrentUser();
    if (!user) throw new AppError("AUTHENTICATION_REQUIRED", 401);
    const input = schema.parse(await request.json());
    await db.$transaction([
      db.profile.upsert({
        where: { userId: user.id },
        create: {
          userId: user.id,
          primaryUse: input.primaryUse,
          industry: input.industry,
          experience: input.experience,
          onboardingDone: true,
        },
        update: {
          primaryUse: input.primaryUse,
          industry: input.industry,
          experience: input.experience,
          onboardingDone: true,
        },
      }),
      db.user.update({
        where: { id: user.id },
        data: { preferredLocale: input.preferredLocale === "ar" ? "AR" : "EN" },
      }),
    ]);
    return NextResponse.json({ completed: true });
  } catch (error) {
    return apiError(error);
  }
}
