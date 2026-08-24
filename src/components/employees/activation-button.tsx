"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, LoaderCircle, Power } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ActivationButton({
  locale,
  employeeId,
  organizationId,
  active,
}: {
  locale: "ar" | "en";
  employeeId: string;
  organizationId?: string;
  active: boolean;
}) {
  const ar = locale === "ar";
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  async function activate() {
    if (!organizationId) {
      router.push(`/${locale}/login?next=/${locale}/employees`);
      return;
    }
    setLoading(true);
    setError("");
    const response = await fetch(
      `/api/organizations/${organizationId}/employees/${employeeId}`,
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "ACTIVE" }),
      },
    );
    setLoading(false);
    if (!response.ok) {
      setError(
        ar
          ? "تعذر التفعيل. قد تحتاج إلى صلاحية مدير."
          : "Activation failed. Manager permission may be required.",
      );
      return;
    }
    router.refresh();
  }

  if (active) {
    return (
      <Button asChild variant="outline" className="w-full">
        <a href={`/${locale}/tasks/new?employee=${employeeId}`}>
          <Check className="size-4 text-success" />
          {ar ? "نشط — أنشئ مهمة" : "Active — Create task"}
        </a>
      </Button>
    );
  }

  return (
    <div>
      <Button
        type="button"
        variant="accent"
        className="w-full"
        onClick={activate}
        disabled={loading}
      >
        {loading ? <LoaderCircle className="size-4 animate-spin" /> : <Power className="size-4" />}
        {ar ? "تفعيل الموظف" : "Activate employee"}
      </Button>
      {error ? <p className="mt-2 text-xs text-danger">{error}</p> : null}
    </div>
  );
}
