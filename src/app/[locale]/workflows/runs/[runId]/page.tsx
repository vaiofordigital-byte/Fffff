import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Check, Circle, Coins } from "lucide-react";
import { WorkflowRunStep } from "@/components/workflows/workflow-run-step";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { isLocale, type Locale } from "@/lib/i18n";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Workflow run",
  robots: { index: false, follow: false },
};

export default async function WorkflowRunPage({
  params,
}: {
  params: Promise<{ locale: string; runId: string }>;
}) {
  const { locale: raw, runId } = await params;
  const locale: Locale = isLocale(raw) ? raw : "ar";
  const ar = locale === "ar";
  const user = await requireUser(locale);
  const run = await db.workflowRun.findFirst({
    where: { id: runId, userId: user.id },
    include: {
      workflow: { select: { nameAr: true, nameEn: true } },
      steps: {
        orderBy: { workflowStep: { sortOrder: "asc" } },
        include: { workflowStep: true },
      },
    },
  });
  if (!run) notFound();

  return (
    <div className="container-shell py-10 sm:py-14">
      <header className="max-w-3xl">
        <p className="eyebrow">{ar ? "تنفيذ متدرج ومراجع" : "Controlled step-by-step run"}</p>
        <h1 className="mt-2 text-3xl font-bold tracking-[-0.035em] sm:text-4xl">
          {ar ? run.workflow.nameAr : run.workflow.nameEn}
        </h1>
        <p className="mt-3 text-sm text-muted">
          {ar ? "راجع مخرج كل خطوة قبل تنفيذ التالية." : "Review each output before running the next step."}
        </p>
      </header>

      <div className="mt-8 grid gap-4">
        {run.steps.map((step, index) => {
          const enabled =
            index === 0 || run.steps.slice(0, index).every((item) => item.status === "COMPLETED");
          const output = step.output as { content?: string } | null;
          return (
            <section
              key={step.id}
              className={`premium-card p-5 sm:p-7 ${!enabled ? "opacity-65" : ""}`}
            >
              <div className="flex items-start gap-4">
                <span
                  className={`grid size-10 shrink-0 place-items-center rounded-xl ${
                    step.status === "COMPLETED"
                      ? "bg-[#e8f3ed] text-success"
                      : "bg-surface-soft text-muted"
                  }`}
                >
                  {step.status === "COMPLETED" ? <Check className="size-5" /> : <Circle className="size-4" />}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="text-xs text-muted">
                        {ar ? "الخطوة" : "Step"} {index + 1}
                      </p>
                      <h2 className="mt-1 text-lg font-bold">
                        {ar ? step.workflowStep.nameAr : step.workflowStep.nameEn}
                      </h2>
                    </div>
                    <span className="inline-flex items-center gap-1 text-xs text-muted">
                      <Coins className="size-3.5" />
                      {step.workflowStep.creditCost}
                    </span>
                  </div>
                  <WorkflowRunStep
                    runId={run.id}
                    stepRunId={step.id}
                    locale={locale}
                    status={step.status}
                    enabled={enabled}
                    output={output?.content}
                  />
                </div>
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
