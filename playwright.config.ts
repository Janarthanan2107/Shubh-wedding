import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "e2e",
  timeout: 120000,
  expect: { timeout: 15000 },
  fullyParallel: false,
  retries: 0,
  use: {
    baseURL: "http://127.0.0.1:3000",
    trace: "on-first-retry",
  },
  webServer: {
    command: "npm run dev",
    url: "http://127.0.0.1:3000",
    reuseExistingServer: true,
    timeout: 120000,
  },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"], viewport: { width: 1280, height: 800 } }, testIgnore: /mobile|visual/ },
    { name: "mobile", use: { ...devices["Desktop Chrome"], viewport: { width: 360, height: 800 } }, testMatch: /mobile/ },
    { name: "visual", use: { ...devices["Desktop Chrome"] }, testMatch: /visual/ },
  ],
});
