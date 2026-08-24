"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, LoaderCircle, Play, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/field";

export function WorkflowRunStep({
  runId,
  stepRunId,
  locale,
  status,
  enabled,
  output,
}: {
  runId: string;
  stepRunId: string;
  locale: "ar" | "en";
  status: string;
  enabled: boolean;
  output?: string;
}) {
  const ar = locale === "ar";
  const [value, setValue] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  async function execute() {
    setLoading(true);
    setError("");
    const response = await fetch(`/api/workflow-runs/${runId}/steps/${stepRunId}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Idempotency-Key": crypto.randomUUID(),
      },
      body: JSON.stringify({
        input: value ? { userInput: value } : {},
        locale,
      }),
    });
    const payload = (await response.json()) as { error?: { code?: string } };
    setLoading(false);
    if (!response.ok) {
      const code = payload.error?.code;
      setError(
        code === "AI_NOT_CONFIGURED"
          ? ar
            ? "يجب تهيئة مزود AI حقيقي قبل التنفيذ."
            : "A real AI provider must be configured before execution."
          : code === "INSUFFICIENT_CREDITS"
            ? ar
              ? "الرصيد غير كافٍ لهذه الخطوة."
              : "Insufficient credits for this step."
            : ar
              ? "فشلت الخطوة ولم يُخصم الرصيد."
              : "The step failed and no credits were charged.",
      );
      return;
    }
    router.refresh();
  }

  if (status === "COMPLETED") {
    return (
      <div className="mt-4">
        <div className="flex items-center gap-2 text-xs font-semibold text-success">
          <Check className="size-4" />
          {ar ? "اكتملت الخطوة" : "Step completed"}
        </div>
        {output ? (
          <pre className="mt-3 max-h-80 overflow-auto whitespace-pre-wrap rounded-xl bg-surface-soft p-4 font-[inherit] text-sm leading-7">
            {output}
          </pre>
        ) : null}
      </div>
    );
  }

  return (
    <div className="mt-4">
      <Textarea
        value={value}
        onChange={(event) => setValue(event.target.value)}
        className="min-h-24"
        placeholder={ar ? "بيانات إضافية لهذه الخطوة (اختياري)" : "Additional input for this step (optional)"}
        disabled={!enabled || loading}
      />
      <Button type="button" className="mt-3" onClick={execute} disabled={!enabled || loading}>
        {loading ? (
          <LoaderCircle className="size-4 animate-spin" />
        ) : status === "FAILED" ? (
          <RotateCcw className="size-4" />
        ) : (
          <Play className="size-4" />
        )}
        {status === "FAILED"
          ? ar
            ? "إعادة المحاولة"
            : "Retry"
          : ar
            ? "تنفيذ الخطوة"
            : "Run step"}
      </Button>
      {!enabled ? (
        <p className="mt-2 text-xs text-muted">
          {ar ? "أكمل الخطوة السابقة أولاً." : "Complete the previous step first."}
        </p>
      ) : null}
      {error ? <p className="mt-2 text-sm text-danger">{error}</p> : null}
    </div>
  );
}
