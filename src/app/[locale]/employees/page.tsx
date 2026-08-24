import type { Metadata } from "next";
import {
  BarChart3,
  Bot,
  Headphones,
  Megaphone,
  PenTool,
  ShoppingBag,
  TrendingUp,
} from "lucide-react";
import { ActivationButton } from "@/components/employees/activation-button";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { isLocale, type Locale } from "@/lib/i18n";
import { getOrganizationMembership } from "@/lib/organizations";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale: raw } = await params;
  const locale = isLocale(raw) ? raw : "ar";
  return {
    title: locale === "ar" ? "موظفو الذكاء الاصطناعي" : "AI Business Employees",
    description:
      locale === "ar"
        ? "فعّل موظفين أذكياء متخصصين في التسويق والمبيعات وخدمة العملاء والمحتوى والتجارة وتحليل الأعمال."
        : "Activate specialized AI employees for marketing, sales, support, content, commerce and business analysis.",
  };
}

const icons = {
  MARKETING_MANAGER: Megaphone,
  CUSTOMER_SERVICE_MANAGER: Headphones,
  SALES_ASSISTANT: TrendingUp,
  CONTENT_CREATOR: PenTool,
  ECOMMERCE_MANAGER: ShoppingBag,
  BUSINESS_ANALYST: BarChart3,
  INDUSTRY_SPECIALIST: Bot,
};

export default async function EmployeesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: raw } = await params;
  const locale: Locale = isLocale(raw) ? raw : "ar";
  const ar = locale === "ar";
  const user = await getCurrentUser();
  const membership = user ? await getOrganizationMembership(user.id) : null;
  const employees = await db.aiEmployee.findMany({
    where: { active: true },
    orderBy: { sortOrder: "asc" },
    include: {
      activations: {
        where: {
          organizationId: membership?.organizationId ?? "__none__",
          status: "ACTIVE",
        },
        select: { id: true },
      },
    },
  });

  return (
    <div className="container-shell py-12 sm:py-16">
      <header className="max-w-3xl">
        <p className="eyebrow">{ar ? "فريق يعمل وفق معرفة شركتك" : "A workforce grounded in your company"}</p>
        <h1 className="text-balance mt-3 text-4xl font-bold tracking-[-0.04em] sm:text-6xl">
          {ar ? "موظفون أذكياء لأعمال حقيقية" : "AI employees for real business work"}
        </h1>
        <p className="mt-5 text-base leading-8 text-muted">
          {ar
            ? "كل موظف له دور واضح وصلاحيات معرفة وتكلفة استخدام قابلة للإدارة. لا توجد شخصية عامة تدّعي معرفة كل شيء."
            : "Every employee has a defined role, knowledge requirements and configurable usage cost—never a generic know-it-all bot."}
        </p>
      </header>

      <div className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
        {employees.map((employee) => {
          const Icon = icons[employee.type];
          const capabilities = employee.capabilities as {
            ar?: string[];
            en?: string[];
          };
          const values = (ar ? capabilities.ar : capabilities.en) ?? [];
          return (
            <article
              key={employee.id}
              className="premium-card flex min-h-[28rem] flex-col overflow-hidden"
            >
              <div className="bg-[#181b1f] p-6 text-white">
                <span className="grid size-11 place-items-center rounded-xl border border-white/10 bg-white/5">
                  <Icon className="size-5 text-[#75a7ff]" />
                </span>
                <p className="mt-7 text-xs font-semibold uppercase tracking-wider text-[#75a7ff]">
                  {employee.type.replaceAll("_", " ")}
                </p>
                <h2 className="mt-2 text-xl font-bold">
                  {ar ? employee.nameAr : employee.nameEn}
                </h2>
                <p className="mt-3 text-sm leading-6 text-white/58">
                  {ar ? employee.purposeAr : employee.purposeEn}
                </p>
              </div>
              <div className="flex flex-1 flex-col p-6">
                <h3 className="text-xs font-bold text-muted">
                  {ar ? "ما الذي ينجزه؟" : "What it can do"}
                </h3>
                <ul className="mt-4 grid gap-2 text-sm">
                  {values.slice(0, 5).map((capability) => (
                    <li key={capability} className="flex items-center gap-2">
                      <span className="size-1.5 rounded-full bg-intelligence" />
                      {capability}
                    </li>
                  ))}
                </ul>
                <div className="mt-auto pt-6">
                  <div className="mb-4 flex items-center justify-between border-t pt-4 text-xs text-muted">
                    <span>{ar ? "تكلفة المهمة الافتراضية" : "Default task cost"}</span>
                    <strong className="text-foreground">
                      {employee.defaultCreditCost} {ar ? "رصيد" : "credits"}
                    </strong>
                  </div>
                  <ActivationButton
                    locale={locale}
                    employeeId={employee.id}
                    organizationId={membership?.organizationId}
                    active={Boolean(employee.activations.length)}
                  />
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
