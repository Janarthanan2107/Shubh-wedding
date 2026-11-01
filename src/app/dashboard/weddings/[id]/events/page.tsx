import { notFound, redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { getOwnedWedding, toEventDTO } from "@/services/weddings";
import { EventsEditor } from "@/components/events-editor";
import { WeddingNav } from "@/components/wedding-nav";

export const dynamic = "force-dynamic";

export default async function EventsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireUser();
  if (!user) redirect("/login");
  const wedding = await getOwnedWedding(user, id, "viewer");
  if (!wedding) notFound();
  return (
    <div>
      <WeddingNav id={id} />
      <h1 className="mb-4 font-serif text-4xl text-maroon">Events</h1>
      <EventsEditor weddingId={id} initial={wedding.events.map(toEventDTO)} />
    </div>
  );
}
