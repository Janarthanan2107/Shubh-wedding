"use client";

import { useState } from "react";
import { EyeOff, Globe } from "lucide-react";
import { Button } from "@/components/ui";

export function PublishControls({ id, status }: { id: string; status: string }) {
  const [message, setMessage] = useState("");
  return (
    <div className="mt-4 flex flex-wrap items-center gap-2">
      <Button type="button" data-testid="publish" onClick={async () => {
        const res = await fetch(`/api/weddings/${id}/publish`, { method: "POST", headers: { "content-type": "application/json" }, body: "{}" });
        const data = await res.json();
        setMessage(res.ok ? `Published · /w/${data.slug}` : data.error);
        if (res.ok) window.setTimeout(() => window.location.reload(), 400);
      }}><Globe className="size-4" aria-hidden />Publish</Button>
      <Button type="button" variant="danger" data-testid="unpublish" onClick={async () => {
        const res = await fetch(`/api/weddings/${id}/publish`, { method: "DELETE" });
        const data = await res.json();
        setMessage(res.ok ? "Unpublished. Visitors now see a not-found page." : data.error);
      }}><EyeOff className="size-4" aria-hidden />Unpublish</Button>
      <span className="text-sm">Status: {status}</span>
      {message ? <p className="w-full text-sm">{message}</p> : null}
    </div>
  );
}
