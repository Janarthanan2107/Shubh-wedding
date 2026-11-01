import { notFound } from "next/navigation";
import { createDefaultDesign } from "@/lib/design";
import { loadTheme, paletteOf } from "@/lib/templates";
import { InvitationView } from "@/components/invitation/view";

export const dynamic = "force-dynamic";

export default async function TemplatePreviewPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const theme = await loadTheme(slug);
  if (!theme) notFound();
  const design = createDefaultDesign({
    templateId: slug,
    motifPack: "neutral",
    groom: "Raja",
    bride: "Rani",
    groomTa: "ராஜா",
    brideTa: "ராணி",
    groomHi: "राजा",
    brideHi: "रानी",
    dateLabel: "20 December 2026",
    city: "Chennai, Tamil Nadu",
  });
  return (
    <InvitationView
      theme={theme}
      palette={paletteOf(theme, "classic").colors}
      design={design}
      wedding={{ groomName: "Raja", brideName: "Rani", city: "Chennai", state: "Tamil Nadu", weddingDate: "2026-12-20", slug: "preview", watermark: theme.tier !== "premium" }}
      events={[{ id: "preview-wedding", name: "Muhurtham", type: "Wedding", date: "2026-12-20", startTime: "09:30", endTime: "11:30", dressCode: "Silk", muhurat: "09:12", tithi: "", nakshatra: "", description: "", venueName: "Demo Mahal", address: "Cathedral Road", city: "Chennai", mapUrl: "https://www.google.com/maps/search/?api=1&query=Chennai" }]}
      media={[{ id: "p1", url: "/demo/groom.webp", alt: "Illustrated portrait", focalX: 0.5, focalY: 0.4, mask: "arch", kind: "couple" }]}
      locale="en"
      mode="card"
    />
  );
}
