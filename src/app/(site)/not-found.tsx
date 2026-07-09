import Link from "next/link";
import { Button } from "@/components/ui/Button";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-lg px-4 py-20 text-center sm:px-6">
      <h1 className="text-2xl font-extrabold">الصفحة غير موجودة</h1>
      <p className="mt-3 text-muted">لم نتمكن من العثور على ما تبحثين عنه.</p>
      <Link href="/" className="mt-8 inline-block">
        <Button>العودة إلى المتجر</Button>
      </Link>
    </div>
  );
}
