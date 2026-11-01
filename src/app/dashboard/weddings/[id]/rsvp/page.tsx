import { notFound, redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { getOwnedWedding } from "@/services/weddings";
import { listGuests, rsvpSummary } from "@/services/guests";
import { RsvpLive } from "@/components/rsvp-live";
import { WeddingNav } from "@/components/wedding-nav";
import { invitationMessage, whatsAppShareUrl } from "@/lib/domain";
import { formatIndianDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function RsvpPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireUser();
  if (!user) redirect("/login");
  const wedding = await getOwnedWedding(user, id, "viewer");
  if (!wedding) notFound();
  const [stats, guests] = await Promise.all([rsvpSummary(id), listGuests(user, id)]);
  const origin = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const dateLabel = formatIndianDate(wedding.weddingDate);
  const pendingGuests = guests
    .filter((guest) => guest.rsvp.status === "pending")
    .map((guest) => ({
      id: guest.id,
      name: guest.name,
      phone: guest.phone ?? "",
      remindUrl: whatsAppShareUrl(
        invitationMessage({ groom: wedding.groomName, bride: wedding.brideName, dateLabel, url: `${origin}/w/${wedding.slug}?g=${guest.token}`, guestName: guest.name }),
        guest.phone || undefined,
      ),
    }));
  return (
    <div>
      <WeddingNav id={id} />
      <h1 className="mb-4 font-serif text-4xl text-maroon">RSVP</h1>
      <RsvpLive weddingId={id} initial={stats} pendingGuests={pendingGuests} />
    </div>
  );
}
