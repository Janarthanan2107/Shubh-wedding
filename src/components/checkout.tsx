"use client";

import { useState } from "react";
import { BadgeCheck, Clock, XCircle } from "lucide-react";
import { Button, Card } from "@/components/ui";
import { formatInr } from "@/lib/utils";

export function Checkout({ weddingId, plan }: { weddingId: string; plan: string }) {
  const [receipt, setReceipt] = useState<string>("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function pay(outcome: "success" | "failed" | "pending") {
    setBusy(true);
    setError("");
    const created = await fetch(`/api/weddings/${weddingId}/orders`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ planId: "premium" }),
    });
    const order = await created.json();
    if (!created.ok) {
      setBusy(false);
      setError(order.error || "Could not start checkout");
      return;
    }
    const settled = await fetch(`/api/orders/${order.orderId}/settle`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ outcome }),
    });
    const result = await settled.json();
    setBusy(false);
    if (!settled.ok) {
      setError(result.error || "Payment failed");
      return;
    }
    setReceipt(`Simulated ${result.status}. Reference ${result.reference}. Subtotal ${formatInr(result.subtotal)}, GST ${formatInr(result.gst)}, total ${formatInr(result.total)}. ${result.unlocked ? "Premium unlocked." : "Premium stays locked."}`);
  }

  return (
    <Card>
      <p className="text-xs uppercase tracking-wider text-gold">Simulated checkout · no card data</p>
      <h2 className="mt-2 font-serif text-3xl">Premium · {formatInr(999)}</h2>
      <p className="mt-2 text-sm">Subtotal {formatInr(999)} · GST 18% {formatInr(179.82)} · Total {formatInr(1178.82)}</p>
      <p className="mt-2 text-sm">Current plan: {plan}</p>
      <div className="mt-4 flex flex-wrap gap-2">
        <Button type="button" data-testid="checkout-success" disabled={busy} onClick={() => void pay("success")}><BadgeCheck className="size-4" aria-hidden />Simulate success</Button>
        <Button type="button" variant="danger" data-testid="checkout-failed" disabled={busy} onClick={() => void pay("failed")}><XCircle className="size-4" aria-hidden />Simulate failed</Button>
        <Button type="button" variant="secondary" data-testid="checkout-pending" disabled={busy} onClick={() => void pay("pending")}><Clock className="size-4" aria-hidden />Simulate pending</Button>
      </div>
      {error ? <p className="mt-3 text-sm text-maroon">{error}</p> : null}
      {receipt ? <p data-testid="receipt" className="mt-3 text-sm">{receipt}</p> : null}
    </Card>
  );
}
