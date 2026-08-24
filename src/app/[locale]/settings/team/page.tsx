import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Shield, Users } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { isLocale, type Locale } from "@/lib/i18n";
import { getOrganizationMembership } from "@/lib/organizations";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Team and roles",
  robots: { index: false, follow: false },
};

export default async function TeamSettingsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: raw } = await params;
  const locale: Locale = isLocale(raw) ? raw : "ar";
  const ar = locale === "ar";
  const user = await requireUser(locale);
  const membership = await getOrganizationMembership(user.id);
  if (!membership) redirect(`/${locale}/onboarding`);
  const members = await db.organizationMember.findMany({
    where: { organizationId: membership.organizationId, active: true },
    orderBy: { joinedAt: "asc" },
    include: {
      user: {
        select: {
          email: true,
          profile: { select: { displayName: true } },
        },
      },
    },
  });

  return (
    <div className="container-shell py-10 sm:py-14">
      <header>
        <p className="eyebrow">{membership.organization.name}</p>
        <h1 className="mt-2 text-4xl font-bold tracking-[-0.04em]">
          {ar ? "الفريق والصلاحيات" : "Team and permissions"}
        </h1>
        <p className="mt-3 text-sm leading-7 text-muted">
          {ar
            ? "بنية جاهزة لأدوار المالك والمدير والموظف والمشاهد، مع فحص الصلاحيات على الخادم."
            : "A server-enforced Owner, Manager, Employee and Viewer role architecture."}
        </p>
      </header>

      <section className="premium-card mt-8 overflow-hidden">
        <div className="flex items-center gap-3 border-b p-5">
          <Users className="size-5 text-intelligence" />
          <h2 className="font-bold">{ar ? "أعضاء الشركة" : "Company members"}</h2>
        </div>
        <div className="divide-y">
          {members.map((member) => (
            <div key={member.id} className="flex items-center gap-4 p-5">
              <span className="grid size-10 place-items-center rounded-xl bg-[#eaf0ff] text-intelligence">
                <Shield className="size-4" />
              </span>
              <div className="min-w-0 flex-1">
                <h3 className="truncate text-sm font-semibold">
                  {member.user.profile?.displayName ?? member.user.email}
                </h3>
                <p className="mt-1 truncate text-xs text-muted">{member.user.email}</p>
              </div>
              <span className="rounded-full bg-surface-soft px-3 py-1 text-xs font-semibold">
                {member.role}
              </span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
