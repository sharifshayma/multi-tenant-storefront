export function Price({ nis, className }: { nis: number; className?: string }) {
  return (
    <span dir="ltr" className={className}>
      {nis} ₪
    </span>
  );
}
