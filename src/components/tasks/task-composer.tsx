"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Bot, LoaderCircle, LockKeyhole, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, Input, Select, Textarea } from "@/components/ui/field";

type EmployeeOption = {
  id: string;
  nameAr: string;
  nameEn: string;
  purposeAr: string;
  purposeEn: string;
  defaultCreditCost: number;
};

export function TaskComposer({
  locale,
  organizationId,
  employees,
  defaultEmployeeId,
  parentTaskId,
  projectId,
}: {
  locale: "ar" | "en";
  organizationId: string;
  employees: EmployeeOption[];
  defaultEmployeeId?: string;
  parentTaskId?: string;
  projectId?: string;
}) {
  const ar = locale === "ar";
  const [employeeId, setEmployeeId] = useState(defaultEmployeeId ?? employees[0]?.id ?? "");
  const [title, setTitle] = useState("");
  const [instruction, setInstruction] = useState("");
  const [privateMode, setPrivateMode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
  const selected = employees.find((employee) => employee.id === employeeId);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError("");
    const response = await fetch("/api/business-tasks", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Idempotency-Key": crypto.randomUUID(),
      },
      body: JSON.stringify({
        organizationId,
        aiEmployeeId: employeeId,
        title,
        instruction,
        locale,
        privateMode,
        parentTaskId,
        projectId,
      }),
    });
    const payload = (await response.json()) as {
      task?: { id?: string };
      error?: { code?: string };
    };
    setLoading(false);
    if (!response.ok || !payload.task?.id) {
      const code = payload.error?.code;
      setError(
        code === "AI_NOT_CONFIGURED"
          ? ar
            ? "مزود الذكاء الاصطناعي غير مهيأ. لن تُنشأ نتيجة وهمية."
            : "The AI provider is not configured. No fabricated result was created."
          : code === "INSUFFICIENT_CREDITS"
            ? ar
              ? "الرصيد غير كافٍ لهذه المهمة."
              : "There are not enough credits for this task."
            : ar
              ? "تعذر تنفيذ المهمة، ولم يُخصم الرصيد عند الفشل."
              : "The task failed and no credits were charged.",
      );
      return;
    }
    router.push(`/${locale}/tasks/${payload.task.id}`);
    router.refresh();
  }

  if (!employees.length) {
    return (
      <div className="premium-card p-8 text-center">
        <Bot className="mx-auto size-10 text-muted" />
        <h2 className="mt-4 text-xl font-bold">
          {ar ? "فعّل موظفاً أولاً" : "Activate an employee first"}
        </h2>
        <p className="mt-2 text-sm text-muted">
          {ar
            ? "المهام تُسند إلى موظف متخصص، وليست محادثة عامة."
            : "Tasks are assigned to specialized employees, not a generic chatbot."}
        </p>
        <Button asChild variant="accent" className="mt-5">
          <a href={`/${locale}/employees`}>{ar ? "اختيار الموظفين" : "Choose employees"}</a>
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="grid gap-5 lg:grid-cols-[1fr_20rem]">
      <section className="premium-card p-5 sm:p-7">
        <div className="flex items-center gap-3">
          <span className="grid size-11 place-items-center rounded-xl bg-[#eaf0ff] text-intelligence">
            <Sparkles className="size-5" />
          </span>
          <div>
            <h2 className="font-bold">{ar ? "صف نتيجة العمل" : "Describe the business outcome"}</h2>
            <p className="text-xs text-muted">
              {ar ? "سيستخدم الموظف معرفة الشركة المعتمدة فقط." : "The employee uses approved company knowledge only."}
            </p>
          </div>
        </div>
        <div className="mt-7 grid gap-5">
          <Field label={ar ? "عنوان المهمة" : "Task title"} htmlFor="task-title">
            <Input
              id="task-title"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              minLength={3}
              maxLength={191}
              required
              placeholder={ar ? "حملة رمضان للمطعم" : "Ramadan restaurant campaign"}
            />
          </Field>
          <Field label={ar ? "ماذا تريد أن ينجز؟" : "What should be accomplished?"} htmlFor="task-instruction" hint={`${instruction.length}/20000`}>
            <Textarea
              id="task-instruction"
              value={instruction}
              onChange={(event) => setInstruction(event.target.value)}
              minLength={12}
              maxLength={20_000}
              required
              className="min-h-72"
              placeholder={
                ar
                  ? "أنشئ حملة تسويق متكاملة لشهر رمضان لمطعمنا، مع الرسائل والقنوات وخطة المحتوى ومؤشرات القياس..."
                  : "Create a complete Ramadan marketing campaign for our restaurant, including messaging, channels, content plan and success measures..."
              }
            />
          </Field>
        </div>
      </section>

      <aside className="premium-card h-fit p-5 lg:sticky lg:top-24">
        <Field label={ar ? "الموظف المسؤول" : "Assigned employee"} htmlFor="task-employee">
          <Select
            id="task-employee"
            value={employeeId}
            onChange={(event) => setEmployeeId(event.target.value)}
          >
            {employees.map((employee) => (
              <option key={employee.id} value={employee.id}>
                {ar ? employee.nameAr : employee.nameEn}
              </option>
            ))}
          </Select>
        </Field>
        {selected ? (
          <div className="mt-4 rounded-xl bg-surface-soft p-4">
            <p className="text-xs leading-6 text-muted">
              {ar ? selected.purposeAr : selected.purposeEn}
            </p>
            <p className="mt-2 text-xs font-semibold">
              {selected.defaultCreditCost} {ar ? "رصيد عند النجاح" : "credits on success"}
            </p>
          </div>
        ) : null}
        <label className="mt-5 flex items-start gap-3 text-sm">
          <input
            type="checkbox"
            checked={privateMode}
            onChange={(event) => setPrivateMode(event.target.checked)}
            className="mt-1 size-4 accent-intelligence"
          />
          <span>
            <span className="flex items-center gap-1 font-semibold">
              <LockKeyhole className="size-3.5" />
              {ar ? "وضع خاص" : "Private mode"}
            </span>
            <span className="mt-1 block text-xs leading-5 text-muted">
              {ar
                ? "لا يُحفظ نص المهمة أو النتيجة، مع الاحتفاظ ببيانات تشغيل محدودة."
                : "Task text and output are not stored; minimal operational metadata remains."}
            </span>
          </span>
        </label>
        {error ? (
          <p className="mt-4 text-sm leading-6 text-danger" role="alert">
            {error}
          </p>
        ) : null}
        <Button
          type="submit"
          variant="accent"
          size="lg"
          className="mt-6 w-full"
          disabled={loading || title.length < 3 || instruction.length < 12}
        >
          {loading ? <LoaderCircle className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
          {ar ? "تنفيذ المهمة" : "Run task"}
        </Button>
      </aside>
    </form>
  );
}
