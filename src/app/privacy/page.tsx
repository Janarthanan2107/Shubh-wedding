import { SiteFooter, SiteHeader } from "@/components/site";

export const metadata = { title: "Privacy" };

export default function PrivacyPage() {
  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-4 py-14">
        <h1 className="font-serif text-5xl text-maroon">Privacy</h1>
        <p className="mt-4 rounded-xl bg-gold-soft/50 p-4 text-sm">This is a template for a demo product. It is not legal advice and needs professional review before a real launch, including under India’s DPDP Act.</p>
        <div className="mt-6 grid gap-4 text-sm leading-relaxed text-ink/80">
          <p>Shubh stores the couple’s names, ceremony details, guest names, optional phone numbers and RSVP answers so the wedding can be planned. We do not ask for more than that.</p>
          <p>Guest contact details and simulated payment records are not included in the public invitation. Guests see only their own name when they open a personal link.</p>
          <p>You can unpublish a site, delete one guest, or delete every guest record. Deletion is written to an audit log. Hosting of a published page stops for visitors, while the couple’s draft stays until they remove it.</p>
          <p>The RSVP form includes a short consent line. A honeypot field is ready for a captcha provider later. Demo accounts use a shared password and should not hold real guest lists.</p>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
