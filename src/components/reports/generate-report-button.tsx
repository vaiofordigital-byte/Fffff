"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { FileBarChart, LoaderCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export function GenerateReportButton({
  locale,
  organizationId,
}: {
  locale: "ar" | "en";
  organizationId: string;
}) {
  const ar = locale === "ar";
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  async function generate() {
    setLoading(true);
    setError("");
    const response = await fetch("/api/reports", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ organizationId, type: "WEEKLY" }),
    });
    setLoading(false);
    if (!response.ok) {
      setError(ar ? "تعذر إنشاء التقرير." : "Report generation failed.");
      return;
    }
    router.refresh();
  }

  return (
    <div>
      <Button type="button" variant="accent" onClick={generate} disabled={loading}>
        {loading ? <LoaderCircle className="size-4 animate-spin" /> : <FileBarChart className="size-4" />}
        {ar ? "إنشاء تقرير أسبوعي" : "Generate weekly report"}
      </Button>
      {error ? <p className="mt-2 text-xs text-danger">{error}</p> : null}
    </div>
  );
}
