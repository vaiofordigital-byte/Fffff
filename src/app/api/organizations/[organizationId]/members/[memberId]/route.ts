import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { apiError, AppError } from "@/lib/http";
import { requireOrganizationMembership } from "@/lib/organizations";
import { assertSameOrigin, requestFingerprint } from "@/lib/security";

const schema = z.object({
  role: z.enum(["OWNER", "MANAGER", "EMPLOYEE", "VIEWER"]),
  active: z.boolean().default(true),
  permissions: z.record(z.string(), z.boolean()).optional(),
});

export async function PATCH(
  request: Request,
  {
    params,
  }: { params: Promise<{ organizationId: string; memberId: string }> },
) {
  try {
    await assertSameOrigin();
    const user = await getCurrentUser();
    if (!user) throw new AppError("AUTHENTICATION_REQUIRED", 401);
    const { organizationId, memberId } = await params;
    await requireOrganizationMembership(user.id, organizationId, "OWNER");
    const input = schema.parse(await request.json());
    const member = await db.organizationMember.findFirst({
      where: { id: memberId, organizationId },
    });
    if (!member) throw new AppError("MEMBER_NOT_FOUND", 404);
    if (member.userId === user.id && (!input.active || input.role !== "OWNER")) {
      throw new AppError("OWNER_CANNOT_REMOVE_SELF", 422);
    }
    const fingerprint = await requestFingerprint();
    const updated = await db.$transaction(async (tx) => {
      const saved = await tx.organizationMember.update({
        where: { id: member.id },
        data: {
          role: input.role,
          active: input.active,
          permissions: input.permissions
            ? JSON.parse(JSON.stringify(input.permissions))
            : undefined,
        },
        select: { id: true, role: true, active: true },
      });
      await tx.auditLog.create({
        data: {
          actorId: user.id,
          action: "ORGANIZATION_MEMBER_CHANGED",
          entityType: "OrganizationMember",
          entityId: saved.id,
          changes: {
            organizationId,
            role: saved.role,
            active: saved.active,
          },
          ...fingerprint,
        },
      });
      return saved;
    });
    return NextResponse.json(updated);
  } catch (error) {
    return apiError(error);
  }
}
