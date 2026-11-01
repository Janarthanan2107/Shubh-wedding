import fs from "fs";
import path from "path";

export const TEMPLATE_SLUGS = [
  "royal-maroon-gold",
  "tamil-traditional",
  "floral-pastel",
  "minimal-ivory",
  "modern-sage",
  "south-indian-temple",
] as const;

export const REQUIRED_FILES = [
  "thumb.webp",
  "preview-desktop.webp",
  "preview-mobile.webp",
  "hero-bg.svg",
  "hero-bg.webp",
  "border-top.svg",
  "border-bottom.svg",
  "divider.svg",
  "corner-tl.svg",
  "corner-tr.svg",
  "corner-bl.svg",
  "corner-br.svg",
  "pattern.svg",
  "og-card.png",
  "theme.json",
];

const HERO_BUDGET = 150 * 1024;
const FIRST_LOAD_BUDGET = 500 * 1024;

export type AssetIssue = { template: string; message: string };

export function validateAssets(root = path.join(process.cwd(), "public", "templates")): AssetIssue[] {
  const issues: AssetIssue[] = [];
  if (!fs.existsSync(root)) {
    return [{ template: "*", message: "public/templates is missing" }];
  }
  for (const slug of TEMPLATE_SLUGS) {
    const dir = path.join(root, slug);
    if (!fs.existsSync(dir)) {
      issues.push({ template: slug, message: "folder missing" });
      continue;
    }
    for (const file of REQUIRED_FILES) {
      const full = path.join(dir, file);
      if (!fs.existsSync(full) || fs.statSync(full).size < 20) {
        issues.push({ template: slug, message: `missing ${file}` });
      }
    }
    const motifDir = path.join(dir, "motifs");
    const motifs = fs.existsSync(motifDir) ? fs.readdirSync(motifDir).filter((f) => f.endsWith(".svg")) : [];
    if (motifs.length < 6) issues.push({ template: slug, message: `motifs need 6 svg files, found ${motifs.length}` });
    const hero = path.join(dir, "hero-bg.webp");
    if (fs.existsSync(hero) && fs.statSync(hero).size > HERO_BUDGET) {
      issues.push({ template: slug, message: `hero-bg.webp exceeds 150KB (${fs.statSync(hero).size})` });
    }
    const firstLoad = ["hero-bg.webp", "border-top.svg", "border-bottom.svg", "divider.svg", "pattern.svg", "corner-tl.svg"]
      .map((f) => path.join(dir, f))
      .filter((f) => fs.existsSync(f))
      .reduce((sum, f) => sum + fs.statSync(f).size, 0);
    if (firstLoad > FIRST_LOAD_BUDGET) {
      issues.push({ template: slug, message: `first-load ornament budget exceeded (${firstLoad} bytes)` });
    }
    const themePath = path.join(dir, "theme.json");
    if (fs.existsSync(themePath)) {
      try {
        const theme = JSON.parse(fs.readFileSync(themePath, "utf8"));
        if (!theme.palettes || theme.palettes.length < 3) issues.push({ template: slug, message: "needs 3 palettes" });
        if (!theme.description?.en || !theme.description?.ta) {
          issues.push({ template: slug, message: "description needs English and Tamil" });
        }
      } catch {
        issues.push({ template: slug, message: "theme.json is invalid" });
      }
    }
  }
  return issues;
}
