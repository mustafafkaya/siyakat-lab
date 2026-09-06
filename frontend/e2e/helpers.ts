import zlib from "zlib";
import { Page, expect } from "@playwright/test";

export const API = process.env.E2E_API_URL || "http://127.0.0.1:8000/api/v1";

/** seed_demo.py ile aynı hesaplar. */
export const USERS = {
  admin: { email: "admin@siyakat-lab.com", password: "admin1234", name: "Sistem Yöneticisi" },
  expert: { email: "uzman@siyakat-lab.com", password: "uzman1234", name: "Uzman Demo" },
  user: { email: "katilimci@siyakat-lab.com", password: "katilimci1234", name: "Katılımcı Demo" },
};

export async function login(page: Page, who: keyof typeof USERS) {
  const u = USERS[who];
  await page.goto("/login");
  await page.locator("input[type=email]").fill(u.email);
  await page.locator("input[type=password]").fill(u.password);
  await page.locator("button[type=submit]").click();
  await expect(page.locator("nav")).toContainText(u.name, { timeout: 15_000 });
}

export async function logout(page: Page) {
  await page.evaluate(() => localStorage.clear());
}

/**
 * Testte kullanılacak belge görselini kod ile üretir (repoda binary fixture tutmamak için).
 * 600×400 RGB PNG; ortasında koyu bir "rakam alanı" dikdörtgeni var.
 */
export function pageImage(): { name: string; mimeType: string; buffer: Buffer } {
  const W = 600;
  const H = 400;
  const raw = Buffer.alloc((W * 3 + 1) * H);
  for (let y = 0; y < H; y++) {
    const off = y * (W * 3 + 1);
    raw[off] = 0; // filter type
    for (let x = 0; x < W; x++) {
      const i = off + 1 + x * 3;
      const inBox = x > 150 && x < 450 && y > 150 && y < 250;
      raw[i] = inBox ? 60 : 245;
      raw[i + 1] = inBox ? 45 : 240;
      raw[i + 2] = inBox ? 30 : 228;
    }
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(W, 0);
  ihdr.writeUInt32BE(H, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 2; // color type: truecolor
  const png = Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    pngChunk("IHDR", ihdr),
    pngChunk("IDAT", zlib.deflateSync(raw)),
    pngChunk("IEND", Buffer.alloc(0)),
  ]);
  return { name: "belge.png", mimeType: "image/png", buffer: png };
}

function pngChunk(type: string, data: Buffer): Buffer {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const typeAndData = Buffer.concat([Buffer.from(type), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(typeAndData));
  return Buffer.concat([len, typeAndData, crc]);
}

function crc32(buf: Buffer): number {
  let crc = 0xffffffff;
  for (let n = 0; n < buf.length; n++) {
    let c = (crc ^ buf[n]) & 0xff;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    crc = c ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

/** CropTool üzerinde fareyle dikdörtgen seçer (kutunun ortasından %25–%75). */
export async function dragCrop(page: Page) {
  const box = page.locator(".cursor-crosshair").first();
  await expect(box).toBeVisible();
  const b = (await box.boundingBox())!;
  await page.mouse.move(b.x + b.width * 0.25, b.y + b.height * 0.25);
  await page.mouse.down();
  await page.mouse.move(b.x + b.width * 0.75, b.y + b.height * 0.75, { steps: 8 });
  await page.mouse.up();
  await expect(page.getByText(/Seçim: x=/)).toBeVisible();
}
