import { requireUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { SettingsForm } from "@/components/settings-form";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const user = await requireUser();
  if (!user) redirect("/login");
  return (
    <div>
      <h1 className="mb-2 font-serif text-4xl text-maroon">Settings</h1>
      <p className="mb-4 text-sm">Signed in as {user.email}. Demo authentication.</p>
      <SettingsForm />
    </div>
  );
}
