import { test, expect } from "@playwright/test";

const slugs = [
  "royal-maroon-gold",
  "tamil-traditional",
  "floral-pastel",
  "minimal-ivory",
  "modern-sage",
  "south-indian-temple",
];

for (const slug of slugs) {
  test(`template ${slug} desktop`, async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto(`/preview/template/${slug}`);
    await expect(page.getByTestId("invitation")).toHaveAttribute("data-template", slug);
    await expect(page).toHaveScreenshot(`${slug}-desktop.png`, { maxDiffPixelRatio: 0.03 });
  });

  test(`template ${slug} mobile`, async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto(`/preview/template/${slug}`);
    await expect(page.getByTestId("invitation")).toBeVisible();
    await expect(page).toHaveScreenshot(`${slug}-mobile.png`, { maxDiffPixelRatio: 0.03 });
  });
}
