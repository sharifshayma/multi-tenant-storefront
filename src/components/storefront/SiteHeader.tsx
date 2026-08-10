import Link from "next/link";
import Image from "next/image";
import { ShoppingBag } from "lucide-react";
import { storeHref } from "@/lib/store-href";
import { CartIcon } from "./CartIcon";

export function SiteHeader({
  basePath,
  name,
  logoUrl,
}: {
  basePath: string;
  name: string;
  logoUrl: string | null;
}) {
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-paper/95 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
        <Link href={storeHref(basePath, "/")} className="flex items-center gap-2 text-brand">
          {logoUrl ? (
            <span className="relative h-8 w-8 shrink-0 overflow-hidden rounded-lg">
              <Image src={logoUrl} alt={name} fill sizes="32px" className="object-contain" />
            </span>
          ) : (
            <ShoppingBag className="h-7 w-7" strokeWidth={2.5} />
          )}
          <span className="text-lg font-extrabold sm:text-xl">{name}</span>
        </Link>
        <CartIcon basePath={basePath} />
      </div>
    </header>
  );
}
