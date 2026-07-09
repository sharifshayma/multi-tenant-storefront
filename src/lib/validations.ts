import { z } from "zod";

export const checkoutSchema = z.object({
  customerName: z.string().trim().min(2, "الرجاء إدخال الاسم الكامل"),
  phone: z
    .string()
    .trim()
    .min(9, "رقم هاتف غير صالح")
    .regex(/^[0-9+\-\s]+$/, "رقم هاتف غير صالح"),
  email: z
    .union([z.string().trim().email("بريد إلكتروني غير صالح"), z.literal("")])
    .optional(),
  city: z.string().trim().min(2, "الرجاء إدخال المدينة"),
  notes: z.string().trim().optional(),
  items: z
    .array(
      z.object({
        bookId: z.string(),
        quantity: z.number().int().min(1),
      })
    )
    .min(1, "السلة فارغة"),
});

export type CheckoutInput = z.infer<typeof checkoutSchema>;

export const loginSchema = z.object({
  password: z.string().min(1, "الرجاء إدخال كلمة المرور"),
});
