import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { NewBookForm } from "@/components/admin/NewBookForm";

export default function NewBookPage() {
  return (
    <div className="flex flex-col gap-6">
      <Link
        href="/admin/books"
        className="flex items-center gap-1 text-sm font-bold text-muted hover:text-ink"
      >
        <ArrowRight className="h-4 w-4" />
        العودة إلى الكتب
      </Link>

      <h1 className="text-2xl font-extrabold">إضافة كتاب جديد</h1>

      <NewBookForm />
    </div>
  );
}
