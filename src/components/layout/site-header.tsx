import Link from "next/link";
import { Bell, ChevronDown, Languages, Menu } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { getCurrentUser } from "@/lib/auth";
import { getDictionary, type Locale } from "@/lib/i18n";

export async function SiteHeader({ locale }: { locale: Locale }) {
  const dictionary = getDictionary(locale);
  const user = await getCurrentUser();
  const targetLocale = locale === "ar" ? "en" : "ar";
  const links = [
    { href: `/${locale}/employees`, label: dictionary.nav.employees },
    { href: `/${locale}/industries`, label: dictionary.nav.industries },
    { href: `/${locale}/workflows`, label: dictionary.nav.workflows },
    { href: `/${locale}/pricing`, label: dictionary.nav.pricing },
  ];

  return (
    <header className="sticky top-0 z-50 border-b border-line/70 bg-background/88 backdrop-blur-xl">
      <div className="container-shell flex h-18 items-center justify-between gap-5">
        <Logo locale={locale} />

        <nav className="hidden items-center gap-1 lg:flex" aria-label="Primary navigation">
          {links.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-lg px-3 py-2 text-sm font-medium text-muted transition hover:bg-white hover:text-foreground"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-2 md:flex">
          <Button asChild variant="ghost" size="sm">
            <Link href={`/${targetLocale}`} hrefLang={targetLocale}>
              <Languages className="size-4" aria-hidden="true" />
              {targetLocale === "ar" ? "العربية" : "English"}
            </Link>
          </Button>
          {user ? (
            <>
              <Button asChild variant="ghost" size="icon">
                <Link href={`/${locale}/notifications`} aria-label={locale === "ar" ? "الإشعارات" : "Notifications"}>
                  <Bell className="size-4" />
                </Link>
              </Button>
              <Button asChild size="sm">
                <Link href={`/${locale}/dashboard`}>
                  {user.profile?.displayName || dictionary.nav.dashboard}
                  <ChevronDown className="size-3.5" aria-hidden="true" />
                </Link>
              </Button>
            </>
          ) : (
            <>
              <Button asChild variant="ghost" size="sm">
                <Link href={`/${locale}/login`}>{dictionary.nav.signIn}</Link>
              </Button>
              <Button asChild variant="accent" size="sm">
                <Link href={`/${locale}/register`}>{dictionary.nav.getStarted}</Link>
              </Button>
            </>
          )}
        </div>

        <details className="group relative md:hidden">
          <summary className="grid size-11 list-none place-items-center rounded-xl border bg-white [&::-webkit-details-marker]:hidden">
            <Menu className="size-5" aria-hidden="true" />
            <span className="sr-only">Menu</span>
          </summary>
          <div className="absolute top-14 end-0 w-[min(20rem,calc(100vw-1.25rem))] rounded-2xl border bg-white p-3 shadow-2xl">
            <nav className="grid gap-1">
              {links.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="rounded-xl px-4 py-3 text-sm font-medium hover:bg-surface-soft"
                >
                  {item.label}
                </Link>
              ))}
              <div className="my-2 border-t" />
              <Link
                href={`/${targetLocale}`}
                className="rounded-xl px-4 py-3 text-sm font-medium hover:bg-surface-soft"
              >
                {targetLocale === "ar" ? "العربية" : "English"}
              </Link>
              <Link
                href={user ? `/${locale}/dashboard` : `/${locale}/login`}
                className="rounded-xl bg-foreground px-4 py-3 text-center text-sm font-semibold text-white"
              >
                {user ? dictionary.nav.dashboard : dictionary.nav.signIn}
              </Link>
            </nav>
          </div>
        </details>
      </div>
    </header>
  );
}
