import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser, verifyPassword } from "@/lib/auth";
import { db } from "@/lib/db";
import { apiError, AppError } from "@/lib/http";
import { assertSameOrigin, sha256 } from "@/lib/security";

const schema = z.object({
  password: z.string().min(1).max(128),
  confirmation: z.literal("DELETE MY ACCOUNT"),
});

export async function DELETE(request: Request) {
  try {
    await assertSameOrigin();
    const sessionUser = await getCurrentUser();
    if (!sessionUser) throw new AppError("AUTHENTICATION_REQUIRED", 401);
    const input = schema.parse(await request.json());
    const user = await db.user.findUnique({
      where: { id: sessionUser.id },
      include: {
        organizationMemberships: {
          where: { active: true },
          include: {
            organization: {
              include: {
                members: {
                  where: { active: true },
                  select: { id: true },
                },
              },
            },
          },
        },
      },
    });
    if (!user?.passwordHash) throw new AppError("PASSWORD_REQUIRED", 422);
    if (!(await verifyPassword(user.passwordHash, input.password))) {
      throw new AppError("INVALID_CREDENTIALS", 401);
    }
    const sharedOrganization = user.organizationMemberships.find(
      (membership) => membership.organization.members.length > 1,
    );
    if (sharedOrganization) {
      throw new AppError("TRANSFER_ORGANIZATION_BEFORE_DELETION", 409);
    }

    const organizationIds = user.organizationMemberships.map(
      (membership) => membership.organizationId,
    );
    const pseudonymousEmail = `${sha256(`${user.id}:${user.email}`).slice(0, 24)}@deleted.invalid`;
    await db.$transaction(async (tx) => {
      if (organizationIds.length) {
        await tx.organization.deleteMany({
          where: { id: { in: organizationIds } },
        });
      }
      await tx.promptHistory.deleteMany({ where: { userId: user.id } });
      await tx.generatedPrompt.deleteMany({ where: { userId: user.id } });
      await tx.favorite.deleteMany({ where: { userId: user.id } });
      await tx.collection.deleteMany({ where: { userId: user.id } });
      await tx.review.deleteMany({ where: { userId: user.id } });
      await tx.notification.deleteMany({ where: { userId: user.id } });
      await tx.notificationPreference.deleteMany({ where: { userId: user.id } });
      await tx.session.deleteMany({ where: { userId: user.id } });
      await tx.emailVerificationToken.deleteMany({ where: { userId: user.id } });
      await tx.passwordResetToken.deleteMany({ where: { userId: user.id } });
      const creditAccount = await tx.creditAccount.findUnique({
        where: { userId: user.id },
        select: { id: true },
      });
      if (creditAccount) {
        await tx.creditTransaction.deleteMany({
          where: { accountId: creditAccount.id },
        });
        await tx.creditAccount.delete({ where: { id: creditAccount.id } });
      }
      await tx.profile.updateMany({
        where: { userId: user.id },
        data: {
          displayName: "Deleted user",
          company: null,
          industry: null,
          primaryUse: null,
          experience: null,
          country: null,
          avatarUrl: null,
        },
      });
      await tx.subscription.updateMany({
        where: { userId: user.id, status: { in: ["ACTIVE", "TRIALING", "PAST_DUE"] } },
        data: { status: "CANCELLED", cancelledAt: new Date() },
      });
      await tx.user.update({
        where: { id: user.id },
        data: {
          email: pseudonymousEmail,
          passwordHash: null,
          status: "DELETED",
          mfaEnabled: false,
          mfaSecretCiphertext: null,
          deletedAt: new Date(),
        },
      });
    });

    return NextResponse.json({ deleted: true });
  } catch (error) {
    return apiError(error);
  }
}
