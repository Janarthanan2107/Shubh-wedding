import { notFound, redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { getOwnedWedding } from "@/services/weddings";
import { WeddingNav } from "@/components/wedding-nav";
import { Checkout } from "@/components/checkout";
import { PublishControls } from "@/components/publish-controls";
import { entitlementsFor } from "@/lib/domain";

export const dynamic = "force-dynamic";

export default async function PlanPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireUser();
  if (!user) redirect("/login");
  const wedding = await getOwnedWedding(user, id, "viewer");
  if (!wedding) notFound();
  const entitlements = entitlementsFor(wedding.plan);
  return (
    <div>
      <WeddingNav id={id} />
      <h1 className="mb-4 font-serif text-4xl text-maroon">Plan</h1>
      <ul className="mb-4 grid gap-1 text-sm">
        <li>Photos: {entitlements.maxPhotos}</li>
        <li>Watermark: {entitlements.watermark ? "shown" : "removed"}</li>
        <li>Premium templates: {entitlements.premiumTemplates ? "unlocked" : "locked"}</li>
        <li>Export: {entitlements.exportCard ? "unlocked" : "locked"}</li>
      </ul>
      <Checkout weddingId={id} plan={wedding.plan} />
      <PublishControls id={id} status={wedding.status} />
    </div>
  );
}
