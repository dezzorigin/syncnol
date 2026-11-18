// Landing: hero + preview produk + fitur + footer + tautan GitHub.
import { test, expect } from "@playwright/test";

test("landing: hero, preview terminal, fitur, footer, tautan GitHub", async ({ page }) => {
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: /your smart/i }),
  ).toBeVisible();
  await expect(page.getByText("J.A.R.V.I.S Co-Pilot online")).toBeVisible();
  for (const f of [
    "Executive Dashboard",
    "J.A.R.V.I.S Co-Pilot",
    "The Vault",
    "Wingman Protocol",
    "Zero-Friction Logging",
    "Smart Analytics",
  ]) {
    await expect(page.getByRole("heading", { name: f })).toBeVisible();
  }
  await expect(
    page.getByRole("link", { name: /github/i }).first(),
  ).toHaveAttribute("href", "https://github.com/dezzorigin/syncnol");
  await expect(page.getByText(/SyncNol\. Your money, your co-pilot\./)).toBeVisible();
  await expect(page.getByRole("link", { name: "Get Started" })).toBeVisible();
});
