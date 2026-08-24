import Link from "next/link";
import {
  Bot,
  BrainCircuit,
  BriefcaseBusiness,
  Coins,
  CreditCard,
  FileBarChart,
  LayoutGrid,
  ListTodo,
  Settings,
} from "lucide-react";

export function WorkspaceNavigation({ locale }: { locale: "ar" | "en" }) {
  const ar = locale === "ar";
  const items = [
    [LayoutGrid, ar ? "الرئيسية" : "Overview", "dashboard"],
    [Bot, ar ? "الموظفون" : "Employees", "employees"],
    [BrainCircuit, ar ? "عقل الشركة" : "Company Brain", "brain"],
    [ListTodo, ar ? "المهام" : "Tasks", "tasks"],
    [BriefcaseBusiness, ar ? "المشاريع" : "Projects", "projects"],
    [FileBarChart, ar ? "التقارير" : "Reports", "reports"],
    [Coins, ar ? "الاستخدام" : "Usage", "usage"],
    [CreditCard, ar ? "الفوترة" : "Billing", "billing"],
    [Settings, ar ? "الخصوصية" : "Privacy", "settings/privacy"],
  ] as const;

  return (
    <nav
      className="hide-scrollbar mt-6 flex gap-1 overflow-x-auto rounded-2xl border bg-white/65 p-1.5"
      aria-label={ar ? "وحدات نظام الأعمال" : "Business OS modules"}
    >
      {items.map(([Icon, label, path]) => (
        <Link
          key={path}
          href={`/${locale}/${path}`}
          className="inline-flex min-h-10 shrink-0 items-center gap-2 rounded-xl px-3 text-xs font-semibold text-muted transition hover:bg-surface-soft hover:text-foreground"
        >
          <Icon className="size-4" />
          {label}
        </Link>
      ))}
    </nav>
  );
}
