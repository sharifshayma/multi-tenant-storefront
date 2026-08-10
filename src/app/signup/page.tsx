import { redirect } from "next/navigation";
import { SignupForm } from "@/components/auth/SignupForm";
import { getCurrentStore } from "@/lib/store-context";
import { LocaleProvider } from "@/i18n/LocaleProvider";

export default async function SignupPage() {
  const store = await getCurrentStore();
  if (store) {
    redirect("/admin");
  }

  return (
    <LocaleProvider locale="ar">
      <div className="flex min-h-screen items-center justify-center p-4">
        <SignupForm />
      </div>
    </LocaleProvider>
  );
}
