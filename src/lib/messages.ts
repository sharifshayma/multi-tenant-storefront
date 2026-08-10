import type { OrderStatus } from "@prisma/client";
import { formatMoney } from "@/lib/format-money";
import { getDictionary, t, type Dictionary, type Locale } from "@/i18n";
import { SITE_NAME, SITE_NAME_EN } from "@/lib/constants";

export type MessageOrderItem = { title: string; quantity: number };
export type MessageOrderCollectionItem = { title: string; quantity: number };

export type MessageOrder = {
  id: string;
  customerName: string;
  totalMinor: number;
  currency: string;
  // Number-formatting locale only (store.defaultLocale) — passed to
  // formatMoney below. NOT the text locale for this message's wording; see
  // the `uiLocale` param on getStatusMessage for that.
  locale: string;
  items: MessageOrderItem[];
  collectionItems: MessageOrderCollectionItem[];
};

function itemsBlock(d: Dictionary, order: MessageOrder): string {
  const collectionSuffix = t(d, "admin.orders.collectionSuffix");
  const lines = [
    ...order.items.map((i) => `• ${i.title} ×${i.quantity}`),
    ...order.collectionItems.map((i) => `• ${i.title} ${collectionSuffix} ×${i.quantity}`),
  ];
  return lines.join("\n");
}

function orderSummary(d: Dictionary, order: MessageOrder): string {
  const shortId = order.id.slice(0, 8);
  const total = formatMoney(order.totalMinor, order.currency, order.locale);
  return [
    t(d, "messages.orderNumberPrefix", { shortId }),
    itemsBlock(d, order),
    t(d, "messages.totalLine", { total }),
  ].join("\n");
}

/**
 * Renders the WhatsApp/email message the admin sends a customer about their
 * order status. `uiLocale` is the store's UI locale (the same one driving
 * every other piece of admin chrome the staff member sees) — deliberately
 * NOT `order.locale`, which only controls number formatting (see
 * MessageOrder above). Defaults to "ar" for any caller that doesn't (yet)
 * thread the locale through.
 */
export function getStatusMessage(
  status: OrderStatus,
  order: MessageOrder,
  uiLocale: Locale = "ar"
): string {
  const d = getDictionary(uiLocale);
  const greeting = t(d, "messages.greeting", { name: order.customerName });
  const summary = orderSummary(d, order);
  const siteName = uiLocale === "en" ? SITE_NAME_EN : SITE_NAME;
  const bodyKey = `messages.status.${status}`;
  const body = t(d, bodyKey, { siteName });
  if (body === bodyKey) return ""; // unknown status — mirrors the original default case
  return `${greeting}\n${summary}\n\n${body}`;
}

/** Formats a local phone number (e.g. 05xxxxxxxx) into WhatsApp's international digits-only format. Defaults to Israel (972) country code. */
export function formatPhoneForWhatsApp(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.startsWith("972")) return digits;
  if (digits.startsWith("0")) return `972${digits.slice(1)}`;
  return digits;
}

export function getWhatsAppLink(phone: string, message: string): string {
  return `https://wa.me/${formatPhoneForWhatsApp(phone)}?text=${encodeURIComponent(message)}`;
}

export function getEmailLink(email: string, subject: string, message: string): string {
  return `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(message)}`;
}
