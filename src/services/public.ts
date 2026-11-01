import { createHmac } from "crypto";
import { prisma } from "@/lib/db";
import { sessionSecret } from "@/lib/auth";
import { parseDesign } from "@/services/weddings";
import { loadTheme } from "@/lib/templates";
import { kolkataDateInput } from "@/lib/utils";

export function gateToken(slug: string) {
  return createHmac("sha256", sessionSecret()).update(`gate:${slug}`).digest("base64url");
}

export async function loadPublicWedding(slug: string, token?: string) {
  const wedding = await prisma.wedding.findUnique({
    where: { slug },
    include: {
      events: { include: { venue: true }, orderBy: { sortOrder: "asc" } },
      media: { orderBy: { sortOrder: "asc" } },
    },
  });
  if (!wedding || wedding.status !== "published" || !wedding.publishedDesignJson) return null;
  const design = parseDesign(wedding.publishedDesignJson);
  const theme = await loadTheme(design.templateId);
  if (!theme) return null;
  let events = wedding.events;
  let guestName = "";
  if (token) {
    const guest = await prisma.guest.findFirst({ where: { token, weddingId: wedding.id }, include: { events: true } });
    if (guest) {
      guestName = guest.name;
      const allowed = new Set(guest.events.map((item) => item.eventId));
      if (allowed.size) events = events.filter((event) => allowed.has(event.id));
    }
  }
  return {
    locked: Boolean(wedding.gatePassword),
    slug: wedding.slug,
    noindex: wedding.noindex,
    templateName: theme.name,
    theme,
    design,
    guestName,
    token: token || "",
    wedding: {
      groomName: wedding.groomName,
      brideName: wedding.brideName,
      city: wedding.city,
      state: wedding.state,
      weddingDate: kolkataDateInput(wedding.weddingDate),
      slug: wedding.slug,
      watermark: wedding.watermark,
    },
    events: events.map((event) => ({
      id: event.id,
      name: event.name,
      type: event.type,
      date: kolkataDateInput(event.date),
      startTime: event.startTime,
      endTime: event.endTime,
      dressCode: event.dressCode,
      muhurat: event.muhurat,
      tithi: event.tithi,
      nakshatra: event.nakshatra,
      description: event.description,
      venueName: event.venue?.name ?? "",
      address: event.venue?.address ?? "",
      city: event.venue?.city ?? "",
      mapUrl: event.venue?.mapUrl ?? "",
    })),
    media: wedding.media.map((item) => ({
      id: item.id,
      url: item.url,
      alt: item.alt,
      focalX: item.focalX,
      focalY: item.focalY,
      mask: item.mask,
      kind: item.kind,
    })),
  };
}
