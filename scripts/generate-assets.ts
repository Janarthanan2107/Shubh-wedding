import fs from "fs/promises";
import path from "path";
import sharp from "sharp";

const pub = path.join(process.cwd(), "public");

function xml(value: string) {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function svg(width: number, height: number, body: string) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" fill="none">${body}</svg>`;
}

async function write(rel: string, data: string | Buffer) {
  const full = path.join(pub, rel);
  await fs.mkdir(path.dirname(full), { recursive: true });
  await fs.writeFile(full, data);
}

async function raster(svgText: string, width: number, height: number, rel: string, format: "webp" | "png", quality = 64) {
  const image = sharp(Buffer.from(svgText), { density: 144 }).resize(width, height);
  const buf = format === "webp" ? await image.webp({ quality }).toBuffer() : await image.png({ compressionLevel: 9 }).toBuffer();
  await write(rel, buf);
  return buf.length;
}

const stroke = `stroke="var(--ornament-color)" fill="none" stroke-linecap="round" stroke-linejoin="round"`;
const fill = `fill="var(--ornament-color)"`;

function repeat(n: number, fn: (i: number) => string) {
  return Array.from({ length: n }, (_, i) => fn(i)).join("");
}

type ThemeSpec = {
  id: string;
  name: string;
  tier: "free" | "premium";
  category: string;
  tags: string[];
  description: { en: string; ta: string };
  colors: Record<string, string>;
  palettes: { id: string; name: string; colors: Record<string, string> }[];
  heroStyle: string;
  density: "airy" | "regular" | "compact";
  corner: string;
  borderTop: string;
  borderBottom: string;
  divider: string;
  pattern: string;
  motifs: Record<string, string>;
  hero: (w: number, h: number) => string;
};

const mandala = `
  <circle cx="46" cy="46" r="30" ${stroke} stroke-width="1.4"/>
  <circle cx="46" cy="46" r="18" ${stroke} stroke-width="1"/>
  <circle cx="46" cy="46" r="4" ${fill}/>
  ${repeat(10, (i) => {
    const a = (i / 10) * Math.PI * 2;
    const x = 46 + Math.cos(a) * 24;
    const y = 46 + Math.sin(a) * 24;
    return `<ellipse cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" rx="5" ry="2.4" transform="rotate(${(a * 180) / Math.PI} ${x.toFixed(1)} ${y.toFixed(1)})" ${fill} opacity="0.85"/>`;
  })}
  <path d="M10 10 H78 M10 10 V78" ${stroke} stroke-width="1.2"/>
`;

const leafSprig = `
  <path d="M20 110 C40 80 50 50 70 20" ${stroke} stroke-width="1.3"/>
  <path d="M40 78 C52 70 60 74 68 64 C56 66 48 72 40 78Z" fill="var(--ornament-color)" opacity="0.8"/>
  <path d="M48 60 C58 48 66 50 74 40 C62 46 54 52 48 60Z" fill="var(--ornament-color)" opacity="0.8"/>
  <path d="M34 92 C24 84 22 74 28 66 C30 78 34 86 34 92Z" fill="var(--ornament-color)" opacity="0.75"/>
`;

const diya = `
  <path d="M10 38 C10 28 22 24 32 24 C42 24 54 28 54 38 C54 46 44 50 32 50 C20 50 10 46 10 38Z" ${stroke} stroke-width="1.6"/>
  <path d="M32 24 C32 14 28 10 32 4 C36 10 32 14 32 24Z" ${fill}/>
  <path d="M18 40 H46" ${stroke} stroke-width="1"/>
`;

const kalash = `
  <path d="M24 18 H40 L44 28 H20 Z" ${stroke} stroke-width="1.5"/>
  <path d="M18 28 H46 C48 40 44 52 32 56 C20 52 16 40 18 28Z" ${stroke} stroke-width="1.5"/>
  <path d="M32 18 V8 M26 10 H38" ${stroke} stroke-width="1.4"/>
  <circle cx="32" cy="40" r="3" ${fill}/>
`;

const lotus = `
  ${repeat(6, (i) => {
    const a = -70 + i * 28;
    return `<ellipse cx="32" cy="36" rx="6" ry="16" transform="rotate(${a} 32 40)" ${stroke} stroke-width="1.2"/>`;
  })}
  <circle cx="32" cy="40" r="3.5" ${fill}/>
`;

const bell = `
  <path d="M32 8 V14" ${stroke} stroke-width="1.5"/>
  <path d="M18 36 C18 22 46 22 46 36 H18Z" ${stroke} stroke-width="1.5"/>
  <path d="M16 36 H48" ${stroke} stroke-width="1.5"/>
  <circle cx="32" cy="44" r="3" ${fill}/>
`;

const jasmine = `
  <circle cx="32" cy="32" r="4" ${fill}/>
  ${repeat(5, (i) => {
    const a = (i / 5) * Math.PI * 2 - Math.PI / 2;
    const x = 32 + Math.cos(a) * 12;
    const y = 32 + Math.sin(a) * 12;
    return `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="6" ${stroke} stroke-width="1.3"/>`;
  })}
`;

const rose = `
  <circle cx="32" cy="32" r="6" ${stroke} stroke-width="1.2"/>
  <circle cx="32" cy="32" r="11" ${stroke} stroke-width="1.1"/>
  <path d="M32 21 C38 16 46 18 44 26 C50 30 46 40 36 40 C34 48 24 48 22 40 C14 38 14 28 22 26 C20 16 28 16 32 21Z" ${stroke} stroke-width="1.1"/>
`;

const mango = `
  <path d="M8 10 C28 14 40 30 36 52 C22 40 10 24 8 10Z" fill="var(--ornament-color)"/>
  <path d="M18 8 C20 20 16 28 10 30" ${stroke} stroke-width="1"/>
`;

const banana = `
  <path d="M6 40 C20 10 50 8 58 28 C40 20 24 28 18 48 C14 46 8 44 6 40Z" fill="var(--ornament-color)" opacity="0.9"/>
`;

const kolamMotif = `
  ${repeat(3, (r) => repeat(3, (c) => `<circle cx="${16 + c * 16}" cy="${16 + r * 16}" r="2.2" ${fill}/>`))}
  <path d="M16 16 Q32 16 32 32 Q32 48 48 48" ${stroke} stroke-width="1.2"/>
  <path d="M48 16 Q32 16 32 32 Q32 48 16 48" ${stroke} stroke-width="1.2"/>
`;

const gopuram = `
  <path d="M22 58 H42 V44 H46 V34 H40 V26 H36 V18 H28 V26 H24 V34 H18 V44 H22 Z" ${fill}/>
  <path d="M30 18 L32 8 L34 18" ${fill}/>
`;

const stripe = `
  <rect x="6" y="28" width="52" height="3" ${fill}/>
  <rect x="6" y="34" width="52" height="1.2" ${fill}/>
  <rect x="6" y="38" width="52" height="3" ${fill}/>
`;

const archMini = `
  <path d="M12 54 V28 Q32 6 52 28 V54" ${stroke} stroke-width="1.6"/>
  <path d="M18 54 V30 Q32 14 46 30 V54" ${stroke} stroke-width="1"/>
`;

const botanical = `
  <path d="M32 58 C32 40 32 24 32 8" ${stroke} stroke-width="1.3"/>
  <path d="M32 40 C20 34 14 26 16 18 C26 22 32 32 32 40Z" ${stroke} stroke-width="1.2"/>
  <path d="M32 30 C44 24 50 16 48 10 C40 16 34 24 32 30Z" ${stroke} stroke-width="1.2"/>
  <path d="M32 48 C22 46 16 40 18 34 C26 38 32 44 32 48Z" ${stroke} stroke-width="1.2"/>
`;

const royalBorder = `
  <line x1="0" y1="18" x2="1200" y2="18" ${stroke} stroke-width="1.4"/>
  <line x1="0" y1="26" x2="1200" y2="26" ${stroke} stroke-width="0.6"/>
  ${repeat(30, (i) => `<path d="M${20 + i * 40} 8 l6 8 l-6 8 l-6 -8 Z" ${stroke} stroke-width="1"/>`)}
`;

const tamilBorder = `
  <path d="M0 34 H1200" ${stroke} stroke-width="2"/>
  ${repeat(16, (i) => `<g transform="translate(${i * 76} 0)">${mango}<g transform="translate(28 0) scale(0.9)">${mango}</g></g>`)}
  ${repeat(40, (i) => `<circle cx="${i * 30 + 10}" cy="62" r="2" ${fill}/>`)}
`;

const floralBorder = `
  ${repeat(14, (i) => `<g transform="translate(${i * 86} 8) scale(0.7)">${jasmine}</g>`)}
  <path d="M0 58 C 40 40 80 70 120 52 C 160 34 200 66 240 50 C 280 34 320 68 360 50 C 400 32 440 66 480 48 C 520 30 560 64 600 46 C 640 28 680 62 720 44 C 760 26 800 60 840 42 C 880 24 920 58 960 40 C 1000 22 1040 56 1080 38 C 1120 22 1160 50 1200 36" ${stroke} stroke-width="1.2"/>
`;

const minimalBorder = `<line x1="40" y1="20" x2="1160" y2="20" ${stroke} stroke-width="0.8"/>`;

const sageBorder = `
  <line x1="0" y1="40" x2="1200" y2="40" ${stroke} stroke-width="0.7"/>
  ${repeat(8, (i) => `<g transform="translate(${80 + i * 140} -6) scale(0.7)">${botanical}</g>`)}
`;

const templeBorder = `
  <rect x="0" y="8" width="1200" height="8" fill="var(--ornament-color)"/>
  <rect x="0" y="20" width="1200" height="2" fill="var(--ornament-color)"/>
  <rect x="0" y="26" width="1200" height="8" fill="var(--ornament-color)"/>
  ${repeat(12, (i) => `<g transform="translate(${20 + i * 98} 40) scale(0.55)">${diya}</g>`)}
`;

const themes: ThemeSpec[] = [
  {
    id: "royal-maroon-gold",
    name: "Royal Maroon & Gold",
    tier: "free",
    category: "Traditional",
    tags: ["royal", "maroon", "gold", "palace"],
    description: {
      en: "A palace-arch invitation in deep maroon and gold foil, with mandala corners.",
      ta: "அரண்மனை வளைவும் மண்டல மூலைகளும் கொண்ட மெரூன்-தங்க அழைப்பிதழ்.",
    },
    colors: { background: "#4A1220", surface: "#64182B", text: "#F8F1E3", muted: "#E7D3A1", accent: "#D4AF37", accent2: "#8C6A2F" },
    palettes: [
      { id: "classic", name: "Classic maroon", colors: { background: "#4A1220", surface: "#64182B", text: "#F8F1E3", muted: "#E7D3A1", accent: "#D4AF37", accent2: "#8C6A2F" } },
      { id: "midnight", name: "Midnight gold", colors: { background: "#16131C", surface: "#262033", text: "#F6EFE2", muted: "#D9C7A2", accent: "#C6A15B", accent2: "#8D7340" } },
      { id: "ivory", name: "Ivory court", colors: { background: "#F7F1E6", surface: "#FFF9F1", text: "#4A1220", muted: "#7A5A3A", accent: "#8C6A2F", accent2: "#D4AF37" } },
    ],
    heroStyle: "palace",
    density: "regular",
    corner: mandala,
    borderTop: royalBorder,
    borderBottom: royalBorder,
    divider: `<line x1="20" y1="12" x2="160" y2="12" ${stroke}/><g transform="translate(168 -8) scale(0.45)">${lotus}</g><line x1="220" y1="12" x2="360" y2="12" ${stroke}/>`,
    pattern: `${repeat(4, (r) => repeat(4, (c) => `<circle cx="${15 + c * 30}" cy="${15 + r * 30}" r="1.4" ${fill} opacity="0.7"/>`))}`,
    motifs: { diya, kalash, lotus, bell, mandala, arch: archMini },
    hero: (w, h) => `
      <rect width="${w}" height="${h}" fill="#4A1220"/>
      <rect x="36" y="28" width="${w - 72}" height="${h - 56}" stroke="#D4AF37" stroke-width="2" fill="none"/>
      <rect x="48" y="40" width="${w - 96}" height="${h - 80}" stroke="#D4AF37" stroke-width="0.7" fill="none"/>
      <path d="M${w * 0.28} ${h * 0.86} V${h * 0.38} Q${w * 0.5} ${h * 0.06} ${w * 0.72} ${h * 0.38} V${h * 0.86}" stroke="#D4AF37" stroke-width="2.2" fill="none"/>
      <path d="M${w * 0.33} ${h * 0.86} V${h * 0.42} Q${w * 0.5} ${h * 0.16} ${w * 0.67} ${h * 0.42} V${h * 0.86}" stroke="#E7D3A1" stroke-width="0.8" fill="none"/>
      <circle cx="80" cy="80" r="36" stroke="#D4AF37" fill="none"/>
      <circle cx="${w - 80}" cy="80" r="36" stroke="#D4AF37" fill="none"/>
      <circle cx="80" cy="${h - 70}" r="28" stroke="#D4AF37" fill="none"/>
      <circle cx="${w - 80}" cy="${h - 70}" r="28" stroke="#D4AF37" fill="none"/>
    `,
  },
  {
    id: "tamil-traditional",
    name: "Tamil Traditional",
    tier: "free",
    category: "Traditional",
    tags: ["tamil", "kolam", "turmeric", "toran"],
    description: {
      en: "Turmeric and kumkum with a kolam border, mango-leaf toran and banana leaves.",
      ta: "மஞ்சள் மற்றும் குங்குமம், கோலம் border, மாவிலை தோரணம், வாழை இலை.",
    },
    colors: { background: "#FFF4D2", surface: "#FFF9E8", text: "#7A1B16", muted: "#8A4B20", accent: "#C4312E", accent2: "#2F6B3A" },
    palettes: [
      { id: "classic", name: "Turmeric", colors: { background: "#FFF4D2", surface: "#FFF9E8", text: "#7A1B16", muted: "#8A4B20", accent: "#C4312E", accent2: "#2F6B3A" } },
      { id: "kumkum", name: "Kumkum night", colors: { background: "#6E1220", surface: "#8A1C2C", text: "#F8E7C1", muted: "#E6C98A", accent: "#E6B325", accent2: "#F2D48A" } },
      { id: "leaf", name: "Banana leaf", colors: { background: "#F3F6EA", surface: "#FFFFFF", text: "#1E3A2F", muted: "#3E5C49", accent: "#C4532A", accent2: "#2F6B3A" } },
    ],
    heroStyle: "kolam",
    density: "regular",
    corner: kolamMotif + `<path d="M8 8 H90 M8 8 V90" ${stroke} stroke-width="1.4"/>`,
    borderTop: tamilBorder,
    borderBottom: `${repeat(18, (i) => `<g transform="translate(${i * 70} 6) scale(0.8)">${banana}</g>`)}`,
    divider: `<path d="M10 16 H150" ${stroke}/><g transform="translate(160 -6) scale(0.5)">${mango}</g><path d="M210 16 H360" ${stroke}/>`,
    pattern: repeat(6, (r) => repeat(6, (c) => `<circle cx="${10 + c * 20}" cy="${10 + r * 20}" r="1.6" ${fill}/>`)),
    motifs: { kolam: kolamMotif, mango, banana, diya, kalash, jasmine },
    hero: (w, h) => `
      <rect width="${w}" height="${h}" fill="#FFF4D2"/>
      <rect x="24" y="24" width="${w - 48}" height="${h - 48}" stroke="#C4312E" stroke-width="3" fill="none"/>
      ${repeat(Math.floor(w / 28), (i) => `<circle cx="${36 + i * 28}" cy="48" r="3" fill="#C4312E"/>`)}
      ${repeat(Math.floor(w / 28), (i) => `<circle cx="${36 + i * 28}" cy="${h - 48}" r="3" fill="#C4312E"/>`)}
      ${repeat(10, (i) => `<g transform="translate(${40 + i * ((w - 80) / 10)} 8) scale(1.1)">${mango}</g>`)}
      <g transform="translate(30 ${h - 120}) scale(1.4)"><path d="M6 40 C20 10 50 8 58 28 C40 20 24 28 18 48 C14 46 8 44 6 40Z" fill="#2F6B3A"/></g>
      <g transform="translate(${w - 120} ${h - 120}) scale(1.4)"><path d="M6 40 C20 10 50 8 58 28 C40 20 24 28 18 48 C14 46 8 44 6 40Z" fill="#2F6B3A"/></g>
    `,
  },
  {
    id: "floral-pastel",
    name: "Floral Pastel",
    tier: "premium",
    category: "Floral",
    tags: ["blush", "watercolor", "jasmine", "rose"],
    description: {
      en: "Blush and peach florals with jasmine and rose garlands.",
      ta: "இளஞ்சிவப்பு மற்றும் பீச் மலர்கள், மல்லிகை மற்றும் ரோஜா மாலை.",
    },
    colors: { background: "#FBF1EE", surface: "#FFF8F6", text: "#6A3A45", muted: "#A56B76", accent: "#D9899A", accent2: "#E7B7A4" },
    palettes: [
      { id: "classic", name: "Blush", colors: { background: "#FBF1EE", surface: "#FFF8F6", text: "#6A3A45", muted: "#A56B76", accent: "#D9899A", accent2: "#E7B7A4" } },
      { id: "peach", name: "Peach", colors: { background: "#FDEFE6", surface: "#FFF8F3", text: "#7A4636", muted: "#B57A68", accent: "#E2A48B", accent2: "#F3C7B0" } },
      { id: "rose", name: "Rose dusk", colors: { background: "#F6E7EE", surface: "#FBF4F7", text: "#6D3A55", muted: "#A56B86", accent: "#C98BB0", accent2: "#E4B7CF" } },
    ],
    heroStyle: "floral",
    density: "airy",
    corner: `<g opacity="0.9">${rose}<g transform="translate(28 8) scale(0.7)">${jasmine}</g></g>`,
    borderTop: floralBorder,
    borderBottom: floralBorder,
    divider: `<g transform="translate(150 -8) scale(0.6)">${rose}</g><path d="M20 16 H140" ${stroke}/><path d="M210 16 H340" ${stroke}/>`,
    pattern: `<circle cx="30" cy="30" r="18" fill="var(--ornament-color)" opacity="0.15"/><circle cx="90" cy="80" r="14" fill="var(--ornament-color)" opacity="0.12"/>`,
    motifs: { rose, jasmine, leaf: botanical, garland: floralBorder, bud: lotus, sprig: leafSprig },
    hero: (w, h) => `
      <rect width="${w}" height="${h}" fill="#FBF1EE"/>
      <ellipse cx="${w * 0.15}" cy="${h * 0.2}" rx="180" ry="120" fill="#F3C9D2" opacity="0.7"/>
      <ellipse cx="${w * 0.86}" cy="${h * 0.75}" rx="200" ry="140" fill="#F6D7C8" opacity="0.8"/>
      <ellipse cx="${w * 0.7}" cy="${h * 0.18}" rx="120" ry="80" fill="#E7B7C4" opacity="0.45"/>
      <ellipse cx="${w * 0.3}" cy="${h * 0.82}" rx="140" ry="90" fill="#F8E0E4" opacity="0.9"/>
      ${repeat(8, (i) => `<g transform="translate(${30 + i * (w / 8)} ${h - 90}) scale(0.8)" opacity="0.8">${jasmine}</g>`)}
    `,
  },
  {
    id: "minimal-ivory",
    name: "Minimal Ivory",
    tier: "free",
    category: "Minimal",
    tags: ["ivory", "minimal", "whitespace", "sprig"],
    description: {
      en: "Ivory space, a thin line frame, and a single floral sprig.",
      ta: "ஐவரி வெளி, மெல்லிய கோட்டு சட்டம், ஒரு சிறிய மலர்க் கொத்து.",
    },
    colors: { background: "#FBF8F3", surface: "#FFFFFF", text: "#2C2825", muted: "#6E655C", accent: "#B08968", accent2: "#E6D8C8" },
    palettes: [
      { id: "classic", name: "Ivory", colors: { background: "#FBF8F3", surface: "#FFFFFF", text: "#2C2825", muted: "#6E655C", accent: "#B08968", accent2: "#E6D8C8" } },
      { id: "ink", name: "Ink", colors: { background: "#F7F7F5", surface: "#FFFFFF", text: "#1A1A1A", muted: "#5C5C5C", accent: "#8A8A8A", accent2: "#D9D9D4" } },
      { id: "sand", name: "Warm sand", colors: { background: "#F6EFE4", surface: "#FFFBF5", text: "#3A2E24", muted: "#7A6554", accent: "#A67C52", accent2: "#E4D2BC" } },
    ],
    heroStyle: "minimal",
    density: "airy",
    corner: `<path d="M16 16 H70 M16 16 V70" ${stroke} stroke-width="1"/>`,
    borderTop: minimalBorder,
    borderBottom: minimalBorder,
    divider: `<line x1="40" y1="12" x2="340" y2="12" ${stroke} stroke-width="0.8"/>`,
    pattern: `<circle cx="60" cy="60" r="1" ${fill}/>`,
    motifs: { sprig: leafSprig, line: `<path d="M8 32 H56" ${stroke}/>`, dot: `<circle cx="32" cy="32" r="4" ${fill}/>`, leaf: botanical, ring: `<circle cx="32" cy="32" r="14" ${stroke}/>`, diamond: `<path d="M32 12 L48 32 L32 52 L16 32 Z" ${stroke}/>` },
    hero: (w, h) => `
      <rect width="${w}" height="${h}" fill="#FBF8F3"/>
      <rect x="64" y="48" width="${w - 128}" height="${h - 96}" stroke="#B08968" stroke-width="1" fill="none"/>
      <g transform="translate(${w - 180} ${h - 180}) scale(1.3)">${leafSprig}</g>
    `,
  },
  {
    id: "modern-sage",
    name: "Modern Sage",
    tier: "premium",
    category: "Modern",
    tags: ["sage", "botanical", "modern", "grain"],
    description: {
      en: "Sage paper, botanical line art, and a quiet modern grid.",
      ta: "சாம்பல் பச்சை தாள், தாவர கோட்டு ஓவியம், அமைதியான நவீன அமைப்பு.",
    },
    colors: { background: "#F3F5EF", surface: "#FBFCF8", text: "#243028", muted: "#5C6B60", accent: "#6E7F62", accent2: "#C5B48A" },
    palettes: [
      { id: "classic", name: "Sage", colors: { background: "#F3F5EF", surface: "#FBFCF8", text: "#243028", muted: "#5C6B60", accent: "#6E7F62", accent2: "#C5B48A" } },
      { id: "forest", name: "Forest", colors: { background: "#1E2A24", surface: "#28362E", text: "#E7EEE4", muted: "#C5D1C6", accent: "#C4B48A", accent2: "#8FA58A" } },
      { id: "mist", name: "Mist", colors: { background: "#E7EEE9", surface: "#F7FAF8", text: "#1C332B", muted: "#4E675C", accent: "#7E9474", accent2: "#D5E0D4" } },
    ],
    heroStyle: "botanical",
    density: "airy",
    corner: botanical,
    borderTop: sageBorder,
    borderBottom: sageBorder,
    divider: `<g transform="translate(150 -20) scale(0.7)">${botanical}</g>`,
    pattern: `<path d="M0 60 H120 M60 0 V120" stroke="var(--ornament-color)" stroke-width="0.4" opacity="0.5"/>`,
    motifs: { leaf: botanical, stem: botanical, fern: leafSprig, seed: `<circle cx="32" cy="32" r="5" ${stroke}/>`, branch: leafSprig, circle: `<circle cx="32" cy="32" r="16" ${stroke}/>` },
    hero: (w, h) => `
      <rect width="${w}" height="${h}" fill="#F3F5EF"/>
      ${repeat(18, (i) => `<circle cx="${(i * 97) % w}" cy="${(i * 53) % h}" r="40" fill="#E1E6DA" opacity="0.5"/>`)}
      <g transform="translate(40 40) scale(2.2)" stroke="#6E7F62">${botanical}</g>
      <g transform="translate(${w - 180} ${h - 220}) scale(2.4)" stroke="#6E7F62">${botanical}</g>
      <rect x="80" y="60" width="${w - 160}" height="${h - 120}" stroke="#6E7F62" stroke-width="0.8" fill="none"/>
    `,
  },
  {
    id: "south-indian-temple",
    name: "South Indian Temple Style",
    tier: "premium",
    category: "Temple",
    tags: ["temple", "gopuram", "kasavu", "diya"],
    description: {
      en: "A gopuram silhouette, kasavu-inspired bands, and a row of diyas on deep red.",
      ta: "கோபுர நிழல், கசவு போன்ற பட்டைகள், விளக்கு வரிசை, ஆழமான சிவப்பு.",
    },
    colors: { background: "#6B1424", surface: "#7E1B2E", text: "#F8E7C0", muted: "#E6D2A2", accent: "#E0B44A", accent2: "#F3E6C4" },
    palettes: [
      { id: "classic", name: "Temple red", colors: { background: "#6B1424", surface: "#7E1B2E", text: "#F8E7C0", muted: "#E6D2A2", accent: "#E0B44A", accent2: "#F3E6C4" } },
      { id: "kasavu", name: "Kasavu", colors: { background: "#F7F3E8", surface: "#FFFDF8", text: "#5C1220", muted: "#7A4A3A", accent: "#C6A15A", accent2: "#6B1424" } },
      { id: "lamp", name: "Night lamp", colors: { background: "#1A120E", surface: "#2A1D16", text: "#F6E6C8", muted: "#D9C4A0", accent: "#E7A23A", accent2: "#F0D7A2" } },
    ],
    heroStyle: "temple",
    density: "regular",
    corner: gopuram,
    borderTop: templeBorder,
    borderBottom: templeBorder,
    divider: `<rect x="10" y="10" width="120" height="4" ${fill}/><rect x="140" y="13" width="80" height="1.5" ${fill}/><rect x="230" y="10" width="120" height="4" ${fill}/>`,
    pattern: `<rect width="120" height="8" y="56" fill="var(--ornament-color)" opacity="0.35"/>`,
    motifs: { gopuram, diya, kalash, stripe, bell, lotus },
    hero: (w, h) => `
      <rect width="${w}" height="${h}" fill="#6B1424"/>
      <rect x="0" y="${h * 0.72}" width="${w}" height="14" fill="#E0B44A"/>
      <rect x="0" y="${h * 0.72 + 20}" width="${w}" height="4" fill="#F3E6C4"/>
      <rect x="0" y="${h * 0.72 + 30}" width="${w}" height="14" fill="#E0B44A"/>
      <path d="M${w / 2 - 70} ${h * 0.7} H${w / 2 + 70} V${h * 0.46} H${w / 2 + 110} V${h * 0.34} H${w / 2 + 50} V${h * 0.24} H${w / 2 + 20} V${h * 0.14} H${w / 2 - 20} V${h * 0.24} H${w / 2 - 50} V${h * 0.34} H${w / 2 - 110} V${h * 0.46} H${w / 2 - 70} Z" fill="#F3E6C4"/>
      <path d="M${w / 2 - 8} ${h * 0.14} L${w / 2} ${h * 0.05} L${w / 2 + 8} ${h * 0.14} Z" fill="#E0B44A"/>
      ${repeat(9, (i) => `<g transform="translate(${80 + i * ((w - 160) / 8)} ${h - 90}) scale(0.9)"><path d="M10 38 C10 28 22 24 32 24 C42 24 54 28 54 38 C54 46 44 50 32 50 C20 50 10 46 10 38Z" stroke="#E0B44A" fill="none"/><path d="M32 24 C32 14 28 8 32 2 C36 8 32 14 32 24Z" fill="#E0B44A"/></g>`)}
    `,
  },
];

function card(theme: ThemeSpec, w: number, h: number) {
  const c = theme.colors;
  return svg(
    w,
    h,
    `
    <rect width="${w}" height="${h}" fill="${c.background}"/>
    ${theme.hero(w, h).replaceAll(c.background, "none")}
    <text x="${w / 2}" y="${h * 0.42}" text-anchor="middle" fill="${c.text}" font-family="Georgia, serif" font-size="${Math.round(h * 0.055)}">Raja &amp; Rani</text>
    <text x="${w / 2}" y="${h * 0.5}" text-anchor="middle" fill="${c.accent}" font-family="Georgia, serif" font-size="${Math.round(h * 0.028)}">20 December 2026</text>
    <text x="${w / 2}" y="${h * 0.56}" text-anchor="middle" fill="${c.muted}" font-family="Georgia, serif" font-size="${Math.round(h * 0.022)}">Chennai · ${xml(theme.name)}</text>
  `,
  );
}

const packs: Record<string, Record<string, string>> = {
  hindu: { om: `<text x="32" y="44" text-anchor="middle" font-size="36" fill="var(--ornament-color)" font-family="serif">ॐ</text>`, kalash, diya, lotus },
  muslim: {
    crescent: `<path d="M36 12 A18 18 0 1 0 36 52 A14 14 0 1 1 36 12Z" ${fill}/><path d="M44 18 L46 24 L52 24 L47 28 L49 34 L44 30 L39 34 L41 28 L36 24 L42 24 Z" ${fill}/>`,
    arch: archMini,
    geometric: `${repeat(3, (r) => repeat(3, (c) => `<rect x="${8 + c * 18}" y="${8 + r * 18}" width="10" height="10" transform="rotate(45 ${13 + c * 18} ${13 + r * 18})" ${stroke}/>`))}`,
  },
  christian: {
    cross: `<path d="M32 8 V56 M18 22 H46" ${stroke} stroke-width="3"/>`,
    dove: `<path d="M8 36 C20 30 28 28 36 32 C44 20 58 22 58 30 C48 30 44 36 40 40 C30 44 16 44 8 36Z" ${stroke} stroke-width="1.4"/>`,
    floral: rose,
  },
  sikh: {
    "ik-onkar": `<circle cx="24" cy="36" r="12" ${stroke} stroke-width="2"/><path d="M36 18 V52 M36 18 H48 M42 18 V28" ${stroke} stroke-width="2"/>`,
    frame: `<rect x="10" y="10" width="44" height="44" ${stroke} stroke-width="1.4"/><rect x="16" y="16" width="32" height="32" ${stroke}/>`,
  },
  neutral: { flower: jasmine, ring: `<circle cx="32" cy="32" r="16" ${stroke} stroke-width="1.4"/>`, sprig: leafSprig },
};

async function main() {
  for (const theme of themes) {
    const base = `templates/${theme.id}`;
    const themeJson = {
      id: theme.id,
      name: theme.name,
      tier: theme.tier,
      category: theme.category,
      tags: theme.tags,
      description: theme.description,
      colors: theme.colors,
      palettes: theme.palettes,
      fonts: { display: "serif", body: theme.heroStyle === "botanical" || theme.heroStyle === "minimal" ? "sans" : "serif" },
      layout: { heroStyle: theme.heroStyle, frame: true, density: theme.density },
      ornaments: {
        heroBg: `/${base}/hero-bg.webp`,
        heroBgSvg: `/${base}/hero-bg.svg`,
        heroBgSmall: `/${base}/hero-bg-640.webp`,
        borderTop: `/${base}/border-top.svg`,
        borderBottom: `/${base}/border-bottom.svg`,
        divider: `/${base}/divider.svg`,
        corners: {
          tl: `/${base}/corner-tl.svg`,
          tr: `/${base}/corner-tr.svg`,
          bl: `/${base}/corner-bl.svg`,
          br: `/${base}/corner-br.svg`,
        },
        pattern: `/${base}/pattern.svg`,
      },
    };
    await write(`${base}/theme.json`, JSON.stringify(themeJson, null, 2));
    await write(`${base}/border-top.svg`, svg(1200, 80, theme.borderTop));
    await write(`${base}/border-bottom.svg`, svg(1200, 80, theme.borderBottom));
    await write(`${base}/divider.svg`, svg(400, 32, theme.divider));
    await write(`${base}/pattern.svg`, svg(120, 120, theme.pattern));
    await write(`${base}/corner-tl.svg`, svg(160, 160, `<g transform="translate(8 8)">${theme.corner}</g>`));
    await write(`${base}/corner-tr.svg`, svg(160, 160, `<g transform="translate(152 8) scale(-1 1)">${theme.corner}</g>`));
    await write(`${base}/corner-bl.svg`, svg(160, 160, `<g transform="translate(8 152) scale(1 -1)">${theme.corner}</g>`));
    await write(`${base}/corner-br.svg`, svg(160, 160, `<g transform="translate(152 152) scale(-1 -1)">${theme.corner}</g>`));
    for (const [name, body] of Object.entries(theme.motifs)) {
      await write(`${base}/motifs/${name}.svg`, svg(64, 64, body));
    }
    const hero = svg(1280, 720, theme.hero(1280, 720));
    await write(`${base}/hero-bg.svg`, hero);
    let quality = 68;
    let size = await raster(hero, 1280, 720, `${base}/hero-bg.webp`, "webp", quality);
    while (size > 150 * 1024 && quality > 36) {
      quality -= 8;
      size = await raster(hero, 1280, 720, `${base}/hero-bg.webp`, "webp", quality);
    }
    await raster(hero, 640, 360, `${base}/hero-bg-640.webp`, "webp", quality);
    await raster(card(theme, 600, 800), 600, 800, `${base}/thumb.webp`, "webp", 70);
    await raster(card(theme, 1440, 900), 1440, 900, `${base}/preview-desktop.webp`, "webp", 66);
    await raster(card(theme, 390, 844), 390, 844, `${base}/preview-mobile.webp`, "webp", 70);
    const og = svg(1200, 630, `
      <rect width="1200" height="630" fill="${theme.colors.background}"/>
      ${theme.hero(1200, 630)}
      <text x="600" y="280" text-anchor="middle" fill="${theme.colors.text}" font-family="Georgia, serif" font-size="64">Raja &amp; Rani</text>
      <text x="600" y="350" text-anchor="middle" fill="${theme.colors.accent}" font-family="Georgia, serif" font-size="28">20 December 2026 · Chennai</text>
      <text x="600" y="410" text-anchor="middle" fill="${theme.colors.muted}" font-family="Georgia, serif" font-size="22">${xml(theme.name)}</text>
    `);
    await raster(og, 1200, 630, `${base}/og-card.png`, "png");
    console.log(`${theme.id} hero ${Math.round(size / 1024)}KB q${quality}`);
  }

  for (const [pack, motifs] of Object.entries(packs)) {
    for (const [name, body] of Object.entries(motifs)) {
      await write(`motifs/${pack}/${name}.svg`, svg(64, 64, body));
    }
  }

  const portrait = (tone: string, accent: string) =>
    svg(800, 1000, `
      <rect width="800" height="1000" fill="${tone}"/>
      <circle cx="400" cy="390" r="150" fill="${accent}" opacity="0.85"/>
      <path d="M180 860 C220 680 580 680 620 860 Z" fill="${accent}" opacity="0.9"/>
      <circle cx="348" cy="370" r="10" fill="${tone}"/>
      <circle cx="452" cy="370" r="10" fill="${tone}"/>
      <path d="M360 450 Q400 480 440 450" stroke="${tone}" stroke-width="6" fill="none"/>
    `);
  await raster(portrait("#6B1D2A", "#E6D3A3"), 800, 1000, "demo/groom.webp", "webp", 70);
  await raster(portrait("#F3D2C6", "#6B1D2A"), 800, 1000, "demo/bride.webp", "webp", 70);
  await raster(portrait("#F4E3B2", "#2F6B3A"), 800, 1000, "demo/gallery-1.webp", "webp", 68);
  await raster(portrait("#E7EFE4", "#6E7F62"), 800, 1000, "demo/gallery-2.webp", "webp", 68);
  await raster(portrait("#F8E7E1", "#D9899A"), 800, 1000, "demo/gallery-3.webp", "webp", 68);
  console.log("assets ready");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
