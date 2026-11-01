"use client";

import { useEffect, useState } from "react";
import { BadgeCheck, EyeOff } from "lucide-react";
import { Button, Card } from "@/components/ui";
import { humanize } from "@/lib/labels";

type Template = { id: string; name: string; tier: string; active: boolean; category: string };

export function AdminTemplates() {
  const [rows, setRows] = useState<Template[]>([]);
  useEffect(() => {
    void fetch("/api/templates").then(async (res) => {
      const data = await res.json();
      const db = await fetch("/api/admin").then((r) => r.json()).catch(() => null);
      void db;
      setRows((data.templates || []).map((item: Template) => ({ id: item.id, name: item.name, tier: item.tier, active: true, category: item.category })));
    });
    void fetch("/api/admin/weddings");
  }, []);
  return (
    <div className="mt-4 grid gap-3" data-testid="admin-templates">
      {rows.map((row) => (
        <Card key={row.id}>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="font-serif text-2xl">{row.name}</h2>
              <p className="text-sm">{row.category} · {humanize(row.tier)}</p>
            </div>
            <div className="flex gap-2">
              <Button type="button" variant="secondary" onClick={async () => {
                const tier = row.tier === "premium" ? "free" : "premium";
                await fetch(`/api/admin/templates/${row.id}`, { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ tier }) });
                setRows(rows.map((item) => item.id === row.id ? { ...item, tier } : item));
              }}><BadgeCheck className="size-4" aria-hidden />Toggle tier</Button>
              <Button type="button" variant="ghost" onClick={async () => {
                await fetch(`/api/admin/templates/${row.id}`, { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ active: false }) });
                setRows(rows.filter((item) => item.id !== row.id));
              }}><EyeOff className="size-4" aria-hidden />Deactivate</Button>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}
