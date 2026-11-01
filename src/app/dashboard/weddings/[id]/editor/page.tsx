import { notFound, redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getOwnedWedding, parseDesign, toEventDTO } from "@/services/weddings";
import { loadThemes } from "@/lib/templates";
import { Editor } from "@/components/editor/editor";
import { WeddingNav } from "@/components/wedding-nav";
import { kolkataDateInput } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function EditorPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireUser();
  if (!user) redirect("/login");
  const wedding = await getOwnedWedding(user, id, "viewer");
  if (!wedding) notFound();
  const [themes, rows] = await Promise.all([loadThemes(), prisma.template.findMany()]);
  const active = new Set(rows.filter((row) => row.active).map((row) => row.id));
  const visible = themes.filter((theme) => active.has(theme.id) || theme.id === wedding.templateId);
  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="shrink-0 border-b border-line px-3 py-2 lg:px-4">
        <WeddingNav id={id} compact />
      </div>
      <div className="min-h-0 flex-1 lg:h-full">
      <Editor
        weddingId={wedding.id}
        initialDesign={parseDesign(wedding.designJson)}
        revision={wedding.designRevision}
        plan={wedding.plan}
        level={wedding.level}
        userName={user.name}
        themes={visible}
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
        initialMedia={wedding.media.map((item) => ({
          id: item.id,
          url: item.url,
          alt: item.alt,
          focalX: item.focalX,
          focalY: item.focalY,
          mask: item.mask,
          kind: item.kind,
        }))}
      />
      </div>
    </div>
  );
}
