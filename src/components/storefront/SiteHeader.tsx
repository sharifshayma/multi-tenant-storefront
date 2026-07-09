import Link from "next/link";
import { BookOpen } from "lucide-react";
import { CartIcon } from "./CartIcon";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-paper/95 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2 text-brand">
          <BookOpen className="h-7 w-7" strokeWidth={2.5} />
          <span className="text-lg font-extrabold sm:text-xl">
            جذور عربية، أجنحة عالمية
          </span>
        </Link>
        <CartIcon />
      </div>
    </header>
  );
}
