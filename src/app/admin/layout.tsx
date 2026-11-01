import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { Shell } from "@/components/shell";

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser(["admin"]);
  if (!user) redirect("/login?next=/admin");
  return <Shell user={user} area="admin">{children}</Shell>;
}
