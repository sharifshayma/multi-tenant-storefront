"use client";

import { useState } from "react";
import { Plus, Minus, Check } from "lucide-react";
import { useCart } from "@/lib/cart-context";
import { Button } from "@/components/ui/Button";
import type { BookSummary } from "@/lib/types";

export function AddToCartButton({
  book,
  size = "md",
}: {
  book: BookSummary;
  size?: "sm" | "md" | "lg";
}) {
  const { addItem } = useCart();
  const [added, setAdded] = useState(false);
  const [qty, setQty] = useState(1);

  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center rounded-full border border-border bg-white">
        <button
          type="button"
          onClick={() => setQty((q) => Math.max(1, q - 1))}
          className="flex h-9 w-9 items-center justify-center text-muted hover:text-ink"
          aria-label="إنقاص الكمية"
        >
          <Minus className="h-4 w-4" />
        </button>
        <span className="w-6 text-center font-bold">{qty}</span>
        <button
          type="button"
          onClick={() => setQty((q) => q + 1)}
          className="flex h-9 w-9 items-center justify-center text-muted hover:text-ink"
          aria-label="زيادة الكمية"
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>
      <Button
        size={size}
        onClick={() => {
          addItem(
            {
              bookId: book.id,
              slug: book.slug,
              title: book.title,
              coverImage: book.coverImage,
              priceNis: book.priceNis,
            },
            qty
          );
          setAdded(true);
          setQty(1);
          setTimeout(() => setAdded(false), 1500);
        }}
        className="flex-1"
      >
        {added ? (
          <>
            <Check className="h-4 w-4" /> أُضيف
          </>
        ) : (
          "أضف إلى السلة"
        )}
      </Button>
    </div>
  );
}
