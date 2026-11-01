"use client";

import { useState } from "react";
import { ArrowDown, ArrowUp, ChevronDown, Plus, Save, Trash2 } from "lucide-react";
import { Button, Field, Input, Textarea } from "@/components/ui";

type EventRow = {
  id?: string;
  name: string;
  type: string;
  date: string;
  startTime: string;
  endTime: string;
  dressCode: string;
  muhurat: string;
  tithi: string;
  nakshatra: string;
  description: string;
  venueName: string;
  address: string;
  city: string;
  state: string;
  mapUrl: string;
};

function summary(event: EventRow) {
  const date = event.date ? new Date(`${event.date}T00:00:00`).toLocaleDateString("en-IN", { day: "numeric", month: "short" }) : "No date";
  const time = event.startTime ? new Date(`2000-01-01T${event.startTime}`).toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" }) : "";
  return [date, time, event.venueName].filter(Boolean).join(" · ");
}

export function EventsEditor({ weddingId, initial }: { weddingId: string; initial: EventRow[] }) {
  const [events, setEvents] = useState(initial);
  const [open, setOpen] = useState<number | null>(initial.length ? 0 : null);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const [saving, setSaving] = useState(false);
  const [removed, setRemoved] = useState<{ event: EventRow; index: number } | null>(null);
  const set = (index: number, patch: Partial<EventRow>) => {
    setMessage(null);
    setEvents(events.map((item, i) => (i === index ? { ...item, ...patch } : item)));
  };
  const swap = (index: number, other: number) => {
    setEvents(events.map((item, i) => (i === index ? events[other] : i === other ? events[index] : item)));
    if (open === index) setOpen(other);
  };

  return (
    <div className="grid gap-3 pb-20">
      {events.map((event, index) => {
        const expanded = open === index;
        return (
          <div key={event.id || index} className="rounded-2xl border border-ink/10 bg-surface">
            <div className="flex items-center gap-2 p-3 pl-4">
              <button type="button" aria-expanded={expanded} className="flex flex-1 items-center gap-3 text-left" onClick={() => setOpen(expanded ? null : index)}>
                <span className="grid size-8 shrink-0 place-items-center rounded-full bg-surface-muted text-sm">{index + 1}</span>
                <span className="min-w-0">
                  <span className="block font-serif text-xl text-heading">{event.name || "Untitled ceremony"}</span>
                  <span className="block truncate text-sm text-muted">{summary(event)}</span>
                </span>
                <ChevronDown className={`ml-auto size-5 shrink-0 text-muted transition ${expanded ? "rotate-180" : ""}`} aria-hidden />
              </button>
              <Button type="button" size="sm" variant="ghost" aria-label={`Move ${event.name} up`} disabled={index === 0} onClick={() => swap(index, index - 1)}><ArrowUp className="size-4" aria-hidden /></Button>
              <Button type="button" size="sm" variant="ghost" aria-label={`Move ${event.name} down`} disabled={index === events.length - 1} onClick={() => swap(index, index + 1)}><ArrowDown className="size-4" aria-hidden /></Button>
            </div>
            {expanded ? (
              <div className="grid gap-4 border-t border-line p-4 md:grid-cols-2">
                <Field label="Ceremony name"><Input value={event.name} onChange={(e) => set(index, { name: e.target.value })} /></Field>
                <Field label="Date"><Input type="date" value={event.date} onChange={(e) => set(index, { date: e.target.value })} /></Field>
                <Field label="Start time"><Input type="time" value={event.startTime} onChange={(e) => set(index, { startTime: e.target.value })} /></Field>
                <Field label="End time" optional><Input type="time" value={event.endTime} onChange={(e) => set(index, { endTime: e.target.value })} /></Field>
                <Field label="Venue name"><Input placeholder="e.g. Kalyana Mandapam" value={event.venueName} onChange={(e) => set(index, { venueName: e.target.value })} /></Field>
                <Field label="Address"><Input placeholder="Street and area" value={event.address} onChange={(e) => set(index, { address: e.target.value })} /></Field>
                <Field label="Google Maps link" optional><Input type="url" placeholder="https://maps.google.com/…" value={event.mapUrl} onChange={(e) => set(index, { mapUrl: e.target.value })} /></Field>
                <Field label="Dress code" optional><Input placeholder="e.g. Traditional silk" value={event.dressCode} onChange={(e) => set(index, { dressCode: e.target.value })} /></Field>
                <Field label="Muhurat" optional><Input placeholder="e.g. 9:30 – 10:30 AM" value={event.muhurat} onChange={(e) => set(index, { muhurat: e.target.value })} /></Field>
                <Field label="Tithi / nakshatra" optional><Input value={event.tithi} onChange={(e) => set(index, { tithi: e.target.value })} /></Field>
                <Field label="Note for guests" optional className="md:col-span-2"><Textarea className="min-h-20" value={event.description} onChange={(e) => set(index, { description: e.target.value })} /></Field>
                <div className="md:col-span-2">
                  <Button type="button" size="sm" variant="danger" disabled={events.length === 1} title={events.length === 1 ? "A wedding needs at least one ceremony" : undefined} onClick={() => {
                    setRemoved({ event, index });
                    setEvents(events.filter((_, i) => i !== index));
                    setOpen(null);
                  }}><Trash2 className="size-4" aria-hidden />Remove ceremony</Button>
                </div>
              </div>
            ) : null}
          </div>
        );
      })}
      {removed ? (
        <p role="status" className="flex items-center justify-between rounded-xl bg-surface-muted px-4 py-2 text-sm">
          {removed.event.name} removed. It stays until you save.
          <button type="button" className="font-medium text-link" onClick={() => {
            const next = [...events];
            next.splice(removed.index, 0, removed.event);
            setEvents(next);
            setRemoved(null);
          }}>Undo</button>
        </p>
      ) : null}
      <Button type="button" variant="secondary" className="justify-self-start" onClick={() => {
        setEvents([...events, { name: "Sangeet", type: "Sangeet", date: events[0]?.date || "2026-12-20", startTime: "18:00", endTime: "21:00", dressCode: "", muhurat: "", tithi: "", nakshatra: "", description: "", venueName: events[0]?.venueName || "", address: events[0]?.address || "", city: events[0]?.city || "", state: events[0]?.state || "", mapUrl: "" }]);
        setOpen(events.length);
      }}><Plus className="size-4" aria-hidden />Add ceremony</Button>
      <div className="sticky bottom-4 flex items-center gap-3 justify-self-start rounded-full border border-line bg-surface/95 p-1.5 pr-4 shadow-sm">
        <Button type="button" disabled={saving} onClick={async () => {
          setSaving(true);
          const res = await fetch(`/api/weddings/${weddingId}/events`, { method: "PUT", headers: { "content-type": "application/json" }, body: JSON.stringify({ events }) });
          const data = await res.json();
          setSaving(false);
          setMessage(res.ok ? { ok: true, text: "All ceremonies saved" } : { ok: false, text: data.error });
          if (res.ok) setRemoved(null);
        }}><Save className="size-4" aria-hidden />{saving ? "Saving…" : "Save ceremonies"}</Button>
        {message ? <p role="status" className={`text-sm ${message.ok ? "text-sage" : "text-maroon"}`}>{message.text}</p> : null}
      </div>
    </div>
  );
}
