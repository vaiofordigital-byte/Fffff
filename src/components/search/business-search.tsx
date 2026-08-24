"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Bot, FileBarChart, LoaderCircle, Search, Workflow } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/field";

type Results = {
  employees: Array<{
    id: string;
    nameAr: string;
    nameEn: string;
    purposeAr: string;
    purposeEn: string;
  }>;
  workflows: Array<{
    id: string;
    slug: string;
    nameAr: string;
    nameEn: string;
    descriptionAr: string;
    descriptionEn: string;
  }>;
  reports: Array<{ id: string; titleAr: string; titleEn: string; type: string }>;
  knowledge: Array<{ id: string; titleAr: string; titleEn: string; kind: string }>;
  tasks: Array<{ id: string; title: string; status: string }>;
};

export function BusinessSearch({
  locale,
  initialQuery = "",
}: {
  locale: "ar" | "en";
  initialQuery?: string;
}) {
  const ar = locale === "ar";
  const [query, setQuery] = useState(initialQuery);
  const [submitted, setSubmitted] = useState(initialQuery);
  const [results, setResults] = useState<Results>();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (submitted.trim().length < 2) return;
    const controller = new AbortController();
    queueMicrotask(() => setLoading(true));
    fetch(`/api/search?q=${encodeURIComponent(submitted)}&locale=${locale}`, {
      signal: controller.signal,
    })
      .then(async (response) => {
        if (!response.ok) throw new Error("SEARCH_FAILED");
        return (await response.json()) as Results;
      })
      .then(setResults)
      .catch((error) => {
        if (error instanceof DOMException && error.name === "AbortError") return;
        setResults(undefined);
      })
      .finally(() => setLoading(false));
    return () => controller.abort();
  }, [locale, submitted]);

  const total = results
    ? results.employees.length +
      results.workflows.length +
      results.reports.length +
      results.knowledge.length +
      results.tasks.length
    : 0;

  return (
    <div>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          setSubmitted(query);
        }}
        className="premium-card flex gap-2 p-2"
      >
        <Search className="ms-3 size-5 self-center text-muted" />
        <Input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          className="border-0 shadow-none"
          placeholder={ar ? "مثال: أريد زيادة مبيعات متجري" : "e.g. I want to increase store sales"}
          aria-label={ar ? "بحث الأعمال" : "Business search"}
        />
        <Button type="submit" disabled={query.trim().length < 2 || loading}>
          {loading ? <LoaderCircle className="size-4 animate-spin" /> : null}
          {ar ? "بحث" : "Search"}
        </Button>
      </form>

      {results ? (
        <div className="mt-8">
          <p className="text-sm text-muted">
            {total} {ar ? "نتائج مرتبطة بهدفك" : "results related to your goal"}
          </p>
          <div className="mt-4 grid gap-5">
            {results.employees.length ? (
              <section className="premium-card p-5">
                <h2 className="flex items-center gap-2 font-bold">
                  <Bot className="size-4 text-intelligence" />
                  {ar ? "الموظفون المناسبون" : "Relevant employees"}
                </h2>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  {results.employees.map((employee) => (
                    <Link key={employee.id} href={`/${locale}/employees`} className="rounded-xl border p-4 hover:border-intelligence/40">
                      <h3 className="font-semibold">{ar ? employee.nameAr : employee.nameEn}</h3>
                      <p className="mt-1 text-xs leading-5 text-muted">{ar ? employee.purposeAr : employee.purposeEn}</p>
                    </Link>
                  ))}
                </div>
              </section>
            ) : null}

            {results.workflows.length ? (
              <section className="premium-card p-5">
                <h2 className="flex items-center gap-2 font-bold">
                  <Workflow className="size-4 text-intelligence" />
                  {ar ? "سير العمل" : "Workflows"}
                </h2>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  {results.workflows.map((workflow) => (
                    <Link key={workflow.id} href={`/${locale}/workflows/${workflow.slug}`} className="rounded-xl border p-4 hover:border-intelligence/40">
                      <h3 className="font-semibold">{ar ? workflow.nameAr : workflow.nameEn}</h3>
                      <p className="mt-1 text-xs leading-5 text-muted">{ar ? workflow.descriptionAr : workflow.descriptionEn}</p>
                    </Link>
                  ))}
                </div>
              </section>
            ) : null}

            {results.tasks.length || results.reports.length || results.knowledge.length ? (
              <section className="premium-card p-5">
                <h2 className="flex items-center gap-2 font-bold">
                  <FileBarChart className="size-4 text-intelligence" />
                  {ar ? "نتائج شركتك الخاصة" : "Private company results"}
                </h2>
                <div className="mt-4 grid gap-2 text-sm">
                  {results.tasks.map((task) => (
                    <Link key={task.id} href={`/${locale}/tasks/${task.id}`} className="rounded-xl border p-3 hover:bg-surface-soft">
                      {task.title} · {task.status}
                    </Link>
                  ))}
                  {results.reports.map((report) => (
                    <Link key={report.id} href={`/${locale}/reports`} className="rounded-xl border p-3 hover:bg-surface-soft">
                      {ar ? report.titleAr : report.titleEn} · {report.type}
                    </Link>
                  ))}
                  {results.knowledge.map((entry) => (
                    <Link key={entry.id} href={`/${locale}/brain`} className="rounded-xl border p-3 hover:bg-surface-soft">
                      {ar ? entry.titleAr : entry.titleEn} · {entry.kind}
                    </Link>
                  ))}
                </div>
              </section>
            ) : null}

            {total === 0 ? (
              <div className="rounded-2xl border border-dashed p-8 text-center text-sm text-muted">
                {ar ? "لا توجد نتيجة مؤكدة. جرّب وصف الهدف بمصطلحات أوسع." : "No confirmed result. Try describing the goal more broadly."}
              </div>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}
