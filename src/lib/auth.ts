import { hash, verify } from "@node-rs/argon2";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { UserRole } from "@/generated/prisma/client";
import { db } from "@/lib/db";
import { env } from "@/lib/env";
import { randomToken, requestFingerprint, securityHash } from "@/lib/security";

const passwordOptions = {
  memoryCost: 19_456,
  timeCost: 2,
  outputLen: 32,
  parallelism: 1,
};

export async function hashPassword(password: string) {
  return hash(password, passwordOptions);
}

export async function verifyPassword(passwordHash: string, password: string) {
  return verify(passwordHash, password);
}

export async function createSession(userId: string, mfaVerified = false) {
  const config = env();
  const token = randomToken();
  const fingerprint = await requestFingerprint();
  const expiresAt = new Date(
    Date.now() + config.SESSION_TTL_DAYS * 24 * 60 * 60 * 1000,
  );

  await db.session.create({
    data: {
      userId,
      tokenHash: securityHash(token),
      expiresAt,
      mfaVerifiedAt: mfaVerified ? new Date() : null,
      ...fingerprint,
    },
  });

  const cookieStore = await cookies();
  cookieStore.set(config.SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
    priority: "high",
  });
}

export async function destroySession() {
  const config = env();
  const cookieStore = await cookies();
  const token = cookieStore.get(config.SESSION_COOKIE_NAME)?.value;

  if (token) {
    await db.session.deleteMany({ where: { tokenHash: securityHash(token) } });
  }

  cookieStore.delete(config.SESSION_COOKIE_NAME);
}

export async function getCurrentUser() {
  const config = env();
  const token = (await cookies()).get(config.SESSION_COOKIE_NAME)?.value;
  if (!token) return null;

  const session = await db.session.findUnique({
    where: { tokenHash: securityHash(token) },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          role: true,
          status: true,
          preferredLocale: true,
          emailVerifiedAt: true,
          mfaEnabled: true,
          profile: {
            select: {
              displayName: true,
              avatarUrl: true,
              onboardingDone: true,
            },
          },
          creditAccount: { select: { balance: true } },
        },
      },
    },
  });

  if (
    !session ||
    session.expiresAt <= new Date() ||
    session.user.status !== "ACTIVE" ||
    (session.user.mfaEnabled && !session.mfaVerifiedAt)
  ) {
    return null;
  }

  return session.user;
}

export async function getPendingMfaSession() {
  const config = env();
  const token = (await cookies()).get(config.SESSION_COOKIE_NAME)?.value;
  if (!token) return null;
  return db.session.findFirst({
    where: {
      tokenHash: securityHash(token),
      expiresAt: { gt: new Date() },
      mfaVerifiedAt: null,
      user: { status: "ACTIVE", mfaEnabled: true },
    },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          mfaSecretCiphertext: true,
        },
      },
    },
  });
}

export async function requireUser(locale: "ar" | "en" = "ar") {
  const user = await getCurrentUser();
  if (!user) redirect(`/${locale}/login`);
  return user;
}

const roleRank: Record<UserRole, number> = {
  USER: 0,
  SUPPORT_AGENT: 10,
  CONTENT_EDITOR: 20,
  PROMPT_EDITOR: 30,
  ADMINISTRATOR: 40,
  SUPER_ADMIN: 50,
};

export async function requireRole(
  minimum: UserRole,
  locale: "ar" | "en" = "ar",
) {
  const user = await requireUser(locale);
  if (roleRank[user.role] >= roleRank.ADMINISTRATOR && !user.mfaEnabled) {
    redirect(`/${locale}/settings/security?required=admin`);
  }
  if (roleRank[user.role] < roleRank[minimum]) redirect(`/${locale}/dashboard`);
  return user;
}

export function hasRole(userRole: UserRole, minimum: UserRole) {
  return roleRank[userRole] >= roleRank[minimum];
}
