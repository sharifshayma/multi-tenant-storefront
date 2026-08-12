"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { upload } from "@vercel/blob/client";
import { Upload, Loader2 } from "lucide-react";
import { updateBookCover } from "@/actions/media";
import { Button } from "@/components/ui/Button";
import { useT } from "@/i18n/LocaleProvider";

// Cover-image editor for a book, mirroring the store-logo replace flow in
// BrandingCard: upload the file to Vercel Blob via /api/admin/upload, then
// persist the returned URL through the updateBookCover server action.
export function BookCoverCard({
  bookId,
  coverImage,
  title,
}: {
  bookId: string;
  coverImage: string;
  title: string;
}) {
  const router = useRouter();
  const { t } = useT();
  const fileRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFile(files: FileList | null) {
    const file = files?.[0];
    if (!file) return;
    setBusy(true);
    setError(null);
    try {
      const blob = await upload(file.name, file, {
        access: "public",
        handleUploadUrl: "/api/admin/upload",
      });
      await updateBookCover({ bookId, coverImage: blob.url });
      router.refresh();
    } catch (err) {
      setError((err as Error).message || t("admin.products.form.errors.uploadFailed"));
    } finally {
      setBusy(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative h-40 w-40 shrink-0 overflow-hidden rounded-2xl border border-border bg-white">
        <Image src={coverImage} alt={title} fill sizes="160px" className="object-contain p-3" />
      </div>
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => handleFile(e.target.files)}
      />
      <Button
        type="button"
        variant="ghost"
        disabled={busy}
        onClick={() => fileRef.current?.click()}
      >
        {busy ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" /> {t("admin.products.uploading")}
          </>
        ) : (
          <>
            <Upload className="h-4 w-4" /> {t("admin.products.form.changeImage")}
          </>
        )}
      </Button>
      {error && <p className="text-sm font-bold text-red-600">{error}</p>}
    </div>
  );
}
