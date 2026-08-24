import type { Metadata } from "next";
import { ProductComposer } from "@/components/admin/product-composer";
import { hasRole, requireRole } from "@/lib/auth";
import { db } from "@/lib/db";
import { isLocale, type Locale } from "@/lib/i18n";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "New product",
  robots: { index: false, follow: false },
};

export default async function NewProductPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: raw } = await params;
  const locale: Locale = isLocale(raw) ? raw : "ar";
  const ar = locale === "ar";
  const user = await requireRole("PROMPT_EDITOR", locale);
  const categories = await db.category.findMany({
    where: { active: true },
    orderBy: { sortOrder: "asc" },
    select: { id: true, nameAr: true, nameEn: true },
  });

  return (
    <div className="container-shell py-10">
      <header className="mb-8">
        <p className="eyebrow">{ar ? "إدارة المحتوى التجاري" : "Commercial content management"}</p>
        <h1 className="mt-2 text-3xl font-bold">{ar ? "منتج برومبت جديد" : "New prompt product"}</h1>
      </header>
      <ProductComposer
        locale={locale}
        categories={categories}
        canPublish={hasRole(user.role, "ADMINISTRATOR")}
      />
    </div>
  );
}
