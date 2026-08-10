"use client";

import { useState, useTransition } from "react";
import { Pencil } from "lucide-react";
import { authClient } from "@/lib/auth-client";
import { Modal } from "@/components/ui/Modal";
import { useT } from "@/i18n/LocaleProvider";

function ChangePasswordForm({ email, onDone }: { email: string; onDone: () => void }) {
  const { t } = useT();
  const [stage, setStage] = useState<"idle" | "code">("idle");
  const [otp, setOtp] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [pending, startTransition] = useTransition();

  function sendCode() {
    setMsg(null);
    startTransition(async () => {
      const { error } = await authClient.emailOtp.sendVerificationOtp({
        email,
        type: "forget-password",
      });
      if (error) {
        setMsg({ ok: false, text: t("admin.settings.password.sendCodeFailed") });
        return;
      }
      setStage("code");
      setMsg({ ok: true, text: t("admin.settings.password.codeSentTo", { email }) });
    });
  }

  function submitNewPassword() {
    setMsg(null);
    if (password.length < 8) {
      setMsg({ ok: false, text: t("admin.settings.password.tooShort") });
      return;
    }
    if (password !== confirm) {
      setMsg({ ok: false, text: t("admin.settings.password.mismatch") });
      return;
    }
    startTransition(async () => {
      const { error } = await authClient.emailOtp.resetPassword({ email, otp, password });
      if (error) {
        setMsg({ ok: false, text: t("admin.settings.password.invalidOrExpiredCode") });
        return;
      }
      onDone();
    });
  }

  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm text-muted">
        {t("admin.settings.password.intro", { email })}
      </p>

      {stage === "idle" ? (
        <button
          type="button"
          disabled={pending}
          onClick={sendCode}
          className="self-start rounded-lg bg-brand px-4 py-1.5 text-sm font-bold text-white disabled:opacity-50"
        >
          {pending ? "..." : t("admin.settings.password.sendCode")}
        </button>
      ) : (
        <div className="flex flex-col gap-2">
          <input
            dir="ltr" inputMode="numeric" placeholder={t("admin.settings.password.codePlaceholder")}
            value={otp} onChange={(e) => setOtp(e.target.value)}
            className="rounded-lg border border-border px-3 py-1.5 text-sm font-bold"
          />
          <input
            type="password" placeholder={t("admin.settings.password.newPasswordPlaceholder")}
            value={password} onChange={(e) => setPassword(e.target.value)}
            className="rounded-lg border border-border px-3 py-1.5 text-sm"
          />
          <input
            type="password" placeholder={t("admin.settings.password.confirmPasswordPlaceholder")}
            value={confirm} onChange={(e) => setConfirm(e.target.value)}
            className="rounded-lg border border-border px-3 py-1.5 text-sm"
          />
          <div className="flex items-center gap-2">
            <button
              type="button" disabled={pending} onClick={submitNewPassword}
              className="rounded-lg bg-brand px-4 py-1.5 text-sm font-bold text-white disabled:opacity-50"
            >
              {pending ? "..." : t("admin.settings.password.savePassword")}
            </button>
            <button
              type="button" disabled={pending} onClick={sendCode}
              className="text-xs font-bold text-muted hover:text-ink"
            >
              {t("admin.settings.password.resendCode")}
            </button>
          </div>
        </div>
      )}

      {msg && (
        <p className={msg.ok ? "text-sm font-bold text-accent" : "text-sm font-bold text-red-600"}>
          {msg.text}
        </p>
      )}
    </div>
  );
}

export function ChangePasswordCard({ email }: { email: string }) {
  const { t } = useT();
  const [open, setOpen] = useState(false);
  const [done, setDone] = useState(false);

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-border bg-white p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="font-extrabold">{t("admin.settings.password.heading")}</h2>
          <p className="mt-1 text-sm text-muted">
            {t("admin.settings.password.description")}
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            setDone(false);
            setOpen(true);
          }}
          className="flex shrink-0 items-center gap-1.5 rounded-lg border border-border bg-white px-3 py-2 text-sm font-bold text-muted hover:text-ink"
        >
          <Pencil className="h-4 w-4" />
          {t("admin.settings.password.changeButton")}
        </button>
      </div>

      {done && <p className="text-sm font-bold text-accent">{t("admin.settings.password.changed")}</p>}

      {open && (
        <Modal title={t("admin.settings.password.modalTitle")} onClose={() => setOpen(false)}>
          <ChangePasswordForm
            email={email}
            onDone={() => {
              setDone(true);
              setOpen(false);
            }}
          />
        </Modal>
      )}
    </div>
  );
}
