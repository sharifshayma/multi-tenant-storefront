"use client";

import { useState } from "react";
import { Copy, Check, ExternalLink, Pencil } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { StoreSlugEditor } from "@/components/admin/StoreSlugEditor";
import { useT } from "@/i18n/LocaleProvider";

function LinkRow({ label, url }: { label: string; url: string }) {
  const { t } = useT();
  const [copied, setCopied] = useState(false);
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border border-border bg-paper p-3">
      <div className="min-w-0">
        <p className="text-xs font-bold text-muted">{label}</p>
        <p dir="ltr" className="truncate text-sm font-bold text-ink">{url}</p>
      </div>
      <div className="flex shrink-0 items-center gap-1.5">
        <button
          type="button"
          aria-label={t("admin.settings.storefrontLink.copyLink")}
          onClick={async () => {
            await navigator.clipboard.writeText(url);
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
          }}
          className="rounded-lg border border-border bg-white p-2 text-muted hover:text-ink"
        >
          {copied ? <Check className="h-4 w-4 text-accent" /> : <Copy className="h-4 w-4" />}
        </button>
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={t("admin.settings.storefrontLink.openStore")}
          className="rounded-lg border border-border bg-white p-2 text-muted hover:text-ink"
        >
          <ExternalLink className="h-4 w-4" />
        </a>
      </div>
    </div>
  );
}

export function StorefrontLinkCard({
  slug,
  platform,
  customDomain,
}: {
  slug: string;
  platform: string;
  customDomain: string | null;
}) {
  const { t } = useT();
  const [editing, setEditing] = useState(false);

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-border bg-white p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="font-extrabold">{t("admin.settings.storefrontLink.heading")}</h2>
          <p className="mt-1 text-sm text-muted">{t("admin.settings.storefrontLink.description")}</p>
        </div>
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="flex shrink-0 items-center gap-1.5 rounded-lg border border-border bg-white px-3 py-2 text-sm font-bold text-muted hover:text-ink"
        >
          <Pencil className="h-4 w-4" />
          {t("admin.settings.storefrontLink.editAddress")}
        </button>
      </div>
      {customDomain && <LinkRow label={t("admin.settings.storefrontLink.primaryLabel")} url={customDomain} />}
      <LinkRow label={t("admin.settings.storefrontLink.platformLabel")} url={platform} />

      {editing && (
        <Modal title={t("admin.settings.storefrontLink.modalTitle")} onClose={() => setEditing(false)}>
          <StoreSlugEditor slug={slug} platform={platform} onSaved={() => setEditing(false)} />
        </Modal>
      )}
    </div>
  );
}
