"use client";

import { useRef, useState } from "react";
import { InvitationView, type InvitationModel, type InviteEvent, type InviteMedia } from "@/components/invitation/view";
import type { Design } from "@/lib/design";
import type { ThemeBundle, ThemeColors } from "@/lib/templates";
import { Button } from "@/components/ui";

export function Exporter({
  locked,
  theme,
  palette,
  design,
  wedding,
  events,
  media,
}: {
  locked: boolean;
  theme: ThemeBundle;
  palette: ThemeColors;
  design: Design;
  wedding: InvitationModel;
  events: InviteEvent[];
  media: InviteMedia[];
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [locale, setLocale] = useState<"en" | "ta" | "hi">("ta");
  const [progress, setProgress] = useState("");
  const [error, setError] = useState("");
  const [size, setSize] = useState<"post" | "story">("post");

  async function render() {
    if (!ref.current) throw new Error("Card is not ready");
    setProgress("Preparing fonts");
    await document.fonts.ready;
    setProgress("Rendering image");
    const { toPng } = await import("html-to-image");
    return toPng(ref.current, { cacheBust: true, pixelRatio: 1 });
  }

  async function png() {
    try {
      setError("");
      const data = await render();
      const link = document.createElement("a");
      link.href = data;
      link.download = size === "story" ? "invitation-story.png" : "invitation-card.png";
      link.click();
      setProgress("PNG ready");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not export the image");
      setProgress("");
    }
  }

  async function pdf() {
    try {
      setError("");
      const data = await render();
      setProgress("Building PDF");
      const { jsPDF } = await import("jspdf");
      const doc = new jsPDF({ orientation: "p", unit: "mm", format: "a4" });
      const width = doc.internal.pageSize.getWidth();
      const height = doc.internal.pageSize.getHeight();
      doc.addImage(data, "PNG", 0, 0, width, height);
      doc.save("invitation.pdf");
      setProgress("PDF ready");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not export the PDF");
      setProgress("");
    }
  }

  return (
    <div>
      {locked ? <p data-testid="export-locked">Image and PDF export unlocks with Premium.</p> : null}
      <div className="mb-3 flex flex-wrap gap-2">
        <Button type="button" variant={size === "post" ? "primary" : "ghost"} onClick={() => setSize("post")}>1080×1350</Button>
        <Button type="button" variant={size === "story" ? "primary" : "ghost"} onClick={() => setSize("story")}>1080×1920</Button>
        {(["en", "ta", "hi"] as const).map((item) => (
          <Button key={item} type="button" variant={locale === item ? "primary" : "ghost"} onClick={() => setLocale(item)}>{item}</Button>
        ))}
        <Button type="button" data-testid="export-png" disabled={locked} onClick={() => void png()}>Export PNG</Button>
        <Button type="button" data-testid="export-pdf" disabled={locked} onClick={() => void pdf()}>Export PDF</Button>
      </div>
      {progress ? <p data-testid="export-progress">{progress}</p> : null}
      {error ? <p className="text-sm text-maroon">{error}</p> : null}
      <div className="overflow-auto">
        <div ref={ref} data-testid="export-card" style={{ width: 1080, height: size === "story" ? 1920 : 1350 }}>
          <InvitationView theme={theme} palette={palette} design={design} wedding={wedding} events={events} media={media} locale={locale} mode="card" />
        </div>
      </div>
    </div>
  );
}
