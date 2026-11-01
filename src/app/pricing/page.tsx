import Link from "next/link";
import { SiteFooter, SiteHeader } from "@/components/site";
import { formatInr } from "@/lib/utils";

export const metadata = { title: "Pricing" };

export default function PricingPage() {
  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-5xl px-4 py-14">
        <h1 className="font-serif text-5xl text-maroon">Simple pricing</h1>
        <p className="mt-3 max-w-2xl text-ink/75">Prices are in INR. Checkout in this demo is simulated and never asks for a card. GST is shown at 18%.</p>
        <div className="mt-8 grid gap-4 md:grid-cols-2">
          <article className="rounded-2xl border border-ink/10 bg-white p-6">
            <h2 className="font-serif text-3xl">Free</h2>
            <p className="mt-2 font-serif text-4xl">{formatInr(0)}</p>
            <ul className="mt-4 grid gap-2 text-sm">
              <li>One published site</li>
              <li>Free templates</li>
              <li>Six gallery photos</li>
              <li>Basic RSVP and a Shubh watermark</li>
            </ul>
          </article>
          <article className="rounded-2xl border border-gold/50 bg-[#4A1220] p-6 text-[#F8F1E3]">
            <h2 className="font-serif text-3xl">Premium</h2>
            <p className="mt-2 font-serif text-4xl">{formatInr(999)} <span className="text-base">+ GST</span></p>
            <ul className="mt-4 grid gap-2 text-sm text-[#E7D3A1]">
              <li>Premium templates and exports</li>
              <li>Fifty photos, freeform layout, no watermark</li>
              <li>Advanced RSVP</li>
            </ul>
            <Link href="/register" className="mt-6 inline-block rounded-full bg-[#E6D3A3] px-4 py-2 text-sm text-[#4A1220]">Start free, upgrade later</Link>
          </article>
        </div>
        <h2 className="mt-12 font-serif text-3xl">Planner studios</h2>
        <p className="mt-2 text-sm text-ink/75">Demo monthly tiers: Starter {formatInr(1499)} for 3 weddings, Studio {formatInr(3999)} for 15. These are labels in the prototype, not live subscriptions.</p>
      </main>
      <SiteFooter />
    </>
  );
}
