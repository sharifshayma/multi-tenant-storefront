"use client";

import { useState } from "react";
import { Plus, Minus, Check } from "lucide-react";
import { useCart } from "@/lib/cart-context";
import { Button } from "@/components/ui/Button";
import { useT } from "@/i18n/LocaleProvider";
import type { BookSummary } from "@/lib/types";

export function AddToCartButton({
  book,
  size = "md",
  compact = false,
}: {
  book: BookSummary;
  size?: "sm" | "md" | "lg";
  /** Compact mode: single full-width button, no quantity stepper. Use in cards/grids where space is tight. */
  compact?: boolean;
}) {
  const { t } = useT();
  const { addBook } = useCart();
  const [added, setAdded] = useState(false);
  const [qty, setQty] = useState(1);

  function handleAdd(quantity: number) {
    addBook(
      {
        bookId: book.id,
        slug: book.slug,
        title: book.title,
        coverImage: book.coverImage,
        priceMinor: book.priceMinor,
      },
      quantity
    );
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  }

  if (compact) {
    return (
      <Button size={size} onClick={() => handleAdd(1)} className="w-full">
        {added ? (
          <>
            <Check className="h-4 w-4 shrink-0" /> {t("store.added")}
          </>
        ) : (
          t("store.addToCart")
        )}
      </Button>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center rounded-full border border-border bg-card">
        <button
          type="button"
          onClick={() => setQty((q) => Math.max(1, q - 1))}
          className="flex h-11 w-11 items-center justify-center text-muted hover:text-ink"
          aria-label={t("store.decreaseQty")}
        >
          <Minus className="h-4 w-4" />
        </button>
        <span className="w-6 text-center font-bold">{qty}</span>
        <button
          type="button"
          onClick={() => setQty((q) => q + 1)}
          className="flex h-11 w-11 items-center justify-center text-muted hover:text-ink"
          aria-label={t("store.increaseQty")}
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>
      <Button
        size={size}
        onClick={() => {
          handleAdd(qty);
          setQty(1);
        }}
        className="flex-1"
      >
        {added ? (
          <>
            <Check className="h-4 w-4 shrink-0" /> {t("store.added")}
          </>
        ) : (
          t("store.addToCart")
        )}
      </Button>
    </div>
  );
}
