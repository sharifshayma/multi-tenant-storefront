import { getBooks } from "@/lib/data";
import { BookCard } from "@/components/storefront/BookCard";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const books = await getBooks();

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <section className="mb-10 text-center">
        <h1 className="text-3xl font-extrabold text-ink sm:text-4xl">
          جذور عربية، أجنحة عالمية
        </h1>
        <p className="mx-auto mt-3 max-w-2xl text-muted">
          سلسلة كتب أطفال ثنائية اللغة (عربي-إنجليزي)، تروي قصص شخصيات عربية
          ألهمت العالم. كل كتاب بـ ٤٠ شيكل فقط — أضيفي الكتب إلى سلتك واملئي
          بياناتك، وسنتواصل معك هاتفياً لتنسيق التوصيل والدفع.
        </p>
      </section>

      <section className="grid grid-cols-2 gap-4 sm:grid-cols-3 sm:gap-6 lg:grid-cols-4">
        {books.map((book) => (
          <BookCard key={book.id} book={book} />
        ))}
      </section>
    </div>
  );
}
