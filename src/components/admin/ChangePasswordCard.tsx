"use client";

import { useState, useTransition } from "react";
import { Pencil } from "lucide-react";
import { authClient } from "@/lib/auth-client";
import { Modal } from "@/components/ui/Modal";

function ChangePasswordForm({ email, onDone }: { email: string; onDone: () => void }) {
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
        setMsg({ ok: false, text: "تعذّر إرسال الرمز، حاولي مرة أخرى" });
        return;
      }
      setStage("code");
      setMsg({ ok: true, text: `أرسلنا رمزاً إلى ${email}` });
    });
  }

  function submitNewPassword() {
    setMsg(null);
    if (password.length < 8) {
      setMsg({ ok: false, text: "كلمة المرور يجب أن تكون 8 أحرف على الأقل" });
      return;
    }
    if (password !== confirm) {
      setMsg({ ok: false, text: "كلمتا المرور غير متطابقتين" });
      return;
    }
    startTransition(async () => {
      const { error } = await authClient.emailOtp.resetPassword({ email, otp, password });
      if (error) {
        setMsg({ ok: false, text: "الرمز غير صحيح أو منتهي، حاولي مرة أخرى" });
        return;
      }
      onDone();
    });
  }

  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm text-muted">
        لتغيير كلمة المرور، سنرسل رمزاً إلى بريدك ({email}) للتأكد من هويتك.
      </p>

      {stage === "idle" ? (
        <button
          type="button"
          disabled={pending}
          onClick={sendCode}
          className="self-start rounded-lg bg-brand px-4 py-1.5 text-sm font-bold text-white disabled:opacity-50"
        >
          {pending ? "..." : "إرسال الرمز"}
        </button>
      ) : (
        <div className="flex flex-col gap-2">
          <input
            dir="ltr" inputMode="numeric" placeholder="الرمز المكوّن من 6 أرقام"
            value={otp} onChange={(e) => setOtp(e.target.value)}
            className="rounded-lg border border-border px-3 py-1.5 text-sm font-bold"
          />
          <input
            type="password" placeholder="كلمة المرور الجديدة"
            value={password} onChange={(e) => setPassword(e.target.value)}
            className="rounded-lg border border-border px-3 py-1.5 text-sm"
          />
          <input
            type="password" placeholder="تأكيد كلمة المرور"
            value={confirm} onChange={(e) => setConfirm(e.target.value)}
            className="rounded-lg border border-border px-3 py-1.5 text-sm"
          />
          <div className="flex items-center gap-2">
            <button
              type="button" disabled={pending} onClick={submitNewPassword}
              className="rounded-lg bg-brand px-4 py-1.5 text-sm font-bold text-white disabled:opacity-50"
            >
              {pending ? "..." : "حفظ كلمة المرور"}
            </button>
            <button
              type="button" disabled={pending} onClick={sendCode}
              className="text-xs font-bold text-muted hover:text-ink"
            >
              إعادة إرسال الرمز
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
  const [open, setOpen] = useState(false);
  const [done, setDone] = useState(false);

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-border bg-white p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="font-extrabold">كلمة المرور</h2>
          <p className="mt-1 text-sm text-muted">
            غيّري كلمة المرور الخاصة بدخولك إلى لوحة التحكم.
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
          تغيير كلمة المرور
        </button>
      </div>

      {done && <p className="text-sm font-bold text-accent">تم تغيير كلمة المرور بنجاح</p>}

      {open && (
        <Modal title="كلمة المرور" onClose={() => setOpen(false)}>
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
