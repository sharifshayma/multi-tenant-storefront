"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { upload } from "@vercel/blob/client";
import { Upload, Loader2 } from "lucide-react";
import { createBook } from "@/actions/books";
import { slugify } from "@/lib/slugify";
import { Input, Textarea } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { minorToInput, inputToMinor } from "@/lib/money-input";

export function NewBookForm({
  itemNounSingular,
  currency,
  urlPrefix,
}: {
  itemNounSingular: string;
  currency: string;
  urlPrefix: string;
}) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);

  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [slugTouched, setSlugTouched] = useState(false);
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState(minorToInput(4000));
  const [coverImage, setCoverImage] = useState("");
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleCoverSelect(files: FileList | null) {
    const file = files?.[0];
    if (!file) return;
    setError(null);
    if (!file.type.startsWith("image/")) {
      setError("الرجاء اختيار ملف صورة لصورة الغلاف");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setError("حجم الصورة أكبر من الحد المسموح (10 ميجابايت)");
      return;
    }
    setUploading(true);
    try {
      const blob = await upload(file.name, file, {
        access: "public",
        handleUploadUrl: "/api/admin/upload",
      });
      setCoverImage(blob.url);
    } catch (err) {
      setError((err as Error).message || "فشل رفع الصورة");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const priceMinor = inputToMinor(price);
    if (!title.trim() || !description.trim() || !slug.trim() || !coverImage || !priceMinor) {
      setError("الرجاء تعبئة جميع الحقول ورفع صورة الغلاف");
      return;
    }
    setSaving(true);
    const result = await createBook({ title, description, slug, priceMinor, coverImage });
    setSaving(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    router.push(`/admin/books/${result.bookId}`);
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 rounded-2xl border border-border bg-white p-5">
      <div className="flex flex-col gap-2">
        <span className="text-sm font-bold text-ink">صورة الغلاف</span>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => handleCoverSelect(e.target.files)}
        />
        <div className="flex items-center gap-4">
          {coverImage ? (
            <div className="relative h-28 w-28 shrink-0 overflow-hidden rounded-xl border border-border bg-paper">
              <Image src={coverImage} alt="" fill sizes="112px" className="object-contain p-2" />
            </div>
          ) : (
            <div className="flex h-28 w-28 shrink-0 items-center justify-center rounded-xl border-2 border-dashed border-border text-xs text-muted">
              لا توجد صورة
            </div>
          )}
          <Button
            type="button"
            variant="ghost"
            disabled={uploading}
            onClick={() => inputRef.current?.click()}
          >
            {uploading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> جارِ الرفع...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4" /> {coverImage ? "تغيير الصورة" : "رفع صورة الغلاف"}
              </>
            )}
          </Button>
        </div>
      </div>

      <Input
        id="newBookTitle"
        label="العنوان"
        value={title}
        onChange={(e) => {
          const value = e.target.value;
          setTitle(value);
          if (!slugTouched) setSlug(slugify(value));
        }}
      />

      <div className="flex flex-col gap-1.5">
        <label htmlFor="newBookSlug" className="text-sm font-bold text-ink">
          رابط ال{itemNounSingular}
        </label>
        <p className="text-xs text-muted">
          اكتبي كلمة قصيرة بالإنجليزية تظهر في نهاية الرابط.
        </p>
        <div
          dir="ltr"
          className="flex items-stretch overflow-hidden rounded-xl border border-border bg-white focus-within:border-brand focus-within:ring-2 focus-within:ring-brand/20"
        >
          <span className="flex items-center whitespace-nowrap bg-paper px-3 text-sm text-muted">
            {urlPrefix}
          </span>
          <input
            id="newBookSlug"
            dir="ltr"
            value={slug}
            placeholder="colorful-cats"
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
        id="newBookDescription"
        label="الوصف"
        rows={4}
        value={description}
        onChange={(e) => setDescription(e.target.value)}
      />

      <Input
        id="newBookPrice"
        label={`السعر (${currency})`}
        type="number"
        min={0}
        step="0.01"
        dir="ltr"
        value={price}
        onChange={(e) => setPrice(e.target.value)}
      />

      {error && <p className="text-sm text-red-600">{error}</p>}

      <Button type="submit" disabled={saving || uploading} className="self-start">
        {saving ? "جارِ الإنشاء..." : `إنشاء ال${itemNounSingular}`}
      </Button>
    </form>
  );
}
