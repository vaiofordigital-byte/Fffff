import Link from "next/link";
import { Bot, BrainCircuit, ClipboardList, LayoutGrid, LineChart } from "lucide-react";
import type { Locale } from "@/lib/i18n";

export function MobileNavigation({ locale }: { locale: Locale }) {
  const ar = locale === "ar";
  const items = [
    { href: `/${locale}/dashboard`, label: ar ? "الرئيسية" : "Home", icon: LayoutGrid },
    { href: `/${locale}/employees`, label: ar ? "الموظفون" : "Employees", icon: Bot },
    { href: `/${locale}/tasks`, label: ar ? "المهام" : "Tasks", icon: ClipboardList },
    { href: `/${locale}/brain`, label: ar ? "العقل" : "Brain", icon: BrainCircuit },
    { href: `/${locale}/reports`, label: ar ? "التقارير" : "Reports", icon: LineChart },
  ];

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 border-t bg-white/94 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl md:hidden"
      aria-label={ar ? "التنقل السريع" : "Quick navigation"}
    >
      <div className="grid grid-cols-5">
        {items.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="flex min-h-16 flex-col items-center justify-center gap-1 text-[0.68rem] font-medium text-muted transition active:bg-surface-soft"
          >
            <item.icon className="size-5" aria-hidden="true" />
            {item.label}
          </Link>
        ))}
      </div>
    </nav>
  );
}
