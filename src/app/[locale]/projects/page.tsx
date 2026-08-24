import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, ArrowRight, FolderKanban } from "lucide-react";
import { ProjectCreator } from "@/components/projects/project-creator";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { isLocale, type Locale } from "@/lib/i18n";
import { getOrganizationMembership } from "@/lib/organizations";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Projects",
  robots: { index: false, follow: false },
};

export default async function ProjectsPage({
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
  const projects = await db.project.findMany({
    where: { organizationId: membership.organizationId, archived: false },
    orderBy: { updatedAt: "desc" },
    include: {
      _count: {
        select: { contexts: true, businessTasks: true, workflowRuns: true },
      },
    },
  });
  const Arrow = ar ? ArrowLeft : ArrowRight;

  return (
    <div className="container-shell py-10 sm:py-14">
      <header className="flex flex-wrap items-end justify-between gap-5">
        <div>
          <p className="eyebrow">{ar ? "سياق وعمل منظم" : "Context and work, organized"}</p>
          <h1 className="mt-2 text-4xl font-bold tracking-[-0.04em]">
            {ar ? "المشاريع" : "Projects"}
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-muted">
            {ar
              ? "اجمع الأهداف والمستندات والموظفين والمهام والنتائج لكل مبادرة."
              : "Bring goals, documents, employees, tasks and results together for every initiative."}
          </p>
        </div>
        <ProjectCreator
          locale={locale}
          organizationId={membership.organizationId}
        />
      </header>

      {projects.length ? (
        <div className="mt-9 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => (
            <Link
              key={project.id}
              href={`/${locale}/projects/${project.id}`}
              className="premium-card group p-6 transition hover:-translate-y-0.5 hover:border-accent/40"
            >
              <div className="flex items-center justify-between">
                <span className="grid size-11 place-items-center rounded-xl bg-surface-soft">
                  <FolderKanban className="size-5" />
                </span>
                <Arrow className="size-4 text-muted group-hover:text-foreground" />
              </div>
              <h2 className="mt-6 text-lg font-bold">{project.name}</h2>
              <p className="mt-2 line-clamp-2 min-h-12 text-sm leading-6 text-muted">
                {project.description || (ar ? "مساحة مشروع خاصة" : "Private project workspace")}
              </p>
              <div className="mt-5 flex flex-wrap gap-2 text-[0.68rem] text-muted">
                <span>{project._count.businessTasks} {ar ? "مهام" : "tasks"}</span>
                <span>·</span>
                <span>{project._count.contexts} {ar ? "سياق" : "contexts"}</span>
                <span>·</span>
                <span>{project._count.workflowRuns} {ar ? "عمليات" : "runs"}</span>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="premium-card mt-9 grid min-h-80 place-items-center p-8 text-center">
          <div>
            <FolderKanban className="mx-auto size-10 text-muted" />
            <h2 className="mt-4 text-xl font-bold">
              {ar ? "ابدأ بأول مشروع" : "Start your first project"}
            </h2>
            <p className="mx-auto mt-2 max-w-sm text-sm leading-7 text-muted">
              {ar ? "مثل: متجري، حملة تسويق، أو مشروع عميل." : "For example: My Store, Marketing Campaign or Client Project."}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
