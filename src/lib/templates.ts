import fs from "fs/promises";
import path from "path";
import { sanitizeInlineSvg } from "@/lib/sanitize";

export type Palette = { id: string; name: string; colors: ThemeColors };
export type ThemeColors = {
  background: string;
  surface: string;
  text: string;
  muted: string;
  accent: string;
  accent2: string;
};

export type ThemeFile = {
  id: string;
  name: string;
  tier: "free" | "premium";
  category: string;
  tags: string[];
  description: { en: string; ta: string };
  colors: ThemeColors;
  palettes: Palette[];
  fonts: { display: string; body: string };
  layout: { heroStyle: string; frame: boolean; density: "airy" | "regular" | "compact" };
  ornaments: {
    heroBg: string;
    heroBgSvg: string;
    heroBgSmall: string;
    borderTop: string;
    borderBottom: string;
    divider: string;
    corners: { tl: string; tr: string; bl: string; br: string };
    pattern: string;
  };
};

export type ThemeBundle = ThemeFile & {
  svg: {
    borderTop: string;
    borderBottom: string;
    divider: string;
    corners: { tl: string; tr: string; bl: string; br: string };
    pattern: string;
    motifs: Record<string, string>;
  };
};

const ROOT = path.join(process.cwd(), "public", "templates");
const MOTIF_ROOT = path.join(process.cwd(), "public", "motifs");

let cache: ThemeBundle[] | null = null;

async function readSvg(file: string) {
  try {
    const raw = await fs.readFile(file, "utf8");
    return sanitizeInlineSvg(raw);
  } catch {
    return "";
  }
}

export async function loadThemes(force = false): Promise<ThemeBundle[]> {
  if (cache && !force) return cache;
  let slugs: string[] = [];
  try {
    const entries = await fs.readdir(ROOT, { withFileTypes: true });
    slugs = entries.filter((e) => e.isDirectory()).map((e) => e.name);
  } catch {
    return [];
  }
  const themes: ThemeBundle[] = [];
  for (const slug of slugs) {
    try {
      const raw = await fs.readFile(path.join(ROOT, slug, "theme.json"), "utf8");
      const theme = JSON.parse(raw) as ThemeFile;
      const dir = path.join(ROOT, slug);
      const motifDir = path.join(dir, "motifs");
      let motifFiles: string[] = [];
      try {
        motifFiles = (await fs.readdir(motifDir)).filter((f) => f.endsWith(".svg"));
      } catch {
        motifFiles = [];
      }
      const motifs: Record<string, string> = {};
      for (const file of motifFiles) {
        motifs[file.replace(/\.svg$/, "")] = await readSvg(path.join(motifDir, file));
      }
      themes.push({
        ...theme,
        svg: {
          borderTop: await readSvg(path.join(dir, "border-top.svg")),
          borderBottom: await readSvg(path.join(dir, "border-bottom.svg")),
          divider: await readSvg(path.join(dir, "divider.svg")),
          corners: {
            tl: await readSvg(path.join(dir, "corner-tl.svg")),
            tr: await readSvg(path.join(dir, "corner-tr.svg")),
            bl: await readSvg(path.join(dir, "corner-bl.svg")),
            br: await readSvg(path.join(dir, "corner-br.svg")),
          },
          pattern: await readSvg(path.join(dir, "pattern.svg")),
          motifs,
        },
      });
    } catch {
      continue;
    }
  }
  cache = themes.sort((a, b) => a.name.localeCompare(b.name));
  return cache;
}

export async function loadTheme(id: string) {
  const all = await loadThemes();
  return all.find((t) => t.id === id) ?? null;
}

export function paletteOf(theme: ThemeFile, paletteId: string) {
  return theme.palettes.find((p) => p.id === paletteId) ?? theme.palettes[0];
}

export async function loadMotifPack(pack: string) {
  const dir = path.join(MOTIF_ROOT, pack);
  try {
    const files = (await fs.readdir(dir)).filter((f) => f.endsWith(".svg"));
    const out: Record<string, string> = {};
    for (const file of files) out[file.replace(/\.svg$/, "")] = await readSvg(path.join(dir, file));
    return out;
  } catch {
    return {};
  }
}

export function clearThemeCache() {
  cache = null;
}
