import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { Shell } from "@/components/shell";

export const dynamic = "force-dynamic";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser(["couple", "planner"]);
  if (!user) redirect("/login?next=/dashboard");
  return <Shell user={user} area="couple">{children}</Shell>;
}
