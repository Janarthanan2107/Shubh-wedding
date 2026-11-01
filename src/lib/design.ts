import { z } from "zod";

export const SECTION_TYPES = [
  "hero",
  "welcome",
  "countdown",
  "schedule",
  "venue",
  "gallery",
  "video",
  "family",
  "rsvp",
  "music",
  "quote",
  "travel",
  "gifts",
  "faq",
  "footer",
  "freeform",
] as const;

export type SectionType = (typeof SECTION_TYPES)[number];
export const SCHEMA_VERSION = 1;

export const motifPacks = ["neutral", "hindu", "muslim", "christian", "sikh"] as const;
export type MotifPack = (typeof motifPacks)[number];

const localized = z.object({
  en: z.string().default(""),
  ta: z.string().default(""),
  hi: z.string().default(""),
});

export const styleSchema = z.object({
  align: z.enum(["left", "center", "right"]).default("center"),
  color: z.string().default(""),
  background: z.string().default(""),
  backgroundImage: z.string().default(""),
  fontFamily: z.string().default(""),
  fontSize: z.number().min(8).max(140).default(18),
  lineHeight: z.number().min(0.8).max(3).default(1.5),
  letterSpacing: z.number().min(-2).max(24).default(0),
  padding: z.number().min(0).max(240).default(32),
  margin: z.number().min(0).max(240).default(0),
  borderWidth: z.number().min(0).max(24).default(0),
  borderColor: z.string().default(""),
  radius: z.number().min(0).max(120).default(0),
  shadow: z.enum(["none", "soft", "medium"]).default("none"),
  opacity: z.number().min(0).max(1).default(1),
  ornament: z.boolean().default(true),
  animation: z.enum(["none", "fade", "rise"]).default("rise"),
  bold: z.boolean().default(false),
  italic: z.boolean().default(false),
});

export type SectionStyle = z.infer<typeof styleSchema>;

const freeformElement = z.object({
  id: z.string().min(1),
  type: z.enum(["text", "image", "shape", "ornament"]),
  x: z.number(),
  y: z.number(),
  w: z.number().min(4),
  h: z.number().min(4),
  rotation: z.number().default(0),
  z: z.number().default(1),
  text: localized.optional(),
  src: z.string().optional(),
  alt: z.string().optional(),
  shape: z.enum(["rect", "ellipse", "line"]).optional(),
  ornament: z.string().optional(),
  color: z.string().optional(),
  fontSize: z.number().optional(),
});

export const sectionSchema = z.object({
  id: z.string().min(1),
  type: z.enum(SECTION_TYPES),
  hidden: z.boolean().default(false),
  locked: z.boolean().default(false),
  content: z.preprocess((v) => (v && typeof v === "object" ? v : {}), z.record(z.string(), z.any())),
  style: z.preprocess((v) => (v && typeof v === "object" ? v : {}), styleSchema),
  elements: z.array(freeformElement).optional(),
});

export type Section = z.infer<typeof sectionSchema>;

export const designSchema = z
  .object({
    schemaVersion: z.literal(1).default(1),
    templateId: z.string().min(1),
    paletteId: z.string().default("classic"),
    fontPairing: z.string().default("classic"),
    language: z.enum(["en", "ta", "hi"]).default("en"),
    motifPack: z.enum(motifPacks).default("neutral"),
    pageBackground: z.string().default(""),
    ornamentPack: z.string().default("template"),
    sections: z.array(sectionSchema).min(1),
  })
  .strict();

export type Design = z.infer<typeof designSchema>;

export function defaultStyle(partial: Partial<SectionStyle> = {}): SectionStyle {
  return styleSchema.parse(partial);
}

export function section(type: SectionType, content: Record<string, unknown>, style?: Partial<SectionStyle>): Section {
  return sectionSchema.parse({
    id: `${type}-${Math.random().toString(36).slice(2, 8)}`,
    type,
    hidden: false,
    locked: false,
    content,
    style: style ?? {},
    elements: type === "freeform" ? [] : undefined,
  });
}

export function createDefaultDesign(input: {
  templateId: string;
  paletteId?: string;
  motifPack?: MotifPack;
  groom: string;
  bride: string;
  groomTa?: string;
  brideTa?: string;
  groomHi?: string;
  brideHi?: string;
  dateLabel: string;
  city: string;
  welcome?: string;
}): Design {
  const names = {
    en: `${input.groom} & ${input.bride}`,
    ta: `${input.groomTa || input.groom} & ${input.brideTa || input.bride}`,
    hi: `${input.groomHi || input.groom} & ${input.brideHi || input.bride}`,
  };
  return designSchema.parse({
    schemaVersion: 1,
    templateId: input.templateId,
    paletteId: input.paletteId ?? "classic",
    fontPairing: "classic",
    language: "en",
    motifPack: input.motifPack ?? "neutral",
    pageBackground: "",
    ornamentPack: "template",
    sections: [
      section("hero", {
        eyebrow: { en: "Together with their families", ta: "குடும்பத்தினருடன்", hi: "परिवार सहित" },
        title: names,
        subtitle: {
          en: "request the pleasure of your company",
          ta: "உங்கள் வருகையை அன்புடன் வேண்டுகிறோம்",
          hi: "आपके सान्निध्य की कामना करते हैं",
        },
        date: { en: input.dateLabel, ta: input.dateLabel, hi: input.dateLabel },
        place: { en: input.city, ta: input.city, hi: input.city },
      }),
      section("welcome", {
        title: { en: "A note from us", ta: "எங்களிடமிருந்து", hi: "हमारी ओर से" },
        body: {
          en: input.welcome || "We are so glad to share these days with the people we love.",
          ta: "நாங்கள் நேசிக்கும் அனைவருடனும் இந்த நாட்களைப் பகிர மகிழ்கிறோம்.",
          hi: "हम जिनसे प्रेम करते हैं, उनके साथ ये दिन बाँटना चाहते हैं।",
        },
      }),
      section("countdown", {
        title: { en: "Counting the days", ta: "நாட்கள் எண்ணம்", hi: "दिन गिनते हुए" },
      }),
      section("schedule", {
        title: { en: "Celebrations", ta: "விழாக்கள்", hi: "उत्सव" },
      }),
      section("venue", {
        title: { en: "Where to find us", ta: "இடம்", hi: "स्थान" },
      }),
      section("gallery", { title: { en: "Moments", ta: "தருணங்கள்", hi: "पल" } }),
      section("quote", {
        text: {
          en: "Two homes, one beginning.",
          ta: "இரு வீடுகள், ஒரு தொடக்கம்.",
          hi: "दो घर, एक नई शुरुआत।",
        },
        by: { en: "", ta: "", hi: "" },
      }),
      section("rsvp", {
        title: { en: "Will you join us?", ta: "நீங்கள் வருகிறீர்களா?", hi: "क्या आप आएँगे?" },
        note: {
          en: "Kindly reply so we can save you a seat.",
          ta: "இருக்கை ஒதுக்க பதில் அளியுங்கள்.",
          hi: "कृपया उत्तर दें, ताकि हम आपकी जगह रख सकें।",
        },
      }),
      section("footer", {
        text: {
          en: "Made with care",
          ta: "அன்புடன்",
          hi: "स्नेह सहित",
        },
      }),
    ],
  });
}

export function migrateDesign(input: unknown): Design {
  if (!input || typeof input !== "object") {
    throw new Error("Design must be an object");
  }
  const raw = { ...(input as Record<string, unknown>) };
  const version = typeof raw.schemaVersion === "number" ? raw.schemaVersion : 0;
  if (version > SCHEMA_VERSION) {
    throw new Error(`Unsupported design schemaVersion ${version}`);
  }
  if (version < 1) {
    raw.schemaVersion = 1;
    if (!raw.motifPack) raw.motifPack = "neutral";
    if (!raw.language) raw.language = "en";
    if (!raw.paletteId) raw.paletteId = "classic";
    if (!raw.fontPairing) raw.fontPairing = "classic";
    if (!raw.ornamentPack) raw.ornamentPack = "template";
    if (!Array.isArray(raw.sections)) throw new Error("Design is missing sections");
  }
  const parsed = designSchema.safeParse(raw);
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    throw new Error(issue ? `${issue.path.join(".")}: ${issue.message}` : "Invalid design");
  }
  return parsed.data;
}

export function readLocale(value: unknown, locale: "en" | "ta" | "hi") {
  if (!value || typeof value !== "object") return "";
  const record = value as Record<string, unknown>;
  const picked = record[locale];
  if (typeof picked === "string" && picked.trim()) return picked;
  return typeof record.en === "string" ? record.en : "";
}

export function diffDesign(a: Design, b: Design) {
  const aIds = new Set(a.sections.map((s) => s.id));
  const bIds = new Set(b.sections.map((s) => s.id));
  const added = b.sections.filter((s) => !aIds.has(s.id)).map((s) => s.id);
  const removed = a.sections.filter((s) => !bIds.has(s.id)).map((s) => s.id);
  const changed = a.sections
    .filter((s) => bIds.has(s.id))
    .filter((s) => JSON.stringify(s) !== JSON.stringify(b.sections.find((x) => x.id === s.id)))
    .map((s) => s.id);
  const templateChanged = a.templateId !== b.templateId;
  return { added, removed, changed, templateChanged };
}
