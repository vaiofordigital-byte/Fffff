import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ArrowDown, Coins, Workflow } from "lucide-react";
import { StartWorkflowButton } from "@/components/workflows/start-workflow-button";
import { db } from "@/lib/db";
import { isLocale, type Locale } from "@/lib/i18n";

export const dynamic = "force-dynamic";

export default async function WorkflowDetailPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale: raw, slug } = await params;
  const locale: Locale = isLocale(raw) ? raw : "ar";
  const ar = locale === "ar";
  const workflow = await db.workflow.findFirst({
    where: { slug, status: "PUBLISHED" },
    include: { steps: { orderBy: { sortOrder: "asc" } } },
  });
  if (!workflow) notFound();

  return (
    <div className="container-shell py-12 sm:py-16">
      <div className="grid gap-8 lg:grid-cols-[1fr_22rem] lg:items-start">
        <article>
          <div className="rounded-[1.75rem] bg-[#1b1e1a] p-8 text-white sm:p-11">
            <span className="grid size-12 place-items-center rounded-xl border border-white/10 bg-white/5">
              <Workflow className="size-5 text-[#dfbf7a]" />
            </span>
            <p className="mt-8 text-xs text-[#dfbf7a]">{workflow.industry}</p>
            <h1 className="text-balance mt-2 text-4xl font-bold tracking-[-0.04em] sm:text-5xl">
              {ar ? workflow.nameAr : workflow.nameEn}
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-8 text-white/60">
              {ar ? workflow.descriptionAr : workflow.descriptionEn}
            </p>
          </div>

          <section className="mt-10" aria-labelledby="workflow-steps">
            <h2 id="workflow-steps" className="text-2xl font-bold">
              {ar ? "خطوات سير العمل" : "Workflow steps"}
            </h2>
            <div className="mt-6">
              {workflow.steps.map((step, index) => (
                <div key={step.id}>
                  <div className="premium-card flex gap-5 p-5 sm:p-6">
                    <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-surface-soft text-sm font-bold">
                      {index + 1}
                    </span>
                    <div>
                      <h3 className="font-bold">{ar ? step.nameAr : step.nameEn}</h3>
                      <p className="mt-2 text-sm leading-6 text-muted">
                        {ar ? "تستخدم السياق ومخرجات الخطوات السابقة تلقائياً." : "Uses approved context and previous step outputs automatically."}
                      </p>
                      <span className="mt-3 inline-flex items-center gap-1 text-xs text-muted">
                        <Coins className="size-3.5" />
                        {step.creditCost} {ar ? "رصيد" : "credits"}
                      </span>
                    </div>
                  </div>
                  {index < workflow.steps.length - 1 ? (
                    <ArrowDown className="mx-auto my-2 size-5 text-muted" />
                  ) : null}
                </div>
              ))}
            </div>
          </section>
        </article>

        <aside className="premium-card sticky top-24 p-6">
          <h2 className="font-bold">{ar ? "قبل أن تبدأ" : "Before you start"}</h2>
          <dl className="mt-5 grid gap-4 text-sm">
            <div className="flex justify-between gap-3">
              <dt className="text-muted">{ar ? "الخطوات" : "Steps"}</dt>
              <dd className="font-semibold">{workflow.steps.length}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-muted">{ar ? "الرصيد التقديري" : "Estimated credits"}</dt>
              <dd className="font-semibold">{workflow.creditEstimate}</dd>
            </div>
          </dl>
          <div className="my-6 border-t" />
          <StartWorkflowButton workflowId={workflow.id} locale={locale} />
          <p className="mt-4 text-xs leading-6 text-muted">
            {ar
              ? "لا يُخصم رصيد إلا بعد نجاح كل خطوة. يمكنك مراجعة المخرجات قبل المتابعة."
              : "Credits are charged only after each successful step. Review outputs before continuing."}
          </p>
        </aside>
      </div>
    </div>
  );
}
