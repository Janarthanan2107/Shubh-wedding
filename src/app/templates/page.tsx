import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import { loadThemes } from "@/lib/templates";
import { SiteFooter, SiteHeader } from "@/components/site";
import { TemplateGallery, type GalleryTemplate } from "@/components/gallery";

export const dynamic = "force-dynamic";
export const metadata = { title: "Templates" };

export default async function TemplatesPage() {
  const [themes, rows, user] = await Promise.all([loadThemes(), prisma.template.findMany(), getSessionUser()]);
  const active = new Set(rows.filter((row) => row.active).map((row) => row.id));
  const templates: GalleryTemplate[] = themes
    .filter((theme) => rows.length === 0 || active.has(theme.id))
    .map((theme) => ({
      id: theme.id,
      name: theme.name,
      tier: (rows.find((row) => row.id === theme.id)?.tier as "free" | "premium") || theme.tier,
      category: theme.category,
      tags: theme.tags,
      description: theme.description,
      thumb: `/templates/${theme.id}/thumb.webp`,
      previewDesktop: `/templates/${theme.id}/preview-desktop.webp`,
      previewMobile: `/templates/${theme.id}/preview-mobile.webp`,
    }));
  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-6xl px-4 py-12">
        <h1 className="font-serif text-5xl text-maroon">Templates</h1>
        <p className="mt-3 max-w-2xl text-ink/75">Six original invitations. Neutral is the starting motif. Choose a religious pack only if you want one.</p>
        <div className="mt-8">
          <TemplateGallery templates={templates} loggedIn={Boolean(user)} />
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
