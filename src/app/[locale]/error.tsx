"use client";

import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ErrorPage({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const ar =
    typeof document !== "undefined" && document.documentElement.lang === "ar";

  return (
    <div className="container-shell grid min-h-[32rem] place-items-center py-12">
      <div className="premium-card max-w-md p-8 text-center">
        <AlertTriangle className="mx-auto size-10 text-danger" />
        <h1 className="mt-5 text-2xl font-bold">
          {ar ? "تعذر تحميل هذه المساحة" : "This workspace could not be loaded"}
        </h1>
        <p className="mt-3 text-sm leading-7 text-muted">
          {ar
            ? "لم تُعرض بيانات غير مكتملة. أعد المحاولة بعد التحقق من الاتصال."
            : "No partial data was displayed. Try again after checking the connection."}
        </p>
        <Button type="button" className="mt-6" onClick={reset}>
          {ar ? "إعادة المحاولة" : "Try again"}
        </Button>
      </div>
    </div>
  );
}
