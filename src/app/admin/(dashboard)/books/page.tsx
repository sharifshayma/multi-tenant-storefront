import Link from "next/link";
import Image from "next/image";
import { prisma } from "@/lib/prisma";
import { Price } from "@/components/ui/Price";

export const dynamic = "force-dynamic";

export default async function AdminBooksPage() {
  const books = await prisma.book.findMany({
    orderBy: { position: "asc" },
    include: { _count: { select: { media: true } } },
  });

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-extrabold">الكتب والوسائط</h1>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {books.map((book) => (
          <Link
            key={book.id}
            href={`/admin/books/${book.id}`}
            className="flex items-center gap-4 rounded-2xl border border-border bg-white p-4 hover:shadow-md"
          >
            <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-paper">
              <Image
                src={book.coverImage}
                alt={book.title}
                fill
                sizes="64px"
                className="object-contain p-1"
              />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate font-bold">{book.title}</p>
              <div className="mt-1 flex items-center gap-3 text-sm text-muted">
                <Price nis={book.priceNis} />
                <span>{book._count.media} ملف وسائط إضافي</span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
