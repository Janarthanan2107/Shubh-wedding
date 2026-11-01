import { prisma } from "@/lib/db";
import { loadThemes } from "@/lib/templates";
import { Wizard } from "@/components/wizard";
import type { GalleryTemplate } from "@/components/gallery";

export const dynamic = "force-dynamic";

export default async function NewWeddingPage({ searchParams }: { searchParams: Promise<{ template?: string }> }) {
  const query = await searchParams;
  const [themes, rows] = await Promise.all([loadThemes(), prisma.template.findMany()]);
  const active = new Set(rows.filter((row) => row.active).map((row) => row.id));
  const templates: GalleryTemplate[] = themes
    .filter((theme) => active.size === 0 || active.has(theme.id))
    .map((theme) => ({
      id: theme.id,
      name: theme.name,
      tier: theme.tier,
      category: theme.category,
      tags: theme.tags,
      description: theme.description,
      thumb: `/templates/${theme.id}/thumb.webp`,
      previewDesktop: `/templates/${theme.id}/preview-desktop.webp`,
      previewMobile: `/templates/${theme.id}/preview-mobile.webp`,
    }));
  return <Wizard templates={templates} initialTemplate={query.template} />;
}
