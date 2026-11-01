import Link from "next/link";
import { Calendar, Eye, Heart, Pencil, Plus, Users } from "lucide-react";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { formatIndianDate } from "@/lib/utils";
import { Badge, Card } from "@/components/ui";
import { planLabel, statusLabel, statusTone } from "@/lib/labels";
import { DeleteDraftButton } from "@/components/delete-draft";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const user = await requireUser(["couple", "planner"]);
  if (!user) redirect("/login");
  const weddings = await prisma.wedding.findMany({
    where: user.role === "admin" ? {} : { OR: [{ ownerId: user.id }, { collaborators: { some: { userId: user.id } } }] },
    include: { _count: { select: { guests: true } }, rsvps: true },
    orderBy: { weddingDate: "asc" },
  });
  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-muted">Dashboard</p>
          <h1 className="font-serif text-4xl text-maroon">Your weddings</h1>
        </div>
        <Link data-testid="nav-new-wedding" href="/dashboard/weddings/new" className="inline-flex items-center gap-2 rounded-full bg-maroon px-4 py-2 text-sm text-ivory">
          <Plus className="size-4" aria-hidden />
          New wedding
        </Link>
      </div>
      {weddings.length === 0 ? (
        <Card className="mt-6">
          <Heart className="size-8 text-gold" aria-hidden />
          <h2 className="mt-3 font-serif text-2xl text-heading">No wedding yet</h2>
          <p className="mt-2 text-sm text-muted">Start with the couple’s names and the first ceremony.</p>
        </Card>
      ) : (
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {weddings.map((wedding) => {
            const attending = wedding.rsvps.filter((rsvp) => rsvp.status === "attending").length;
            return (
              <Card key={wedding.id}>
                <div className="flex items-start justify-between gap-2">
                  <h2 className="font-serif text-2xl">{wedding.groomName} & {wedding.brideName}</h2>
                  <Badge tone={statusTone(wedding.status)}>{statusLabel(wedding.status)}</Badge>
                </div>
                <p className="mt-2 text-sm">{formatIndianDate(wedding.weddingDate)} · {wedding.city}</p>
                <p className="mt-1 text-sm text-muted">{wedding._count.guests} guests · {attending} attending · {planLabel(wedding.plan)}</p>
                <div className="mt-4 flex flex-wrap items-center gap-3 text-sm">
                  <Link className="inline-flex items-center gap-1 text-link" href={`/dashboard/weddings/${wedding.id}`}><Eye className="size-4" aria-hidden />Overview</Link>
                  <Link className="inline-flex items-center gap-1 text-link" href={`/dashboard/weddings/${wedding.id}/editor`}><Pencil className="size-4" aria-hidden />Editor</Link>
                  <Link className="inline-flex items-center gap-1 text-link" href={`/dashboard/weddings/${wedding.id}/guests`}><Users className="size-4" aria-hidden />Guests</Link>
                  <Link className="inline-flex items-center gap-1 text-link" href={`/dashboard/weddings/${wedding.id}/rsvp`}><Calendar className="size-4" aria-hidden />RSVP</Link>
                  {wedding.status === "draft" && wedding.ownerId === user.id ? (
                    <DeleteDraftButton weddingId={wedding.id} label={`${wedding.groomName} & ${wedding.brideName}`} />
                  ) : null}
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
