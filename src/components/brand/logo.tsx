import Link from "next/link";
import { Orbit } from "lucide-react";
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
      aria-label="EVELIA"
    >
      <span className="grid size-9 place-items-center rounded-xl bg-foreground text-white shadow-lg transition group-hover:-rotate-3">
        <Orbit className="size-4 text-[#75a7ff]" aria-hidden="true" />
      </span>
      {compact ? null : (
        <span className="text-lg font-bold tracking-[-0.045em]" dir="ltr">
          EVELIA<span className="ms-1 text-[0.58rem] font-semibold tracking-[0.12em] text-intelligence">INTELLIGENCE</span>
        </span>
      )}
    </Link>
  );
}
