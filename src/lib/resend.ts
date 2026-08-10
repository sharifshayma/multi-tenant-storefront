import { Resend } from "resend";
import { formatMoney } from "@/lib/format-money";
import { getDictionary, t, dirFor, type Locale } from "@/i18n";

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

type OrderEmailItem = { title: string; quantity: number; unitPriceMinor: number };
type OrderEmailCollectionItem = OrderEmailItem & { bookTitles: string[] };

// `storeUiLocale`/`storeName` come from the sending store, not a fixed
// locale/brand — every store's order notification renders in its own
// uiLocale and is signed with its own name (multi-tenant: this inbox may
// receive notifications for many stores). The caller (src/actions/orders.ts)
// already has `store` resolved, so it threads store.uiLocale/store.name
// through rather than this module doing its own store lookup.
export async function sendOrderNotification(order: {
  id: string;
  customerName: string;
  phone: string;
  email?: string | null;
  city: string;
  notes?: string | null;
  totalMinor: number;
  currency: string;
  locale: string;
  storeUiLocale: string;
  storeName: string;
  items: OrderEmailItem[];
  collectionItems?: OrderEmailCollectionItem[];
}) {
  if (!resend) {
    console.warn("RESEND_API_KEY not set — skipping order notification email");
    return;
  }

  const to = process.env.ORDER_NOTIFICATION_EMAIL;
  const from = process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev";
  if (!to) {
    console.warn("ORDER_NOTIFICATION_EMAIL not set — skipping order notification email");
    return;
  }

  const uiLocale: Locale = order.storeUiLocale === "en" ? "en" : "ar";
  const d = getDictionary(uiLocale);
  const dir = dirFor(uiLocale);
  const collectionSuffix = t(d, "admin.orders.collectionSuffix");
  const listSeparator = t(d, "email.orderNotification.listSeparator");

  const itemsHtml = order.items
    .map(
      (i) =>
        `<tr><td style="padding:4px 8px">${i.title}</td><td style="padding:4px 8px">×${i.quantity}</td><td style="padding:4px 8px">${formatMoney(
          i.unitPriceMinor * i.quantity,
          order.currency,
          order.locale
        )}</td></tr>`
    )
    .join("");

  const collectionItemsHtml = (order.collectionItems ?? [])
    .map(
      (i) =>
        `<tr><td style="padding:4px 8px"><strong>${i.title}</strong> ${collectionSuffix}<br/><span style="color:#666;font-size:13px">${i.bookTitles.join(listSeparator)}</span></td><td style="padding:4px 8px">×${i.quantity}</td><td style="padding:4px 8px">${formatMoney(
          i.unitPriceMinor * i.quantity,
          order.currency,
          order.locale
        )}</td></tr>`
    )
    .join("");

  try {
    await resend.emails.send({
      from,
      to,
      subject: t(d, "email.orderNotification.subject", {
        shortId: order.id.slice(0, 8),
        storeName: order.storeName,
        customerName: order.customerName,
      }),
      html: `
        <div dir="${dir}" style="font-family:sans-serif">
          <h2>${t(d, "email.orderNotification.heading", { storeName: order.storeName })}</h2>
          <p><strong>${t(d, "email.orderNotification.status")}</strong> ${t(d, "admin.orders.status.NEW")}</p>
          <p><strong>${t(d, "email.orderNotification.name")}</strong> ${order.customerName}</p>
          <p><strong>${t(d, "email.orderNotification.phone")}</strong> ${order.phone}</p>
          ${order.email ? `<p><strong>${t(d, "email.orderNotification.email")}</strong> ${order.email}</p>` : ""}
          <p><strong>${t(d, "email.orderNotification.city")}</strong> ${order.city}</p>
          ${order.notes ? `<p><strong>${t(d, "email.orderNotification.notes")}</strong> ${order.notes}</p>` : ""}
          <table style="border-collapse:collapse;margin-top:12px">${itemsHtml}${collectionItemsHtml}</table>
          <p style="margin-top:12px"><strong>${t(d, "email.orderNotification.total")} ${formatMoney(order.totalMinor, order.currency, order.locale)}</strong></p>
          <p style="margin-top:16px;color:#666">${t(d, "email.orderNotification.orderNumber")} ${order.id}</p>
        </div>
      `,
    });
  } catch (err) {
    console.error("Failed to send order notification email", err);
  }
}

// `uiLocale` defaults to "ar" for backward compatibility (this OTP flow is
// account-level — better-auth's emailOTP callback only hands us
// {email, otp, type}, no store — so callers that can resolve a store for
// this email, like auth-server.ts, look it up and pass its uiLocale
// through; callers that can't just get the "ar" default).
export async function sendPasswordResetOtp(
  email: string,
  otp: string,
  uiLocale: Locale = "ar"
): Promise<void> {
  if (!resend) {
    console.warn("RESEND_API_KEY not set — skipping password reset OTP email");
    return;
  }
  const from = process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev";
  const d = getDictionary(uiLocale);
  const dir = dirFor(uiLocale);
  try {
    await resend.emails.send({
      from,
      to: email,
      subject: t(d, "email.otp.subject"),
      html: `
        <div dir="${dir}" style="font-family:sans-serif">
          <h2>${t(d, "email.otp.heading")}</h2>
          <p>${t(d, "email.otp.instructions")}</p>
          <p style="font-size:28px;font-weight:800;letter-spacing:4px">${otp}</p>
          <p style="color:#666">${t(d, "email.otp.expiry")}</p>
        </div>
      `,
    });
  } catch (err) {
    console.error("Failed to send password reset OTP email", err);
  }
}
