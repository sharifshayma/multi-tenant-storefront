"use client";

import { useState, useTransition } from "react";
import { Archive, ArchiveRestore } from "lucide-react";
import { setBookArchived } from "@/actions/books";
import { cn } from "@/lib/utils";

export function ArchiveToggleButton({
  bookId,
  isArchived: initialArchived,
}: {
  bookId: string;
  isArchived: boolean;
}) {
  const [archived, setArchived] = useState(initialArchived);
  const [pending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => {
        const next = !archived;
        setArchived(next);
        startTransition(() => {
          setBookArchived(bookId, next);
        });
      }}
      className={cn(
        "flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm font-bold disabled:opacity-50",
        archived
          ? "border-accent/30 bg-accent/10 text-accent hover:bg-accent/20"
          : "border-border text-muted hover:bg-black/5"
      )}
    >
      {archived ? <ArchiveRestore className="h-3.5 w-3.5" /> : <Archive className="h-3.5 w-3.5" />}
      {archived ? "إلغاء الأرشفة" : "أرشفة الكتاب"}
    </button>
  );
}
