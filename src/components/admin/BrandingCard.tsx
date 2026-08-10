"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { upload } from "@vercel/blob/client";
import { Upload, Loader2 } from "lucide-react";
import { updateBranding, type BrandingInput } from "@/actions/store";
import { Input, Textarea } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

function ColorField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-bold text-ink">{label}</label>
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={value || "#b5542c"}
          onChange={(e) => onChange(e.target.value)}
          className="h-10 w-12 shrink-0 cursor-pointer rounded-lg border border-border bg-white"
        />
        <input
          dir="ltr"
          value={value}
          placeholder="#b5542c"
          onChange={(e) => onChange(e.target.value)}
          className="w-32 rounded-xl border border-border bg-white px-3 py-2 text-sm text-ink outline-none focus:border-brand"
        />
      </div>
    </div>
  );
}

export function BrandingCard({ initial }: { initial: BrandingInput }) {
  const router = useRouter();
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
      setMsg({ ok: false, text: (err as Error).message || "فشل رفع الشعار" });
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
      setMsg({ ok: true, text: "تم حفظ الهوية" });
      router.refresh();
    } else {
      setMsg({ ok: false, text: r.error });
    }
  }

  return (
    <form onSubmit={save} className="flex flex-col gap-4 rounded-2xl border border-border bg-white p-5">
      <div>
        <h2 className="font-extrabold">الهوية والتصميم</h2>
        <p className="mt-1 text-sm text-muted">اسم متجرك وألوانه وشعاره كما تظهر لعملائك.</p>
      </div>

      <div className="flex flex-col gap-2">
        <span className="text-sm font-bold text-ink">الشعار</span>
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => handleLogo(e.target.files)} />
        <div className="flex items-center gap-4">
          {form.logoUrl ? (
            <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl border border-border bg-paper">
              <Image src={form.logoUrl} alt="" fill sizes="64px" className="object-contain p-1" />
            </div>
          ) : (
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl border-2 border-dashed border-border text-xs text-muted">
              لا يوجد
            </div>
          )}
          <Button type="button" variant="ghost" disabled={uploading} onClick={() => fileRef.current?.click()}>
            {uploading ? (<><Loader2 className="h-4 w-4 animate-spin" /> جارِ الرفع...</>) : (<><Upload className="h-4 w-4" /> {form.logoUrl ? "تغيير الشعار" : "رفع الشعار"}</>)}
          </Button>
          {form.logoUrl && (
            <button type="button" onClick={() => set("logoUrl", "")} className="text-sm font-bold text-muted hover:text-ink">
              إزالة
            </button>
          )}
        </div>
      </div>

      <Input id="brandName" label="اسم المتجر" value={form.name} onChange={(e) => set("name", e.target.value)} />
      <Input id="brandHeroTitle" label="عنوان الصفحة الرئيسية (اختياري)" value={form.heroTitle} onChange={(e) => set("heroTitle", e.target.value)} />
      <Textarea id="brandHeroSubtitle" label="وصف قصير تحت العنوان (اختياري)" rows={3} value={form.heroSubtitle} onChange={(e) => set("heroSubtitle", e.target.value)} />
      <Textarea id="brandFooter" label="نص التذييل (اختياري)" rows={2} value={form.footerText} onChange={(e) => set("footerText", e.target.value)} />

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <ColorField label="اللون الأساسي" value={form.brandColor} onChange={(v) => set("brandColor", v)} />
        <ColorField label="اللون الثانوي" value={form.accentColor} onChange={(v) => set("accentColor", v)} />
        <ColorField label="اللون الذهبي" value={form.goldColor} onChange={(v) => set("goldColor", v)} />
      </div>

      {msg && <p className={msg.ok ? "text-sm font-bold text-accent" : "text-sm font-bold text-red-600"}>{msg.text}</p>}

      <Button type="submit" disabled={saving || uploading} className="self-start">
        {saving ? "جارِ الحفظ..." : "حفظ"}
      </Button>
    </form>
  );
}
