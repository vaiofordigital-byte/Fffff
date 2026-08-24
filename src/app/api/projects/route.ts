import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { apiError, AppError } from "@/lib/http";
import { assertSameOrigin } from "@/lib/security";

const schema = z.object({
  name: z.string().trim().min(2).max(160),
  description: z.string().trim().max(1_000).optional(),
  color: z.string().regex(/^#[0-9a-f]{6}$/i).optional(),
});

export async function POST(request: Request) {
  try {
    await assertSameOrigin();
    const user = await getCurrentUser();
    if (!user) throw new AppError("AUTHENTICATION_REQUIRED", 401);
    const input = schema.parse(await request.json());
    const project = await db.project.create({
      data: { userId: user.id, ...input },
      select: { id: true, name: true },
    });
    return NextResponse.json(project, { status: 201 });
  } catch (error) {
    return apiError(error);
  }
}
