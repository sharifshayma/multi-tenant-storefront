import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { BookEditForm } from "@/components/admin/BookEditForm";
import { MediaUploader } from "@/components/admin/MediaUploader";
import { MediaList } from "@/components/admin/MediaList";

export const dynamic = "force-dynamic";

export default async function AdminBookDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const book = await prisma.book.findUnique({
    where: { id },
    include: { media: { orderBy: { sortOrder: "asc" } } },
  });
  if (!book) notFound();

  return (
    <div className="flex flex-col gap-6">
      <Link
        href="/admin/books"
        className="flex items-center gap-1 text-sm font-bold text-muted hover:text-ink"
      >
        <ArrowRight className="h-4 w-4" />
        العودة إلى الكتب
      </Link>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-[auto_1fr]">
        <div className="relative h-40 w-40 shrink-0 overflow-hidden rounded-2xl border border-border bg-white">
          <Image
            src={book.coverImage}
            alt={book.title}
            fill
            sizes="160px"
            className="object-contain p-3"
          />
        </div>
        <BookEditForm
          bookId={book.id}
          title={book.title}
          description={book.description}
          priceNis={book.priceNis}
        />
      </div>

      <div className="rounded-2xl border border-border bg-white p-5">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-extrabold">صور وفيديوهات إضافية</h2>
          <MediaUploader bookId={book.id} />
        </div>
        <MediaList
          bookId={book.id}
          media={book.media.map((m) => ({
            id: m.id,
            type: m.type,
            url: m.url,
            sortOrder: m.sortOrder,
          }))}
        />
      </div>
    </div>
  );
}
