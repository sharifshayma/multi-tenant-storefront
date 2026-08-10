"use client";

import { useState } from "react";
import Image from "next/image";
import { Minus, Plus, Trash2 } from "lucide-react";
import { updateOrderItems } from "@/actions/orders";
import { Price } from "@/components/ui/Price";
import { Button } from "@/components/ui/Button";
import { formatMoney } from "@/lib/format-money";
import { useT } from "@/i18n/LocaleProvider";

type EditableBookLine = {
  bookId: string;
  title: string;
  coverImage: string;
  priceMinor: number;
  quantity: number;
};

type EditableCollectionLine = {
  id: string;
  title: string;
  unitPriceMinor: number;
  quantity: number;
  bookTitles: string[];
};

type SelectableBook = { id: string; title: string; priceMinor: number; coverImage: string };

export function OrderItemsEditor({
  orderId,
  initialItems,
  initialCollectionItems,
  allBooks,
  currency,
  locale,
  itemNounSingular,
  itemNounPlural,
}: {
  orderId: string;
  initialItems: EditableBookLine[];
  initialCollectionItems: EditableCollectionLine[];
  allBooks: SelectableBook[];
  currency: string;
  locale: string;
  itemNounSingular: string;
  itemNounPlural: string;
}) {
  const { t } = useT();
  const [items, setItems] = useState(initialItems);
  const [collectionItems, setCollectionItems] = useState(initialCollectionItems);
  const [addBookId, setAddBookId] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const total =
    items.reduce((sum, i) => sum + i.priceMinor * i.quantity, 0) +
    collectionItems.reduce((sum, c) => sum + c.unitPriceMinor * c.quantity, 0);

  function updateQty(bookId: string, qty: number) {
    setItems((prev) =>
      qty <= 0 ? prev.filter((i) => i.bookId !== bookId) : prev.map((i) => (i.bookId === bookId ? { ...i, quantity: qty } : i))
    );
  }

  function updateCollectionQty(id: string, qty: number) {
    setCollectionItems((prev) =>
      qty <= 0 ? prev.filter((c) => c.id !== id) : prev.map((c) => (c.id === id ? { ...c, quantity: qty } : c))
    );
  }

  function addBook() {
    const book = allBooks.find((b) => b.id === addBookId);
    if (!book) return;
    setItems((prev) => {
      const existing = prev.find((i) => i.bookId === book.id);
      if (existing) {
        return prev.map((i) => (i.bookId === book.id ? { ...i, quantity: i.quantity + 1 } : i));
      }
      return [...prev, { bookId: book.id, title: book.title, coverImage: book.coverImage, priceMinor: book.priceMinor, quantity: 1 }];
    });
    setAddBookId("");
  }

  async function handleSave() {
    setError(null);
    if (items.length === 0 && collectionItems.length === 0) {
      setError(t("admin.orders.items.minOneError", { item: itemNounSingular }));
      return;
    }
    setSaving(true);
    const result = await updateOrderItems({
      orderId,
      items: items.map((i) => ({ bookId: i.bookId, quantity: i.quantity })),
      collectionItems: collectionItems.map((c) => ({ id: c.id, quantity: c.quantity })),
    });
    setSaving(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  }

  return (
    <div className="rounded-2xl border border-border bg-white p-5">
      <h2 className="mb-3 font-extrabold">
        {t("admin.orders.itemsHeading", { plural: itemNounPlural })}
      </h2>

      {items.length === 0 && collectionItems.length === 0 && (
        <p className="text-sm text-muted">{t("admin.orders.items.empty")}</p>
      )}

      <div className="flex flex-col divide-y divide-border">
        {items.map((item) => (
          <div key={item.bookId} className="flex flex-wrap items-center gap-3 py-2">
            <span className="relative h-10 w-10 shrink-0 overflow-hidden rounded-lg border border-border bg-paper">
              <Image src={item.coverImage} alt="" fill sizes="40px" className="object-contain p-0.5" />
            </span>
            <span className="min-w-0 flex-1 truncate text-sm">{item.title}</span>
            <div className="flex items-center rounded-full border border-border">
              <button
                type="button"
                onClick={() => updateQty(item.bookId, item.quantity - 1)}
                className="flex h-8 w-8 items-center justify-center text-muted hover:text-ink"
              >
                <Minus className="h-3.5 w-3.5" />
              </button>
              <span className="w-6 text-center text-sm font-bold">{item.quantity}</span>
              <button
                type="button"
                onClick={() => updateQty(item.bookId, item.quantity + 1)}
                className="flex h-8 w-8 items-center justify-center text-muted hover:text-ink"
              >
                <Plus className="h-3.5 w-3.5" />
              </button>
            </div>
            <Price
              minor={item.priceMinor * item.quantity}
              currency={currency}
              locale={locale}
              className="w-16 shrink-0 text-end text-sm font-bold"
            />
            <button
              type="button"
              onClick={() => updateQty(item.bookId, 0)}
              className="shrink-0 text-muted hover:text-red-600"
              aria-label={t("admin.orders.items.remove")}
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        ))}

        {collectionItems.map((c) => (
          <div key={c.id} className="flex flex-col gap-1 py-2">
            <div className="flex flex-wrap items-center gap-3">
              <span className="min-w-0 flex-1 truncate text-sm font-bold">
                {c.title} {t("admin.orders.collectionSuffix")}
              </span>
              <div className="flex items-center rounded-full border border-border">
                <button
                  type="button"
                  onClick={() => updateCollectionQty(c.id, c.quantity - 1)}
                  className="flex h-8 w-8 items-center justify-center text-muted hover:text-ink"
                >
                  <Minus className="h-3.5 w-3.5" />
                </button>
                <span className="w-6 text-center text-sm font-bold">{c.quantity}</span>
                <button
                  type="button"
                  onClick={() => updateCollectionQty(c.id, c.quantity + 1)}
                  className="flex h-8 w-8 items-center justify-center text-muted hover:text-ink"
                >
                  <Plus className="h-3.5 w-3.5" />
                </button>
              </div>
              <Price
                minor={c.unitPriceMinor * c.quantity}
                currency={currency}
                locale={locale}
                className="w-16 shrink-0 text-end text-sm font-bold"
              />
              <button
                type="button"
                onClick={() => updateCollectionQty(c.id, 0)}
                className="shrink-0 text-muted hover:text-red-600"
                aria-label={t("admin.orders.items.remove")}
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
            <span className="text-xs text-muted">
              {c.bookTitles.join(t("store.cart.itemSeparator"))}
            </span>
          </div>
        ))}
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-border pt-3">
        <select
          value={addBookId}
          onChange={(e) => setAddBookId(e.target.value)}
          className="min-w-[160px] flex-1 rounded-xl border border-border bg-white px-3 py-2.5 text-sm outline-none focus:border-brand"
        >
          <option value="">{t("admin.orders.items.addPlaceholder", { item: itemNounSingular })}</option>
          {allBooks.map((b) => (
            <option key={b.id} value={b.id}>
              {b.title} — {formatMoney(b.priceMinor, currency, locale)}
            </option>
          ))}
        </select>
        <Button type="button" variant="ghost" size="sm" onClick={addBook} disabled={!addBookId}>
          {t("common.add")}
        </Button>
      </div>

      <p className="mt-2 text-xs text-muted">{t("admin.orders.items.collectionEditNote")}</p>

      <div className="mt-3 flex items-center justify-between border-t border-border pt-3 font-extrabold">
        <span>{t("admin.orders.items.newTotal")}</span>
        <Price minor={total} currency={currency} locale={locale} className="text-brand" />
      </div>

      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}

      <Button onClick={handleSave} disabled={saving} size="sm" className="mt-3">
        {saving ? t("common.saving") : saved ? t("common.savedCheck") : t("admin.orders.items.saveButton")}
      </Button>
    </div>
  );
}
