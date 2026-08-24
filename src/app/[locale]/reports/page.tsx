import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { BarChart3, CheckCircle2, Coins, FileBarChart } from "lucide-react";
import { GenerateReportButton } from "@/components/reports/generate-report-button";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { isLocale, type Locale } from "@/lib/i18n";
import { getOrganizationMembership } from "@/lib/organizations";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Business intelligence reports",
  robots: { index: false, follow: false },
};

type ReportContent = {
  completedTasks?: Array<{ id: string; title: string }>;
  failedTaskCount?: number;
  usage?: { requests?: number; credits?: number };
  recommendations?: Array<{
    key: string;
    titleAr: string;
    titleEn: string;
  }>;
  dataCoverage?: { taskCount?: number; generatedFromActualUsage?: boolean };
};

export default async function ReportsPage({
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
  const reports = await db.businessReport.findMany({
    where: {
      organizationId: membership.organizationId,
      status: "READY",
    },
    orderBy: { periodEnd: "desc" },
    take: 24,
  });

  return (
    <div className="container-shell py-10 sm:py-14">
      <header className="flex flex-wrap items-end justify-between gap-5">
        <div className="max-w-3xl">
          <p className="eyebrow">{membership.organization.name}</p>
          <h1 className="mt-2 text-4xl font-bold tracking-[-0.04em]">
            {ar ? "تقارير ذكاء الأعمال" : "Business intelligence reports"}
          </h1>
          <p className="mt-3 text-sm leading-7 text-muted">
            {ar
              ? "ملخصات مبنية على المهام والاستخدام الفعلي. لا توجد إيرادات أو رؤى مصطنعة."
              : "Summaries based on actual tasks and usage. No fabricated revenue or insights."}
          </p>
        </div>
        <GenerateReportButton
          locale={locale}
          organizationId={membership.organizationId}
        />
      </header>

      {reports.length ? (
        <div className="mt-8 grid gap-5 md:grid-cols-2">
          {reports.map((report) => {
            const content = (report.content ?? {}) as ReportContent;
            return (
              <article key={report.id} className="premium-card overflow-hidden">
                <div className="flex items-start justify-between gap-4 border-b p-5">
                  <div>
                    <p className="text-xs font-semibold text-intelligence">{report.type}</p>
                    <h2 className="mt-1 text-lg font-bold">
                      {ar ? report.titleAr : report.titleEn}
                    </h2>
                    <p className="mt-1 text-xs text-muted">
                      {new Intl.DateTimeFormat(ar ? "ar-SA" : "en", {
                        dateStyle: "medium",
                      }).format(report.periodStart)}
                      {" — "}
                      {new Intl.DateTimeFormat(ar ? "ar-SA" : "en", {
                        dateStyle: "medium",
                      }).format(report.periodEnd)}
                    </p>
                  </div>
                  <span className="grid size-10 place-items-center rounded-xl bg-[#eaf0ff] text-intelligence">
                    <FileBarChart className="size-5" />
                  </span>
                </div>
                <div className="grid grid-cols-3 divide-x rtl:divide-x-reverse">
                  <div className="p-4 text-center">
                    <CheckCircle2 className="mx-auto size-4 text-success" />
                    <strong className="mt-2 block text-xl">
                      {content.completedTasks?.length ?? 0}
                    </strong>
                    <span className="text-[0.68rem] text-muted">{ar ? "مكتملة" : "Completed"}</span>
                  </div>
                  <div className="p-4 text-center">
                    <BarChart3 className="mx-auto size-4 text-intelligence" />
                    <strong className="mt-2 block text-xl">
                      {content.usage?.requests ?? 0}
                    </strong>
                    <span className="text-[0.68rem] text-muted">{ar ? "طلبات" : "Requests"}</span>
                  </div>
                  <div className="p-4 text-center">
                    <Coins className="mx-auto size-4 text-accent-strong" />
                    <strong className="mt-2 block text-xl">
                      {content.usage?.credits ?? 0}
                    </strong>
                    <span className="text-[0.68rem] text-muted">{ar ? "رصيد" : "Credits"}</span>
                  </div>
                </div>
                {content.recommendations?.length ? (
                  <div className="border-t p-5">
                    <h3 className="text-xs font-bold">{ar ? "أهم التوصيات" : "Top recommendations"}</h3>
                    <ul className="mt-3 grid gap-2 text-xs text-muted">
                      {content.recommendations.slice(0, 3).map((item) => (
                        <li key={item.key}>• {ar ? item.titleAr : item.titleEn}</li>
                      ))}
                    </ul>
                  </div>
                ) : null}
              </article>
            );
          })}
        </div>
      ) : (
        <div className="premium-card mt-8 p-10 text-center">
          <FileBarChart className="mx-auto size-10 text-muted" />
          <h2 className="mt-4 text-xl font-bold">{ar ? "لا توجد تقارير بعد" : "No reports yet"}</h2>
          <p className="mt-2 text-sm text-muted">
            {ar ? "أنشئ تقريراً بعد تنفيذ بعض المهام ليعكس بيانات فعلية." : "Generate a report after running tasks so it reflects actual data."}
          </p>
        </div>
      )}
    </div>
  );
}
