import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { apiError, AppError } from "@/lib/http";
import { assertSameOrigin } from "@/lib/security";

const schema = z.object({
  ids: z.array(z.string().cuid()).max(200).optional(),
  all: z.boolean().default(false),
});

export async function PATCH(request: Request) {
  try {
    await assertSameOrigin();
    const user = await getCurrentUser();
    if (!user) throw new AppError("AUTHENTICATION_REQUIRED", 401);
    const input = schema.parse(await request.json());
    const result = await db.notification.updateMany({
      where: {
        userId: user.id,
        readAt: null,
        ...(input.all ? {} : { id: { in: input.ids ?? [] } }),
      },
      data: { readAt: new Date() },
    });
    return NextResponse.json({ updated: result.count });
  } catch (error) {
    return apiError(error);
  }
}
