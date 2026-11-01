import { test, expect } from "@playwright/test";

test("couple creates a wedding, edits, pays, publishes and collects an RSVP", async ({ page }) => {
  const stamp = Date.now().toString().slice(-6);
  const groom = `Arun${stamp}`;
  const bride = `Diya${stamp}`;
  await page.goto("/login");
  await page.getByTestId("demo-login-couple").click();
  await expect(page).toHaveURL(/dashboard/);
  await page.getByTestId("nav-new-wedding").click();
  // Typing before the wizard hydrates leaves React state empty, so wait for the page to settle.
  await page.waitForLoadState("networkidle");
  await page.getByTestId("wizard-groom").fill(groom);
  await page.getByTestId("wizard-bride").fill(bride);
  await page.getByTestId("wizard-date").fill("2026-12-20");
  await page.getByTestId("wizard-city").fill("Chennai");
  await page.getByTestId("wizard-state").fill("Tamil Nadu");
  await page.getByTestId("wizard-next").click();
  await page.getByTestId("event-add").click();
  await page.getByTestId("wizard-next").click();
  const venue = page.getByPlaceholder("Venue");
  const address = page.getByPlaceholder("Address");
  const count = await venue.count();
  for (let i = 0; i < count; i += 1) {
    await venue.nth(i).fill("Demo Mahal");
    await address.nth(i).fill("Cathedral Road");
  }
  await page.getByTestId("wizard-next").click();
  await page.getByTestId("wizard-next").click();
  await page.getByTestId("motif-neutral").click();
  await page.getByTestId("template-card-floral-pastel").click();
  await expect(page.getByTestId("premium-gate")).toBeVisible();
  await page.getByTestId("template-card-royal-maroon-gold").click();
  await page.getByTestId("wizard-next").click();
  await page.getByTestId("wizard-create").click();
  await expect(page).toHaveURL(/editor/);
  await page.waitForLoadState("networkidle");
  await page.getByTestId("palette-quote").click();
  await page.getByTestId("layer-up").first().click();
  await page.getByTestId("duplicate-section").click();
  await page.getByTestId("hide-section").click();
  await page.getByTestId("lock-section").click();
  await page.getByTestId("undo").click();
  await page.keyboard.press("Control+Z");
  await page.getByTestId("prop-font-size").fill("28");
  await expect(page.getByTestId("save-status")).toHaveText(/saved|saving/i, { timeout: 10000 });
  await page.reload();
  await expect(page.getByTestId("invitation")).toBeVisible();
  await page.getByTestId("version-snapshot").click();
  await page.getByRole("link", { name: "Plan" }).click();
  await page.waitForLoadState("networkidle");
  await page.getByTestId("checkout-failed").click();
  await expect(page.getByTestId("receipt")).toContainText("locked");
  await page.getByTestId("checkout-pending").click();
  await expect(page.getByTestId("receipt")).toContainText("locked");
  await page.getByTestId("checkout-success").click();
  await expect(page.getByTestId("receipt")).toContainText("unlocked");
  // Publishing shows the link, then reloads the page; read the link first and wait for the
  // reload so the next goto is not aborted.
  const reloaded = page.waitForEvent("load");
  await page.getByTestId("publish").click();
  await expect(page.getByText(/Published/)).toBeVisible();
  const published = page.getByText(/\/w\//);
  const text = await published.textContent();
  const slug = text?.split("/w/")[1]?.trim();
  expect(slug).toBeTruthy();
  await reloaded;
  await page.goto(`/w/${slug}`);
  await page.waitForLoadState("networkidle");
  await expect(page.getByRole("heading", { name: new RegExp(groom) })).toBeVisible();
  await page.getByTestId("rsvp-attending").click();
  await page.getByTestId("rsvp-name").fill("Guest " + stamp);
  await page.getByTestId("public-rsvp").getByRole("button", { name: /Send reply|பதில்|उत्तर/ }).click();
  await expect(page.getByTestId("rsvp-thanks")).toBeVisible();
  await page.goto("/dashboard");
  await page.getByRole("link", { name: "RSVP" }).first().click();
  await expect(page.getByText("Guest " + stamp).or(page.getByText(/Attending/))).toBeVisible();
});
