// Playwright config — e2e mode demo SyncNol.
// Base URL disajikan vite preview (CI) atau `npm run preview` lokal di 4173.
import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  timeout: 60 * 1000,
  expect: { timeout: 15 * 1000 },
  fullyParallel: true,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? "line" : "list",
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL || "http://127.0.0.1:4173",
    trace: "retain-on-failure",
  },
  // Lokal (VM ini): pakai Chromium cache Playwright yang sudah ada —
  // unduhan browser Playwright diblokir gateway egress. Di CI, env ini
  // tidak diset sehingga Playwright memakai browser hasil `npx playwright
  // install chromium`.
  projects: [
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
        ...(process.env.PLAYWRIGHT_CHROMIUM_PATH
          ? { launchOptions: { executablePath: process.env.PLAYWRIGHT_CHROMIUM_PATH } }
          : {}),
      },
    },
  ],
  webServer: process.env.PLAYWRIGHT_BASE_URL
    ? undefined
    : {
        command: "npx vite preview --port 4173 --strictPort --host 127.0.0.1",
        url: "http://127.0.0.1:4173/",
        reuseExistingServer: true,
        timeout: 60 * 1000,
      },
});
