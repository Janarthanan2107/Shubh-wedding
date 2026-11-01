import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import QRCode from "qrcode";
import { requireUser } from "@/lib/auth";
import { getOwnedWedding, toEventDTO } from "@/services/weddings";
import { listGuests, rsvpSummary } from "@/services/guests";
import { WeddingNav } from "@/components/wedding-nav";
import { Badge, Card } from "@/components/ui";
import { invitationMessage, whatsAppShareUrl } from "@/lib/domain";
import { formatIndianDate } from "@/lib/utils";
import { replyLabel, replyTone, statusLabel, statusTone } from "@/lib/labels";
import { CopyLink } from "@/components/copy-link";
import { DeleteDraftButton } from "@/components/delete-draft";

export const dynamic = "force-dynamic";

export default async function WeddingOverview({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireUser();
  if (!user) redirect("/login");
  const wedding = await getOwnedWedding(user, id, "viewer");
  if (!wedding) notFound();
  const stats = await rsvpSummary(id);
  const guests = await listGuests(user, id);
  const origin = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const url = `${origin}/w/${wedding.slug}`;
  const message = invitationMessage({
    groom: wedding.groomName,
    bride: wedding.brideName,
    dateLabel: formatIndianDate(wedding.weddingDate),
    url,
  });
  const qr = await QRCode.toDataURL(url, { margin: 1, width: 280 });
  return (
    <div>
      <WeddingNav id={id} />
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-serif text-4xl text-maroon">{wedding.groomName} & {wedding.brideName}</h1>
          <p className="mt-2 text-sm">{formatIndianDate(wedding.weddingDate)} · {wedding.city}, {wedding.state}</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge tone={statusTone(wedding.status)}>{statusLabel(wedding.status)}</Badge>
          {wedding.status === "draft" && wedding.level === "owner" ? (
            <DeleteDraftButton weddingId={id} label={`${wedding.groomName} & ${wedding.brideName}`} redirectTo="/dashboard" />
          ) : null}
        </div>
      </div>
      <div className="mt-6 grid gap-4 md:grid-cols-4">
        {[
          ["Guests invited", stats.total, `${stats.pending} awaiting reply`],
          ["Attending", stats.attending, `of ${stats.total} guests`],
          ["Expected headcount", stats.headcount, `${stats.meals.veg} veg · ${stats.meals.nonVeg} non-veg · ${stats.meals.jain} Jain`],
          ["Replied", `${stats.responseRate}%`, `${stats.total - stats.pending} of ${stats.total} guests`],
        ].map(([label, value, hint]) => (
          <Card key={String(label)}>
            <p className="text-xs uppercase tracking-wider text-muted">{label}</p>
            <p className="font-serif text-3xl">{value}</p>
            <p className="mt-1 text-xs text-muted">{hint}</p>
          </Card>
        ))}
      </div>
      <div className="mt-4 grid items-start gap-4 lg:grid-cols-[minmax(280px,340px)_1fr]">
        <Card>
          <h2 className="font-serif text-2xl">Share</h2>
          <div className="mt-3 flex items-start gap-3">
            <img src={qr} alt="QR code for the invitation" width={112} height={112} className="shrink-0 rounded-lg" />
            <div className="flex min-w-0 flex-col items-start gap-2">
              <a data-testid="whatsapp-share" className="inline-flex h-11 items-center rounded-full bg-[#1f7a4d] px-5 text-sm font-medium text-white hover:bg-[#186440]" target="_blank" rel="noreferrer" href={whatsAppShareUrl(message)}>WhatsApp</a>
              <CopyLink url={url} />
              {wedding.status === "published" ? <Link href={`/w/${wedding.slug}`} className="inline-flex h-11 items-center rounded-full border border-line px-5 text-sm hover:bg-surface-muted">Open site</Link> : <span className="text-sm text-muted">Publish to open the public link</span>}
            </div>
          </div>
        </Card>
        <Card>
          <h2 className="font-serif text-2xl">Personal links</h2>
          <p className="mt-1 text-xs text-muted">Each guest gets their own link, so their reply is matched to them. Showing guests who have not replied first. Full list on the <Link className="text-link underline" href={`/dashboard/weddings/${id}/guests`}>Guests</Link> page.</p>
          <ul className="mt-3 grid max-h-72 gap-2 overflow-auto sm:grid-cols-2">
            {[...guests].sort((a, b) => Number(a.rsvp.status !== "pending") - Number(b.rsvp.status !== "pending")).slice(0, 30).map((guest) => {
              const personal = `${url}?g=${guest.token}`;
              const text = invitationMessage({ groom: wedding.groomName, bride: wedding.brideName, dateLabel: formatIndianDate(wedding.weddingDate), url: personal, guestName: guest.name });
              return (
                <li key={guest.id} className="flex items-center gap-2 rounded-xl bg-surface-muted px-3 py-2 text-sm">
                  <span className="min-w-0 flex-1 truncate">{guest.name}</span>
                  <Badge tone={replyTone(guest.rsvp.status)}>{replyLabel(guest.rsvp.status)}</Badge>
                  <a data-testid="personal-link" className="shrink-0 font-medium text-link" href={whatsAppShareUrl(text, guest.phone || undefined)} target="_blank" rel="noreferrer">Remind</a>
                </li>
              );
            })}
          </ul>
        </Card>
      </div>
      <Card className="mt-4">
        <h2 className="font-serif text-2xl">Ceremonies</h2>
        <ul className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
          {wedding.events.map(toEventDTO).map((event) => (
            <li key={event.id} className="rounded-xl bg-surface-muted px-3 py-2">
              <span className="block font-medium">{event.name}</span>
              <span className="text-muted">{formatIndianDate(new Date(`${event.date}T12:00:00+05:30`))} · {event.startTime} · {event.venueName}</span>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
