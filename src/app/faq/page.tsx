import { SiteFooter, SiteHeader } from "@/components/site";

export const metadata = { title: "FAQ" };

const faqs = [
  ["Is this a real payment?", "No. Checkout is simulated. You choose success, failed or pending. Nothing is charged and no card data is collected."],
  ["Which languages are included?", "English, Tamil and Hindi. The structure can take Telugu, Malayalam, Kannada, Marathi, Gujarati and Bengali next."],
  ["Can a guest see other guests?", "No. The public invitation never returns the guest list, phone numbers or payments."],
  ["How do WhatsApp messages send?", "Shubh opens wa.me with a prepared message. You send each one yourself. A Business API can be added later."],
  ["Can I delete guest data?", "Yes. Settings includes a delete-all-guests action, and each guest can be removed. The privacy note follows DPDP principles and still needs a lawyer’s review."],
];

export default function FaqPage() {
  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-4 py-14">
        <h1 className="font-serif text-5xl text-maroon">Questions</h1>
        <div className="mt-8 grid gap-4">
          {faqs.map(([q, a]) => (
            <article key={q} className="rounded-2xl border border-ink/10 bg-white p-5">
              <h2 className="font-serif text-2xl">{q}</h2>
              <p className="mt-2 text-sm leading-relaxed text-ink/80">{a}</p>
            </article>
          ))}
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
