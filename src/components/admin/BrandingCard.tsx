"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { upload } from "@vercel/blob/client";
import { Upload, Loader2 } from "lucide-react";
import { updateBranding, type BrandingInput } from "@/actions/store";
import { Input, Textarea } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { useT } from "@/i18n/LocaleProvider";

function ColorField({
  label,
  hint,
  value,
  onChange,
  defaultSwatch = "#b5542c",
}: {
  label: string;
  hint: string;
  value: string;
  onChange: (v: string) => void;
  defaultSwatch?: string;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-bold text-ink">{label}</label>
      <p className="text-xs text-muted">{hint}</p>
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={value || defaultSwatch}
          onChange={(e) => onChange(e.target.value)}
          className="h-10 w-12 shrink-0 cursor-pointer rounded-lg border border-border bg-white"
        />
        <input
          dir="ltr"
          value={value}
          placeholder={defaultSwatch}
          onChange={(e) => onChange(e.target.value)}
          className="w-32 rounded-xl border border-border bg-white px-3 py-2 text-sm text-ink outline-none focus:border-brand"
        />
      </div>
    </div>
  );
}

export function BrandingCard({ initial }: { initial: BrandingInput }) {
  const router = useRouter();
  const { t } = useT();
  const fileRef = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState<BrandingInput>(initial);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  function set<K extends keyof BrandingInput>(key: K, value: BrandingInput[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleLogo(files: FileList | null) {
    const file = files?.[0];
    if (!file) return;
    setUploading(true);
    setMsg(null);
    try {
      const blob = await upload(file.name, file, {
        access: "public",
        handleUploadUrl: "/api/admin/upload",
      });
      set("logoUrl", blob.url);
    } catch (err) {
      setMsg({ ok: false, text: (err as Error).message || t("admin.settings.branding.uploadFailed") });
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMsg(null);
    const r = await updateBranding(form);
    setSaving(false);
    if (r.ok) {
      setMsg({ ok: true, text: t("admin.settings.branding.saved") });
      router.refresh();
    } else {
      setMsg({ ok: false, text: r.error });
    }
  }

  return (
    <form onSubmit={save} className="flex flex-col gap-4 rounded-2xl border border-border bg-white p-5">
      <div>
        <h2 className="font-extrabold">{t("admin.settings.branding.heading")}</h2>
        <p className="mt-1 text-sm text-muted">{t("admin.settings.branding.description")}</p>
      </div>

      <div className="flex flex-col gap-2">
        <span className="text-sm font-bold text-ink">{t("admin.settings.branding.logoLabel")}</span>
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => handleLogo(e.target.files)} />
        <div className="flex items-center gap-4">
          {form.logoUrl ? (
            <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl border border-border bg-paper">
              <Image src={form.logoUrl} alt="" fill sizes="64px" className="object-contain p-1" />
            </div>
          ) : (
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl border-2 border-dashed border-border text-xs text-muted">
              {t("admin.settings.branding.noLogo")}
            </div>
          )}
          <Button type="button" variant="ghost" disabled={uploading} onClick={() => fileRef.current?.click()}>
            {uploading ? (<><Loader2 className="h-4 w-4 animate-spin" /> {t("admin.settings.branding.uploading")}</>) : (<><Upload className="h-4 w-4" /> {form.logoUrl ? t("admin.settings.branding.changeLogo") : t("admin.settings.branding.uploadLogo")}</>)}
          </Button>
          {form.logoUrl && (
            <button type="button" onClick={() => set("logoUrl", "")} className="text-sm font-bold text-muted hover:text-ink">
              {t("admin.settings.branding.removeLogo")}
            </button>
          )}
        </div>
      </div>

      <Input id="brandName" label={t("admin.settings.branding.nameLabel")} value={form.name} onChange={(e) => set("name", e.target.value)} />
      <Input id="brandHeroTitle" label={t("admin.settings.branding.heroTitleLabel")} value={form.heroTitle} onChange={(e) => set("heroTitle", e.target.value)} />
      <Textarea id="brandHeroSubtitle" label={t("admin.settings.branding.heroSubtitleLabel")} rows={3} value={form.heroSubtitle} onChange={(e) => set("heroSubtitle", e.target.value)} />
      <Textarea id="brandFooter" label={t("admin.settings.branding.footerLabel")} rows={2} value={form.footerText} onChange={(e) => set("footerText", e.target.value)} />

      <div className="flex flex-col gap-3">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <ColorField
            label={t("admin.settings.branding.brandColorLabel")}
            hint={t("admin.settings.branding.brandColorHint")}
            value={form.brandColor}
            onChange={(v) => set("brandColor", v)}
            defaultSwatch="#3d6b99"
          />
          <ColorField
            label={t("admin.settings.branding.backgroundColorLabel")}
            hint={t("admin.settings.branding.backgroundColorHint")}
            value={form.backgroundColor}
            onChange={(v) => set("backgroundColor", v)}
            defaultSwatch="#f6f6f7"
          />
          <ColorField
            label={t("admin.settings.branding.textColorLabel")}
            hint={t("admin.settings.branding.textColorHint")}
            value={form.textColor}
            onChange={(v) => set("textColor", v)}
            defaultSwatch="#22262e"
          />
        </div>
        <p className="text-xs text-muted">
          {t("admin.settings.branding.contrastNote")}
        </p>
      </div>

      {msg && <p className={msg.ok ? "text-sm font-bold text-accent" : "text-sm font-bold text-red-600"}>{msg.text}</p>}

      <Button type="submit" disabled={saving || uploading} className="self-start">
        {saving ? t("common.saving") : t("common.save")}
      </Button>
    </form>
  );
}
