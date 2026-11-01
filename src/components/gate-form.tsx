"use client";

import { useState } from "react";

export function GateForm({ slug }: { slug: string }) {
  const [error, setError] = useState("");
  return (
    <main className="mx-auto grid min-h-screen max-w-md place-items-center px-4">
      <form
        className="w-full rounded-2xl border border-ink/10 bg-white p-6"
        onSubmit={async (event) => {
          event.preventDefault();
          const password = new FormData(event.currentTarget).get("password");
          const res = await fetch(`/api/public/${slug}/gate`, {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ password }),
          });
          if (!res.ok) setError("That password did not match.");
          else window.location.reload();
        }}
      >
        <h1 className="font-serif text-3xl text-maroon">This invitation is private</h1>
        <p className="mt-2 text-sm">Enter the password shared by the couple.</p>
        <input name="password" type="password" className="mt-4 h-11 w-full rounded-xl border px-3" required />
        {error ? <p className="mt-2 text-sm text-maroon">{error}</p> : null}
        <button className="mt-4 h-11 rounded-full bg-maroon px-4 text-ivory">Unlock</button>
      </form>
    </main>
  );
}
