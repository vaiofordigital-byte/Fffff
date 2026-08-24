"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LoaderCircle, Play } from "lucide-react";
import { Button } from "@/components/ui/button";

export function StartWorkflowButton({
  workflowId,
  locale,
}: {
  workflowId: string;
  locale: "ar" | "en";
}) {
  const ar = locale === "ar";
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  async function start() {
    setLoading(true);
    setError("");
    const response = await fetch(`/api/workflows/${workflowId}/runs`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Idempotency-Key": crypto.randomUUID(),
      },
      body: JSON.stringify({ context: {} }),
    });
    const payload = (await response.json()) as {
      id?: string;
      error?: { code?: string };
    };
    if (response.status === 401) {
      router.push(`/${locale}/login`);
      return;
    }
    if (!response.ok || !payload.id) {
      setLoading(false);
      setError(ar ? "تعذر بدء سير العمل." : "Workflow could not be started.");
      return;
    }
    router.push(`/${locale}/workflows/runs/${payload.id}`);
  }

  return (
    <div>
      <Button type="button" variant="accent" size="lg" className="w-full" onClick={start} disabled={loading}>
        {loading ? <LoaderCircle className="size-4 animate-spin" /> : <Play className="size-4" />}
        {ar ? "بدء سير العمل" : "Start workflow"}
      </Button>
      {error ? <p className="mt-2 text-sm text-danger">{error}</p> : null}
    </div>
  );
}
