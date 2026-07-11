"use client";

import { useState } from "react";
import { updateOrderCustomerInfo } from "@/actions/orders";
import { Input, Textarea } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

export function CustomerInfoEditForm({
  orderId,
  customerName,
  phone,
  email,
  city,
  notes,
  createdAt,
}: {
  orderId: string;
  customerName: string;
  phone: string;
  email: string | null;
  city: string;
  notes: string | null;
  createdAt: Date;
}) {
  const [name, setName] = useState(customerName);
  const [phoneVal, setPhoneVal] = useState(phone);
  const [emailVal, setEmailVal] = useState(email ?? "");
  const [cityVal, setCityVal] = useState(city);
  const [notesVal, setNotesVal] = useState(notes ?? "");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!name.trim() || !phoneVal.trim() || !cityVal.trim()) {
      setError("الرجاء تعبئة الاسم والهاتف والمدينة");
      return;
    }
    setSaving(true);
    try {
      await updateOrderCustomerInfo({
        orderId,
        customerName: name,
        phone: phoneVal,
        email: emailVal,
        city: cityVal,
        notes: notesVal,
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 1500);
    } catch (err) {
      setError((err as Error).message || "فشل الحفظ");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3 rounded-2xl border border-border bg-white p-5">
      <h2 className="font-extrabold">بيانات العميل</h2>
      <Input id="editCustomerName" label="الاسم" value={name} onChange={(e) => setName(e.target.value)} />
      <Input
        id="editCustomerPhone"
        label="الهاتف"
        dir="ltr"
        value={phoneVal}
        onChange={(e) => setPhoneVal(e.target.value)}
      />
      <Input
        id="editCustomerEmail"
        label="البريد الإلكتروني (اختياري)"
        dir="ltr"
        value={emailVal}
        onChange={(e) => setEmailVal(e.target.value)}
      />
      <Input id="editCustomerCity" label="المدينة" value={cityVal} onChange={(e) => setCityVal(e.target.value)} />
      <Textarea
        id="editCustomerNotes"
        label="ملاحظات"
        rows={2}
        value={notesVal}
        onChange={(e) => setNotesVal(e.target.value)}
      />
      <p className="text-xs text-muted">
        تاريخ الطلب:{" "}
        {new Intl.DateTimeFormat("ar", { dateStyle: "medium", timeStyle: "short" }).format(createdAt)}
      </p>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <Button type="submit" disabled={saving} size="sm" className="self-start">
        {saving ? "جارِ الحفظ..." : saved ? "تم الحفظ ✓" : "حفظ بيانات العميل"}
      </Button>
    </form>
  );
}
