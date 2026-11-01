"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Monitor, Search, Smartphone } from "lucide-react";
import { Badge, Button } from "@/components/ui";
import { humanize } from "@/lib/labels";

export type GalleryTemplate = {
  id: string;
  name: string;
  tier: "free" | "premium";
  category: string;
  tags: string[];
  description: { en: string; ta: string };
  thumb: string;
  previewDesktop: string;
  previewMobile: string;
};

const filters = ["All", "Traditional", "Modern", "Floral", "Minimal", "Temple", "Free", "Premium"];

export function TemplateGallery({ templates, loggedIn }: { templates: GalleryTemplate[]; loggedIn: boolean }) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("All");
  const [device, setDevice] = useState<"desktop" | "mobile">("desktop");
  const [open, setOpen] = useState<GalleryTemplate | null>(null);
  const visible = useMemo(() => {
    return templates.filter((template) => {
      const hay = `${template.name} ${template.tags.join(" ")} ${template.description.en}`.toLowerCase();
      if (query && !hay.includes(query.toLowerCase())) return false;
      if (filter === "Free") return template.tier === "free";
      if (filter === "Premium") return template.tier === "premium";
      if (filter !== "All" && template.category !== filter) return false;
      return true;
    });
  }, [templates, query, filter]);

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted" aria-hidden />
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search templates" className="h-11 rounded-full border border-line bg-surface pl-9 pr-4 text-ink" />
        </div>
        {filters.map((item) => (
          <button key={item} type="button" onClick={() => setFilter(item)} className={`rounded-full px-3 py-2 text-sm ${filter === item ? "bg-maroon text-ivory" : "bg-surface text-ink"}`}>{item}</button>
        ))}
        <button type="button" className="inline-flex items-center gap-2 rounded-full border border-line px-3 py-2 text-sm" onClick={() => setDevice((d) => (d === "desktop" ? "mobile" : "desktop"))}>
          {device === "desktop" ? <Smartphone className="size-4" aria-hidden /> : <Monitor className="size-4" aria-hidden />}
          {device === "desktop" ? "Mobile preview" : "Desktop preview"}
        </button>
      </div>
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {visible.map((template) => (
          <article key={template.id} data-testid={`template-card-${template.id}`} className="overflow-hidden rounded-2xl border border-ink/10 bg-white">
            <button type="button" className="block w-full" onClick={() => setOpen(template)}>
              <img src={device === "desktop" ? template.thumb : template.previewMobile} alt={`${template.name} invitation preview`} width={600} height={800} className="h-72 w-full object-cover" />
            </button>
            <div className="p-4">
              <div className="flex items-center justify-between gap-2">
                <h2 className="font-serif text-2xl">{template.name}</h2>
                <Badge tone={template.tier === "premium" ? "gold" : "green"}>{humanize(template.tier)}</Badge>
              </div>
              <p className="mt-2 text-sm text-ink/70">{template.description.en}</p>
              <p className="mt-1 text-sm text-ink/60">{template.description.ta}</p>
              <div className="mt-3 flex flex-wrap gap-1">
                {template.tags.map((tag) => <Badge key={tag}>{tag}</Badge>)}
              </div>
              <div className="mt-4 flex gap-2">
                <Button type="button" variant="secondary" onClick={() => setOpen(template)}>Preview</Button>
                <Link data-testid={`template-use-${template.id}`} href={loggedIn ? `/dashboard/weddings/new?template=${template.id}` : `/login?next=/dashboard/weddings/new?template=${template.id}`} className="inline-flex h-11 items-center rounded-full bg-maroon px-4 text-sm text-ivory">Use this template</Link>
              </div>
            </div>
          </article>
        ))}
      </div>
      {open ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4" role="dialog" aria-modal>
          <div className="max-h-[90vh] w-full max-w-4xl overflow-auto rounded-2xl bg-page p-4">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="font-serif text-3xl">{open.name}</h3>
              <button type="button" className="rounded-full px-3 py-1 text-sm hover:bg-surface-muted" onClick={() => setOpen(null)}>Close</button>
            </div>
            <img data-testid="template-preview" src={device === "desktop" ? open.previewDesktop : open.previewMobile} alt={`${open.name} full preview`} className="w-full rounded-xl" />
          </div>
        </div>
      ) : null}
    </div>
  );
}
