import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight, BrainCircuit, FileText, Shield } from "lucide-react";
import { ContextCreator } from "@/components/projects/context-creator";
import { Button } from "@/components/ui/button";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { isLocale, type Locale } from "@/lib/i18n";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Project workspace",
  robots: { index: false, follow: false },
};

export default async function ProjectPage({
  params,
}: {
  params: Promise<{ locale: string; projectId: string }>;
}) {
  const { locale: raw, projectId } = await params;
  const locale: Locale = isLocale(raw) ? raw : "ar";
  const ar = locale === "ar";
  const user = await requireUser(locale);
  const project = await db.project.findFirst({
    where: { id: projectId, userId: user.id },
    include: {
      contexts: { orderBy: { updatedAt: "desc" } },
      generatedPrompts: {
        orderBy: { updatedAt: "desc" },
        take: 20,
        select: {
          id: true,
          title: true,
          mode: true,
          qualityScore: true,
          updatedAt: true,
        },
      },
      workflowRuns: {
        orderBy: { updatedAt: "desc" },
        take: 10,
        include: { workflow: { select: { nameAr: true, nameEn: true } } },
      },
    },
  });
  if (!project) notFound();
  const Arrow = ar ? ArrowLeft : ArrowRight;

  return (
    <div className="container-shell py-10 sm:py-14">
      <header className="flex flex-wrap items-end justify-between gap-5">
        <div>
          <p className="eyebrow">{ar ? "مساحة مشروع خاصة" : "Private project workspace"}</p>
          <h1 className="mt-2 text-4xl font-bold tracking-[-0.04em]">{project.name}</h1>
          {project.description ? (
            <p className="mt-3 max-w-2xl text-sm leading-7 text-muted">{project.description}</p>
          ) : null}
        </div>
        <Button asChild variant="accent">
          <Link href={`/${locale}/architect?project=${project.id}`}>
            <BrainCircuit className="size-4" />
            {ar ? "إنشاء داخل المشروع" : "Create in project"}
          </Link>
        </Button>
      </header>

      <section className="mt-9" aria-labelledby="context-heading">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 id="context-heading" className="text-xl font-bold">
              {ar ? "خزنة السياق" : "Context Vault"}
            </h2>
            <p className="mt-1 text-xs text-muted">
              {ar ? "يُستخدم السياق المعتمد فقط." : "Only approved context is reused."}
            </p>
          </div>
          <ContextCreator projectId={project.id} locale={locale} />
        </div>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {project.contexts.map((context) => (
            <article key={context.id} className="premium-card p-5">
              <div className="flex items-center justify-between">
                <span className="grid size-9 place-items-center rounded-xl bg-[#e8f3ed] text-success">
                  {context.privateMode ? <Shield className="size-4" /> : <FileText className="size-4" />}
                </span>
                <span className="text-[0.65rem] text-muted">
                  {context.approved ? (ar ? "معتمد" : "Approved") : ar ? "غير معتمد" : "Not approved"}
                </span>
              </div>
              <h3 className="mt-4 font-bold">{context.name}</h3>
              <p className="mt-2 text-xs leading-6 text-muted">
                {Object.keys(context.data as Record<string, unknown>).filter(
                  (key) => Boolean((context.data as Record<string, unknown>)[key]),
                ).length}{" "}
                {ar ? "حقول سياق" : "context fields"}
              </p>
            </article>
          ))}
          {!project.contexts.length ? (
            <div className="col-span-full rounded-2xl border border-dashed p-7 text-sm text-muted">
              {ar ? "أضف وصف العلامة والجمهور والسوق لإعادة استخدام سياق موثوق." : "Add brand, audience and market information for trusted context reuse."}
            </div>
          ) : null}
        </div>
      </section>

      <section className="mt-10" aria-labelledby="project-prompts">
        <h2 id="project-prompts" className="text-xl font-bold">
          {ar ? "البرومبتات والمخرجات" : "Prompts and outputs"}
        </h2>
        <div className="mt-4 overflow-hidden rounded-2xl border bg-white/65">
          {project.generatedPrompts.length ? (
            <div className="divide-y">
              {project.generatedPrompts.map((prompt) => (
                <Link
                  href={`/${locale}/lab?prompt=${prompt.id}`}
                  key={prompt.id}
                  className="flex items-center gap-4 p-4 hover:bg-surface-soft/50"
                >
                  <FileText className="size-4 text-muted" />
                  <div className="min-w-0 flex-1">
                    <h3 className="truncate text-sm font-semibold">{prompt.title}</h3>
                    <p className="mt-1 text-xs text-muted">{prompt.mode}</p>
                  </div>
                  <Arrow className="size-4 text-muted" />
                </Link>
              ))}
            </div>
          ) : (
            <p className="p-7 text-center text-sm text-muted">
              {ar ? "لا توجد مخرجات في المشروع بعد." : "No project outputs yet."}
            </p>
          )}
        </div>
      </section>
    </div>
  );
}
