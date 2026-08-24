import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Workflow } from "lucide-react";
import { db } from "@/lib/db";
import { isLocale, type Locale } from "@/lib/i18n";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale: raw } = await params;
  const locale = isLocale(raw) ? raw : "ar";
  return {
    title: locale === "ar" ? "سير عمل AI احترافي" : "Professional AI workflows",
    description:
      locale === "ar"
        ? "حوّل مشروعاً كاملاً إلى خطوات AI مترابطة تحفظ السياق والمخرجات."
        : "Turn a complete project into connected AI steps that retain context and outputs.",
  };
}

export default async function WorkflowsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: raw } = await params;
  const locale: Locale = isLocale(raw) ? raw : "ar";
  const ar = locale === "ar";
  const workflows = await db.workflow.findMany({
    where: { status: "PUBLISHED" },
    orderBy: { updatedAt: "desc" },
    include: { _count: { select: { steps: true } } },
  });
  const Arrow = ar ? ArrowLeft : ArrowRight;

  return (
    <div className="container-shell py-12 sm:py-16">
      <header className="max-w-3xl">
        <p className="eyebrow">{ar ? "من مهمة إلى نظام عمل" : "From task to operating system"}</p>
        <h1 className="text-balance mt-3 text-4xl font-bold tracking-[-0.04em] sm:text-5xl">
          {ar ? "سير عمل متعدد الخطوات" : "Multi-step AI workflows"}
        </h1>
        <p className="mt-4 text-base leading-8 text-muted">
          {ar
            ? "كل خطوة تستخدم سياق ما قبلها، وتحفظ مخرجاتها، وتعرض تكلفة الرصيد قبل التنفيذ."
            : "Each step reuses prior context, saves its output and shows credit cost before execution."}
        </p>
      </header>

      {workflows.length ? (
        <div className="mt-9 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {workflows.map((workflow) => (
            <Link
              href={`/${locale}/workflows/${workflow.slug}`}
              key={workflow.id}
              className="premium-card group overflow-hidden transition hover:-translate-y-1 hover:border-accent/40"
            >
              <div className="bg-[#1c1f1b] p-6 text-white">
                <span className="grid size-11 place-items-center rounded-xl border border-white/10 bg-white/5">
                  <Workflow className="size-5 text-[#dfbf7a]" />
                </span>
                <p className="mt-7 text-xs text-white/45">{workflow.industry ?? (ar ? "أعمال" : "Business")}</p>
                <h2 className="mt-2 text-xl font-bold">{ar ? workflow.nameAr : workflow.nameEn}</h2>
              </div>
              <div className="p-6">
                <p className="line-clamp-3 min-h-[4.5rem] text-sm leading-6 text-muted">
                  {ar ? workflow.descriptionAr : workflow.descriptionEn}
                </p>
                <div className="mt-5 flex items-center justify-between border-t pt-4 text-xs">
                  <span className="text-muted">
                    {workflow._count.steps} {ar ? "خطوات" : "steps"} · {workflow.creditEstimate} {ar ? "رصيد تقديري" : "estimated credits"}
                  </span>
                  <Arrow className="size-4" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="premium-card mt-9 p-10 text-center">
          <Workflow className="mx-auto size-10 text-muted" />
          <h2 className="mt-4 text-xl font-bold">{ar ? "لا توجد عمليات منشورة" : "No published workflows"}</h2>
          <p className="mt-2 text-sm text-muted">
            {ar ? "ينشر المسؤول عمليات حقيقية بعد مراجعة خطواتها وتكلفتها." : "Administrators publish workflows after validating steps and cost."}
          </p>
        </div>
      )}
    </div>
  );
}
