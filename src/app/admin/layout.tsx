export const metadata = {
  title: "لوحة التحكم | جذور عربية، أجنحة عالمية",
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <div className="min-h-screen bg-paper">{children}</div>;
}
