import { notFound, redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { getOwnedWedding } from "@/services/weddings";
import { listGuests } from "@/services/guests";
import { GuestsManager } from "@/components/guests-manager";
import { WeddingNav } from "@/components/wedding-nav";

export const dynamic = "force-dynamic";

export default async function GuestsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireUser();
  if (!user) redirect("/login");
  const wedding = await getOwnedWedding(user, id, "viewer");
  if (!wedding) notFound();
  const guests = await listGuests(user, id);
  return (
    <div>
      <WeddingNav id={id} />
      <h1 className="mb-4 font-serif text-4xl text-maroon">Guests</h1>
      <GuestsManager weddingId={id} slug={wedding.slug} initial={guests} events={wedding.events.map((event) => ({ id: event.id, name: event.name }))} />
    </div>
  );
}
