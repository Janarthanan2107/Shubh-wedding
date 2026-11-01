import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { plannerHome } from "@/services/planner";
import { PlannerBoard } from "@/components/planner-board";
import { Card } from "@/components/ui";

export async function PlannerView({ tab = "projects" }: { tab?: "projects" | "tasks" | "vendors" | "budget" | "team" }) {
  const user = await requireUser(["planner"]);
  if (!user) redirect("/login");
  const home = await plannerHome(user);
  if (!home) return <Card>No planner workspace is linked to this account.</Card>;
  return <PlannerBoard home={JSON.parse(JSON.stringify(home))} tab={tab} />;
}
