import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser, hasRole } from "@/lib/auth";
import { db } from "@/lib/db";
import { apiError, AppError } from "@/lib/http";
import { assertSameOrigin, requestFingerprint } from "@/lib/security";

const schema = z.object({
  status: z.enum(["ACTIVE", "SUSPENDED", "CLOSED"]),
});

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ organizationId: string }> },
) {
  try {
    await assertSameOrigin();
    const user = await getCurrentUser();
    if (!user) throw new AppError("AUTHENTICATION_REQUIRED", 401);
    if (!hasRole(user.role, "ADMINISTRATOR")) throw new AppError("FORBIDDEN", 403);
    const input = schema.parse(await request.json());
    const { organizationId } = await params;
    const fingerprint = await requestFingerprint();
    const organization = await db.$transaction(async (tx) => {
      const updated = await tx.organization.update({
        where: { id: organizationId },
        data: { status: input.status },
        select: { id: true, name: true, status: true },
      });
      await tx.auditLog.create({
        data: {
          actorId: user.id,
          action: "ORGANIZATION_STATUS_CHANGED",
          entityType: "Organization",
          entityId: updated.id,
          changes: { status: updated.status },
          ...fingerprint,
        },
      });
      return updated;
    });
    return NextResponse.json(organization);
  } catch (error) {
    return apiError(error);
  }
}
