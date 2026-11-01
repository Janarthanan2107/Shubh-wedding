export const GST_RATE = 0.18;

export type PlanId = "free" | "premium" | "planner-starter" | "planner-studio";
export type PaymentOutcome = "success" | "failed" | "pending";

export type Entitlements = {
  maxWeddings: number;
  maxPhotos: number;
  premiumTemplates: boolean;
  watermark: boolean;
  freeform: boolean;
  customFonts: boolean;
  exportCard: boolean;
  advancedRsvp: boolean;
  hostingLabel: string;
};

export const ENTITLEMENTS: Record<"free" | "premium", Entitlements> = {
  free: {
    maxWeddings: 1,
    maxPhotos: 6,
    premiumTemplates: false,
    watermark: true,
    freeform: false,
    customFonts: false,
    exportCard: false,
    advancedRsvp: false,
    hostingLabel: "Shubh branded URL",
  },
  premium: {
    maxWeddings: 1,
    maxPhotos: 50,
    premiumTemplates: true,
    watermark: false,
    freeform: true,
    customFonts: true,
    exportCard: true,
    advancedRsvp: true,
    hostingLabel: "Extended hosting",
  },
};

export const PLANNER_LIMITS: Record<string, number> = {
  "planner-starter": 3,
  "planner-studio": 15,
};

export function entitlementsFor(plan: string): Entitlements {
  if (plan === "premium") return ENTITLEMENTS.premium;
  return ENTITLEMENTS.free;
}

export function canUseTemplate(plan: string, tier: string) {
  if (tier !== "premium") return true;
  return entitlementsFor(plan).premiumTemplates;
}

export function photoLimit(plan: string) {
  return entitlementsFor(plan).maxPhotos;
}

export function quoteInr(subtotalInr: number, gstRate = GST_RATE) {
  const subtotal = roundMoney(subtotalInr);
  const gst = roundMoney(subtotal * gstRate);
  const total = roundMoney(subtotal + gst);
  return { subtotal, gst, total, currency: "INR" as const, gstRate };
}

export function roundMoney(n: number) {
  return Math.round(n * 100) / 100;
}

export function paymentUnlocksPremium(status: string, verified: boolean) {
  return status === "success" && verified === true;
}

export interface PaymentProvider {
  name: string;
  createOrder(input: {
    reference: string;
    amountInr: number;
    currency: "INR";
  }): Promise<{ provider: string; reference: string; status: "created" }>;
  verify(input: {
    reference: string;
    outcome: PaymentOutcome;
  }): Promise<{ status: PaymentOutcome; verified: boolean; gateway: string }>;
}

export class MockRazorpayProvider implements PaymentProvider {
  name = "mock-razorpay";

  async createOrder(input: { reference: string; amountInr: number; currency: "INR" }) {
    return { provider: this.name, reference: input.reference, status: "created" as const };
  }

  async verify(input: { reference: string; outcome: PaymentOutcome }) {
    const verified = input.outcome === "success";
    return {
      status: input.outcome,
      verified,
      gateway: this.name,
    };
  }
}

export function getPaymentProvider(): PaymentProvider {
  return new MockRazorpayProvider();
}

export function slugify(value: string) {
  const ascii = value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");
  return ascii;
}

export function coupleSlug(groom: string, bride: string) {
  const g = slugify(groom);
  const b = slugify(bride);
  if (!g && !b) return "wedding";
  if (!g) return b;
  if (!b) return g;
  return `${g}-weds-${b}`;
}

export function uniqueSlug(base: string, existing: Set<string>) {
  const root = base || "wedding";
  if (!existing.has(root)) return root;
  let n = 2;
  while (existing.has(`${root}-${n}`)) n += 1;
  return `${root}-${n}`;
}

const PHONE = /^(?:\+91|91|0)?[6-9]\d{9}$/;

export function isIndianPhone(input: string) {
  const compact = input.replace(/[\s()-]/g, "");
  return PHONE.test(compact);
}

export function normalizeIndianPhone(input: string) {
  const compact = input.replace(/[\s()-]/g, "");
  if (!PHONE.test(compact)) return null;
  const digits = compact.replace(/\D/g, "");
  const last10 = digits.slice(-10);
  return `+91${last10}`;
}

export function whatsAppShareUrl(message: string, phone?: string) {
  const text = encodeURIComponent(message);
  if (phone) {
    const digits = phone.replace(/\D/g, "");
    return `https://wa.me/${digits}?text=${text}`;
  }
  return `https://wa.me/?text=${text}`;
}

export function invitationMessage(input: {
  groom: string;
  bride: string;
  dateLabel: string;
  url: string;
  guestName?: string;
  blessing?: string;
}) {
  const greeting = input.guestName ? `Dear ${input.guestName}, ` : "";
  const blessing = input.blessing?.trim() || "With love and blessings, we hope you can celebrate with us.";
  return `${greeting}${input.groom} & ${input.bride} are getting married on ${input.dateLabel}. You are warmly invited.\n${input.url}\n${blessing}`;
}

export type RsvpStatus = "pending" | "attending" | "not_attending" | "maybe";

export function normalizeRsvp(input: { status: RsvpStatus; headcount: number; plusOnes?: number }) {
  const cap = 1 + Math.max(0, input.plusOnes ?? 8);
  if (input.status === "not_attending" || input.status === "pending") {
    return { status: input.status, headcount: 0 };
  }
  const headcount = Math.min(Math.max(1, Math.floor(input.headcount || 1)), Math.max(cap, 1));
  return { status: input.status, headcount };
}

export function responseRate(total: number, pending: number) {
  if (total <= 0) return 0;
  return Math.round(((total - pending) / total) * 1000) / 10;
}

export type CsvRow = Record<string, string>;

export function parseCsv(text: string): string[][] {
  const src = text.replace(/^\uFEFF/, "").replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let quoted = false;
  for (let i = 0; i < src.length; i += 1) {
    const ch = src[i];
    if (quoted) {
      if (ch === '"') {
        if (src[i + 1] === '"') {
          cell += '"';
          i += 1;
        } else {
          quoted = false;
        }
      } else {
        cell += ch;
      }
      continue;
    }
    if (ch === '"') {
      quoted = true;
      continue;
    }
    if (ch === ",") {
      row.push(cell.trim());
      cell = "";
      continue;
    }
    if (ch === "\n") {
      row.push(cell.trim());
      if (row.some((c) => c.length > 0)) rows.push(row);
      row = [];
      cell = "";
      continue;
    }
    cell += ch;
  }
  row.push(cell.trim());
  if (row.some((c) => c.length > 0)) rows.push(row);
  return rows;
}

export const GUEST_FIELDS = ["name", "phone", "email", "side", "dietary", "plusOnes", "events"] as const;
export type GuestField = (typeof GUEST_FIELDS)[number];

export function toCsv(headers: string[], rows: string[][]) {
  const escape = (value: string) => {
    if (/[",\n]/.test(value)) return `"${value.replace(/"/g, '""')}"`;
    return value;
  };
  const lines = [headers, ...rows].map((r) => r.map((c) => escape(c ?? "")).join(","));
  return `\uFEFF${lines.join("\n")}`;
}

export type ImportIssue = { row: number; message: string };
export type ImportResult = {
  accepted: Array<{
    name: string;
    phone: string;
    email: string;
    side: string;
    dietary: string;
    plusOnes: number;
    events: string[];
  }>;
  errors: ImportIssue[];
  duplicates: ImportIssue[];
};

const SIDES = new Set(["bride", "groom", "family", "friends", "work"]);
const DIETS = new Set(["veg", "non-veg", "jain"]);

export function importGuestRows(input: {
  headers: string[];
  rows: string[][];
  mapping: Partial<Record<GuestField, string>>;
  existingPhones: string[];
  existingNames: string[];
}): ImportResult {
  const indexOf = (field: GuestField) => {
    const header = input.mapping[field];
    if (!header) return -1;
    return input.headers.findIndex((h) => h.toLowerCase() === header.toLowerCase());
  };
  const nameIdx = indexOf("name");
  const accepted: ImportResult["accepted"] = [];
  const errors: ImportIssue[] = [];
  const duplicates: ImportIssue[] = [];
  const seen = new Set(input.existingPhones.map((p) => p.replace(/\D/g, "").slice(-10)).filter(Boolean));
  const seenNames = new Set(input.existingNames.map((n) => n.trim().toLowerCase()));

  input.rows.forEach((row, i) => {
    const rowNumber = i + 2;
    const cell = (idx: number) => (idx >= 0 ? (row[idx] ?? "").trim() : "");
    const name = cell(nameIdx);
    if (!name) {
      errors.push({ row: rowNumber, message: "Name is required" });
      return;
    }
    const phoneRaw = cell(indexOf("phone"));
    const phone = phoneRaw ? normalizeIndianPhone(phoneRaw) : "";
    if (phoneRaw && !phone) {
      errors.push({ row: rowNumber, message: `Invalid Indian phone: ${phoneRaw}` });
      return;
    }
    const phoneKey = phone ? phone.slice(-10) : "";
    const nameKey = name.toLowerCase();
    if ((phoneKey && seen.has(phoneKey)) || (!phoneKey && seenNames.has(nameKey))) {
      duplicates.push({ row: rowNumber, message: `Duplicate guest: ${name}` });
      return;
    }
    const sideRaw = cell(indexOf("side")).toLowerCase();
    const side = SIDES.has(sideRaw) ? sideRaw : "friends";
    const dietRaw = cell(indexOf("dietary")).toLowerCase();
    const dietary = DIETS.has(dietRaw) ? dietRaw : "veg";
    const plusOnes = Math.max(0, Math.min(6, Number.parseInt(cell(indexOf("plusOnes")) || "0", 10) || 0));
    const events = cell(indexOf("events"))
      .split("|")
      .map((e) => e.trim())
      .filter(Boolean);
    if (phoneKey) seen.add(phoneKey);
    seenNames.add(nameKey);
    accepted.push({
      name,
      phone: phone ?? "",
      email: cell(indexOf("email")),
      side,
      dietary,
      plusOnes,
      events,
    });
  });

  return { accepted, errors, duplicates };
}

export function youtubeEmbed(url: string) {
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.replace(/^www\./, "");
    if (host === "youtu.be") {
      const id = parsed.pathname.split("/").filter(Boolean)[0];
      return id ? `https://www.youtube.com/embed/${id}` : null;
    }
    if (host === "youtube.com" || host === "m.youtube.com" || host === "music.youtube.com") {
      if (parsed.pathname === "/watch") {
        const id = parsed.searchParams.get("v");
        return id ? `https://www.youtube.com/embed/${id}` : null;
      }
      if (parsed.pathname.startsWith("/embed/")) {
        const id = parsed.pathname.split("/")[2];
        return id ? `https://www.youtube.com/embed/${id}` : null;
      }
    }
    return null;
  } catch {
    return null;
  }
}

export function mapsLink(query: string) {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}

export function icsForEvent(input: {
  title: string;
  description: string;
  location: string;
  date: string;
  startTime: string;
  endTime?: string;
}) {
  const start = toIcsStamp(input.date, input.startTime);
  const end = toIcsStamp(input.date, input.endTime || addHour(input.startTime));
  const uid = `${start}-${slugify(input.title) || "event"}@shubh.local`;
  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Shubh//Wedding//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${uid}`,
    `DTSTAMP:${start}`,
    `DTSTART:${start}`,
    `DTEND:${end}`,
    `SUMMARY:${escapeIcs(input.title)}`,
    `DESCRIPTION:${escapeIcs(input.description)}`,
    `LOCATION:${escapeIcs(input.location)}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");
}

function toIcsStamp(date: string, time: string) {
  const [y, m, d] = date.split("-");
  const [hh, mm] = (time || "00:00").split(":");
  return `${y}${m}${d}T${hh}${mm}00`;
}

function addHour(time: string) {
  const [hh, mm] = time.split(":").map((n) => Number.parseInt(n, 10));
  const hour = ((hh || 0) + 1) % 24;
  return `${String(hour).padStart(2, "0")}:${String(mm || 0).padStart(2, "0")}`;
}

function escapeIcs(value: string) {
  return value.replace(/\\/g, "\\\\").replace(/\n/g, "\\n").replace(/,/g, "\\,").replace(/;/g, "\\;");
}

export function draftDeletionError(status: string, isOwner: boolean) {
  if (!isOwner) return { status: 403, message: "Only the wedding owner can delete a draft." };
  if (status !== "draft") {
    return { status: 409, message: "Only draft weddings can be deleted. Unpublish a live site instead of deleting it." };
  }
  return null;
}

export function orderReference() {
  const stamp = Date.now().toString(36).toUpperCase();
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `SHB-${stamp}-${rand}`;
}
