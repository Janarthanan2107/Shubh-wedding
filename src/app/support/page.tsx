import { SiteFooter, SiteHeader } from "@/components/site";

export const metadata = { title: "Support" };

export default function SupportPage() {
  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-4 py-14">
        <h1 className="font-serif text-5xl text-maroon">Support</h1>
        <p className="mt-4 text-ink/80">This demo has no support desk. For a local reset, sign in and use Settings → Reset demo data, or run <code className="rounded bg-ivory-deep px-1">npm run db:reset</code>.</p>
        <p className="mt-4 text-sm">Demo accounts: couple@demo.com, planner@demo.com, admin@demo.com. Password Demo@123. Authentication is labelled as a demo and can be replaced with JWT or OTP later.</p>
      </main>
      <SiteFooter />
    </>
  );
}
