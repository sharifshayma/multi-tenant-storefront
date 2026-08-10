export function SiteFooter({ footerText }: { footerText: string | null }) {
  if (!footerText) return null;
  return (
    <footer className="mt-16 border-t border-border bg-card">
      <div className="mx-auto max-w-6xl px-4 py-8 text-center text-sm text-muted sm:px-6">
        {footerText.split("\n").map((line, i) => (
          <p key={i} className={i === 0 ? undefined : "mt-1"}>
            {line}
          </p>
        ))}
      </div>
    </footer>
  );
}
