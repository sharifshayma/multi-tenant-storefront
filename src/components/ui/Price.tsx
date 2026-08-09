import { formatMoney } from "@/lib/format-money";

export function Price({
  minor,
  currency,
  locale,
  className,
}: {
  minor: number;
  currency: string;
  locale: string;
  className?: string;
}) {
  return (
    <span dir="ltr" className={className}>
      {formatMoney(minor, currency, locale)}
    </span>
  );
}
