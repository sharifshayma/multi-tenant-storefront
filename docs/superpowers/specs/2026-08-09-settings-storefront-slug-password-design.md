# Settings: Storefront Link, Editable Slug, Password Change

**Date:** 2026-08-09
**Status:** Approved (design) — pending spec review before implementation plan
**Parent:** builds on the live multi-tenant platform (Plans 1–4 shipped)

---

## 1. Goal

Give a store operator three self-serve capabilities on the admin **Settings**
page (`/admin/settings`):

1. **See and copy their storefront link(s).**
2. **Edit their platform address (store `slug`).**
3. **Change their password**, gated by a one-time code emailed to their account
   address (which also serves as account recovery).

All three are additive cards on the existing Settings page; no new routes.

## 2. Locked Decisions

| # | Decision | Choice |
|---|----------|--------|
| 1 | Which URL is editable | Platform **slug** only (`store.thatsmy.app/{slug}`). Custom domain stays out of scope. |
| 2 | Password flow | **Email 6-digit code → set new password.** No current password required (doubles as recovery). |
| 3 | Link card location | On **Settings** only (not the dashboard). |
| 4 | Building blocks | Reuse `store-slug` helper, Resend, and Better Auth's **email-OTP** plugin. |

## 3. Feature 1 — Storefront link card (رابط متجرك)

- Read-only card at the top of Settings listing the store's public URL(s):
  - **Custom domain** (if `store.customDomain` set), labeled as the primary link
    to share — e.g. `https://arabstories.shayma.me`.
  - **Platform URL**: `https://store.thatsmy.app/{store.slug}`.
- Each row has **Copy** (clipboard) and **Open** (new tab) actions.
- A small client component handles copy-to-clipboard; URLs are derived from the
  store record passed by the server page.
- The platform origin is derived from `BETTER_AUTH_URL` (falls back to
  `https://store.thatsmy.app`) so it is not hard-coded in the component.

## 4. Feature 2 — Store address editor (عنوان المتجر)

### 4.1 UI
- Card showing `store.thatsmy.app/[input]` with the current slug pre-filled and a
  **Save** button.
- A warning line: changing the address breaks any previously shared
  `store.thatsmy.app/{old-slug}` links; the custom domain is unaffected.

### 4.2 Server action `updateStoreSlug(nextSlug)`
- `requireStore()` — scoped to the caller's store.
- Normalize with `slugify()`. Reject when:
  - empty after slugify → "العنوان غير صالح",
  - `isReservedSlug()` → reserved,
  - already taken by another store (unique constraint / pre-check) → taken.
- On success, `prisma.store.update({ where: { id }, data: { slug } })` and
  `revalidatePath("/admin/settings")` (+ the storefront paths).
- Extend `RESERVED_SLUGS` only if a gap is found; current list
  (`admin, login, signup, api, _next, logout`) already covers the real
  root-level routes.

### 4.3 Custom-domain decoupling (safety fix — required)
Today `resolveStorefrontContext` resolves a custom-domain request by the slug in
the static `DOMAIN_TO_STORE_SLUG` map, then `findUnique({ where: { slug } })`. If
the slug changes, that lookup returns null and the custom domain 404s.

**Change:** for a custom-domain host, resolve the store **by host**:
`prisma.store.findUnique({ where: { customDomain: host } })`. The Edge proxy
keeps the static map solely to (a) detect that a host is a custom domain and
(b) produce a routing segment for the rewrite; the segment's exact value no
longer needs to match the live slug, so a slug edit can never break the custom
domain. `basePath` stays `""` for custom-domain hosts.

## 5. Feature 3 — Change password (كلمة المرور)

### 5.1 Auth wiring
- Add Better Auth's `emailOTP` plugin to `src/lib/auth-server.ts` with a
  `sendVerificationOTP` callback that sends the code via Resend.
- Add `sendPasswordResetOtp(email, otp)` to `src/lib/resend.ts` (mirrors the
  existing order-notification send; uses `RESEND_FROM_EMAIL`).
- Expose `emailOtpClient` on `src/lib/auth-client.ts`.

### 5.2 UI flow (client component)
1. **Request code** — button "تغيير كلمة المرور" calls
   `authClient.emailOtp.sendVerificationOtp({ email, type: "forget-password" })`
   for the signed-in user's email. Show "أرسلنا رمزاً إلى بريدك".
2. **Set new password** — inputs for the 6-digit code and the new password
   (with a confirm field), calling
   `authClient.emailOtp.resetPassword({ email, otp, password })`.
3. Success/again messaging; errors surfaced in Arabic.

- The signed-in user's email comes from the server session (not typed).
- No current password is requested (recovery-capable by design).

### 5.3 Security boundary
The feature only builds UI + wiring. The operator types the new password into
the browser; Better Auth hashes and stores it. The OTP is delivered only to the
account email. No secret is handled in chat or by the build.

## 6. Out of Scope
- Editing / provisioning the **custom domain** from Settings (DNS + Edge map).
- Email change, 2FA, multiple users per store.
- Password strength meter / breached-password checks (Better Auth defaults apply).

## 7. Testing Focus
- **Slug validation:** reserved, malformed, and duplicate slugs are rejected;
  a valid new slug updates the store. (Unit — pure validation + action guard.)
- **Custom-domain resolver:** a custom-domain host resolves to its store by
  host, and continues to resolve after the store's slug changes. (Unit.)
- **Storefront card:** renders the custom domain (when present) and the platform
  URL from the store record.
- **Password flow:** manual/prod verification that the OTP email arrives and a
  code + new password resets successfully.

## 8. Risks / Notes
- **Resend from-address:** the OTP uses the same Resend config as order emails;
  deliverability depends on `RESEND_FROM_EMAIL` being a verified sender.
- **Slug edit breaks old platform links** by design — surfaced in the UI warning.
- The custom-domain decoupling is a small, contained change but touches the
  storefront's hot path; covered by the resolver test above.
