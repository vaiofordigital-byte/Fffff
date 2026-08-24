import type { OrganizationRole } from "@/generated/prisma/client";
import { db } from "@/lib/db";
import { AppError } from "@/lib/http";

const roleRank: Record<OrganizationRole, number> = {
  VIEWER: 0,
  EMPLOYEE: 10,
  MANAGER: 20,
  OWNER: 30,
};

export async function getOrganizationMembership(
  userId: string,
  organizationId?: string,
) {
  return db.organizationMember.findFirst({
    where: {
      userId,
      active: true,
      ...(organizationId ? { organizationId } : {}),
      organization: { status: "ACTIVE", deletedAt: null },
    },
    orderBy: { joinedAt: "asc" },
    include: {
      organization: true,
    },
  });
}

export async function requireOrganizationMembership(
  userId: string,
  organizationId?: string,
  minimumRole: OrganizationRole = "VIEWER",
) {
  const membership = await getOrganizationMembership(userId, organizationId);
  if (!membership) throw new AppError("ORGANIZATION_REQUIRED", 403);
  if (roleRank[membership.role] < roleRank[minimumRole]) {
    throw new AppError("ORGANIZATION_PERMISSION_REQUIRED", 403);
  }
  return membership;
}

export function hasOrganizationRole(
  role: OrganizationRole,
  minimumRole: OrganizationRole,
) {
  return roleRank[role] >= roleRank[minimumRole];
}

export async function listUserOrganizations(userId: string) {
  return db.organizationMember.findMany({
    where: {
      userId,
      active: true,
      organization: { status: "ACTIVE", deletedAt: null },
    },
    orderBy: { joinedAt: "asc" },
    include: {
      organization: {
        select: {
          id: true,
          name: true,
          slug: true,
          industry: true,
          businessType: true,
        },
      },
    },
  });
}
