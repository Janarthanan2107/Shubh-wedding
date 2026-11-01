"use client";

import Link from "next/link";
import { useState } from "react";
import { LogIn, Shield } from "lucide-react";
import { SiteFooter, SiteHeader } from "@/components/site";
import { Button, Input, Label } from "@/components/ui";

export default function LoginPage() {
  const [email, setEmail] = useState("couple@demo.com");
  const [password, setPassword] = useState("Demo@123");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function submit(nextEmail = email, nextPassword = password) {
    setPending(true);
    setError("");
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email: nextEmail, password: nextPassword }),
    });
    const data = await res.json();
    setPending(false);
    if (!res.ok) {
      setError(data.error || "Could not sign in");
      return;
    }
    const next = new URLSearchParams(window.location.search).get("next");
    if (next) window.location.href = next;
    else if (data.user.role === "planner") window.location.href = "/planner";
    else if (data.user.role === "admin") window.location.href = "/admin";
    else window.location.href = "/dashboard";
  }

  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-md px-4 py-16">
        <h1 className="font-serif text-4xl text-maroon">Log in</h1>
        <p className="mt-2 text-sm text-muted">Demo authentication. No OTP provider is connected.</p>
        <form className="mt-6 grid gap-3" onSubmit={(event) => { event.preventDefault(); void submit(); }}>
          <div>
            <Label htmlFor="email">Email</Label>
            <Input id="email" data-testid="login-email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} />
          </div>
          <div>
            <Label htmlFor="password">Password</Label>
            <Input id="password" data-testid="login-password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} />
          </div>
          {error ? <p className="text-sm text-maroon">{error}</p> : null}
          <Button data-testid="login-submit" disabled={pending}><LogIn className="size-4" aria-hidden />{pending ? "Signing in" : "Sign in"}</Button>
        </form>
        <div className="mt-4 grid gap-2">
          <Button type="button" variant="secondary" data-testid="demo-login-couple" onClick={() => void submit("couple@demo.com", "Demo@123")}><Shield className="size-4" aria-hidden />Continue as demo couple</Button>
          <Button type="button" variant="ghost" data-testid="demo-login-planner" onClick={() => void submit("planner@demo.com", "Demo@123")}><Shield className="size-4" aria-hidden />Continue as demo planner</Button>
          <Button type="button" variant="ghost" data-testid="demo-login-admin" onClick={() => void submit("admin@demo.com", "Demo@123")}><Shield className="size-4" aria-hidden />Continue as demo admin</Button>
        </div>
        <p className="mt-4 text-sm">New here? <Link href="/register" className="text-maroon">Create a couple account</Link></p>
      </main>
      <SiteFooter />
    </>
  );
}
