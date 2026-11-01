"use client";

import { useEffect, useState } from "react";
import { Filter, Inbox } from "lucide-react";
import { Badge, Card } from "@/components/ui";
import { formatInr } from "@/lib/utils";
import { humanize } from "@/lib/labels";

type Order = { id: string; reference: string; status: string; total: number; plan: string; simulated: boolean; verified: boolean; by: string };

function statusTone(status: string): "neutral" | "gold" | "green" | "maroon" {
  if (status === "success") return "green";
  if (status === "failed") return "maroon";
  if (status === "pending") return "gold";
  return "neutral";
}

export function AdminOrders() {
  const [status, setStatus] = useState("");
  const [orders, setOrders] = useState<Order[]>([]);
  useEffect(() => {
    const query = status ? `?status=${status}` : "";
    void fetch(`/api/admin/orders${query}`).then(async (res) => {
      const data = await res.json();
      setOrders(data.orders || []);
    });
  }, [status]);
  return (
    <div className="mt-4" data-testid="admin-orders">
      <label className="inline-flex items-center gap-2 text-sm"><Filter className="size-4 text-muted" aria-hidden />Status
        <select className="h-10 rounded-xl border border-line bg-surface px-3 text-ink" value={status} onChange={(event) => setStatus(event.target.value)}>
          <option value="">All</option>
          <option value="success">Success</option>
          <option value="failed">Failed</option>
          <option value="pending">Pending</option>
          <option value="created">Created</option>
        </select>
      </label>
      <div className="mt-3 grid gap-2">
        {orders.map((order) => (
          <Card key={order.id}>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="font-medium">{order.reference}</p>
                <p className="mt-1 text-sm text-muted">{order.by}</p>
              </div>
              <p className="font-serif text-2xl">{formatInr(order.total)}</p>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              <Badge tone={statusTone(order.status)}>{humanize(order.status)}</Badge>
              <Badge tone="gold">{humanize(order.plan)}</Badge>
              <Badge tone={order.verified ? "green" : "neutral"}>{order.verified ? "Verified" : "Unverified"}</Badge>
              <Badge tone={order.simulated ? "neutral" : "green"}>{order.simulated ? "Simulated" : "Live"}</Badge>
            </div>
          </Card>
        ))}
        {orders.length === 0 ? <p className="flex items-center gap-2 text-sm text-muted"><Inbox className="size-4" aria-hidden />No orders for this filter.</p> : null}
      </div>
    </div>
  );
}
