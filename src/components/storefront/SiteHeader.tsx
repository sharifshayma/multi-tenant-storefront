import Link from "next/link";
import { BookOpen } from "lucide-react";
import { storeHref } from "@/lib/store-href";
import { CartIcon } from "./CartIcon";

export function SiteHeader({ basePath }: { basePath: string }) {
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-paper/95 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
        <Link href={storeHref(basePath, "/")} className="flex items-center gap-2 text-brand">
          <BookOpen className="h-7 w-7" strokeWidth={2.5} />
          <span className="text-lg font-extrabold sm:text-xl">
            جذور عربية، أجنحة عالمية
          </span>
        </Link>
        <CartIcon basePath={basePath} />
      </div>
    </header>
  );
}
