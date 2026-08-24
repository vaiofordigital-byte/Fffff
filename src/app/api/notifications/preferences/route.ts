import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { apiError, AppError } from "@/lib/http";
import { assertSameOrigin } from "@/lib/security";

const schema = z.object({
  purchasesEmail: z.boolean(),
  promptUpdatesEmail: z.boolean(),
  creditsEmail: z.boolean(),
  subscriptionsEmail: z.boolean(),
  securityEmail: z.literal(true),
  taskCompletedEmail: z.boolean(),
  reportsEmail: z.boolean(),
  recommendationsEmail: z.boolean(),
  marketingEmail: z.boolean(),
  inAppEnabled: z.boolean(),
});

export async function PUT(request: Request) {
  try {
    await assertSameOrigin();
    const user = await getCurrentUser();
    if (!user) throw new AppError("AUTHENTICATION_REQUIRED", 401);
    const input = schema.parse(await request.json());
    const preferences = await db.notificationPreference.upsert({
      where: { userId: user.id },
      create: { userId: user.id, ...input },
      update: input,
      select: {
        purchasesEmail: true,
        promptUpdatesEmail: true,
        creditsEmail: true,
        subscriptionsEmail: true,
        securityEmail: true,
        taskCompletedEmail: true,
        reportsEmail: true,
        recommendationsEmail: true,
        marketingEmail: true,
        inAppEnabled: true,
      },
    });
    return NextResponse.json(preferences);
  } catch (error) {
    return apiError(error);
  }
}
