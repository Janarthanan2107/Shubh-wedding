"use client";

import { useState } from "react";
import { RotateCcw, Save, Trash2 } from "lucide-react";
import { Button, Input } from "@/components/ui";

export function SettingsForm({ weddingId, noindex, hasGate }: { weddingId?: string; noindex?: boolean; hasGate?: boolean }) {
  const [message, setMessage] = useState("");
  return (
    <div className="grid max-w-xl gap-4">
      {weddingId ? (
        <form className="rounded-2xl border border-ink/10 bg-white p-4" onSubmit={async (event) => {
          event.preventDefault();
          const form = new FormData(event.currentTarget);
          const res = await fetch(`/api/weddings/${weddingId}`, {
            method: "PATCH",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ gatePassword: String(form.get("gate") || ""), noindex: form.get("noindex") === "on" }),
          });
          const data = await res.json();
          setMessage(res.ok ? "Settings saved" : data.error);
        }}>
          <h2 className="font-serif text-2xl">Privacy</h2>
          <label className="mt-3 block text-sm">Invitation password <Input name="gate" placeholder={hasGate ? "Replace password" : "Optional"} /></label>
          <label className="mt-3 flex items-center gap-2 text-sm"><input type="checkbox" name="noindex" defaultChecked={noindex} /> Ask search engines not to index</label>
          <Button className="mt-3"><Save className="size-4" aria-hidden />Save</Button>
        </form>
      ) : null}
      {weddingId ? (
        <Button type="button" variant="danger" onClick={async () => {
          if (!confirm("Delete every guest and RSVP for this wedding?")) return;
          const res = await fetch(`/api/weddings/${weddingId}/guests/purge`, { method: "DELETE" });
          const data = await res.json();
          setMessage(res.ok ? `Deleted ${data.count} guests` : data.error);
        }}><Trash2 className="size-4" aria-hidden />Delete all guest data</Button>
      ) : null}
      <Button type="button" variant="danger" data-testid="reset-demo" onClick={async () => {
        const res = await fetch("/api/demo/reset", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ confirm: "RESET DEMO" }) });
        const data = await res.json();
        if (res.ok) window.location.href = "/login";
        else setMessage(data.error);
      }}><RotateCcw className="size-4" aria-hidden />Reset demo data</Button>
      {message ? <p className="text-sm">{message}</p> : null}
      <p className="text-xs text-muted">Guest deletion and unpublishing follow data-minimisation principles. This copy is a template and needs legal review under the DPDP Act.</p>
    </div>
  );
}
