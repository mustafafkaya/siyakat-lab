import { test, expect } from "@playwright/test";
import { API, USERS, dragCrop, login, logout, pageImage } from "./helpers";

/**
 * E2 · Uçtan uca akış: yükle → kırp → kaydet (taslak) → incelemeye gönder →
 * uzman onaylar → geçmiş isimli görünür → CSV export içinde çıkar.
 *
 * Ön koşul: backend ayakta + `python -m scripts.seed_demo` çalıştırılmış.
 */
const READ_VALUE = `E2E-${Date.now()}`;
const REGION = "Erzurum";

test.describe.configure({ mode: "serial" });

test("katılımcı belge yükler, alan seçer ve taslak örnek kaydeder", async ({ page }) => {
  await login(page, "user");
  await page.goto("/upload");

  // 1) Belge
  await page.locator("#f-document-file").setInputFiles(pageImage());
  await page.getByRole("button", { name: "İleri" }).click();

  // 2) Kırpma
  await dragCrop(page);
  await page.getByRole("button", { name: "İleri" }).click();

  // 3) Bilgiler (etiketle seçilebiliyor — a11y)
  await page.getByLabel("Okunan Değer").fill(READ_VALUE);
  await page.getByLabel("Bölge").fill(REGION);
  await page.getByLabel("Dönem/Yüzyıl").fill("12. yy (H.)");
  await page.getByLabel("Belge Türü").fill("Tereke Defteri");
  await page.getByRole("button", { name: "İleri" }).click();

  // 4) Kaydet
  await page.getByRole("button", { name: /Kaydet/ }).click();
  await expect(page.getByText(/Kaydedildi|Örneği aç/)).toBeVisible({ timeout: 20_000 });
  await expect(page.getByText("Taslak", { exact: true })).toBeVisible();
});

test("örnek atlasta görünür ve incelemeye gönderilir", async ({ page }) => {
  await login(page, "user");
  await page.goto("/search");
  await page.locator("input").first().fill(READ_VALUE);
  await expect(page.getByText(READ_VALUE).first()).toBeVisible({ timeout: 15_000 });

  await page.getByText(READ_VALUE).first().click();
  await expect(page.getByRole("heading", { name: new RegExp(READ_VALUE) })).toBeVisible();

  await page.getByRole("button", { name: "İncelemeye Gönder" }).click();
  await expect(page.getByText("İnceleme Bekliyor").first()).toBeVisible({ timeout: 15_000 });
  await expect(page.getByRole("button", { name: "İncelemeye Gönder" })).toHaveCount(0);
});

test("uzman kuyruktan örneği onaylar, geçmişte isimler görünür", async ({ page }) => {
  await login(page, "expert");
  await page.goto("/admin");
  await expect(page.getByText(READ_VALUE).first()).toBeVisible({ timeout: 15_000 });

  const row = page.locator("div").filter({ hasText: READ_VALUE }).last();
  await page.getByRole("button", { name: "İncele", exact: true }).first().click();
  await page.getByLabel("Uzman Notu").or(page.locator("textarea")).first().fill("E2E: tereke defteriyle doğrulandı.");
  await page.getByRole("button", { name: "Onayla" }).first().click();
  await expect(page.getByText(READ_VALUE)).toHaveCount(0, { timeout: 15_000 });

  // "Doğrulandı" sekmesinde olmalı
  await page.getByRole("button", { name: /^Doğrulandı/ }).click();
  await expect(page.getByText(READ_VALUE).first()).toBeVisible({ timeout: 15_000 });

  // Detay: geçmişte UUID değil, kullanıcı adları
  await page.getByRole("link", { name: "Detay" }).first().click();
  const body = page.locator("body");
  await expect(body).toContainText(USERS.expert.name, { timeout: 15_000 });
  await expect(body).toContainText(USERS.user.name);
  await expect(body).not.toContainText("Kullanıcı #");
  await expect(body).toContainText("E2E: tereke defteriyle doğrulandı.");
});

test("CSV export onaylanan örneği içerir", async ({ request }) => {
  const res = await request.get(`${API}/export/samples?format=csv&region=${encodeURIComponent(REGION)}`);
  expect(res.status()).toBe(200);
  const csv = await res.text();
  expect(csv).toContain(READ_VALUE);
  expect(csv).toContain("verified");
});

test("sıradan kullanıcı onay/ret kararı veremez (403)", async ({ page, request }) => {
  await login(page, "user");
  const token = await page.evaluate(() => localStorage.getItem("siyakat_token"));
  const list = await request.get(`${API}/samples?query=${encodeURIComponent(READ_VALUE)}`);
  const sampleId = (await list.json())[0].id;
  const res = await request.patch(`${API}/samples/${sampleId}`, {
    headers: { Authorization: `Bearer ${token}` },
    data: { verification_status: "rejected" },
  });
  expect(res.status()).toBe(403);
  await logout(page);
});
