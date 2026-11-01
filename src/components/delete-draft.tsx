"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui";

export function DeleteDraftButton({
  weddingId,
  label,
  redirectTo,
}: {
  weddingId: string;
  label: string;
  redirectTo?: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape" && !busy) setOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, busy]);

  async function confirm() {
    setBusy(true);
    setError("");
    try {
      const res = await fetch(`/api/weddings/${weddingId}`, { method: "DELETE" });
      const data = await res.json().catch(() => ({}));
      if (res.status === 404) {
        setOpen(false);
        if (redirectTo) router.push(redirectTo);
        router.refresh();
        return;
      }
      if (!res.ok) {
        setError(data.error || "Could not delete this draft.");
        setBusy(false);
        return;
      }
      localStorage.removeItem(`shubh-draft-${weddingId}`);
      setOpen(false);
      if (redirectTo) router.push(redirectTo);
      router.refresh();
    } catch {
      setError("Network error. This draft is still here.");
      setBusy(false);
    }
  }

  return (
    <>
      <Button type="button" variant="danger" size="sm" data-testid="delete-draft" onClick={() => { setError(""); setOpen(true); }}>
        <Trash2 className="size-4" aria-hidden />
        Delete draft
      </Button>
      {open ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-ink/40 p-4" role="presentation" onClick={() => { if (!busy) setOpen(false); }}>
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-draft-title"
            className="w-full max-w-md rounded-2xl border border-line bg-surface p-5 text-ink shadow-lg"
            onClick={(event) => event.stopPropagation()}
          >
            <h2 id="delete-draft-title" className="font-serif text-2xl text-heading">Delete this draft?</h2>
            <p className="mt-2 text-sm text-muted">
              {label} will be removed, including its ceremonies, guests and saved design. This cannot be undone. Published weddings are left as they are.
            </p>
            {error ? <p className="mt-3 text-sm text-link" role="alert">{error}</p> : null}
            <div className="mt-5 flex justify-end gap-2">
              <Button type="button" variant="ghost" disabled={busy} onClick={() => setOpen(false)}>Cancel</Button>
              <Button type="button" variant="danger" disabled={busy} data-testid="delete-draft-confirm" onClick={() => void confirm()}>
                <Trash2 className="size-4" aria-hidden />
                {busy ? "Deleting" : "Delete draft"}
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
