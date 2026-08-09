"use client";

import { useState } from "react";
import { Check } from "lucide-react";
import { useCart } from "@/lib/cart-context";
import { Button } from "@/components/ui/Button";
import type { CollectionSummary } from "@/lib/types";

export function AddCollectionToCartButton({
  collection,
  size = "lg",
}: {
  collection: CollectionSummary;
  size?: "sm" | "md" | "lg";
}) {
  const { addCollection } = useCart();
  const [added, setAdded] = useState(false);

  return (
    <Button
      size={size}
      onClick={() => {
        addCollection(
          {
            collectionId: collection.id,
            slug: collection.slug,
            title: collection.title,
            priceMinor: collection.priceMinor,
            isCustom: false,
            selectedBooks: collection.books,
          },
          1
        );
        setAdded(true);
        setTimeout(() => setAdded(false), 1500);
      }}
    >
      {added ? (
        <>
          <Check className="h-4 w-4" /> أُضيفت المجموعة
        </>
      ) : (
        "أضف المجموعة إلى السلة"
      )}
    </Button>
  );
}
