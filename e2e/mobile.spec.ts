import { test, expect } from "@playwright/test";

test("landing and a published invitation fit a 360px screen", async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 800 });
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Your Wedding, Beautifully Told." })).toBeVisible();
  await page.goto("/w/raja-weds-rani");
  await expect(page.getByTestId("invitation")).toBeVisible();
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 2);
  expect(overflow).toBe(true);
});
