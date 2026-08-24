import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { publicEnv } from "@/lib/env";
import { securityHash } from "@/lib/security";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const token = url.searchParams.get("token");
  const locale = url.searchParams.get("locale") === "en" ? "en" : "ar";

  if (!token || token.length > 200) {
    return NextResponse.redirect(`${publicEnv.appUrl}/${locale}/login?verified=invalid`);
  }

  const record = await db.emailVerificationToken.findUnique({
    where: { tokenHash: securityHash(token) },
  });

  if (!record || record.usedAt || record.expiresAt <= new Date()) {
    return NextResponse.redirect(`${publicEnv.appUrl}/${locale}/login?verified=expired`);
  }

  await db.$transaction([
    db.emailVerificationToken.update({
      where: { id: record.id },
      data: { usedAt: new Date() },
    }),
    db.user.update({
      where: { id: record.userId },
      data: { status: "ACTIVE", emailVerifiedAt: new Date() },
    }),
    db.auditLog.create({
      data: {
        actorId: record.userId,
        action: "EMAIL_VERIFIED",
        entityType: "User",
        entityId: record.userId,
      },
    }),
  ]);

  return NextResponse.redirect(`${publicEnv.appUrl}/${locale}/login?verified=true`);
}
