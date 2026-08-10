import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { getDictionary, t } from "@/i18n";

export default function NotFound() {
  // No resolved store context here, so fall back to the documented Arabic default.
  const d = getDictionary("ar");
  return (
    <div className="mx-auto max-w-lg px-4 py-20 text-center sm:px-6">
      <h1 className="text-2xl font-extrabold">{t(d, "store.notFound.title")}</h1>
      <p className="mt-3 text-muted">{t(d, "store.notFound.message")}</p>
      <Link href="/" className="mt-8 inline-block">
        <Button>{t(d, "store.backToStore")}</Button>
      </Link>
    </div>
  );
}
