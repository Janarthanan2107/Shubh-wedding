import { notFound, redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { getOwnedWedding, parseDesign, toEventDTO } from "@/services/weddings";
import { loadTheme, paletteOf } from "@/lib/templates";
import { InvitationView } from "@/components/invitation/view";
import { WeddingNav } from "@/components/wedding-nav";
import { kolkataDateInput } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function PreviewPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ device?: string }> }) {
  const { id } = await params;
  const query = await searchParams;
  const user = await requireUser();
  if (!user) redirect("/login");
  const wedding = await getOwnedWedding(user, id, "viewer");
  if (!wedding) notFound();
  const design = parseDesign(wedding.designJson);
  const theme = await loadTheme(design.templateId);
  if (!theme) notFound();
  const width = query.device === "mobile" ? 390 : query.device === "tablet" ? 820 : 1100;
  return (
    <div>
      <WeddingNav id={id} />
      <div className="mb-4 flex gap-2 text-sm">
        <a data-testid="preview-desktop" href="?device=desktop">Desktop</a>
        <a data-testid="preview-tablet" href="?device=tablet">Tablet</a>
        <a data-testid="preview-mobile" href="?device=mobile">Mobile</a>
      </div>
      <div className="mx-auto overflow-hidden rounded-2xl border border-ink/10" style={{ width }}>
        <InvitationView
          theme={theme}
          palette={paletteOf(theme, design.paletteId).colors}
          design={design}
          wedding={{
            groomName: wedding.groomName,
            brideName: wedding.brideName,
            city: wedding.city,
            state: wedding.state,
            weddingDate: kolkataDateInput(wedding.weddingDate),
            slug: wedding.slug,
            watermark: wedding.watermark,
          }}
          events={wedding.events.map(toEventDTO)}
          media={wedding.media.map((item) => ({ id: item.id, url: item.url, alt: item.alt, focalX: item.focalX, focalY: item.focalY, mask: item.mask, kind: item.kind }))}
          locale={design.language}
          mode="editor"
        />
      </div>
    </div>
  );
}
