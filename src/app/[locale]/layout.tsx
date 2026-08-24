import type { Metadata, Viewport } from "next";
import { notFound } from "next/navigation";
import "../globals.css";
import { MobileNavigation } from "@/components/layout/mobile-navigation";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { direction, isLocale, type Locale } from "@/lib/i18n";
import { publicEnv } from "@/lib/env";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: "#f8f7f3",
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale: rawLocale } = await params;
  const locale: Locale = isLocale(rawLocale) ? rawLocale : "ar";
  const arabic = locale === "ar";

  return {
    metadataBase: new URL(publicEnv.appUrl),
    title: {
      default: arabic
        ? "PROMPTX | نظام تشغيل البرومبتات الاحترافية"
        : "PROMPTX | Professional Prompt Operating System",
      template: `%s | PROMPTX`,
    },
    description: arabic
      ? "أنشئ وحسّن ونظّم برومبتات احترافية تحول أفكارك إلى تعليمات ذكية ونتائج أفضل."
      : "Create, optimize and organize professional prompts that turn ideas into intelligent instructions and better results.",
    alternates: {
      canonical: `/${locale}`,
      languages: { ar: "/ar", en: "/en" },
    },
    openGraph: {
      type: "website",
      locale: arabic ? "ar_SA" : "en_US",
      siteName: "PROMPTX",
      title: arabic
        ? "PROMPTX — نتائج احترافية تبدأ بتعليمات أفضل"
        : "PROMPTX — Professional results start with better instructions",
      description: arabic
        ? "نظام عربي متكامل لإنشاء وتحسين وإدارة البرومبتات."
        : "An Arabic-first system to create, improve and manage prompts.",
    },
    robots: { index: true, follow: true },
  };
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale: rawLocale } = await params;
  if (!isLocale(rawLocale)) notFound();
  const locale = rawLocale;

  return (
    <html lang={locale} dir={direction(locale)}>
      <body className="pb-16 md:pb-0">
        <a
          href="#main-content"
          className="fixed start-4 top-3 z-[100] -translate-y-20 rounded-lg bg-foreground px-4 py-2 text-sm text-white focus:translate-y-0"
        >
          {locale === "ar" ? "انتقل إلى المحتوى" : "Skip to content"}
        </a>
        <SiteHeader locale={locale} />
        <main id="main-content">{children}</main>
        <SiteFooter locale={locale} />
        <MobileNavigation locale={locale} />
      </body>
    </html>
  );
}
