import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { apiError, AppError } from "@/lib/http";
import { assertSameOrigin } from "@/lib/security";

const schema = z.object({
  projectId: z.string().cuid(),
  name: z.string().trim().min(2).max(160),
  description: z.string().trim().max(1_000).optional(),
  data: z.record(z.string(), z.string().max(5_000)),
  privateMode: z.boolean().default(false),
});

export async function POST(request: Request) {
  try {
    await assertSameOrigin();
    const user = await getCurrentUser();
    if (!user) throw new AppError("AUTHENTICATION_REQUIRED", 401);
    const input = schema.parse(await request.json());
    const project = await db.project.findFirst({
      where: { id: input.projectId, userId: user.id },
      select: { id: true },
    });
    if (!project) throw new AppError("PROJECT_NOT_FOUND", 404);

    const context = await db.context.create({
      data: { userId: user.id, ...input },
      select: { id: true, name: true },
    });
    return NextResponse.json(context, { status: 201 });
  } catch (error) {
    return apiError(error);
  }
}
