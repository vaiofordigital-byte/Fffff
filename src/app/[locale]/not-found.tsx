import Link from "next/link";
import { SearchX } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="container-shell grid min-h-[32rem] place-items-center py-12">
      <div className="text-center">
        <SearchX className="mx-auto size-12 text-muted" />
        <h1 className="mt-5 text-3xl font-bold">Page not found</h1>
        <p className="mt-3 text-sm text-muted">
          الصفحة غير موجودة أو لم تعد منشورة.
        </p>
        <Button asChild variant="outline" className="mt-6">
          <Link href="/ar">PROMPTX</Link>
        </Button>
      </div>
    </div>
  );
}
