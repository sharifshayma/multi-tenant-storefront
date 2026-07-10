import Link from "next/link";
import Image from "next/image";
import { prisma } from "@/lib/prisma";
import { Price } from "@/components/ui/Price";
import { getBookDemand } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function AdminBooksPage() {
  const [books, demand] = await Promise.all([
    prisma.book.findMany({
      orderBy: { position: "asc" },
      include: { _count: { select: { media: true } } },
    }),
    getBookDemand(),
  ]);

  const demandById = new Map(demand.map((d) => [d.id, d]));

  return (
    <div className="flex flex-col gap-10">
      <div className="flex flex-col gap-4">
        <div>
          <h1 className="text-2xl font-extrabold">سجل الطلب على الكتب</h1>
          <p className="mt-1 text-sm text-muted">
            ترتيب تنازلي حسب عدد مرات الطلب — يشمل الطلبات المباشرة وظهور الكتاب ضمن أي مجموعة (قد يُحسب الكتاب أكثر من
            مرة، وهذا مقصود لقياس الطلب الفعلي).
          </p>
        </div>
        {demand.every((d) => d.totalCount === 0) ? (
          <p className="text-muted">لا توجد طلبات بعد.</p>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-border bg-white">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-right text-muted">
                  <th className="p-3">#</th>
                  <th className="p-3">الكتاب</th>
                  <th className="p-3">طلبات مباشرة</th>
                  <th className="p-3">ضمن مجموعات</th>
                  <th className="p-3">الإجمالي</th>
                </tr>
              </thead>
              <tbody>
                {demand.map((d, i) => (
                  <tr key={d.id} className="border-b border-border last:border-0">
                    <td className="p-3 text-muted">{i + 1}</td>
                    <td className="p-3">
                      <Link
                        href={`/admin/books/${d.id}`}
                        className="flex items-center gap-3 font-bold text-brand hover:underline"
                      >
                        <span className="relative h-10 w-10 shrink-0 overflow-hidden rounded-lg border border-border bg-paper">
                          <Image src={d.coverImage} alt={d.title} fill sizes="40px" className="object-contain p-0.5" />
                        </span>
                        <span className="line-clamp-1">{d.title}</span>
                      </Link>
                    </td>
                    <td className="p-3">{d.directCount}</td>
                    <td className="p-3">{d.collectionCount}</td>
                    <td className="p-3 font-extrabold text-brand">{d.totalCount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="flex flex-col gap-4">
        <h2 className="text-xl font-extrabold">الكتب والوسائط</h2>
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
                  <span>طُلب {demandById.get(book.id)?.totalCount ?? 0} مرة</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
