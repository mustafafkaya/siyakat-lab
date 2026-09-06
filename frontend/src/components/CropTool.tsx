"use client";

/**
 * F7 · Kırpma / alan seçme aracı.
 *
 * Belge görseli üzerinde fare ile dikdörtgen alan seçtirir ve normalize edilmiş
 * (0..1) koordinatları üst bileşene bildirir. Gerçek görsel yoksa placeholder alan gösterir.
 * Koordinatlar normalize olduğu için görsel ölçeğinden bağımsızdır — backend'e
 * {x, y, width, height} olarak gider (schemas/sample.py: Coordinates ile uyumlu).
 */
import { useRef, useState } from "react";

export type CropRect = { x: number; y: number; width: number; height: number };

function clamp01(v: number) {
  return Math.max(0, Math.min(1, v));
}

export default function CropTool({
  imageSrc,
  onChange,
}: {
  imageSrc?: string;
  onChange?: (rect: CropRect | null) => void;
}) {
  const boxRef = useRef<HTMLDivElement>(null);
  const startRef = useRef<{ x: number; y: number } | null>(null);
  const [rect, setRect] = useState<CropRect | null>(null);
  const [drawing, setDrawing] = useState(false);

  function relPos(clientX: number, clientY: number) {
    const b = boxRef.current!.getBoundingClientRect();
    return { x: clamp01((clientX - b.left) / b.width), y: clamp01((clientY - b.top) / b.height) };
  }

  function rectFrom(a: { x: number; y: number }, b: { x: number; y: number }): CropRect {
    return {
      x: Math.min(a.x, b.x),
      y: Math.min(a.y, b.y),
      width: Math.abs(a.x - b.x),
      height: Math.abs(a.y - b.y),
    };
  }

  function onPointerDown(e: React.PointerEvent) {
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    const p = relPos(e.clientX, e.clientY);
    startRef.current = p;
    setDrawing(true);
    setRect({ x: p.x, y: p.y, width: 0, height: 0 });
  }

  function onPointerMove(e: React.PointerEvent) {
    if (!drawing || !startRef.current) return;
    setRect(rectFrom(startRef.current, relPos(e.clientX, e.clientY)));
  }

  function onPointerUp() {
    if (!drawing) return;
    setDrawing(false);
    const r = rect && rect.width > 0.01 && rect.height > 0.01 ? rect : null;
    setRect(r);
    onChange?.(r);
  }

  function reset() {
    setRect(null);
    startRef.current = null;
    onChange?.(null);
  }

  const pct = (n: number) => `${(n * 100).toFixed(2)}%`;

  return (
    <div>
      <div
        ref={boxRef}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        className="relative w-full select-none cursor-crosshair rounded border border-stone-300 overflow-hidden touch-none"
        style={{ aspectRatio: "3 / 2", background: "#f5f5f4" }}
      >
        {imageSrc ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={imageSrc} alt="Belge" draggable={false} className="pointer-events-none w-full h-full object-contain" />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-xs text-stone-400">
            Belge görseli — üzerinde fareyle rakam alanı seçin
          </div>
        )}

        {rect && (
          <div
            className="absolute border-2 border-amber-500 bg-amber-400/20 pointer-events-none"
            style={{ left: pct(rect.x), top: pct(rect.y), width: pct(rect.width), height: pct(rect.height) }}
          />
        )}
      </div>

      <div className="mt-2 flex items-center justify-between text-xs text-stone-500">
        <span>
          {rect
            ? `Seçim: x=${rect.x.toFixed(3)}, y=${rect.y.toFixed(3)}, g=${rect.width.toFixed(3)}, y=${rect.height.toFixed(3)}`
            : "Henüz alan seçilmedi"}
        </span>
        {rect && (
          <button type="button" onClick={reset} className="px-2 py-1 rounded bg-stone-100 hover:bg-stone-200">
            Temizle
          </button>
        )}
      </div>
    </div>
  );
}
