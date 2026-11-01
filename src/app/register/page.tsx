"use client";

import { useState } from "react";
import { UserPlus } from "lucide-react";
import { SiteFooter, SiteHeader } from "@/components/site";
import { Button, Input, Label } from "@/components/ui";

export default function RegisterPage() {
  const [error, setError] = useState("");
  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-md px-4 py-16">
        <h1 className="font-serif text-4xl text-maroon">Create an account</h1>
        <p className="mt-2 text-sm text-muted">Demo sign-up. Passwords stay in the local database as a hash.</p>
        <form
          className="mt-6 grid gap-3"
          onSubmit={async (event) => {
            event.preventDefault();
            const form = new FormData(event.currentTarget);
            const res = await fetch("/api/auth/register", {
              method: "POST",
              headers: { "content-type": "application/json" },
              body: JSON.stringify({ name: form.get("name"), email: form.get("email"), password: form.get("password") }),
            });
            const data = await res.json();
            if (!res.ok) setError(data.error || "Could not register");
            else window.location.href = "/dashboard/weddings/new";
          }}
        >
          <div><Label htmlFor="name">Your name</Label><Input id="name" name="name" required /></div>
          <div><Label htmlFor="email">Email</Label><Input id="email" name="email" type="email" required /></div>
          <div><Label htmlFor="password">Password</Label><Input id="password" name="password" type="password" minLength={8} required /></div>
          {error ? <p className="text-sm text-maroon">{error}</p> : null}
          <Button><UserPlus className="size-4" aria-hidden />Create account</Button>
        </form>
      </main>
      <SiteFooter />
    </>
  );
}
