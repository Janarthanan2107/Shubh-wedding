import { test, expect } from "@playwright/test";

test("planner sees several weddings and admin filters orders", async ({ page }) => {
  await page.goto("/login");
  await page.getByTestId("demo-login-planner").click();
  await expect(page).toHaveURL(/planner/);
  await expect(page.getByRole("heading", { name: /Raja/ })).toBeVisible();
  await expect(page.getByRole("heading", { name: /Ananya/ }).first()).toBeVisible();
  await page.goto("/login");
  await page.getByTestId("demo-login-admin").click();
  await expect(page).toHaveURL(/admin/);
  await page.getByRole("link", { name: "Orders" }).click();
  await page.getByLabel("Status").selectOption("failed");
  await expect(page.getByText("SHB-DEMO-FAIL")).toBeVisible();
  await page.goto("/admin/templates");
  await expect(page.getByTestId("admin-templates")).toBeVisible();
});
