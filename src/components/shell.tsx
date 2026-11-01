"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  BarChart3,
  CalendarHeart,
  CreditCard,
  FolderKanban,
  LayoutDashboard,
  LayoutTemplate,
  ListTodo,
  LogOut,
  Menu,
  Plus,
  Receipt,
  Settings,
  Store,
  Users,
  Wallet,
  X,
} from "lucide-react";
import type { SessionUser } from "@/lib/auth";
import { ThemeToggle } from "@/components/theme-toggle";

const couple = [
  { label: "Overview", href: "/dashboard", icon: LayoutDashboard },
  { label: "New wedding", href: "/dashboard/weddings/new", icon: Plus },
  { label: "Settings", href: "/dashboard/settings", icon: Settings },
];
const planner = [
  { label: "Projects", href: "/planner", icon: FolderKanban },
  { label: "Tasks", href: "/planner/tasks", icon: ListTodo },
  { label: "Vendors", href: "/planner/vendors", icon: Store },
  { label: "Budget", href: "/planner/budget", icon: Wallet },
  { label: "Team", href: "/planner/team", icon: Users },
];
const admin = [
  { label: "Stats", href: "/admin", icon: BarChart3 },
  { label: "Users", href: "/admin/users", icon: Users },
  { label: "Weddings", href: "/admin/weddings", icon: CalendarHeart },
  { label: "Templates", href: "/admin/templates", icon: LayoutTemplate },
  { label: "Plans", href: "/admin/plans", icon: CreditCard },
  { label: "Orders", href: "/admin/orders", icon: Receipt },
];

function isActive(pathname: string, href: string) {
  if (href === "/dashboard" || href === "/planner" || href === "/admin") return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function Shell({ user, area, children }: { user: Pick<SessionUser, "name" | "email" | "role">; area: "couple" | "planner" | "admin"; children: React.ReactNode }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const studio = pathname.includes("/editor");
  const items = area === "planner" ? planner : area === "admin" ? admin : couple;
  return (
    <div className={`bg-page text-ink ${studio ? "lg:h-dvh lg:overflow-hidden" : "min-h-screen"}`}>
      <div className={`flex ${studio ? "lg:h-dvh" : "min-h-screen"}`}>
        <aside className={`${open ? "fixed inset-y-0 left-0 z-40 block w-64" : "hidden"} shrink-0 border-r border-line bg-surface p-4 md:static md:block md:w-60`}>
          <div className="flex items-center justify-between">
            <Link href="/" className="inline-flex items-center gap-2 font-serif text-2xl text-heading">
              <CalendarHeart className="size-5 text-gold" aria-hidden />
              Shubh
            </Link>
            <button type="button" className="md:hidden" aria-label="Close menu" onClick={() => setOpen(false)}>
              <X className="size-5" />
            </button>
          </div>
          <p className="mt-1 text-xs uppercase tracking-wider text-muted">{area} · demo</p>
          <nav className="mt-6 grid gap-1">
            {items.map((item) => {
              const Icon = item.icon;
              const active = isActive(pathname, item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  aria-current={active ? "page" : undefined}
                  className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm ${active ? "bg-maroon text-ivory" : "text-ink hover:bg-surface-muted"}`}
                >
                  <Icon className="size-4 shrink-0" aria-hidden />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </aside>
        {open ? <button type="button" aria-label="Close menu" className="fixed inset-0 z-30 bg-ink/40 md:hidden" onClick={() => setOpen(false)} /> : null}
        <div className={`min-w-0 flex-1 ${studio ? "lg:flex lg:min-h-0 lg:flex-col" : ""}`}>
          <header className="sticky top-0 z-20 flex h-14 items-center justify-between gap-3 border-b border-line bg-page/95 px-4 backdrop-blur">
            <button type="button" className="inline-flex items-center gap-2 rounded-full px-2 py-2 text-sm md:hidden" onClick={() => setOpen(true)} aria-label="Open menu">
              <Menu className="size-5" aria-hidden />
              Menu
            </button>
            <p className="hidden text-sm md:block">
              <span className="text-muted">Signed in as</span> {user.name}
            </p>
            <div className="ml-auto flex items-center gap-1 text-sm">
              <ThemeToggle />
              <button
                type="button"
                className="inline-flex items-center gap-2 rounded-full px-3 py-2 hover:bg-surface-muted"
                onClick={async () => {
                  await fetch("/api/auth/logout", { method: "POST" });
                  window.location.href = "/";
                }}
              >
                <LogOut className="size-4" aria-hidden />
                Log out
              </button>
            </div>
          </header>
          <main className={studio ? "flex min-h-0 flex-col p-0 lg:h-[calc(100dvh-3.5rem)] lg:flex-1 lg:overflow-hidden" : "p-4 md:p-6"}>{children}</main>
        </div>
      </div>
    </div>
  );
}
