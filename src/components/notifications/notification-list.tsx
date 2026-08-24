"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Bell, CheckCheck } from "lucide-react";
import { Button } from "@/components/ui/button";

type NotificationItem = {
  id: string;
  type: string;
  titleAr: string;
  titleEn: string;
  bodyAr: string;
  bodyEn: string;
  actionUrl: string | null;
  readAt: Date | null;
  createdAt: Date;
};

export function NotificationList({
  locale,
  notifications,
}: {
  locale: "ar" | "en";
  notifications: NotificationItem[];
}) {
  const ar = locale === "ar";
  const router = useRouter();

  async function markAllRead() {
    await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ all: true }),
    });
    router.refresh();
  }

  return (
    <div>
      <div className="flex justify-end">
        <Button type="button" variant="ghost" size="sm" onClick={markAllRead}>
          <CheckCheck className="size-4" />
          {ar ? "تعليم الكل كمقروء" : "Mark all read"}
        </Button>
      </div>
      {notifications.length ? (
        <div className="premium-card mt-3 overflow-hidden">
          <div className="divide-y">
            {notifications.map((item) => {
              const content = (
                <div className={`p-5 ${item.readAt ? "opacity-65" : "bg-[#f8faff]"}`}>
                  <div className="flex items-start gap-4">
                    <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-[#eaf0ff] text-intelligence">
                      <Bell className="size-4" />
                    </span>
                    <div>
                      <p className="text-xs font-semibold text-intelligence">{item.type}</p>
                      <h2 className="mt-1 text-sm font-bold">{ar ? item.titleAr : item.titleEn}</h2>
                      <p className="mt-2 text-xs leading-6 text-muted">{ar ? item.bodyAr : item.bodyEn}</p>
                      <p className="mt-2 text-[0.68rem] text-muted">
                        {new Intl.DateTimeFormat(ar ? "ar-SA" : "en", {
                          dateStyle: "medium",
                          timeStyle: "short",
                        }).format(new Date(item.createdAt))}
                      </p>
                    </div>
                  </div>
                </div>
              );
              return item.actionUrl ? (
                <Link
                  key={item.id}
                  href={`/${locale}${item.actionUrl.startsWith("/") ? item.actionUrl : `/${item.actionUrl}`}`}
                  className="block hover:bg-surface-soft/40"
                >
                  {content}
                </Link>
              ) : (
                <div key={item.id}>{content}</div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="premium-card mt-3 p-10 text-center">
          <Bell className="mx-auto size-10 text-muted" />
          <p className="mt-4 text-sm text-muted">
            {ar ? "لا توجد إشعارات." : "No notifications."}
          </p>
        </div>
      )}
    </div>
  );
}
