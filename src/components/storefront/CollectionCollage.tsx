import Image from "next/image";
import { Sparkles } from "lucide-react";
import type { CollectionBookRef } from "@/lib/types";

export function CollectionCollage({
  books,
  isCustom,
}: {
  books: CollectionBookRef[];
  isCustom?: boolean;
}) {
  if (isCustom || books.length === 0) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-gold/20 to-brand/10">
        <Sparkles className="h-12 w-12 text-brand" strokeWidth={1.5} />
      </div>
    );
  }

  const tiles = books.slice(0, 4);

  return (
    <div className="grid h-full w-full grid-cols-2 grid-rows-2 gap-0.5 bg-border">
      {tiles.map((book) => (
        <div key={book.bookId} className="relative bg-white">
          <Image
            src={book.coverImage}
            alt={book.title}
            fill
            sizes="150px"
            className="object-cover"
          />
        </div>
      ))}
    </div>
  );
}
