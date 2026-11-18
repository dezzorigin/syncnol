// Auth + onboarding akun baru (mode demo): daftar -> masuk ->
// onboarding 3 langkah -> dashboard.
// Catatan: <label> di AuthPage tidak terasosiasi dengan <input> (tanpa
// for/id), jadi isi form lewat placeholder, bukan getByLabel.
import { test, expect } from "@playwright/test";

test("signup baru -> onboarding -> dashboard", async ({ page }) => {
  const email = `e2e-${Date.now()}@syncnol.id`;
  await page.goto("/auth");
  await page.getByRole("button", { name: "Sign Up" }).click();
  await page.getByPlaceholder("agent@syncnol.io").fill(email);
  await page.getByPlaceholder("••••••••••").fill("demo1234");
  await page.locator("input[type='checkbox']").check();
  await page.getByRole("button", { name: "Create Account" }).click();
  await expect(page.locator("body")).toContainText("Account created!");
  await page.getByRole("button", { name: "Sign In" }).click();
  await page.getByPlaceholder("agent@syncnol.io").fill(email);
  await page.getByPlaceholder("••••••••••").fill("demo1234");
  await page.getByRole("button", { name: "Enter Command Center" }).click();
  await expect(page).toHaveURL("/onboarding");
  await page.locator("input").first().fill("E2E Agent");
  await page.getByRole("button", { name: "Next Step" }).click();
  await page.locator("input[type='number']").fill("7500000");
  await page.getByRole("button", { name: "Next Step" }).click();
  await page.getByRole("button", { name: /Kill My Debt/ }).click();
  await page.getByRole("button", { name: "Launch Command Center" }).click();
  await expect(page).toHaveURL(/\/app\/dashboard/);
  await expect(page.locator("main")).toContainText("Total Kekayaan");
});

test("login salah menampilkan pesan error", async ({ page }) => {
  await page.goto("/auth");
  await page.getByPlaceholder("agent@syncnol.io").fill("tidak-ada@syncnol.id");
  await page.getByPlaceholder("••••••••••").fill("salah123");
  await page.getByRole("button", { name: "Enter Command Center" }).click();
  await expect(page.locator("body")).toContainText("Email atau kata sandi salah");
});
