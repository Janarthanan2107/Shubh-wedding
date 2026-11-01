"use client";

import { useEffect, useMemo, useState } from "react";
import { MessageCircle, Search, Utensils } from "lucide-react";
import { Card, Input } from "@/components/ui";
import { formatIndianPhone } from "@/lib/labels";

type Meals = { veg: number; nonVeg: number; jain: number };

type Stats = {
  total: number;
  attending: number;
  notAttending: number;
  maybe: number;
  pending: number;
  headcount: number;
  responseRate: number;
  meals: Meals;
  perEvent: { eventId: string; name: string; invited: number; attending: number; headcount: number; meals: Meals }[];
};

export type PendingGuest = { id: string; name: string; phone: string; remindUrl: string };

const SEGMENTS = [
  { key: "attending", label: "Attending", colour: "bg-sage" },
  { key: "maybe", label: "Maybe", colour: "bg-gold" },
  { key: "notAttending", label: "Not attending", colour: "bg-maroon/70" },
  { key: "pending", label: "Awaiting reply", colour: "bg-ink/15" },
] as const;

function pct(part: number, whole: number) {
  return whole ? Math.round((part / whole) * 100) : 0;
}

export function RsvpLive({ weddingId, initial, pendingGuests }: { weddingId: string; initial: Stats; pendingGuests: PendingGuest[] }) {
  const [stats, setStats] = useState(initial);
  const [query, setQuery] = useState("");
  useEffect(() => {
    const id = window.setInterval(() => {
      void fetch(`/api/weddings/${weddingId}/stats`).then(async (res) => {
        if (res.ok) setStats(await res.json());
      });
    }, 5000);
    return () => window.clearInterval(id);
  }, [weddingId]);
  const plates = stats.meals.veg + stats.meals.nonVeg + stats.meals.jain;
  const pending = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q ? pendingGuests.filter((guest) => guest.name.toLowerCase().includes(q) || guest.phone.includes(q)) : pendingGuests;
  }, [pendingGuests, query]);

  return (
    <div className="grid gap-4">
      <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        <Card>
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-wider text-muted">Expected headcount</p>
              <p className="font-serif text-5xl text-heading">{stats.headcount}</p>
              <p className="text-sm text-muted">from {stats.attending} attending {stats.attending === 1 ? "reply" : "replies"}</p>
            </div>
            <div className="text-right">
              <p className="text-xs uppercase tracking-wider text-muted">Replied</p>
              <p className="font-serif text-3xl">{stats.responseRate}%</p>
              <p className="text-sm text-muted">{stats.total - stats.pending} of {stats.total} guests</p>
            </div>
          </div>
          <div className="mt-5 flex h-3 overflow-hidden rounded-full bg-ink/10" role="img" aria-label={SEGMENTS.map((s) => `${s.label} ${stats[s.key]}`).join(", ")}>
            {SEGMENTS.map((segment) => <span key={segment.key} className={segment.colour} style={{ width: `${pct(stats[segment.key], stats.total)}%` }} />)}
          </div>
          <ul className="mt-3 grid grid-cols-2 gap-2 text-sm sm:grid-cols-4">
            {SEGMENTS.map((segment) => (
              <li key={segment.key} className="flex items-center gap-2">
                <span className={`size-2.5 shrink-0 rounded-full ${segment.colour}`} aria-hidden />
                <span className="text-muted">{segment.label}</span>
                <span className="ml-auto font-medium tabular-nums sm:ml-0">{stats[segment.key]}</span>
              </li>
            ))}
          </ul>
        </Card>
        <Card>
          <h2 className="flex items-center gap-2 font-serif text-2xl"><Utensils className="size-5 text-gold" aria-hidden />Meals for the caterer</h2>
          <p className="text-sm text-muted">Plates across all ceremonies, counting every person in an attending party.</p>
          <MealBars meals={stats.meals} total={plates} />
        </Card>
      </div>

      <Card>
        <h2 className="font-serif text-2xl">By ceremony</h2>
        <ul className="mt-3 divide-y divide-line">
          {stats.perEvent.map((event) => (
            <li key={event.eventId} className="grid gap-2 py-3 md:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)] md:items-center md:gap-6">
              <div>
                <div className="flex items-baseline justify-between gap-2">
                  <p className="font-serif text-xl">{event.name}</p>
                  <p className="text-sm tabular-nums"><span className="font-medium">{event.attending}</span> <span className="text-muted">of {event.invited} attending</span></p>
                </div>
                <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-ink/10">
                  <span className="block h-full rounded-full bg-sage" style={{ width: `${pct(event.attending, event.invited)}%` }} />
                </div>
              </div>
              <p className="text-sm text-muted">
                <span className="font-medium text-ink">{event.headcount} people</span> · {event.meals.veg} veg · {event.meals.nonVeg} non-veg · {event.meals.jain} Jain
              </p>
            </li>
          ))}
        </ul>
      </Card>

      <Card>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-serif text-2xl">Awaiting reply</h2>
            <p className="text-sm text-muted">{pendingGuests.length ? `${pendingGuests.length} guests have not replied yet. Send a gentle reminder on WhatsApp.` : "Everyone has replied."}</p>
          </div>
          {pendingGuests.length > 8 ? (
            <label className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-3 size-4 text-muted" aria-hidden />
              <span className="sr-only">Search guests awaiting reply</span>
              <Input className="pl-9" placeholder="Search name or phone" value={query} onChange={(event) => setQuery(event.target.value)} />
            </label>
          ) : null}
        </div>
        {pending.length ? (
          <ul className="mt-3 grid max-h-96 gap-2 overflow-auto sm:grid-cols-2">
            {pending.map((guest) => (
              <li key={guest.id} className="flex items-center gap-3 rounded-xl bg-surface-muted px-3 py-2 text-sm">
                <span className="min-w-0 flex-1">
                  <span className="block truncate">{guest.name}</span>
                  {guest.phone ? <span className="block text-xs text-muted">{formatIndianPhone(guest.phone)}</span> : null}
                </span>
                <a className="inline-flex shrink-0 items-center gap-1 rounded-full bg-[#1f7a4d] px-3 py-1.5 text-xs font-medium text-white hover:bg-[#186440]" href={guest.remindUrl} target="_blank" rel="noreferrer">
                  <MessageCircle className="size-3.5" aria-hidden />Remind
                </a>
              </li>
            ))}
          </ul>
        ) : query ? <p className="mt-3 text-sm text-muted">No guest matches “{query}”.</p> : null}
      </Card>
    </div>
  );
}

function MealBars({ meals, total }: { meals: Meals; total: number }) {
  const rows = [
    { label: "Vegetarian", value: meals.veg, colour: "bg-sage" },
    { label: "Non-vegetarian", value: meals.nonVeg, colour: "bg-maroon/70" },
    { label: "Jain", value: meals.jain, colour: "bg-gold" },
  ];
  return (
    <ul className="mt-4 grid gap-3">
      {rows.map((row) => (
        <li key={row.label}>
          <div className="flex justify-between text-sm">
            <span>{row.label}</span>
            <span className="tabular-nums"><span className="font-medium">{row.value}</span> <span className="text-muted">plates</span></span>
          </div>
          <div className="mt-1 h-2 overflow-hidden rounded-full bg-ink/10">
            <span className={`block h-full rounded-full ${row.colour}`} style={{ width: `${pct(row.value, total)}%` }} />
          </div>
        </li>
      ))}
    </ul>
  );
}
