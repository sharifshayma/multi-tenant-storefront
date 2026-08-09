"use client";

import { useState } from "react";
import Image from "next/image";
import { Check } from "lucide-react";
import { useCart } from "@/lib/cart-context";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import type { BookSummary, CollectionSummary } from "@/lib/types";

export function BundleBuilder({
  collection,
  books,
}: {
  collection: CollectionSummary;
  books: BookSummary[];
}) {
  const { addCollection } = useCart();
  const requiredCount = collection.requiredCount ?? 5;
  const [selected, setSelected] = useState<string[]>([]);
  const [added, setAdded] = useState(false);

  function toggle(bookId: string) {
    setSelected((prev) => {
      if (prev.includes(bookId)) return prev.filter((id) => id !== bookId);
      if (prev.length >= requiredCount) return prev;
      return [...prev, bookId];
    });
  }

  const isComplete = selected.length === requiredCount;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-gold/40 bg-gold/10 p-4">
        <p className="font-bold">
          المحدد: <span className="text-brand">{selected.length}</span> / {requiredCount}
        </p>
        <Button
          disabled={!isComplete}
          onClick={() => {
            const selectedBooks = books
              .filter((b) => selected.includes(b.id))
              .map((b) => ({ bookId: b.id, slug: b.slug, title: b.title, coverImage: b.coverImage }));
            addCollection(
              {
                collectionId: collection.id,
                slug: collection.slug,
                title: collection.title,
                priceMinor: collection.priceMinor,
                isCustom: true,
                selectedBooks,
              },
              1
            );
            setSelected([]);
            setAdded(true);
            setTimeout(() => setAdded(false), 1500);
          }}
        >
          {added ? (
            <>
              <Check className="h-4 w-4" /> أُضيفت
            </>
          ) : (
            "أضف إلى السلة"
          )}
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
        {books.map((book) => {
          const isSelected = selected.includes(book.id);
          const disabled = !isSelected && selected.length >= requiredCount;
          return (
            <button
              key={book.id}
              type="button"
              disabled={disabled}
              onClick={() => toggle(book.id)}
              className={cn(
                "relative flex flex-col overflow-hidden rounded-xl border-2 bg-white text-start transition disabled:opacity-40",
                isSelected ? "border-brand ring-2 ring-brand/30" : "border-border"
              )}
            >
              <div className="relative aspect-square w-full">
                <Image
                  src={book.coverImage}
                  alt={book.title}
                  fill
                  sizes="150px"
                  className="object-contain p-2"
                />
                {isSelected && (
                  <span className="absolute end-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-brand text-white">
                    <Check className="h-4 w-4" />
                  </span>
                )}
              </div>
              <p className="line-clamp-2 p-2 text-xs font-bold">{book.title}</p>
            </button>
          );
        })}
      </div>
    </div>
  );
}
