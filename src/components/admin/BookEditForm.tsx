"use client";

import { useState } from "react";
import { updateBook } from "@/actions/media";
import { Input, Textarea } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

export function BookEditForm({
  bookId,
  title: initialTitle,
  description: initialDescription,
  priceNis: initialPrice,
}: {
  bookId: string;
  title: string;
  description: string;
  priceNis: number;
}) {
  const [title, setTitle] = useState(initialTitle);
  const [description, setDescription] = useState(initialDescription);
  const [priceNis, setPriceNis] = useState(initialPrice);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setSaved(false);
    await updateBook({ bookId, title, description, priceNis });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <Input
        id="title"
        label="العنوان"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
      />
      <Textarea
        id="description"
        label="الوصف"
        rows={4}
        value={description}
        onChange={(e) => setDescription(e.target.value)}
      />
      <Input
        id="priceNis"
        label="السعر (شيكل)"
        type="number"
        min={0}
        dir="ltr"
        value={priceNis}
        onChange={(e) => setPriceNis(Number(e.target.value))}
      />
      <Button type="submit" disabled={saving} className="self-start">
        {saving ? "جارِ الحفظ..." : saved ? "تم الحفظ ✓" : "حفظ التعديلات"}
      </Button>
    </form>
  );
}
