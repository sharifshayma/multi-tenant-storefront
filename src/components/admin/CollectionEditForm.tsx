"use client";

import { useState } from "react";
import { updateCollection } from "@/actions/collections";
import { Input, Textarea } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

export function CollectionEditForm({
  collectionId,
  title: initialTitle,
  description: initialDescription,
  priceMinor: initialPrice,
  isCustom,
  requiredCount: initialRequiredCount,
  itemNounPlural,
}: {
  collectionId: string;
  title: string;
  description: string;
  priceMinor: number;
  isCustom: boolean;
  requiredCount: number | null;
  itemNounPlural: string;
}) {
  const [title, setTitle] = useState(initialTitle);
  const [description, setDescription] = useState(initialDescription);
  const [priceMinor, setPriceMinor] = useState(initialPrice);
  const [requiredCount, setRequiredCount] = useState(initialRequiredCount ?? 5);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setSaved(false);
    await updateCollection({
      collectionId,
      title,
      description,
      priceMinor,
      requiredCount: isCustom ? requiredCount : undefined,
    });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <Input id="title" label="العنوان" value={title} onChange={(e) => setTitle(e.target.value)} />
      <Textarea
        id="description"
        label="الوصف"
        rows={3}
        value={description}
        onChange={(e) => setDescription(e.target.value)}
      />
      <Input
        id="priceMinor"
        label="سعر المجموعة (شيكل)"
        type="number"
        min={0}
        dir="ltr"
        value={priceMinor}
        onChange={(e) => setPriceMinor(Number(e.target.value))}
      />
      {isCustom && (
        <Input
          id="requiredCount"
          label={`عدد ال${itemNounPlural} التي تختارها العميلة`}
          type="number"
          min={1}
          dir="ltr"
          value={requiredCount}
          onChange={(e) => setRequiredCount(Number(e.target.value))}
        />
      )}
      <Button type="submit" disabled={saving} className="self-start">
        {saving ? "جارِ الحفظ..." : saved ? "تم الحفظ ✓" : "حفظ التعديلات"}
      </Button>
    </form>
  );
}
