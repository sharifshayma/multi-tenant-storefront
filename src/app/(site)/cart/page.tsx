"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Minus, Plus, Trash2, Package } from "lucide-react";
import { useCart } from "@/lib/cart-context";
import { Price } from "@/components/ui/Price";
import { Button } from "@/components/ui/Button";
import { Input, Textarea } from "@/components/ui/Input";
import { checkoutSchema } from "@/lib/validations";
import { createOrder } from "@/actions/orders";

export default function CartPage() {
  const { items, updateQty, removeItem, totalNis, clear, hydrated } = useCart();
  const router = useRouter();

  const [form, setForm] = useState({
    customerName: "",
    phone: "",
    email: "",
    city: "",
    notes: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitError(null);

    const input = {
      ...form,
      items: items
        .filter((i) => i.kind === "book")
        .map((i) => ({ bookId: i.bookId, quantity: i.quantity })),
      collections: items
        .filter((i) => i.kind === "collection")
        .map((i) => ({
          collectionId: i.collectionId,
          quantity: i.quantity,
          selectedBookIds: i.selectedBooks.map((b) => b.bookId),
        })),
    };

    const parsed = checkoutSchema.safeParse(input);
    if (!parsed.success) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path[0] as string;
        if (!fieldErrors[key]) fieldErrors[key] = issue.message;
      }
      setErrors(fieldErrors);
      return;
    }
    setErrors({});
    setSubmitting(true);
    const result = await createOrder(parsed.data);
    setSubmitting(false);

    if (!result.ok) {
      setSubmitError(result.error);
      return;
    }
    clear();
    router.push("/order/confirmation");
  }

  if (!hydrated) return null;

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center sm:px-6">
        <h1 className="text-2xl font-extrabold">سلتك فارغة</h1>
        <p className="mt-2 text-muted">أضيفي بعض الكتب لتظهر هنا.</p>
        <Link href="/" className="mt-6 inline-block">
          <Button>تصفّحي الكتب</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      <h1 className="mb-6 text-2xl font-extrabold">السلة والدفع</h1>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1.2fr_1fr]">
        <div className="flex flex-col gap-4">
          {items.map((item) => (
            <div
              key={item.id}
              className="flex items-center gap-4 rounded-2xl border border-border bg-card p-3"
            >
              {item.kind === "book" ? (
                <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-white">
                  <Image
                    src={item.coverImage}
                    alt={item.title}
                    fill
                    sizes="64px"
                    className="object-contain p-1"
                  />
                </div>
              ) : (
                <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-lg bg-gold/20 text-brand">
                  <Package className="h-7 w-7" />
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate font-bold">{item.title}</p>
                {item.kind === "collection" && (
                  <p className="truncate text-xs text-muted">
                    {item.selectedBooks.map((b) => b.title).join("، ")}
                  </p>
                )}
                <Price nis={item.priceNis} className="text-sm text-muted" />
              </div>
              <div className="flex items-center rounded-full border border-border bg-white">
                <button
                  type="button"
                  onClick={() => updateQty(item.id, item.quantity - 1)}
                  className="flex h-8 w-8 items-center justify-center text-muted hover:text-ink"
                >
                  <Minus className="h-3.5 w-3.5" />
                </button>
                <span className="w-6 text-center text-sm font-bold">
                  {item.quantity}
                </span>
                <button
                  type="button"
                  onClick={() => updateQty(item.id, item.quantity + 1)}
                  className="flex h-8 w-8 items-center justify-center text-muted hover:text-ink"
                >
                  <Plus className="h-3.5 w-3.5" />
                </button>
              </div>
              <button
                type="button"
                onClick={() => removeItem(item.id)}
                className="text-muted hover:text-red-600"
                aria-label="إزالة"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}

          <div className="flex items-center justify-between rounded-2xl border border-border bg-white p-4">
            <span className="font-bold">الإجمالي</span>
            <Price nis={totalNis} className="text-xl font-extrabold text-brand" />
          </div>
        </div>

        <form
          onSubmit={handleSubmit}
          className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-5"
        >
          <h2 className="font-extrabold">بيانات التوصيل</h2>
          <Input
            id="customerName"
            label="الاسم الكامل"
            value={form.customerName}
            onChange={(e) => setForm({ ...form, customerName: e.target.value })}
            error={errors.customerName}
          />
          <Input
            id="phone"
            label="رقم الهاتف"
            dir="ltr"
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
            error={errors.phone}
          />
          <Input
            id="email"
            label="البريد الإلكتروني (اختياري)"
            dir="ltr"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            error={errors.email}
          />
          <Input
            id="city"
            label="المدينة"
            value={form.city}
            onChange={(e) => setForm({ ...form, city: e.target.value })}
            error={errors.city}
          />
          <Textarea
            id="notes"
            label="ملاحظات (اختياري)"
            rows={2}
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
          />
          {submitError && <p className="text-sm text-red-600">{submitError}</p>}
          <Button type="submit" disabled={submitting} size="lg">
            {submitting ? "جارِ الإرسال..." : "إتمام الطلب"}
          </Button>
          <p className="text-center text-xs text-muted">
            لن يتم الدفع الآن — سنتصل بك لتنسيق التوصيل والدفع.
          </p>
        </form>
      </div>
    </div>
  );
}
