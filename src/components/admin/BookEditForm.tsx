"use client";

import { useState } from "react";
import { updateBook } from "@/actions/media";
import { Input, Textarea } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { minorToInput, inputToMinor } from "@/lib/money-input";
import { useT } from "@/i18n/LocaleProvider";

export function BookEditForm({
  bookId,
  title: initialTitle,
  description: initialDescription,
  priceMinor: initialPrice,
  currency,
}: {
  bookId: string;
  title: string;
  description: string;
  priceMinor: number;
  currency: string;
}) {
  const { t } = useT();
  const [title, setTitle] = useState(initialTitle);
  const [description, setDescription] = useState(initialDescription);
  const [price, setPrice] = useState(minorToInput(initialPrice));
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setSaved(false);
    await updateBook({ bookId, title, description, priceMinor: inputToMinor(price) });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <Input
        id="title"
        label={t("admin.products.form.titleLabel")}
        value={title}
        onChange={(e) => setTitle(e.target.value)}
      />
      <Textarea
        id="description"
        label={t("admin.products.form.descriptionLabel")}
        rows={4}
        value={description}
        onChange={(e) => setDescription(e.target.value)}
      />
      <Input
        id="priceMinor"
        label={t("admin.products.form.priceLabel", { currency })}
        type="number"
        min={0}
        step="0.01"
        dir="ltr"
        value={price}
        onChange={(e) => setPrice(e.target.value)}
      />
      <Button type="submit" disabled={saving} className="self-start">
        {saving ? t("common.saving") : saved ? t("common.savedCheck") : t("admin.products.form.saveChanges")}
      </Button>
    </form>
  );
}
