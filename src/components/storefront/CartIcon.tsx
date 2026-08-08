"use client";

import Link from "next/link";
import { ShoppingBag } from "lucide-react";
import { useCart } from "@/lib/cart-context";
import { storeHref } from "@/lib/store-href";

export function CartIcon({ basePath }: { basePath: string }) {
  const { totalCount } = useCart();

  return (
    <Link
      href={storeHref(basePath, "/cart")}
      className="relative flex h-11 w-11 items-center justify-center rounded-full bg-white border border-border text-brand hover:bg-brand/5"
      aria-label="السلة"
    >
      <ShoppingBag className="h-5 w-5" />
      {totalCount > 0 && (
        <span className="absolute -top-1 -end-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-brand px-1 text-xs font-bold text-white">
          {totalCount}
        </span>
      )}
    </Link>
  );
}
