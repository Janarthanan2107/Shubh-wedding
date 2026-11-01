import { z } from "zod";
import { prisma } from "@/lib/db";
import { guestToken } from "@/lib/utils";
import { sanitizeText } from "@/lib/sanitize";
import {
  importGuestRows,
  normalizeIndianPhone,
  normalizeRsvp,
  responseRate,
  toCsv,
  type GuestField,
} from "@/lib/domain";
import { can, weddingAccess, audit } from "@/services/access";
import type { SessionUser } from "@/lib/auth";

export const guestSchema = z.object({
  name: z.string().min(1).max(120),
  phone: z.string().max(20).optional().default(""),
  email: z.string().max(160).optional().default(""),
  side: z.enum(["bride", "groom", "family", "friends", "work"]).default("friends"),
  plusOnes: z.number().int().min(0).max(6).default(0),
  dietary: z.enum(["veg", "non-veg", "jain"]).default("veg"),
  notes: z.string().max(500).optional().default(""),
  eventIds: z.array(z.string()).default([]),
});

export const rsvpSchema = z.object({
  name: z.string().min(1).max(120),
  status: z.enum(["attending", "not_attending", "maybe"]),
  headcount: z.number().int().min(0).max(12).default(1),
  dietary: z.enum(["veg", "non-veg", "jain"]).optional(),
  message: z.string().max(500).optional().default(""),
  website: z.string().max(200).optional().default(""),
  token: z.string().optional().default(""),
});

async function assertEditor(user: SessionUser, weddingId: string) {
  const access = await weddingAccess(user, weddingId);
  if (!access || !can(access.level, "editor")) throw new Error("You cannot edit guests for this wedding.");
  return access;
}

export async function listGuests(user: SessionUser, weddingId: string) {
  const access = await weddingAccess(user, weddingId);
  if (!access || !can(access.level, "viewer")) throw new Error("Not found.");
  const guests = await prisma.guest.findMany({
    where: { weddingId },
    include: { rsvp: true, events: true },
    orderBy: { name: "asc" },
  });
  return guests.map((g) => ({
    id: g.id,
    name: g.name,
    phone: g.phone,
    email: g.email,
    side: g.side,
    plusOnes: g.plusOnes,
    dietary: g.dietary,
    notes: g.notes,
    token: g.token,
    eventIds: g.events.map((e) => e.eventId),
    rsvp: g.rsvp
      ? { status: g.rsvp.status, headcount: g.rsvp.headcount, dietary: g.rsvp.dietary, message: g.rsvp.message }
      : { status: "pending", headcount: 0, dietary: "", message: "" },
  }));
}

export async function createGuest(user: SessionUser, weddingId: string, input: z.infer<typeof guestSchema>) {
  await assertEditor(user, weddingId);
  const phone = input.phone ? normalizeIndianPhone(input.phone) : "";
  if (input.phone && !phone) throw new Error("Enter a valid Indian mobile number.");
  const events = await prisma.event.findMany({ where: { weddingId, id: { in: input.eventIds } } });
  const guest = await prisma.guest.create({
    data: {
      weddingId,
      name: sanitizeText(input.name, 120),
      phone: phone ?? "",
      email: sanitizeText(input.email, 160),
      side: input.side,
      plusOnes: input.plusOnes,
      dietary: input.dietary,
      notes: sanitizeText(input.notes, 500),
      token: guestToken(),
      events: { create: events.map((e) => ({ eventId: e.id })) },
    },
  });
  await prisma.rsvp.create({ data: { guestId: guest.id, weddingId, status: "pending", headcount: 0 } });
  return guest.id;
}

export async function updateGuest(user: SessionUser, weddingId: string, guestId: string, input: z.infer<typeof guestSchema>) {
  await assertEditor(user, weddingId);
  const guest = await prisma.guest.findFirst({ where: { id: guestId, weddingId } });
  if (!guest) throw new Error("Guest not found.");
  const phone = input.phone ? normalizeIndianPhone(input.phone) : "";
  if (input.phone && !phone) throw new Error("Enter a valid Indian mobile number.");
  const events = await prisma.event.findMany({ where: { weddingId, id: { in: input.eventIds } } });
  await prisma.guestEvent.deleteMany({ where: { guestId } });
  await prisma.guest.update({
    where: { id: guestId },
    data: {
      name: sanitizeText(input.name, 120),
      phone: phone ?? "",
      email: sanitizeText(input.email, 160),
      side: input.side,
      plusOnes: input.plusOnes,
      dietary: input.dietary,
      notes: sanitizeText(input.notes, 500),
      events: { create: events.map((e) => ({ eventId: e.id })) },
    },
  });
}

export async function deleteGuest(user: SessionUser, weddingId: string, guestId: string) {
  await assertEditor(user, weddingId);
  await prisma.guest.deleteMany({ where: { id: guestId, weddingId } });
  await audit(user.id, "deletion", "guest", guestId, { weddingId });
}

export async function deleteAllGuests(user: SessionUser, weddingId: string) {
  await assertEditor(user, weddingId);
  const result = await prisma.guest.deleteMany({ where: { weddingId } });
  await audit(user.id, "deletion", "wedding-guests", weddingId, { count: result.count });
  return result.count;
}

export async function importGuests(user: SessionUser, weddingId: string, csv: string, mapping: Partial<Record<GuestField, string>>) {
  await assertEditor(user, weddingId);
  const table = (await import("@/lib/domain")).parseCsv(csv);
  if (table.length < 2) throw new Error("The CSV needs a header row and at least one guest.");
  const headers = table[0];
  const existing = await prisma.guest.findMany({ where: { weddingId } });
  const events = await prisma.event.findMany({ where: { weddingId } });
  const report = importGuestRows({
    headers,
    rows: table.slice(1),
    mapping,
    existingPhones: existing.map((g) => g.phone),
    existingNames: existing.map((g) => g.name),
  });
  for (const row of report.accepted) {
    const eventIds = events.filter((e) => row.events.some((n) => n.toLowerCase() === e.name.toLowerCase() || n.toLowerCase() === e.type.toLowerCase())).map((e) => e.id);
    const chosen = eventIds.length ? eventIds : events.map((e) => e.id);
    const guest = await prisma.guest.create({
      data: {
        weddingId,
        name: sanitizeText(row.name, 120),
        phone: row.phone,
        email: sanitizeText(row.email, 160),
        side: row.side,
        plusOnes: row.plusOnes,
        dietary: row.dietary,
        token: guestToken(),
        events: { create: chosen.map((eventId) => ({ eventId })) },
      },
    });
    await prisma.rsvp.create({ data: { guestId: guest.id, weddingId, status: "pending", headcount: 0 } });
  }
  return { imported: report.accepted.length, errors: report.errors, duplicates: report.duplicates };
}

export async function exportGuestsCsv(user: SessionUser, weddingId: string) {
  await assertEditor(user, weddingId);
  const guests = await prisma.guest.findMany({
    where: { weddingId },
    include: { events: { include: { event: true } }, rsvp: true },
    orderBy: { name: "asc" },
  });
  const rows = guests.map((g) => [
    g.name,
    g.phone,
    g.email,
    g.side,
    g.dietary,
    String(g.plusOnes),
    g.events.map((e) => e.event.name).join("|"),
    g.rsvp?.status ?? "pending",
    String(g.rsvp?.headcount ?? 0),
  ]);
  return toCsv(["name", "phone", "email", "side", "dietary", "plusOnes", "events", "rsvp", "headcount"], rows);
}

export async function rsvpSummary(weddingId: string) {
  const [guests, events] = await Promise.all([
    prisma.guest.findMany({ where: { weddingId }, include: { rsvp: true, events: true } }),
    prisma.event.findMany({ where: { weddingId }, orderBy: { sortOrder: "asc" } }),
  ]);
  const statusOf = (g: (typeof guests)[number]) => g.rsvp?.status ?? "pending";
  const attending = guests.filter((g) => statusOf(g) === "attending");
  const notAttending = guests.filter((g) => statusOf(g) === "not_attending").length;
  const maybe = guests.filter((g) => statusOf(g) === "maybe").length;
  const pending = guests.filter((g) => statusOf(g) === "pending").length;
  const headcount = attending.reduce((sum, g) => sum + (g.rsvp?.headcount || 1), 0);
  // Plates per diet: every person in an attending party eats what the reply (or the guest record) says.
  const meals = (list: typeof guests) => {
    const plates = { veg: 0, nonVeg: 0, jain: 0 };
    for (const g of list) {
      const diet = g.rsvp?.dietary || g.dietary;
      const count = g.rsvp?.headcount || 1;
      if (diet === "non-veg") plates.nonVeg += count;
      else if (diet === "jain") plates.jain += count;
      else plates.veg += count;
    }
    return plates;
  };
  return {
    total: guests.length,
    attending: attending.length,
    notAttending,
    maybe,
    pending,
    headcount,
    responseRate: responseRate(guests.length, pending),
    meals: meals(attending),
    perEvent: events.map((event) => {
      const invited = guests.filter((g) => g.events.some((ge) => ge.eventId === event.id));
      const yes = invited.filter((g) => statusOf(g) === "attending");
      return {
        eventId: event.id,
        name: event.name,
        invited: invited.length,
        attending: yes.length,
        headcount: yes.reduce((sum, g) => sum + (g.rsvp?.headcount || 1), 0),
        meals: meals(yes),
      };
    }),
  };
}

export async function submitPublicRsvp(weddingId: string, input: z.infer<typeof rsvpSchema>) {
  if (input.website && input.website.trim()) return { ok: true as const };
  const wedding = await prisma.wedding.findUnique({ where: { id: weddingId } });
  if (!wedding || wedding.status !== "published") throw new Error("This invitation is not published.");
  const normalized = normalizeRsvp({ status: input.status, headcount: input.headcount });
  if (input.token) {
    const guest = await prisma.guest.findFirst({ where: { token: input.token, weddingId } });
    if (!guest) throw new Error("This invitation link is not valid.");
    await prisma.rsvp.upsert({
      where: { guestId: guest.id },
      update: {
        status: normalized.status,
        headcount: normalized.headcount,
        dietary: input.dietary ?? guest.dietary,
        message: sanitizeText(input.message, 500),
      },
      create: {
        guestId: guest.id,
        weddingId,
        status: normalized.status,
        headcount: normalized.headcount,
        dietary: input.dietary ?? "",
        message: sanitizeText(input.message, 500),
      },
    });
    return { ok: true as const };
  }
  const guest = await prisma.guest.create({
    data: {
      weddingId,
      name: sanitizeText(input.name, 120),
      dietary: input.dietary ?? "veg",
      token: guestToken(),
      side: "friends",
    },
  });
  const allEvents = await prisma.event.findMany({ where: { weddingId } });
  if (allEvents.length) {
    await prisma.guestEvent.createMany({ data: allEvents.map((e) => ({ guestId: guest.id, eventId: e.id })) });
  }
  await prisma.rsvp.create({
    data: {
      guestId: guest.id,
      weddingId,
      status: normalized.status,
      headcount: normalized.headcount,
      dietary: input.dietary ?? "",
      message: sanitizeText(input.message, 500),
    },
  });
  return { ok: true as const };
}
