"use client";

import { useRef, useState } from "react";
import { upload } from "@vercel/blob/client";
import { Upload, Loader2 } from "lucide-react";
import { attachMedia } from "@/actions/media";
import { Button } from "@/components/ui/Button";
import { useT } from "@/i18n/LocaleProvider";

export function MediaUploader({ bookId }: { bookId: string }) {
  const { t } = useT();
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    setError(null);
    setUploading(true);
    try {
      for (const file of Array.from(files)) {
        const isVideo = file.type.startsWith("video/");
        const maxSize = isVideo ? 100 * 1024 * 1024 : 10 * 1024 * 1024;
        if (file.size > maxSize) {
          throw new Error(
            t("admin.products.media.sizeError", { name: file.name, max: isVideo ? "100" : "10" })
          );
        }
        const blob = await upload(file.name, file, {
          access: "public",
          handleUploadUrl: "/api/admin/upload",
        });
        await attachMedia({
          bookId,
          url: blob.url,
          type: isVideo ? "VIDEO" : "IMAGE",
        });
      }
    } catch (err) {
      setError((err as Error).message || t("admin.products.media.uploadFailed"));
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <input
        ref={inputRef}
        type="file"
        accept="image/*,video/*"
        multiple
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />
      <Button
        type="button"
        variant="ghost"
        disabled={uploading}
        onClick={() => inputRef.current?.click()}
      >
        {uploading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" /> {t("admin.products.uploading")}
          </>
        ) : (
          <>
            <Upload className="h-4 w-4" /> {t("admin.products.media.upload")}
          </>
        )}
      </Button>
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}
