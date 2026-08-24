import Link from "next/link";
import { FlaskConical, LayoutGrid, Library, Store, WandSparkles } from "lucide-react";
import type { Locale } from "@/lib/i18n";

export function MobileNavigation({ locale }: { locale: Locale }) {
  const ar = locale === "ar";
  const items = [
    { href: `/${locale}/marketplace`, label: ar ? "المتجر" : "Store", icon: Store },
    { href: `/${locale}/architect`, label: ar ? "إنشاء" : "Create", icon: WandSparkles },
    { href: `/${locale}/lab`, label: ar ? "المختبر" : "Lab", icon: FlaskConical },
    { href: `/${locale}/vault`, label: ar ? "المكتبة" : "Vault", icon: Library },
    { href: `/${locale}/dashboard`, label: ar ? "مساحتي" : "Workspace", icon: LayoutGrid },
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
