"use client";

import { useMemo, useState } from "react";
import { Check, ChevronLeft, ChevronRight, Download, Link2, Pencil, Search, Trash2, Upload, UserPlus, Users, X } from "lucide-react";
import { Badge, Button, Field, Input } from "@/components/ui";
import { GUEST_FIELDS, parseCsv, type GuestField } from "@/lib/domain";
import { formatIndianPhone, mealLabel, replyLabel, replyTone, sideLabel } from "@/lib/labels";

type Guest = {
  id: string;
  name: string;
  phone: string;
  email: string;
  side: string;
  plusOnes: number;
  dietary: string;
  notes: string;
  token: string;
  eventIds: string[];
  rsvp: { status: string; headcount: number };
};

const sides = ["bride", "groom", "family", "friends", "work"];
const diets = ["veg", "non-veg", "jain"];
const replies = ["pending", "attending", "maybe", "not_attending"];
const PAGE = 25;
const SELECT = "h-11 rounded-xl border border-line bg-surface px-3 text-sm text-ink";
const FIELD_LABEL: Record<GuestField, string> = { name: "Name", phone: "Phone", email: "Email", side: "Side", dietary: "Meal", plusOnes: "Plus-ones", events: "Ceremonies" };

export function GuestsManager({
  weddingId,
  initial,
  events,
  slug,
}: {
  weddingId: string;
  initial: Guest[];
  events: { id: string; name: string }[];
  slug: string;
}) {
  const [guests, setGuests] = useState(initial);
  const [query, setQuery] = useState("");
  const [side, setSide] = useState("all");
  const [status, setStatus] = useState("all");
  const [page, setPage] = useState(0);
  const [picked, setPicked] = useState<Set<string>>(new Set());
  const [editing, setEditing] = useState<Guest | null>(null);
  const [copied, setCopied] = useState("");
  const [error, setError] = useState("");
  const [form, setForm] = useState({ name: "", phone: "", side: "friends", dietary: "veg", plusOnes: 0, eventIds: events.map((event) => event.id) });

  const visible = useMemo(
    () => guests.filter((guest) => {
      if (query && !`${guest.name} ${guest.phone}`.toLowerCase().includes(query.toLowerCase())) return false;
      if (side !== "all" && guest.side !== side) return false;
      if (status !== "all" && guest.rsvp.status !== status) return false;
      return true;
    }),
    [guests, query, side, status],
  );
  const pages = Math.max(1, Math.ceil(visible.length / PAGE));
  const current = Math.min(page, pages - 1);
  const rows = visible.slice(current * PAGE, current * PAGE + PAGE);
  const allOnPage = rows.length > 0 && rows.every((guest) => picked.has(guest.id));

  async function refresh() {
    const res = await fetch(`/api/weddings/${weddingId}/guests`);
    const data = await res.json();
    if (res.ok) setGuests(data.guests);
  }

  async function add() {
    setError("");
    const res = await fetch(`/api/weddings/${weddingId}/guests`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    if (!res.ok) setError(data.error || "Could not add guest");
    else {
      setForm({ ...form, name: "", phone: "" });
      await refresh();
    }
  }

  async function saveEdit() {
    if (!editing) return;
    setError("");
    const res = await fetch(`/api/weddings/${weddingId}/guests/${editing.id}`, { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify(editing) });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Could not save guest");
      return;
    }
    setEditing(null);
    await refresh();
  }

  async function remove(ids: string[]) {
    const names = guests.filter((guest) => ids.includes(guest.id)).map((guest) => guest.name);
    if (!window.confirm(ids.length === 1 ? `Remove ${names[0]} from the guest list?` : `Remove ${ids.length} guests from the guest list?`)) return;
    await Promise.all(ids.map((id) => fetch(`/api/weddings/${weddingId}/guests/${id}`, { method: "DELETE" })));
    setPicked(new Set());
    await refresh();
  }

  async function copyLink(guest: Guest) {
    await navigator.clipboard?.writeText(`${window.location.origin}/w/${slug}?g=${guest.token}`).catch(() => undefined);
    setCopied(guest.id);
    window.setTimeout(() => setCopied(""), 1500);
  }

  const toggle = (id: string) => setPicked((prev) => {
    const next = new Set(prev);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    return next;
  });

  return (
    <div className="grid gap-4">
      <div className="rounded-2xl border border-ink/10 bg-surface p-4">
        <h2 className="mb-3 font-serif text-2xl">Add a guest</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-[2fr_1.5fr_1fr_1fr_auto] lg:items-end">
          <Field label="Name"><Input data-testid="guest-name" placeholder="e.g. Asha Iyer" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} onKeyDown={(event) => event.key === "Enter" && void add()} /></Field>
          <Field label="WhatsApp number" optional><Input data-testid="guest-phone" type="tel" placeholder="+91 98400 11111" value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} /></Field>
          <Field label="Side">
            <select className={`${SELECT} w-full`} value={form.side} onChange={(event) => setForm({ ...form, side: event.target.value })}>
              {sides.map((item) => <option key={item} value={item}>{sideLabel(item)}</option>)}
            </select>
          </Field>
          <Field label="Meal">
            <select className={`${SELECT} w-full`} value={form.dietary} onChange={(event) => setForm({ ...form, dietary: event.target.value })}>
              {diets.map((item) => <option key={item} value={item}>{mealLabel(item)}</option>)}
            </select>
          </Field>
          <Button type="button" data-testid="guest-add" disabled={!form.name.trim()} onClick={() => void add()}><UserPlus className="size-4" aria-hidden />Add guest</Button>
        </div>
        {error ? <p role="alert" className="mt-2 text-sm text-maroon">{error}</p> : null}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-48 flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted" aria-hidden />
          <Input data-testid="guest-search" aria-label="Search guests" className="pl-9" placeholder="Search name or phone" value={query} onChange={(event) => { setQuery(event.target.value); setPage(0); }} />
        </div>
        <select data-testid="guest-filter-side" aria-label="Filter by side" className={SELECT} value={side} onChange={(event) => { setSide(event.target.value); setPage(0); }}>
          <option value="all">All sides</option>
          {sides.map((item) => <option key={item} value={item}>{sideLabel(item)}</option>)}
        </select>
        <select aria-label="Filter by reply" className={SELECT} value={status} onChange={(event) => { setStatus(event.target.value); setPage(0); }}>
          <option value="all">All replies</option>
          {replies.map((item) => <option key={item} value={item}>{replyLabel(item)}</option>)}
        </select>
        <a data-testid="guest-export" className="inline-flex h-11 items-center gap-2 rounded-full border border-line px-4 text-sm hover:bg-surface-muted" href={`/api/weddings/${weddingId}/guests/export`}><Download className="size-4" aria-hidden />Export CSV</a>
      </div>

      {picked.size ? (
        <div className="flex flex-wrap items-center gap-3 rounded-xl bg-blush/50 px-4 py-2 text-sm">
          <span className="font-medium">{picked.size} selected</span>
          <Button type="button" size="sm" variant="danger" onClick={() => void remove([...picked])}><Trash2 className="size-4" aria-hidden />Remove</Button>
          <button type="button" className="ml-auto text-link" onClick={() => setPicked(new Set())}>Clear selection</button>
        </div>
      ) : null}

      <div className="overflow-auto rounded-2xl border border-ink/10 bg-surface">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="sticky top-0 bg-surface text-xs uppercase tracking-wider text-muted">
            <tr>
              <th className="w-10 p-3"><input type="checkbox" aria-label="Select all guests on this page" checked={allOnPage} onChange={() => setPicked((prev) => {
                const next = new Set(prev);
                rows.forEach((guest) => (allOnPage ? next.delete(guest.id) : next.add(guest.id)));
                return next;
              })} /></th>
              <th className="py-3 pr-3">Name</th><th className="pr-3">Phone</th><th className="pr-3">Side</th><th className="pr-3">Meal</th><th className="pr-3">Reply</th><th className="pr-3 text-right"><span className="sr-only">Actions</span></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((guest) => editing?.id === guest.id ? (
              <tr key={guest.id} className="border-t border-ink/10 bg-surface-muted/60">
                <td className="p-3" />
                <td className="py-2 pr-2"><Input aria-label="Name" className="h-9" value={editing.name} onChange={(event) => setEditing({ ...editing, name: event.target.value })} /></td>
                <td className="pr-2"><Input aria-label="Phone" className="h-9" value={editing.phone} onChange={(event) => setEditing({ ...editing, phone: event.target.value })} /></td>
                <td className="pr-2"><select aria-label="Side" className={`${SELECT} h-9`} value={editing.side} onChange={(event) => setEditing({ ...editing, side: event.target.value })}>{sides.map((item) => <option key={item} value={item}>{sideLabel(item)}</option>)}</select></td>
                <td className="pr-2"><select aria-label="Meal" className={`${SELECT} h-9`} value={editing.dietary} onChange={(event) => setEditing({ ...editing, dietary: event.target.value })}>{diets.map((item) => <option key={item} value={item}>{mealLabel(item)}</option>)}</select></td>
                <td className="pr-2"><Badge tone={replyTone(guest.rsvp.status)}>{replyLabel(guest.rsvp.status)}</Badge></td>
                <td className="whitespace-nowrap pr-3 text-right">
                  <IconButton label="Save changes" onClick={() => void saveEdit()}><Check className="size-4" aria-hidden /></IconButton>
                  <IconButton label="Cancel editing" onClick={() => setEditing(null)}><X className="size-4" aria-hidden /></IconButton>
                </td>
              </tr>
            ) : (
              <tr key={guest.id} className={`border-t border-ink/10 hover:bg-surface-muted/50 ${picked.has(guest.id) ? "bg-blush/30" : ""}`}>
                <td className="p-3"><input type="checkbox" aria-label={`Select ${guest.name}`} checked={picked.has(guest.id)} onChange={() => toggle(guest.id)} /></td>
                <td className="py-3 pr-3 font-medium">{guest.name}</td>
                <td className="whitespace-nowrap pr-3 tabular-nums text-muted">{formatIndianPhone(guest.phone) || "—"}</td>
                <td className="pr-3">{sideLabel(guest.side)}</td>
                <td className="pr-3">{mealLabel(guest.dietary)}</td>
                <td className="pr-3"><Badge tone={replyTone(guest.rsvp.status)}>{replyLabel(guest.rsvp.status)}{guest.rsvp.status === "attending" && guest.rsvp.headcount > 1 ? ` · ${guest.rsvp.headcount}` : ""}</Badge></td>
                <td className="whitespace-nowrap pr-3 text-right">
                  <IconButton label={copied === guest.id ? "Link copied" : `Copy ${guest.name}'s invitation link`} onClick={() => void copyLink(guest)}>{copied === guest.id ? <Check className="size-4 text-sage" aria-hidden /> : <Link2 className="size-4" aria-hidden />}</IconButton>
                  <IconButton label={`Edit ${guest.name}`} onClick={() => setEditing(guest)}><Pencil className="size-4" aria-hidden /></IconButton>
                  <IconButton label={`Delete ${guest.name}`} onClick={() => void remove([guest.id])}><Trash2 className="size-4" aria-hidden /></IconButton>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {visible.length === 0 ? (
          <div className="flex flex-col items-center gap-2 p-10 text-center text-sm text-muted">
            <Users className="size-8" aria-hidden />
            {guests.length ? "No guests match these filters." : "No guests yet. Add your first guest above, or import a spreadsheet below."}
          </div>
        ) : null}
      </div>
      {visible.length ? (
        <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-muted">
          <span>Showing {current * PAGE + 1}–{Math.min(visible.length, (current + 1) * PAGE)} of {visible.length}{visible.length !== guests.length ? ` (filtered from ${guests.length})` : ""}</span>
          {pages > 1 ? (
            <span className="flex items-center gap-1">
              <Button type="button" size="sm" variant="ghost" aria-label="Previous page" disabled={current === 0} onClick={() => setPage(current - 1)}><ChevronLeft className="size-4" aria-hidden /></Button>
              Page {current + 1} of {pages}
              <Button type="button" size="sm" variant="ghost" aria-label="Next page" disabled={current >= pages - 1} onClick={() => setPage(current + 1)}><ChevronRight className="size-4" aria-hidden /></Button>
            </span>
          ) : null}
        </div>
      ) : null}

      <CsvImport weddingId={weddingId} onDone={refresh} />
    </div>
  );
}

function IconButton({ label, onClick, children }: { label: string; onClick: () => void; children: React.ReactNode }) {
  return (
    <button type="button" aria-label={label} title={label} onClick={onClick} className="ml-1 inline-grid size-8 place-items-center rounded-full text-muted hover:bg-surface-muted hover:text-ink">
      {children}
    </button>
  );
}

function guessColumn(field: GuestField, headers: string[]) {
  const hints: Record<GuestField, string[]> = {
    name: ["name", "guest", "full name"],
    phone: ["phone", "mobile", "whatsapp", "number", "contact"],
    email: ["email", "mail"],
    side: ["side", "relation"],
    dietary: ["dietary", "diet", "meal", "food"],
    plusOnes: ["plusones", "plus ones", "plus-ones", "extra"],
    events: ["events", "ceremonies", "functions"],
  };
  return headers.find((header) => hints[field].some((hint) => header.trim().toLowerCase().includes(hint))) ?? "";
}

function CsvImport({ weddingId, onDone }: { weddingId: string; onDone: () => Promise<void> }) {
  const [csv, setCsv] = useState("");
  const [fileName, setFileName] = useState("");
  const [mapping, setMapping] = useState<Partial<Record<GuestField, string>>>({});
  const [report, setReport] = useState<{ ok: boolean; text: string; issues?: string[] } | null>(null);
  const [busy, setBusy] = useState(false);
  const table = useMemo(() => (csv.trim() ? parseCsv(csv) : []), [csv]);
  const headers = table[0] ?? [];

  function load(text: string, name: string) {
    const parsed = parseCsv(text);
    const head = parsed[0] ?? [];
    setCsv(text);
    setFileName(name);
    setReport(null);
    setMapping(Object.fromEntries(GUEST_FIELDS.map((field) => [field, guessColumn(field, head)])));
  }

  async function submit() {
    setBusy(true);
    const res = await fetch(`/api/weddings/${weddingId}/guests/import`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ csv, mapping: Object.fromEntries(Object.entries(mapping).filter(([, value]) => value)) }),
    });
    const data = await res.json();
    setBusy(false);
    if (!res.ok) {
      setReport({ ok: false, text: data.error });
      return;
    }
    const issues = [...data.errors, ...data.duplicates].map((item: { row: number; message: string }) => `Row ${item.row}: ${item.message}`);
    setReport({ ok: true, text: `Imported ${data.imported} ${data.imported === 1 ? "guest" : "guests"}.${issues.length ? ` ${issues.length} rows skipped.` : ""}`, issues });
    setCsv("");
    setFileName("");
    await onDone();
  }

  return (
    <div className="rounded-2xl border border-ink/10 bg-surface p-4">
      <h2 className="inline-flex items-center gap-2 font-serif text-2xl"><Upload className="size-5" aria-hidden />Import from a spreadsheet</h2>
      <p className="text-sm text-muted">Save your Excel or Google Sheet as CSV, then choose the file. You will match the columns before anything is added.</p>
      <label className="mt-3 flex cursor-pointer flex-col items-center gap-1 rounded-xl border-2 border-dashed border-line px-4 py-6 text-center text-sm hover:border-maroon/40 hover:bg-surface-muted">
        <Upload className="size-5 text-muted" aria-hidden />
        <span className="font-medium">{fileName || "Choose a CSV file"}</span>
        <span className="text-xs text-muted">The first row should hold column names</span>
        <input type="file" accept=".csv,text/csv" className="sr-only" onChange={async (event) => {
          const file = event.target.files?.[0];
          if (file) load(await file.text(), file.name);
          event.target.value = "";
        }} />
      </label>
      <details className="mt-2 text-sm">
        <summary className="cursor-pointer text-muted">Or paste CSV text</summary>
        <textarea data-testid="guest-import" className="mt-2 min-h-28 w-full rounded-xl border border-line bg-surface p-3 text-sm text-ink" placeholder={"name,phone,side\nAsha Iyer,+919876543210,bride"} onChange={(event) => load(event.target.value, "Pasted text")} />
      </details>
      {headers.length ? (
        <div className="mt-4 grid gap-4">
          <div>
            <p className="text-sm font-medium">Match your columns</p>
            <div className="mt-2 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {GUEST_FIELDS.map((field) => (
                <Field key={field} label={FIELD_LABEL[field]} optional={field !== "name"}>
                  <select className={`${SELECT} w-full`} value={mapping[field] ?? ""} onChange={(event) => setMapping({ ...mapping, [field]: event.target.value })}>
                    <option value="">— Skip —</option>
                    {headers.map((header) => <option key={header} value={header}>{header}</option>)}
                  </select>
                </Field>
              ))}
            </div>
          </div>
          <div className="overflow-auto rounded-xl border border-line">
            <p className="border-b border-line bg-surface-muted px-3 py-2 text-xs text-muted">Preview · first {Math.min(5, table.length - 1)} of {table.length - 1} rows</p>
            <table className="w-full text-left text-xs">
              <thead><tr>{GUEST_FIELDS.filter((field) => mapping[field]).map((field) => <th key={field} className="px-3 py-2">{FIELD_LABEL[field]}</th>)}</tr></thead>
              <tbody>
                {table.slice(1, 6).map((row, i) => (
                  <tr key={i} className="border-t border-line">
                    {GUEST_FIELDS.filter((field) => mapping[field]).map((field) => <td key={field} className="px-3 py-2">{row[headers.indexOf(mapping[field] as string)] ?? ""}</td>)}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Button type="button" className="justify-self-start" disabled={busy || !mapping.name} onClick={() => void submit()}>
            <Upload className="size-4" aria-hidden />{busy ? "Importing…" : `Import ${table.length - 1} ${table.length - 1 === 1 ? "guest" : "guests"}`}
          </Button>
          {!mapping.name ? <p className="text-sm text-maroon">Choose which column holds the guest name.</p> : null}
        </div>
      ) : null}
      {report ? (
        <div role="status" className={`mt-3 rounded-xl px-3 py-2 text-sm ${report.ok ? "bg-sage/15" : "bg-blush/50 text-maroon"}`}>
          {report.text}
          {report.issues?.length ? (
            <details className="mt-1">
              <summary className="cursor-pointer text-muted">See skipped rows</summary>
              <ul className="mt-1 list-inside list-disc text-xs">{report.issues.slice(0, 50).map((issue) => <li key={issue}>{issue}</li>)}</ul>
            </details>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
