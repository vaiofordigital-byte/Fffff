"use client";

import { useEffect } from "react";

export function SearchTracker({
  query,
  resultCount,
  locale,
}: {
  query?: string;
  resultCount: number;
  locale: "ar" | "en";
}) {
  useEffect(() => {
    if (!query?.trim()) return;
    const controller = new AbortController();
    fetch("/api/analytics/search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query, resultCount, locale }),
      signal: controller.signal,
      keepalive: true,
    }).catch(() => undefined);
    return () => controller.abort();
  }, [locale, query, resultCount]);
  return null;
}
