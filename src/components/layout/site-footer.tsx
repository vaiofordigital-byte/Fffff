import Link from "next/link";
import { ArrowUpLeft, ArrowUpRight } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import type { Locale } from "@/lib/i18n";

export function SiteFooter({ locale }: { locale: Locale }) {
  const ar = locale === "ar";
  const Arrow = ar ? ArrowUpLeft : ArrowUpRight;
  const groups = [
    {
      title: ar ? "المنتج" : "Product",
      links: [
        [ar ? "موظفو AI" : "AI Employees", "employees"],
        [ar ? "عقل الشركة" : "Company Brain", "brain"],
        [ar ? "سير العمل" : "Workflows", "workflows"],
        [ar ? "الأسعار" : "Pricing", "pricing"],
      ],
    },
    {
      title: ar ? "الموارد" : "Resources",
      links: [
        [ar ? "مركز المعرفة" : "Insights", "blog"],
        [ar ? "حلول القطاعات" : "Industry solutions", "industries"],
        [ar ? "مركز المساعدة" : "Help center", "help"],
        [ar ? "حالة الخدمة" : "Service status", "status"],
      ],
    },
    {
      title: ar ? "الشركة" : "Company",
      links: [
        [ar ? "عن EVELIA" : "About EVELIA", "about"],
        [ar ? "الخصوصية" : "Privacy", "privacy"],
        [ar ? "الشروط" : "Terms", "terms"],
        [ar ? "سياسة استخدام AI" : "AI usage policy", "licenses"],
      ],
    },
  ];

  return (
    <footer className="mt-24 border-t bg-[#171916] text-white">
      <div className="container-shell py-14">
        <div className="grid gap-12 md:grid-cols-[1.4fr_2fr]">
          <div>
            <Logo locale={locale} className="[&>span:first-of-type]:bg-white [&>span:first-of-type]:text-foreground" />
            <p className="mt-5 max-w-sm text-sm leading-7 text-white/60">
              {ar
                ? "نظام تشغيل أعمال عربي أولاً يمنح شركتك موظفين أذكياء يفهمون سياقها ويعملون معها."
                : "An Arabic-first business operating system that gives every company an AI workforce grounded in its knowledge."}
            </p>
          </div>
          <div className="grid grid-cols-2 gap-8 sm:grid-cols-3">
            {groups.map((group) => (
              <div key={group.title}>
                <h2 className="text-sm font-semibold">{group.title}</h2>
                <ul className="mt-4 grid gap-3 text-sm text-white/55">
                  {group.links.map(([label, slug]) => (
                    <li key={slug}>
                      <Link
                        href={`/${locale}/${slug}`}
                        className="inline-flex items-center gap-1.5 transition hover:text-white"
                      >
                        {label}
                        <Arrow className="size-3" aria-hidden="true" />
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
        <div className="mt-12 flex flex-wrap items-center justify-between gap-4 border-t border-white/10 pt-6 text-xs text-white/45">
          <p>© {new Date().getFullYear()} EVELIA Intelligence</p>
          <p>
            {ar
              ? "مؤشر ذكاء الأعمال تقييم إرشادي وليس مقياساً علمياً."
              : "Business Intelligence Score is a guidance indicator, not a scientific measure."}
          </p>
        </div>
      </div>
    </footer>
  );
}
