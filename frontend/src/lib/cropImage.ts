/**
 * E1 adım 4 · Tarayıcıda kırpma.
 *
 * CropTool normalize (0..1) bir dikdörtgen verir; backend `POST /samples`
 * ise gerçek bir `cropped_image` dosyası bekler. Burada kaynak görselin
 * TAM çözünürlüğünden o alan kesilip PNG blob üretilir.
 */

export type NormalizedRect = { x: number; y: number; width: number; height: number };

/** Bir data/blob URL'sini HTMLImageElement olarak yükler. */
export function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Görsel okunamadı"));
    img.src = src;
  });
}

/** Normalize dikdörtgeni kaynak görselden kesip blob döndürür. */
export async function cropToBlob(
  src: string,
  rect: NormalizedRect,
  type: string = "image/png"
): Promise<Blob> {
  const img = await loadImage(src);
  const nw = img.naturalWidth || img.width;
  const nh = img.naturalHeight || img.height;
  if (!nw || !nh) throw new Error("Görsel boyutu okunamadı");

  const sx = Math.min(Math.max(0, Math.round(rect.x * nw)), nw - 1);
  const sy = Math.min(Math.max(0, Math.round(rect.y * nh)), nh - 1);
  const w = Math.max(1, Math.min(Math.round(rect.width * nw), nw - sx));
  const h = Math.max(1, Math.min(Math.round(rect.height * nh), nh - sy));

  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Kırpma için canvas desteklenmiyor");
  ctx.drawImage(img, sx, sy, w, h, 0, 0, w, h);

  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("Kırpılan görsel oluşturulamadı"))),
      type
    );
  });
}

/** "belge.jpg" + kırpma -> "belge-kirpma.png" */
export function cropFileName(originalName: string): string {
  const base = (originalName || "belge").replace(/\.[^.]+$/, "");
  return `${base || "belge"}-kirpma.png`;
}
