import Link from "next/link";
import { Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

export function Logo({
  locale = "ar",
  compact = false,
  className,
}: {
  locale?: "ar" | "en";
  compact?: boolean;
  className?: string;
}) {
  return (
    <Link
      href={`/${locale}`}
      className={cn("group inline-flex items-center gap-2.5", className)}
      aria-label="PROMPTX"
    >
      <span className="grid size-9 place-items-center rounded-xl bg-foreground text-white shadow-lg transition group-hover:-rotate-3">
        <Sparkles className="size-4" aria-hidden="true" />
      </span>
      {compact ? null : (
        <span className="text-lg font-bold tracking-[-0.045em]" dir="ltr">
          PROMPT<span className="text-accent">X</span>
        </span>
      )}
    </Link>
  );
}
