import { SiteFooter, SiteHeader } from "@/components/site";

export const metadata = { title: "API" };

const rows = [
  ["POST /api/auth/login", "Demo sign-in"],
  ["POST /api/auth/register", "Create a couple account"],
  ["GET /api/weddings", "Weddings visible to the session"],
  ["POST /api/weddings", "Create a wedding from the wizard"],
  ["PUT /api/weddings/:id/design", "Autosave. Send the revision you last received."],
  ["POST /api/weddings/:id/publish", "Publish after validation"],
  ["DELETE /api/weddings/:id/publish", "Unpublish. The public URL becomes not found."],
  ["POST /api/weddings/:id/orders", "Start a simulated order"],
  ["POST /api/orders/:id/settle", "Outcome success, failed or pending"],
  ["POST /api/public/:slug/rsvp", "Guest reply. No other guest is returned."],
  ["GET /api/openapi", "Short OpenAPI document"],
];

export default function DocsPage() {
  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-4 py-14">
        <h1 className="font-serif text-5xl text-maroon">API</h1>
        <p className="mt-3 text-sm text-ink/75">JSON over HTTP. Mutations check the Origin header. Role checks live in the service layer.</p>
        <ul className="mt-6 grid gap-2 text-sm">
          {rows.map(([path, note]) => (
            <li key={path} className="rounded-xl border border-ink/10 bg-white px-3 py-2"><code>{path}</code> — {note}</li>
          ))}
        </ul>
      </main>
      <SiteFooter />
    </>
  );
}
