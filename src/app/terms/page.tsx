import { SiteFooter, SiteHeader } from "@/components/site";

export const metadata = { title: "Terms" };

export default function TermsPage() {
  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-4 py-14 text-sm leading-relaxed text-ink/80">
        <h1 className="font-serif text-5xl text-maroon">Terms</h1>
        <p className="mt-4 rounded-xl bg-gold-soft/50 p-4">Template terms for a demo. Have a lawyer review them before you take real bookings or payments.</p>
        <p className="mt-4">Shubh is provided as a demonstration. Simulated orders are labelled as such and do not create a payment obligation. You are responsible for the invitation text you publish and for having permission to store guest details.</p>
        <p className="mt-4">Free accounts may publish one site. Premium features stay locked until a verified successful payment. Failed and pending simulations do not unlock them.</p>
        <p className="mt-4">Do not upload unlawful images or someone else’s private contact list without a reason to do so. We may remove demo content that is not fictional.</p>
      </main>
      <SiteFooter />
    </>
  );
}
