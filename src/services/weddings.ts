import { z } from "zod";
import { prisma } from "@/lib/db";
import { can, weddingAccess, audit } from "@/services/access";
import type { SessionUser } from "@/lib/auth";
import fs from "fs/promises";
import path from "path";
import { coupleSlug, uniqueSlug, mapsLink, canUseTemplate, entitlementsFor, draftDeletionError } from "@/lib/domain";
import { createDefaultDesign, migrateDesign, motifPacks, type Design } from "@/lib/design";
import { sanitizeText } from "@/lib/sanitize";
import { kolkataDateInput } from "@/lib/utils";

export const eventInputSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1).max(80),
  type: z.string().min(1).max(40),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  startTime: z.string().regex(/^\d{2}:\d{2}$/),
  endTime: z.string().optional().default(""),
  dressCode: z.string().max(80).optional().default(""),
  muhurat: z.string().max(80).optional().default(""),
  tithi: z.string().max(80).optional().default(""),
  nakshatra: z.string().max(80).optional().default(""),
  description: z.string().max(500).optional().default(""),
  venueName: z.string().min(1).max(120),
  address: z.string().min(1).max(240),
  city: z.string().min(1).max(80),
  state: z.string().min(1).max(80),
  mapUrl: z.string().max(400).optional().default(""),
});

export const weddingInputSchema = z.object({
  groomName: z.string().min(1).max(80),
  brideName: z.string().min(1).max(80),
  groomNameTa: z.string().max(80).optional().default(""),
  brideNameTa: z.string().max(80).optional().default(""),
  groomNameHi: z.string().max(80).optional().default(""),
  brideNameHi: z.string().max(80).optional().default(""),
  tagline: z.string().max(180).optional().default(""),
  story: z.string().max(2000).optional().default(""),
  weddingDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  city: z.string().min(1).max(80),
  state: z.string().min(1).max(80),
  templateId: z.string().min(1),
  paletteId: z.string().min(1).default("classic"),
  motifPack: z.enum(motifPacks),
  language: z.enum(["en", "ta", "hi"]).optional().default("en"),
  events: z.array(eventInputSchema).min(1),
});

function noon(date: string) {
  return new Date(`${date}T12:00:00+05:30`);
}

function cleanEvent(input: z.infer<typeof eventInputSchema>) {
  return {
    name: sanitizeText(input.name, 80),
    type: sanitizeText(input.type, 40),
    date: input.date,
    startTime: input.startTime,
    endTime: sanitizeText(input.endTime, 8),
    dressCode: sanitizeText(input.dressCode, 80),
    muhurat: sanitizeText(input.muhurat, 80),
    tithi: sanitizeText(input.tithi, 80),
    nakshatra: sanitizeText(input.nakshatra, 80),
    description: sanitizeText(input.description, 500),
    venueName: sanitizeText(input.venueName, 120),
    address: sanitizeText(input.address, 240),
    city: sanitizeText(input.city, 80),
    state: sanitizeText(input.state, 80),
    mapUrl: input.mapUrl?.startsWith("https://") ? input.mapUrl : mapsLink(`${input.venueName}, ${input.address}, ${input.city}`),
  };
}

export async function syncEvents(weddingId: string, events: z.infer<typeof eventInputSchema>[]) {
  const existing = await prisma.event.findMany({ where: { weddingId } });
  const keep = new Set<string>();
  const venues = new Map<string, string>();
  async function venueId(item: ReturnType<typeof cleanEvent>) {
    const key = item.venueName.toLowerCase();
    const cached = venues.get(key);
    if (cached) return cached;
    const found = await prisma.venue.findFirst({ where: { weddingId, name: item.venueName } });
    const row =
      found ??
      (await prisma.venue.create({
        data: {
          weddingId,
          name: item.venueName,
          address: item.address,
          city: item.city,
          state: item.state,
          mapUrl: item.mapUrl,
        },
      }));
    if (found) {
      await prisma.venue.update({
        where: { id: found.id },
        data: { address: item.address, city: item.city, state: item.state, mapUrl: item.mapUrl },
      });
    }
    venues.set(key, row.id);
    return row.id;
  }

  for (let index = 0; index < events.length; index += 1) {
    const raw = events[index];
    const item = cleanEvent(raw);
    const vId = await venueId(item);
    const data = {
      weddingId,
      venueId: vId,
      name: item.name,
      type: item.type,
      date: noon(item.date),
      startTime: item.startTime,
      endTime: item.endTime,
      dressCode: item.dressCode,
      muhurat: item.muhurat,
      tithi: item.tithi,
      nakshatra: item.nakshatra,
      description: item.description,
      sortOrder: index,
    };
    const match = raw.id ? existing.find((e) => e.id === raw.id) : undefined;
    if (match) {
      keep.add(match.id);
      await prisma.event.update({ where: { id: match.id }, data });
    } else {
      const created = await prisma.event.create({ data });
      keep.add(created.id);
    }
  }
  const remove = existing.filter((e) => !keep.has(e.id)).map((e) => e.id);
  if (remove.length) {
    await prisma.guestEvent.deleteMany({ where: { eventId: { in: remove } } });
    await prisma.event.deleteMany({ where: { id: { in: remove } } });
  }
  await prisma.venue.deleteMany({ where: { weddingId, events: { none: {} } } });
}

export async function createWedding(user: SessionUser, input: z.infer<typeof weddingInputSchema>) {
  const owned = await prisma.wedding.count({ where: { ownerId: user.id } });
  if (user.role !== "admin" && owned >= 8) {
    throw new Error("This demo account has reached the wedding draft limit.");
  }
  const template = await prisma.template.findUnique({ where: { id: input.templateId } });
  if (!template || !template.active) throw new Error("Choose an active template.");
  const slugs = new Set((await prisma.wedding.findMany({ select: { slug: true } })).map((w) => w.slug));
  const slug = uniqueSlug(coupleSlug(input.groomName, input.brideName), slugs);
  const dateLabel = new Intl.DateTimeFormat("en-IN", {
    timeZone: "Asia/Kolkata",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(noon(input.weddingDate));
  const design = createDefaultDesign({
    templateId: template.tier === "premium" ? input.templateId : input.templateId,
    paletteId: input.paletteId,
    motifPack: input.motifPack,
    groom: sanitizeText(input.groomName, 80),
    bride: sanitizeText(input.brideName, 80),
    groomTa: sanitizeText(input.groomNameTa, 80),
    brideTa: sanitizeText(input.brideNameTa, 80),
    groomHi: sanitizeText(input.groomNameHi, 80),
    brideHi: sanitizeText(input.brideNameHi, 80),
    dateLabel,
    city: `${sanitizeText(input.city, 80)}, ${sanitizeText(input.state, 80)}`,
    welcome: sanitizeText(input.story, 2000),
  });
  const wedding = await prisma.wedding.create({
    data: {
      slug,
      ownerId: user.id,
      groomName: sanitizeText(input.groomName, 80),
      brideName: sanitizeText(input.brideName, 80),
      groomNameTa: sanitizeText(input.groomNameTa, 80),
      brideNameTa: sanitizeText(input.brideNameTa, 80),
      groomNameHi: sanitizeText(input.groomNameHi, 80),
      brideNameHi: sanitizeText(input.brideNameHi, 80),
      tagline: sanitizeText(input.tagline, 180),
      story: sanitizeText(input.story, 2000),
      weddingDate: noon(input.weddingDate),
      city: sanitizeText(input.city, 80),
      state: sanitizeText(input.state, 80),
      language: input.language,
      templateId: input.templateId,
      paletteId: input.paletteId,
      motifPack: input.motifPack,
      plan: "free",
      status: "draft",
      designJson: JSON.stringify(design),
      schemaVersion: 1,
      watermark: true,
      invitation: { create: { slug, status: "draft" } },
    },
  });
  await syncEvents(wedding.id, input.events);
  return wedding.id;
}

const detailInclude = {
  events: { include: { venue: true }, orderBy: { sortOrder: "asc" as const } },
  media: { orderBy: { sortOrder: "asc" as const } },
  template: true,
  invitation: true,
  _count: { select: { guests: true, rsvps: true } },
};

export async function getOwnedWedding(user: SessionUser, id: string, need: "viewer" | "commenter" | "editor" | "owner" = "viewer") {
  const access = await weddingAccess(user, id);
  if (!access || !can(access.level, need)) return null;
  const full = await prisma.wedding.findUnique({ where: { id }, include: detailInclude });
  if (!full) return null;
  return { ...full, level: access.level };
}

export function toEventDTO(event: {
  id: string;
  name: string;
  type: string;
  date: Date;
  startTime: string;
  endTime: string;
  dressCode: string;
  muhurat: string;
  tithi: string;
  nakshatra: string;
  description: string;
  sortOrder: number;
  venue: { name: string; address: string; city: string; state: string; mapUrl: string } | null;
}) {
  return {
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
    sortOrder: event.sortOrder,
    venueName: event.venue?.name ?? "",
    address: event.venue?.address ?? "",
    city: event.venue?.city ?? "",
    state: event.venue?.state ?? "",
    mapUrl: event.venue?.mapUrl ?? "",
  };
}

export function parseDesign(raw: string): Design {
  return migrateDesign(JSON.parse(raw));
}

export async function saveDesign(user: SessionUser, weddingId: string, designInput: unknown, revision: number) {
  const access = await weddingAccess(user, weddingId);
  if (!access || !can(access.level, "editor")) throw new Error("You cannot edit this wedding.");
  if (access.wedding.designRevision !== revision) {
    const error = new Error("Someone else saved a newer version. Reload before saving.");
    (error as Error & { status?: number }).status = 409;
    throw error;
  }
  const design = migrateDesign(designInput);
  const template = await prisma.template.findUnique({ where: { id: design.templateId } });
  if (!template) throw new Error("Unknown template.");
  const plan = entitlementsFor(access.wedding.plan);
  if (design.sections.some((s) => s.type === "freeform") && !plan.freeform) {
    throw new Error("Freeform sections are part of Premium.");
  }
  const freePairings = new Set(["classic", "modern", "template"]);
  if (!freePairings.has(design.fontPairing) && !plan.customFonts) {
    throw new Error("Custom font pairings are part of Premium.");
  }
  const updated = await prisma.wedding.update({
    where: { id: weddingId },
    data: {
      designJson: JSON.stringify(design),
      templateId: design.templateId,
      paletteId: design.paletteId,
      motifPack: design.motifPack,
      fontPairing: design.fontPairing,
      language: design.language,
      schemaVersion: design.schemaVersion,
      designRevision: { increment: 1 },
    },
  });
  return { revision: updated.designRevision, premiumWarning: template.tier === "premium" && !canUseTemplate(access.wedding.plan, template.tier) };
}

export async function listVersions(weddingId: string) {
  return prisma.designVersion.findMany({
    where: { weddingId },
    orderBy: { createdAt: "desc" },
    take: 20,
    select: { id: true, label: true, status: true, createdAt: true, schemaVersion: true },
  });
}

export async function snapshotDesign(user: SessionUser, weddingId: string, label: string) {
  const access = await weddingAccess(user, weddingId);
  if (!access || !can(access.level, "editor")) throw new Error("You cannot snapshot this wedding.");
  const count = await prisma.designVersion.count({ where: { weddingId, status: "snapshot" } });
  if (count >= 20) {
    const oldest = await prisma.designVersion.findMany({
      where: { weddingId, status: "snapshot" },
      orderBy: { createdAt: "asc" },
      take: count - 19,
    });
    if (oldest.length) await prisma.designVersion.deleteMany({ where: { id: { in: oldest.map((o) => o.id) } } });
  }
  return prisma.designVersion.create({
    data: {
      weddingId,
      json: access.wedding.designJson,
      status: "snapshot",
      label: sanitizeText(label, 80) || "Snapshot",
      schemaVersion: access.wedding.schemaVersion,
      createdBy: user.id,
    },
  });
}

export async function restoreVersion(user: SessionUser, weddingId: string, versionId: string) {
  const access = await weddingAccess(user, weddingId);
  if (!access || !can(access.level, "editor")) throw new Error("You cannot restore this wedding.");
  const version = await prisma.designVersion.findFirst({ where: { id: versionId, weddingId } });
  if (!version) throw new Error("Version not found.");
  await snapshotDesign(user, weddingId, "Before restore");
  const design = migrateDesign(JSON.parse(version.json));
  const updated = await prisma.wedding.update({
    where: { id: weddingId },
    data: {
      designJson: JSON.stringify(design),
      templateId: design.templateId,
      paletteId: design.paletteId,
      motifPack: design.motifPack,
      fontPairing: design.fontPairing,
      language: design.language,
      designRevision: { increment: 1 },
    },
  });
  return { revision: updated.designRevision, design };
}

export async function publishWedding(user: SessionUser, weddingId: string) {
  const row = await getOwnedWedding(user, weddingId, "editor");
  if (!row) throw new Error("Wedding not found.");
  if (!row.groomName || !row.brideName) throw new Error("Add both partners' names before publishing.");
  if (!row.events.length) throw new Error("Add at least one ceremony.");
  for (const event of row.events) {
    if (!event.date || !event.venue) throw new Error(`Add a date and venue for ${event.name}.`);
  }
  const design = parseDesign(row.designJson);
  const template = await prisma.template.findUnique({ where: { id: design.templateId } });
  if (!template) throw new Error("Template missing.");
  if (!canUseTemplate(row.plan, template.tier)) {
    throw new Error("This premium template stays locked until a successful payment is verified.");
  }
  if (row.plan === "premium") {
    const paid = await prisma.payment.findFirst({
      where: { verified: true, status: "success", order: { weddingId, status: "success" } },
    });
    if (!paid) throw new Error("Premium is locked until payment is verified.");
  }
  if (row.plan !== "premium") {
    const other = await prisma.wedding.count({
      where: { ownerId: row.ownerId, status: "published", NOT: { id: weddingId } },
    });
    if (other >= 1) throw new Error("The free plan includes one published site. Upgrade or unpublish the other site.");
  }
  const version = await prisma.designVersion.create({
    data: {
      weddingId,
      json: JSON.stringify(design),
      status: "published",
      label: "Published",
      schemaVersion: design.schemaVersion,
      createdBy: user.id,
    },
  });
  await prisma.wedding.update({
    where: { id: weddingId },
    data: {
      status: "published",
      publishedAt: new Date(),
      publishedDesignJson: JSON.stringify(design),
      watermark: entitlementsFor(row.plan).watermark,
    },
  });
  await prisma.invitation.upsert({
    where: { weddingId },
    update: { status: "published", slug: row.slug, publishedVersionId: version.id },
    create: { weddingId, slug: row.slug, status: "published", publishedVersionId: version.id },
  });
  await audit(user.id, "publish", "wedding", weddingId, { slug: row.slug });
  return row.slug;
}

function httpError(message: string, status: number): never {
  const error = new Error(message) as Error & { status: number };
  error.status = status;
  throw error;
}

export async function deleteDraftWedding(user: SessionUser, weddingId: string) {
  const access = await weddingAccess(user, weddingId);
  if (!access) httpError("Wedding not found.", 404);
  const blocked = draftDeletionError(access.wedding.status, access.level === "owner");
  if (blocked) httpError(blocked.message, blocked.status);
  const media = await prisma.media.findMany({ where: { weddingId }, select: { url: true } });
  await prisma.$transaction(async (tx) => {
    await tx.order.updateMany({ where: { weddingId }, data: { weddingId: null } });
    await tx.event.updateMany({ where: { weddingId }, data: { venueId: null } });
    await tx.wedding.delete({ where: { id: weddingId } });
  });
  for (const item of media) {
    if (!item.url.startsWith("/api/media/")) continue;
    const key = item.url.slice("/api/media/".length).replace(/[^a-zA-Z0-9._-]/g, "");
    if (!key) continue;
    await fs.unlink(path.join(process.cwd(), "data", "uploads", key)).catch(() => undefined);
  }
  await audit(user.id, "delete", "wedding", weddingId, { slug: access.wedding.slug, status: "draft" });
}

export async function unpublishWedding(user: SessionUser, weddingId: string) {
  const row = await getOwnedWedding(user, weddingId, "editor");
  if (!row) throw new Error("Wedding not found.");
  await prisma.wedding.update({ where: { id: weddingId }, data: { status: "unpublished" } });
  await prisma.invitation.update({ where: { weddingId }, data: { status: "unpublished" } }).catch(() => undefined);
  await audit(user.id, "unpublish", "wedding", weddingId, { slug: row.slug });
}

export async function rollbackPublished(user: SessionUser, weddingId: string, versionId: string) {
  const row = await getOwnedWedding(user, weddingId, "editor");
  if (!row) throw new Error("Wedding not found.");
  const version = await prisma.designVersion.findFirst({ where: { id: versionId, weddingId } });
  if (!version) throw new Error("Version not found.");
  const design = migrateDesign(JSON.parse(version.json));
  await prisma.wedding.update({
    where: { id: weddingId },
    data: { publishedDesignJson: JSON.stringify(design), status: "published", designJson: JSON.stringify(design) },
  });
  await prisma.invitation.update({
    where: { weddingId },
    data: { status: "published", publishedVersionId: version.id },
  });
  await audit(user.id, "publish", "wedding", weddingId, { rollback: version.id });
}
