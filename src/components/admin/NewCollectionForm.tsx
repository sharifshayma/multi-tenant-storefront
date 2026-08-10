"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createCollection } from "@/actions/collections";
import { slugify } from "@/lib/slugify";
import { Input, Textarea } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import { minorToInput, inputToMinor } from "@/lib/money-input";

export function NewCollectionForm({
  itemNounPlural,
  currency,
  urlPrefix,
}: {
  itemNounPlural: string;
  currency: string;
  urlPrefix: string;
}) {
  const router = useRouter();

  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [slugTouched, setSlugTouched] = useState(false);
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState(minorToInput(10000));
  const [isCustom, setIsCustom] = useState(false);
  const [requiredCount, setRequiredCount] = useState(5);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!title.trim()) {
      setError("الرجاء إدخال عنوان المجموعة");
      return;
    }
    setSaving(true);
    const result = await createCollection({
      title,
      slug,
      description,
      priceMinor: inputToMinor(price),
      isCustom,
      requiredCount: isCustom ? requiredCount : undefined,
    });
    setSaving(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    // Land on the collection's edit page — a fixed bundle picks its items there.
    router.push(`/admin/collections/${result.collectionId}`);
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 rounded-2xl border border-border bg-white p-5">
      <Input
        id="newCollectionTitle"
        label="العنوان"
        value={title}
        onChange={(e) => {
          const value = e.target.value;
          setTitle(value);
          if (!slugTouched) setSlug(slugify(value));
        }}
      />

      <div className="flex flex-col gap-1.5">
        <label htmlFor="newCollectionSlug" className="text-sm font-bold text-ink">
          رابط المجموعة
        </label>
        <p className="text-xs text-muted">اكتبي كلمة قصيرة بالإنجليزية تظهر في نهاية الرابط.</p>
        <div
          dir="ltr"
          className="flex items-stretch overflow-hidden rounded-xl border border-border bg-white focus-within:border-brand focus-within:ring-2 focus-within:ring-brand/20"
        >
          <span className="flex items-center whitespace-nowrap bg-paper px-3 text-sm text-muted">
            {urlPrefix}
          </span>
          <input
            id="newCollectionSlug"
            dir="ltr"
            value={slug}
            placeholder="summer-set"
            onChange={(e) => {
              setSlugTouched(true);
              setSlug(e.target.value);
            }}
            onBlur={() => {
              if (slug.trim()) setSlug(slugify(slug));
            }}
            className="min-w-0 flex-1 bg-white px-3 py-2.5 text-ink outline-none"
          />
        </div>
      </div>

      <Textarea
        id="newCollectionDescription"
        label="الوصف"
        rows={3}
        value={description}
        onChange={(e) => setDescription(e.target.value)}
      />

      <Input
        id="newCollectionPrice"
        label={`سعر المجموعة (${currency})`}
        type="number"
        min={0}
        step="0.01"
        dir="ltr"
        value={price}
        onChange={(e) => setPrice(e.target.value)}
      />

      <div className="flex flex-col gap-2">
        <span className="text-sm font-bold text-ink">نوع المجموعة</span>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          <button
            type="button"
            onClick={() => setIsCustom(false)}
            className={cn(
              "flex flex-col gap-1 rounded-xl border p-3 text-start",
              !isCustom ? "border-brand bg-brand/5" : "border-border bg-white hover:border-brand/40"
            )}
          >
            <span className="font-bold">مجموعة ثابتة</span>
            <span className="text-xs text-muted">أنتِ تحددين ال{itemNounPlural} في المجموعة.</span>
          </button>
          <button
            type="button"
            onClick={() => setIsCustom(true)}
            className={cn(
              "flex flex-col gap-1 rounded-xl border p-3 text-start",
              isCustom ? "border-brand bg-brand/5" : "border-border bg-white hover:border-brand/40"
            )}
          >
            <span className="font-bold">اختاري بنفسك</span>
            <span className="text-xs text-muted">العميلة تختار عدداً من ال{itemNounPlural} بنفسها.</span>
          </button>
        </div>
      </div>

      {isCustom && (
        <Input
          id="newCollectionRequiredCount"
          label={`عدد ال${itemNounPlural} التي تختارها العميلة`}
          type="number"
          min={1}
          dir="ltr"
          value={requiredCount}
          onChange={(e) => setRequiredCount(Number(e.target.value))}
        />
      )}

      {error && <p className="text-sm text-red-600">{error}</p>}

      <Button type="submit" disabled={saving} className="self-start">
        {saving ? "جارِ الإنشاء..." : `إنشاء المجموعة`}
      </Button>

      {!isCustom && (
        <p className="text-xs text-muted">
          بعد الإنشاء ستنتقلين لاختيار ال{itemNounPlural} التي تتكوّن منها المجموعة.
        </p>
      )}
    </form>
  );
}
