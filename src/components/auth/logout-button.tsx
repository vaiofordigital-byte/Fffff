"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";

export function LogoutButton({ locale }: { locale: "ar" | "en" }) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      disabled={loading}
      onClick={async () => {
        setLoading(true);
        await fetch("/api/auth/logout", { method: "POST" });
        router.push(`/${locale}`);
        router.refresh();
      }}
    >
      <LogOut className="size-4" />
      {locale === "ar" ? "خروج" : "Sign out"}
    </Button>
  );
}
