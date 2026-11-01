import Link from "next/link";
import { CircleHelp, Images, IndianRupee, LogIn, Sparkles } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";

const links = [
  { label: "Templates", href: "/templates", icon: Images },
  { label: "Features", href: "/features", icon: Sparkles },
  { label: "Pricing", href: "/pricing", icon: IndianRupee },
  { label: "FAQ", href: "/faq", icon: CircleHelp },
];

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-30 border-b border-line bg-page/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-3 px-4">
        <Link href="/" className="font-serif text-2xl text-heading">Shubh</Link>
        <nav className="hidden items-center gap-5 text-sm md:flex">
          {links.map((item) => {
            const Icon = item.icon;
            return (
              <Link key={item.href} href={item.href} className="inline-flex items-center gap-1.5 text-ink/80 hover:text-heading">
                <Icon className="size-4" aria-hidden />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="flex items-center gap-1">
          <ThemeToggle compact />
          <Link href="/login" className="inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-sm">
            <LogIn className="size-4" aria-hidden />
            Log in
          </Link>
          <Link href="/register" className="rounded-full bg-maroon px-4 py-2 text-sm text-ivory">Start a wedding</Link>
        </div>
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="border-t border-line">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-8 text-sm text-muted">
        <p>Shubh · invitations for Indian weddings. Demo product, fictional data.</p>
        <div className="flex gap-4">
          <Link href="/privacy">Privacy</Link>
          <Link href="/terms">Terms</Link>
          <Link href="/support">Support</Link>
        </div>
      </div>
    </footer>
  );
}
