import { LoginForm } from "@/components/admin/LoginForm";
import { LocaleProvider } from "@/i18n/LocaleProvider";

export default function AdminLoginPage() {
  return (
    <LocaleProvider locale="ar">
      <div className="flex min-h-screen items-center justify-center p-4">
        <LoginForm />
      </div>
    </LocaleProvider>
  );
}
