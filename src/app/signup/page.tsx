import { redirect } from "next/navigation";
import { SignupForm } from "@/components/auth/SignupForm";
import { getCurrentStore } from "@/lib/store-context";

export default async function SignupPage() {
  const store = await getCurrentStore();
  if (store) {
    redirect("/admin");
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <SignupForm />
    </div>
  );
}
