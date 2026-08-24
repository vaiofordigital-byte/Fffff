"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { FolderPlus, LoaderCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/field";

export function CollectionCreator({ locale }: { locale: "ar" | "en" }) {
  const ar = locale === "ar";
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function create(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    const response = await fetch("/api/collections", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    setLoading(false);
    if (!response.ok) return;
    setName("");
    setOpen(false);
    router.refresh();
  }

  return (
    <div className="relative">
      <Button type="button" variant="ghost" size="sm" onClick={() => setOpen((value) => !value)}>
        <FolderPlus className="size-4" />
        {ar ? "مجموعة" : "Collection"}
      </Button>
      {open ? (
        <form
          onSubmit={create}
          className="absolute end-0 top-12 z-10 w-72 rounded-2xl border bg-white p-4 shadow-2xl"
        >
          <label htmlFor="collection-name" className="text-xs font-semibold">
            {ar ? "اسم المجموعة" : "Collection name"}
          </label>
          <Input
            id="collection-name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            minLength={2}
            maxLength={120}
            required
            autoFocus
            className="mt-2"
          />
          <div className="mt-3 flex gap-2">
            <Button type="submit" size="sm" disabled={loading || name.trim().length < 2}>
              {loading ? <LoaderCircle className="size-4 animate-spin" /> : null}
              {ar ? "إنشاء" : "Create"}
            </Button>
            <Button type="button" size="sm" variant="ghost" onClick={() => setOpen(false)}>
              {ar ? "إلغاء" : "Cancel"}
            </Button>
          </div>
        </form>
      ) : null}
    </div>
  );
}
