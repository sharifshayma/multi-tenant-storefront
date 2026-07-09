import { getBooks, getCollections } from "@/lib/data";
import { BookCard } from "@/components/storefront/BookCard";
import { CollectionCard } from "@/components/storefront/CollectionCard";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [books, collections] = await Promise.all([getBooks(), getCollections()]);

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

      {collections.length > 0 && (
        <section className="mb-14">
          <h2 className="mb-5 text-xl font-extrabold text-ink sm:text-2xl">
            مجموعات بأسعار مميزة
          </h2>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 sm:gap-6 lg:grid-cols-5">
            {collections.map((collection) => (
              <CollectionCard key={collection.id} collection={collection} />
            ))}
          </div>
        </section>
      )}

      <section>
        <h2 className="mb-5 text-xl font-extrabold text-ink sm:text-2xl">
          الكتب الفردية
        </h2>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 sm:gap-6 lg:grid-cols-4">
          {books.map((book) => (
            <BookCard key={book.id} book={book} />
          ))}
        </div>
      </section>
    </div>
  );
}
