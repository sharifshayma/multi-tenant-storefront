import type { OrderStatus } from "@prisma/client";
import { formatMoney } from "@/lib/format-money";

export type MessageOrderItem = { title: string; quantity: number };
export type MessageOrderCollectionItem = { title: string; quantity: number };

export type MessageOrder = {
  id: string;
  customerName: string;
  totalMinor: number;
  currency: string;
  locale: string;
  items: MessageOrderItem[];
  collectionItems: MessageOrderCollectionItem[];
};

function itemsBlock(order: MessageOrder): string {
  const lines = [
    ...order.items.map((i) => `• ${i.title} ×${i.quantity}`),
    ...order.collectionItems.map((i) => `• ${i.title} (مجموعة) ×${i.quantity}`),
  ];
  return lines.join("\n");
}

function orderSummary(order: MessageOrder): string {
  const shortId = order.id.slice(0, 8);
  const total = formatMoney(order.totalMinor, order.currency, order.locale);
  return `طلبك رقم #${shortId}:\n${itemsBlock(order)}\nالإجمالي: ${total}`;
}

export function getStatusMessage(status: OrderStatus, order: MessageOrder): string {
  const name = order.customerName;
  const summary = orderSummary(order);

  switch (status) {
    case "NEW":
      return `مرحباً ${name} 👋\n${summary}\n\nاستلمنا طلبك وسنتواصل معك قريباً لتأكيده. 📚`;
    case "CONFIRMED":
      return `مرحباً ${name} 👋\n${summary}\n\nتم تأكيد طلبك وسنبدأ بتجهيزه قريباً. شكراً لطلبك من جذور عربية، أجنحة عالمية 💛`;
    case "IN_PROGRESS":
      return `مرحباً ${name} 👋\n${summary}\n\nطلبك قيد التجهيز الآن 📦. سنعلمك فور شحنه بإذن الله.`;
    case "SHIPPED":
      return `مرحباً ${name} 👋\n${summary}\n\nتم شحن طلبك وهو في طريقه إليك الآن 🚚. سنتواصل معك عند الوصول.`;
    case "DELIVERED":
      return `مرحباً ${name} 👋\n${summary}\n\nنتمنى أن تكونوا استمتعتم بالكتب! 💛 شكراً لطلبك من جذور عربية، أجنحة عالمية. يسعدنا سماع رأيكم في أي وقت.`;
    default:
      return "";
  }
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
