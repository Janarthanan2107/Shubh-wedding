import { chromium } from "playwright";
import sharp from "sharp";
import fs from "fs/promises";
import path from "path";

const slugs = [
  "royal-maroon-gold",
  "tamil-traditional",
  "floral-pastel",
  "minimal-ivory",
  "modern-sage",
  "south-indian-temple",
];

async function shot(page: Awaited<ReturnType<Awaited<ReturnType<typeof chromium.launch>>["newPage"]>>, slug: string, width: number, height: number, file: string) {
  await page.setViewportSize({ width, height });
  await page.goto(`http://127.0.0.1:3000/preview/template/${slug}`, { waitUntil: "networkidle" });
  const png = await page.screenshot({ fullPage: true });
  const webp = await sharp(png).resize(width, height, { fit: "cover" }).webp({ quality: 70 }).toBuffer();
  await fs.writeFile(path.join("public", "templates", slug, file), webp);
}

async function main() {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  for (const slug of slugs) {
    await shot(page, slug, 1440, 900, "preview-desktop.webp");
    await shot(page, slug, 390, 844, "preview-mobile.webp");
    await page.setViewportSize({ width: 600, height: 800 });
    await page.goto(`http://127.0.0.1:3000/preview/template/${slug}`, { waitUntil: "networkidle" });
    const png = await page.screenshot({ clip: { x: 0, y: 0, width: 600, height: 800 } });
    await fs.writeFile(path.join("public", "templates", slug, "thumb.webp"), await sharp(png).webp({ quality: 70 }).toBuffer());
    console.log(slug);
  }
  await browser.close();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
