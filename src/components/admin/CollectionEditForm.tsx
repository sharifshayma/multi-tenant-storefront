"use client";

import { useState } from "react";
import { updateCollection } from "@/actions/collections";
import { Input, Textarea } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { minorToInput, inputToMinor } from "@/lib/money-input";
import { useT } from "@/i18n/LocaleProvider";

export function CollectionEditForm({
  collectionId,
  title: initialTitle,
  description: initialDescription,
  priceMinor: initialPrice,
  isCustom,
  requiredCount: initialRequiredCount,
  itemNounPlural,
  currency,
}: {
  collectionId: string;
  title: string;
  description: string;
  priceMinor: number;
  isCustom: boolean;
  requiredCount: number | null;
  itemNounPlural: string;
  currency: string;
}) {
  const { t } = useT();
  const [title, setTitle] = useState(initialTitle);
  const [description, setDescription] = useState(initialDescription);
  const [price, setPrice] = useState(minorToInput(initialPrice));
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
      priceMinor: inputToMinor(price),
      requiredCount: isCustom ? requiredCount : undefined,
    });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <Input
        id="title"
        label={t("admin.collections.form.titleLabel")}
        value={title}
        onChange={(e) => setTitle(e.target.value)}
      />
      <Textarea
        id="description"
        label={t("admin.collections.form.descriptionLabel")}
        rows={3}
        value={description}
        onChange={(e) => setDescription(e.target.value)}
      />
      <Input
        id="priceMinor"
        label={t("admin.collections.form.priceLabel", { currency })}
        type="number"
        min={0}
        step="0.01"
        dir="ltr"
        value={price}
        onChange={(e) => setPrice(e.target.value)}
      />
      {isCustom && (
        <Input
          id="requiredCount"
          label={t("admin.collections.form.requiredCountLabel", { plural: itemNounPlural })}
          type="number"
          min={1}
          dir="ltr"
          value={requiredCount}
          onChange={(e) => setRequiredCount(Number(e.target.value))}
        />
      )}
      <Button type="submit" disabled={saving} className="self-start">
        {saving ? t("common.saving") : saved ? t("common.savedCheck") : t("admin.collections.form.saveChanges")}
      </Button>
    </form>
  );
}
