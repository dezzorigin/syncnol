// Alur demo end-to-end (tanpa Supabase & backend):
// masuk demo -> dashboard seed -> chat J.A.R.V.I.S mencatat transaksi ->
// Wingman bagi tagihan -> Analytics menampilkan transaksi -> Planner goals.
import { test, expect } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.goto("/auth");
  await page.getByRole("button", { name: "Coba Mode Demo" }).click();
  await expect(page).toHaveURL(/\/app\/dashboard/);
});

test("dashboard: data seed ter-render (kekayaan, utang, grafik)", async ({ page }) => {
  await expect(page.getByText(/total kekayaan/i)).toBeVisible();
  await expect(page.getByText("Grafik Kekayaan")).toBeVisible();
  await expect(page.getByText("Total Utang")).toBeVisible();
  await expect(page.getByText("4.650.000")).toBeVisible();
  await expect(page.getByText("Batas Jajan Harian")).toBeVisible();
});

test("jarvis: 'beli kopi 22 ribu' tercatat sebagai Pengeluaran Makan", async ({ page }) => {
  await page.getByPlaceholder(/Catat pengeluaran/).fill("beli kopi 22 ribu");
  await page.keyboard.press("Enter");
  await expect(page.locator("main")).toContainText(
    "Tercatat: Pengeluaran Rp 22.000 (Makan)",
  );
});

test("wingman: bagi 124800 berempat = 31.200 per orang + QR", async ({ page }) => {
  await page.goto("/app/wingman");
  await page.getByPlaceholder(/Makan malam/).fill("Makan malam Kemang");
  await page.getByPlaceholder("124800").fill("124800");
  await page.getByPlaceholder(/Nabil, Najwa/).fill("Nabil, Najwa, Rafid, Raisa");
  await page.getByRole("button", { name: "Bagi Tagihan" }).click();
  await expect(page.locator("main")).toContainText("Makan malam Kemang");
  await expect(page.locator("main")).toContainText("Rp 31.200");
  // Membuat split langsung membuka modal bagikan (openSplitId diset saat
  // create) — tidak perlu mengetuk tombol "Bagikan" lagi.
  await expect(page.locator("main")).toContainText("Bagikan — Makan malam Kemang");
  // QR code react-qr-code merender <svg> 180x180 di dalam modal bagikan.
  await expect(page.locator('svg[width="180"]')).toBeVisible();
});

test("analytics + planner: transaksi & goals seed tampil", async ({ page }) => {
  await page.goto("/app/analytics");
  await expect(page.locator("main")).toContainText("Spotify");
  await page.goto("/app/planner");
  await expect(page.getByText("Dana Darurat")).toBeVisible();
  await expect(page.getByText("MacBook Pro")).toBeVisible();
});
