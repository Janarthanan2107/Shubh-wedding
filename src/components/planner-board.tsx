"use client";

import { useState } from "react";
import Link from "next/link";
import { ExternalLink, Plus, Trash2 } from "lucide-react";
import { Button, Card, Input } from "@/components/ui";
import { DeleteDraftButton } from "@/components/delete-draft";
import { formatInr, formatIndianDate } from "@/lib/utils";
import { humanize, statusLabel } from "@/lib/labels";

type Home = {
  workspace: { id: string; name: string; plan: string; limit: number };
  weddings: { id: string; groomName: string; brideName: string; city: string; status: string; weddingDate: string; guests: number; client: string; events: number; canDelete?: boolean }[];
  tasks: { id: string; title: string; status: string; priority: string; dueDate: string; weddingId: string | null }[];
  vendors: { id: string; name: string; category: string; phone: string; city: string; notes: string; bookings: number }[];
  budget: { id: string; weddingId: string; label: string; category: string; estimate: number; paid: number; status: string }[];
  team: { id: string; name: string; email: string; role: string }[];
};

export function PlannerBoard({ home, tab }: { home: Home; tab: "projects" | "tasks" | "vendors" | "budget" | "team" }) {
  const [message, setMessage] = useState("");
  return (
    <div>
      <p className="text-xs uppercase tracking-[0.18em] text-muted">{home.workspace.name} · {humanize(home.workspace.plan)} · up to {home.workspace.limit} weddings</p>
      <h1 className="font-serif text-4xl text-maroon">{tab[0].toUpperCase() + tab.slice(1)}</h1>
      {tab === "projects" ? (
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {home.weddings.length === 0 ? <Card>No weddings in this studio yet.</Card> : home.weddings.map((wedding) => (
            <Card key={wedding.id}>
              <h2 className="font-serif text-2xl">{wedding.groomName} & {wedding.brideName}</h2>
              <p className="text-sm">{wedding.client} · {wedding.city} · {formatIndianDate(wedding.weddingDate)}</p>
              <p className="text-sm">{wedding.events} events · {wedding.guests} guests · {statusLabel(wedding.status)}</p>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <Link className="inline-flex items-center gap-1 text-sm text-link" href={`/dashboard/weddings/${wedding.id}`}><ExternalLink className="size-4" aria-hidden />Open</Link>
                {wedding.canDelete ? <DeleteDraftButton weddingId={wedding.id} label={`${wedding.groomName} & ${wedding.brideName}`} /> : null}
              </div>
            </Card>
          ))}
        </div>
      ) : null}
      {tab === "tasks" ? (
        <div className="mt-4 grid gap-3">
          {home.tasks.length === 0 ? <Card>No tasks yet.</Card> : home.tasks.map((task) => (
            <Card key={task.id}>
              <p className="font-medium">{task.title}</p>
              <p className="text-sm">{humanize(task.status)} · {humanize(task.priority)} priority {task.dueDate ? `· ${formatIndianDate(task.dueDate)}` : ""}</p>
              <Button type="button" variant="danger" size="sm" onClick={async () => { await fetch(`/api/planner/tasks/${task.id}`, { method: "DELETE" }); window.location.reload(); }}><Trash2 className="size-4" aria-hidden />Delete</Button>
            </Card>
          ))}
          <form className="grid gap-2 md:grid-cols-4" onSubmit={async (event) => {
            event.preventDefault();
            const form = new FormData(event.currentTarget);
            const res = await fetch("/api/planner/tasks", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ title: form.get("title"), status: "todo", priority: form.get("priority"), dueDate: form.get("due") }) });
            setMessage(res.ok ? "Task added" : "Could not add task");
            if (res.ok) window.location.reload();
          }}>
            <Input name="title" placeholder="Task" required />
            <select name="priority" className="h-11 rounded-xl border border-line bg-surface px-3 text-ink"><option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option></select>
            <Input name="due" type="date" />
            <Button><Plus className="size-4" aria-hidden />Add task</Button>
          </form>
        </div>
      ) : null}
      {tab === "vendors" ? (
        <div className="mt-4 grid gap-3">
          {home.vendors.length === 0 ? <Card>No vendors yet.</Card> : home.vendors.map((vendor) => (
            <Card key={vendor.id}>
              <h2 className="font-serif text-2xl">{vendor.name}</h2>
              <p className="text-sm">{vendor.category} · {vendor.city} · {vendor.phone} · {vendor.bookings} bookings</p>
              <Button type="button" variant="danger" size="sm" onClick={async () => { await fetch(`/api/planner/vendors/${vendor.id}`, { method: "DELETE" }); window.location.reload(); }}><Trash2 className="size-4" aria-hidden />Remove</Button>
            </Card>
          ))}
          <form className="grid gap-2 md:grid-cols-4" onSubmit={async (event) => {
            event.preventDefault();
            const form = new FormData(event.currentTarget);
            await fetch("/api/planner/vendors", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ name: form.get("name"), category: form.get("category"), city: form.get("city"), phone: form.get("phone") }) });
            window.location.reload();
          }}>
            <Input name="name" placeholder="Vendor" required />
            <Input name="category" placeholder="Category" required />
            <Input name="city" placeholder="City" />
            <Button><Plus className="size-4" aria-hidden />Add vendor</Button>
          </form>
        </div>
      ) : null}
      {tab === "budget" ? (
        <div className="mt-4 grid gap-3">
          {home.budget.map((item) => (
            <Card key={item.id}>
              <h2 className="font-serif text-2xl">{item.label}</h2>
              <p className="text-sm">{item.category} · estimate {formatInr(item.estimate)} · paid {formatInr(item.paid)} · {humanize(item.status)}</p>
            </Card>
          ))}
          <form className="grid gap-2 md:grid-cols-4" onSubmit={async (event) => {
            event.preventDefault();
            const form = new FormData(event.currentTarget);
            const res = await fetch("/api/planner/budget", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ weddingId: form.get("weddingId"), label: form.get("label"), category: form.get("category"), estimate: Number(form.get("estimate")), paid: Number(form.get("paid") || 0), status: "pending" }) });
            const data = await res.json();
            setMessage(res.ok ? "Budget line added" : data.error);
            if (res.ok) window.location.reload();
          }}>
            <select name="weddingId" className="h-11 rounded-xl border border-line bg-surface px-3 text-ink">{home.weddings.map((wedding) => <option key={wedding.id} value={wedding.id}>{wedding.groomName}</option>)}</select>
            <Input name="label" placeholder="Label" required />
            <Input name="category" placeholder="Category" required />
            <Input name="estimate" type="number" placeholder="Estimate" required />
            <Button><Plus className="size-4" aria-hidden />Add line</Button>
          </form>
        </div>
      ) : null}
      {tab === "team" ? (
        <div className="mt-4 grid gap-3">
          {home.team.map((member) => (
            <Card key={member.id}><h2 className="font-serif text-2xl">{member.name}</h2><p className="text-sm">{member.email} · {humanize(member.role)}</p></Card>
          ))}
          <p className="text-sm text-muted">Invites in this demo are the seeded memberships. A mailer can replace this later.</p>
        </div>
      ) : null}
      {message ? <p className="mt-3 text-sm">{message}</p> : null}
    </div>
  );
}
