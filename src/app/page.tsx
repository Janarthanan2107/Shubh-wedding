import Link from "next/link";
import { CalendarHeart, MessageCircle, Palette, Send, Users, Utensils } from "lucide-react";
import { SiteFooter, SiteHeader } from "@/components/site";
import { loadThemes } from "@/lib/templates";
import { formatInr } from "@/lib/utils";

function Phone({ src, alt, className = "" }: { src: string; alt: string; className?: string }) {
  return (
    <div className={`overflow-hidden rounded-4xl border-[6px] border-ink bg-ink shadow-xl ${className}`}>
      <img src={src} alt={alt} width={390} height={844} className="block h-auto w-full rounded-[1.6rem]" />
    </div>
  );
}

export default async function HomePage() {
  const themes = await loadThemes();
  return (
    <>
      <SiteHeader />
      <main className="overflow-x-hidden">
        <section className="mx-auto grid max-w-6xl items-center gap-12 px-4 py-14 md:grid-cols-[1.1fr_1fr] md:py-20">
          <div>
            <p className="text-xs uppercase tracking-[0.28em] text-gold">Invitations for Indian weddings</p>
            <h1 className="mt-4 font-serif text-5xl leading-[0.95] text-maroon md:text-7xl">Your Wedding, Beautifully Told.</h1>
            <p className="mt-6 max-w-xl text-lg text-ink/80">
              Design a site for the mehendi, the muhurtham and the reception. Collect RSVPs, share a WhatsApp link, and keep the planner’s notes in one place.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/register" className="rounded-full bg-maroon px-6 py-3 text-ivory hover:bg-maroon-deep">Create your wedding, free</Link>
              <Link href="/w/raja-weds-rani" className="rounded-full border border-maroon/30 px-6 py-3 hover:bg-surface-muted">See a live invitation</Link>
            </div>
            <p className="mt-4 text-sm text-muted">No card needed · English, தமிழ், हिन्दी</p>
          </div>
          <div className="relative mx-auto h-[420px] w-full max-w-[340px] md:h-[500px]">
            <Phone src="/templates/floral-pastel/preview-mobile.webp" alt="Floral Pastel invitation on a phone" className="absolute left-0 top-10 w-[52%] -rotate-6 opacity-95" />
            <Phone src="/templates/royal-maroon-gold/preview-mobile.webp" alt="Royal Maroon & Gold invitation on a phone" className="absolute right-0 top-0 w-[58%] rotate-3" />
          </div>
        </section>

        <section className="border-y border-line bg-surface">
          <div className="mx-auto max-w-6xl px-4 py-14">
            <h2 className="font-serif text-4xl text-heading">Ready in an evening</h2>
            <ol className="mt-8 grid gap-6 md:grid-cols-3">
              {[
                { icon: CalendarHeart, title: "Add your ceremonies", body: "Names, dates, venues and muhurat for every function, from haldi to reception." },
                { icon: Palette, title: "Pick a design", body: "Six original templates with palettes, motifs and Tamil or Devanagari type." },
                { icon: Send, title: "Share on WhatsApp", body: "One link for everyone, or a personal link per guest so replies match names." },
              ].map((step, index) => (
                <li key={step.title} className="flex gap-4">
                  <span className="grid size-10 shrink-0 place-items-center rounded-full bg-blush/70 font-serif text-xl text-maroon">{index + 1}</span>
                  <div>
                    <h3 className="flex items-center gap-2 font-serif text-2xl"><step.icon className="size-5 text-gold" aria-hidden />{step.title}</h3>
                    <p className="mt-1 text-sm text-ink/75">{step.body}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 py-14">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="font-serif text-4xl text-heading">Templates</h2>
              <p className="mt-1 text-ink/75">Neutral by default. Add a Hindu, Muslim, Christian or Sikh motif pack only if you want one.</p>
            </div>
            <Link href="/templates" className="text-link underline-offset-4 hover:underline">Browse all templates →</Link>
          </div>
          <ul className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
            {themes.map((theme) => (
              <li key={theme.id}>
                <Link href={`/preview/template/${theme.id}`} className="group block">
                  <img src={`/templates/${theme.id}/thumb.webp`} alt="" width={600} height={800} className="aspect-[3/4] w-full rounded-2xl border border-line object-cover transition group-hover:-translate-y-1 group-hover:shadow-lg" />
                  <span className="mt-2 block font-serif text-lg leading-tight">{theme.name}</span>
                  <span className="text-xs text-muted">{theme.tier === "premium" ? "Premium" : "Free"}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>

        <section className="border-y border-line bg-surface">
          <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-14 md:grid-cols-2">
            <div>
              <h2 className="font-serif text-4xl text-heading">Know who is coming, and what they eat</h2>
              <ul className="mt-6 grid gap-4">
                {[
                  { icon: Users, title: "Replies per ceremony", body: "Guests can attend the reception but skip the haldi. You see each count separately." },
                  { icon: Utensils, title: "Plates for the caterer", body: "Veg, non-veg and Jain totals, counted per person in each party." },
                  { icon: MessageCircle, title: "Gentle reminders", body: "One tap opens WhatsApp with a personal message for anyone who has not replied." },
                ].map((item) => (
                  <li key={item.title} className="flex gap-3">
                    <item.icon className="mt-1 size-5 shrink-0 text-gold" aria-hidden />
                    <div>
                      <h3 className="font-medium">{item.title}</h3>
                      <p className="text-sm text-ink/75">{item.body}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-3xl border border-line bg-page p-6 shadow-sm" aria-label="Example RSVP summary">
              <p className="text-xs uppercase tracking-wider text-muted">Example · Expected headcount</p>
              <p className="font-serif text-5xl text-heading">87</p>
              <div className="mt-4 flex h-3 overflow-hidden rounded-full bg-ink/10">
                <span className="bg-sage" style={{ width: "54%" }} />
                <span className="bg-gold" style={{ width: "8%" }} />
                <span className="bg-maroon/70" style={{ width: "13%" }} />
              </div>
              <p className="mt-2 text-sm text-muted">65 attending · 10 maybe · 15 not attending · 30 awaiting</p>
              <div className="mt-6 grid gap-3 text-sm">
                {[["Vegetarian", 52, "bg-sage"], ["Non-vegetarian", 24, "bg-maroon/70"], ["Jain", 11, "bg-gold"]].map(([label, value, colour]) => (
                  <div key={String(label)}>
                    <div className="flex justify-between"><span>{label}</span><span className="font-medium">{value} plates</span></div>
                    <div className="mt-1 h-2 rounded-full bg-ink/10"><span className={`block h-full rounded-full ${colour}`} style={{ width: `${(Number(value) / 87) * 100}%` }} /></div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 py-14">
          <h2 className="font-serif text-4xl text-heading">Start free, upgrade if you need to</h2>
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <article className="rounded-2xl border border-line bg-surface p-6">
              <h3 className="font-serif text-2xl">Free</h3>
              <p className="font-serif text-4xl">{formatInr(0)}</p>
              <p className="mt-2 text-sm text-ink/75">One published site, free templates, six photos and RSVPs.</p>
            </article>
            <article className="rounded-2xl border border-gold/50 bg-[#4A1220] p-6 text-[#F8F1E3]">
              <h3 className="font-serif text-2xl">Premium</h3>
              <p className="font-serif text-4xl">{formatInr(999)} <span className="text-base">+ GST, once</span></p>
              <p className="mt-2 text-sm text-[#E7D3A1]">All templates, fifty photos, freeform layout and no watermark.</p>
            </article>
          </div>
          <Link href="/pricing" className="mt-4 inline-block text-link underline-offset-4 hover:underline">Compare plans →</Link>
        </section>

        <section className="px-4 pb-16">
          <div className="mx-auto max-w-6xl rounded-4xl bg-[#4A1220] px-6 py-12 text-center text-[#F8F1E3]">
            <p className="text-xs uppercase tracking-[0.25em] text-[#E7D3A1]">Together with your families</p>
            <h2 className="mt-3 font-serif text-4xl md:text-5xl">Send your invitation this week</h2>
            <Link href="/register" className="mt-6 inline-block rounded-full bg-[#E6D3A3] px-6 py-3 text-[#4A1220] hover:bg-[#f0e2bd]">Create your wedding, free</Link>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
