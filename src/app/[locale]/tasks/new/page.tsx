import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { TaskComposer } from "@/components/tasks/task-composer";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { isLocale, type Locale } from "@/lib/i18n";
import { getOrganizationMembership } from "@/lib/organizations";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "New business task",
  robots: { index: false, follow: false },
};

export default async function NewTaskPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ employee?: string; parent?: string; project?: string }>;
}) {
  const [{ locale: raw }, query] = await Promise.all([params, searchParams]);
  const locale: Locale = isLocale(raw) ? raw : "ar";
  const ar = locale === "ar";
  const user = await requireUser(locale);
  const membership = await getOrganizationMembership(user.id);
  if (!membership) redirect(`/${locale}/onboarding`);
  const activations = await db.organizationAiEmployee.findMany({
    where: {
      organizationId: membership.organizationId,
      status: "ACTIVE",
    },
    orderBy: { activatedAt: "asc" },
    select: {
      aiEmployee: {
        select: {
          id: true,
          nameAr: true,
          nameEn: true,
          purposeAr: true,
          purposeEn: true,
          defaultCreditCost: true,
        },
      },
    },
  });
  const employees = activations.map((activation) => activation.aiEmployee);

  return (
    <div className="container-shell py-10 sm:py-14">
      <header className="mb-8 max-w-3xl">
        <p className="eyebrow">{ar ? "تكليف واضح. نتيجة قابلة للمراجعة." : "Clear assignment. Reviewable output."}</p>
        <h1 className="mt-2 text-4xl font-bold tracking-[-0.04em]">
          {ar ? "مهمة عمل جديدة" : "New business task"}
        </h1>
        <p className="mt-3 text-sm leading-7 text-muted">
          {ar
            ? `ستنفذ المهمة داخل ${membership.organization.name} باستخدام معرفة الشركة المعتمدة.`
            : `This task runs inside ${membership.organization.name} using approved company knowledge.`}
        </p>
      </header>
      <TaskComposer
        locale={locale}
        organizationId={membership.organizationId}
        employees={employees}
        defaultEmployeeId={query.employee}
        parentTaskId={query.parent}
        projectId={query.project}
      />
    </div>
  );
}
