"use client";

import { useState } from "react";
import Image from "next/image";
import { Check } from "lucide-react";
import { setCollectionBooks } from "@/actions/collections";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import type { BookSummary } from "@/lib/types";

export function CollectionBooksPicker({
  collectionId,
  books,
  initialSelectedIds,
  itemNounPlural,
}: {
  collectionId: string;
  books: BookSummary[];
  initialSelectedIds: string[];
  itemNounPlural: string;
}) {
  const [selected, setSelected] = useState<string[]>(initialSelectedIds);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  function toggle(bookId: string) {
    setSelected((prev) =>
      prev.includes(bookId) ? prev.filter((id) => id !== bookId) : [...prev, bookId]
    );
  }

  async function handleSave() {
    setSaving(true);
    setSaved(false);
    await setCollectionBooks(collectionId, selected);
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5">
        {books.map((book) => {
          const isSelected = selected.includes(book.id);
          return (
            <button
              key={book.id}
              type="button"
              onClick={() => toggle(book.id)}
              className={cn(
                "relative flex flex-col overflow-hidden rounded-xl border-2 bg-white text-start",
                isSelected ? "border-brand ring-2 ring-brand/30" : "border-border"
              )}
            >
              <div className="relative aspect-square w-full">
                <Image src={book.coverImage} alt={book.title} fill sizes="120px" className="object-contain p-2" />
                {isSelected && (
                  <span className="absolute end-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-brand text-white">
                    <Check className="h-3 w-3" />
                  </span>
                )}
              </div>
              <p className="line-clamp-2 p-1.5 text-xs font-bold">{book.title}</p>
            </button>
          );
        })}
      </div>
      <Button onClick={handleSave} disabled={saving} className="self-start">
        {saving ? "جارِ الحفظ..." : saved ? "تم الحفظ ✓" : `حفظ ال${itemNounPlural} المختارة (${selected.length})`}
      </Button>
    </div>
  );
}
