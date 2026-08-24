import type { Metadata } from "next";
import { NotificationList } from "@/components/notifications/notification-list";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { isLocale, type Locale } from "@/lib/i18n";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Notifications",
  robots: { index: false, follow: false },
};

export default async function NotificationsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: raw } = await params;
  const locale: Locale = isLocale(raw) ? raw : "ar";
  const ar = locale === "ar";
  const user = await requireUser(locale);
  const notifications = await db.notification.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  return (
    <div className="container-shell py-10 sm:py-14">
      <header>
        <p className="eyebrow">{ar ? "مركز التنبيهات" : "Notification center"}</p>
        <h1 className="mt-2 text-4xl font-bold tracking-[-0.04em]">
          {ar ? "الإشعارات" : "Notifications"}
        </h1>
      </header>
      <div className="mt-6">
        <NotificationList locale={locale} notifications={notifications} />
      </div>
    </div>
  );
}
