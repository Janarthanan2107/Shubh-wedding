import type { Metadata } from "next";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { InvitationView } from "@/components/invitation/view";
import { paletteOf } from "@/lib/templates";
import { gateToken, loadPublicWedding } from "@/services/public";
import { GateForm } from "@/components/gate-form";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const page = await loadPublicWedding(slug);
  if (!page) return { title: "Invitation" };
  return {
    title: `${page.wedding.groomName} & ${page.wedding.brideName}`,
    description: `Wedding invitation · ${page.wedding.city}`,
    robots: page.noindex ? { index: false, follow: false } : { index: true, follow: true },
    openGraph: {
      title: `${page.wedding.groomName} & ${page.wedding.brideName}`,
      description: `${page.wedding.city}, ${page.wedding.state}`,
      images: [`/templates/${page.design.templateId}/og-card.png`],
    },
  };
}

export default async function PublicWeddingPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ g?: string; lang?: string }>;
}) {
  const { slug } = await params;
  const query = await searchParams;
  const page = await loadPublicWedding(slug, query.g);
  if (!page) notFound();
  if (page.locked) {
    const jar = await cookies();
    if (jar.get(`shubh_gate_${slug}`)?.value !== gateToken(slug)) {
      return <GateForm slug={slug} />;
    }
  }
  const locale = query.lang === "ta" || query.lang === "hi" ? query.lang : page.design.language;
  const palette = paletteOf(page.theme, page.design.paletteId).colors;
  return (
    <div>
      <div className="flex justify-end gap-2 px-4 py-3 text-sm">
        {(["en", "ta", "hi"] as const).map((lang) => (
          <a key={lang} href={`/w/${slug}?${new URLSearchParams({ ...(query.g ? { g: query.g } : {}), lang }).toString()}`} className={locale === lang ? "font-semibold" : ""}>
            {lang === "en" ? "English" : lang === "ta" ? "தமிழ்" : "हिन्दी"}
          </a>
        ))}
      </div>
      <InvitationView
        theme={page.theme}
        palette={palette}
        design={page.design}
        wedding={page.wedding}
        events={page.events}
        media={page.media}
        locale={locale}
        mode="public"
        guestName={page.guestName}
        token={query.g}
      />
    </div>
  );
}
