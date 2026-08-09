import { Resend } from "resend";
import { formatMoney } from "@/lib/format-money";

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

type OrderEmailItem = { title: string; quantity: number; unitPriceMinor: number };
type OrderEmailCollectionItem = OrderEmailItem & { bookTitles: string[] };

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
        `<tr><td style="padding:4px 8px"><strong>${i.title}</strong> (مجموعة)<br/><span style="color:#666;font-size:13px">${i.bookTitles.join("، ")}</span></td><td style="padding:4px 8px">×${i.quantity}</td><td style="padding:4px 8px">${formatMoney(
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
      subject: `طلب جديد رقم #${order.id.slice(0, 8)} — ${order.customerName}`,
      html: `
        <div dir="rtl" style="font-family:sans-serif">
          <h2>طلب جديد</h2>
          <p><strong>الاسم:</strong> ${order.customerName}</p>
          <p><strong>الهاتف:</strong> ${order.phone}</p>
          ${order.email ? `<p><strong>البريد الإلكتروني:</strong> ${order.email}</p>` : ""}
          <p><strong>المدينة:</strong> ${order.city}</p>
          ${order.notes ? `<p><strong>ملاحظات:</strong> ${order.notes}</p>` : ""}
          <table style="border-collapse:collapse;margin-top:12px">${itemsHtml}${collectionItemsHtml}</table>
          <p style="margin-top:12px"><strong>الإجمالي: ${formatMoney(order.totalMinor, order.currency, order.locale)}</strong></p>
          <p style="margin-top:16px;color:#666">رقم الطلب: ${order.id}</p>
        </div>
      `,
    });
  } catch (err) {
    console.error("Failed to send order notification email", err);
  }
}

export async function sendPasswordResetOtp(email: string, otp: string): Promise<void> {
  if (!resend) {
    console.warn("RESEND_API_KEY not set — skipping password reset OTP email");
    return;
  }
  const from = process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev";
  try {
    await resend.emails.send({
      from,
      to: email,
      subject: "رمز تغيير كلمة المرور",
      html: `
        <div dir="rtl" style="font-family:sans-serif">
          <h2>رمز تغيير كلمة المرور</h2>
          <p>استخدمي هذا الرمز لتعيين كلمة مرور جديدة:</p>
          <p style="font-size:28px;font-weight:800;letter-spacing:4px">${otp}</p>
          <p style="color:#666">ينتهي الرمز خلال بضع دقائق. إن لم تطلبي هذا التغيير، تجاهلي هذه الرسالة.</p>
        </div>
      `,
    });
  } catch (err) {
    console.error("Failed to send password reset OTP email", err);
  }
}
