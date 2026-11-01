import { notFound, redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { getOwnedWedding, parseDesign, toEventDTO } from "@/services/weddings";
import { loadTheme, paletteOf } from "@/lib/templates";
import { entitlementsFor } from "@/lib/domain";
import { Exporter } from "@/components/exporter";
import { WeddingNav } from "@/components/wedding-nav";
import { kolkataDateInput } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function ExportPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireUser();
  if (!user) redirect("/login");
  const wedding = await getOwnedWedding(user, id, "viewer");
  if (!wedding) notFound();
  const design = parseDesign(wedding.designJson);
  const theme = await loadTheme(design.templateId);
  if (!theme) notFound();
  return (
    <div>
      <WeddingNav id={id} />
      <h1 className="mb-4 font-serif text-4xl text-maroon">Export</h1>
      <Exporter
        locked={!entitlementsFor(wedding.plan).exportCard}
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
      />
    </div>
  );
}
