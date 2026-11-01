import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { Shell } from "@/components/shell";

export const dynamic = "force-dynamic";

export default async function PlannerLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser(["planner"]);
  if (!user) redirect("/login?next=/planner");
  return <Shell user={user} area="planner">{children}</Shell>;
}
