import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/Button";

export default function OrderConfirmationPage() {
  return (
    <div className="mx-auto max-w-lg px-4 py-20 text-center sm:px-6">
      <CheckCircle2 className="mx-auto h-16 w-16 text-accent" />
      <h1 className="mt-4 text-2xl font-extrabold">شكراً لطلبك!</h1>
      <p className="mt-3 text-muted">
        استلمنا طلبك بنجاح. سنتصل بك قريباً على رقم هاتفك لتنسيق التوصيل
        والدفع.
      </p>
      <Link href="/" className="mt-8 inline-block">
        <Button variant="ghost">العودة إلى المتجر</Button>
      </Link>
    </div>
  );
}
