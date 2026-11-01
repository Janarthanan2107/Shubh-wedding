import { SiteFooter, SiteHeader } from "@/components/site";

export const metadata = { title: "Features" };

export default function FeaturesPage() {
  const items = [
    ["Invitation editor", "Drag sections, edit type, colour and spacing, then undo a mistake."],
    ["Six image templates", "Royal, Tamil, floral, minimal, sage and temple. Each has its own artwork."],
    ["WhatsApp sharing", "A personal link for every guest, plus a printable QR code."],
    ["RSVP desk", "Headcount, meal preference and a live count for each ceremony."],
    ["Planner workspace", "Several weddings, tasks, vendors and a budget with paid and pending."],
    ["Languages", "English, Tamil and Hindi on the invitation, with room for more Indic languages."],
  ];
  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-5xl px-4 py-14">
        <h1 className="font-serif text-5xl text-maroon">What Shubh holds</h1>
        <div className="mt-8 grid gap-4 md:grid-cols-2">
          {items.map(([title, body]) => (
            <article key={title} className="rounded-2xl border border-ink/10 bg-white p-5">
              <h2 className="font-serif text-2xl">{title}</h2>
              <p className="mt-2 text-sm text-ink/75">{body}</p>
            </article>
          ))}
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
