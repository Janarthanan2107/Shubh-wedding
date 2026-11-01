import Link from "next/link";
import { Calendar, CreditCard, Download, Eye, Image, LayoutDashboard, Monitor, Pencil, Users } from "lucide-react";

const links = [
  ["Overview", "", LayoutDashboard],
  ["Events", "/events", Calendar],
  ["Editor", "/editor", Pencil],
  ["Preview", "/preview", Monitor],
  ["Guests", "/guests", Users],
  ["RSVP", "/rsvp", Eye],
  ["Media", "/media", Image],
  ["Plan", "/plan", CreditCard],
  ["Export", "/export", Download],
] as const;

export function WeddingNav({ id, compact = false }: { id: string; compact?: boolean }) {
  return (
    <nav className={compact ? "flex gap-2 overflow-x-auto text-sm" : "mb-6 flex flex-wrap gap-2 text-sm"}>
      {links.map(([label, href, Icon]) => (
        <Link key={label} href={`/dashboard/weddings/${id}${href}`} className="inline-flex items-center gap-1.5 rounded-full border border-line bg-surface px-3 py-1.5 text-ink hover:bg-surface-muted">
          <Icon className="size-3.5" aria-hidden />
          {label}
        </Link>
      ))}
    </nav>
  );
}
