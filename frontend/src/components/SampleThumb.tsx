"use client";
import { useState } from "react";
import { assetUrl } from "@/lib/api";

/**
 * Örnek görseli. Gerçek kırpılmış görsel varsa onu, yoksa (ya da yüklenemezse)
 * nötr bir yer tutucu gösterir. Dummy dönemindeki `thumbnailColor` bunun yerini aldı.
 */
export default function SampleThumb({
  url,
  alt,
  className = "h-24",
}: {
  url?: string | null;
  alt?: string;
  className?: string;
}) {
  const [failed, setFailed] = useState(false);
  const src = assetUrl(url);

  if (!src || failed) {
    return (
      <div
        className={`${className} w-full rounded bg-stone-100 border border-stone-200 flex items-center justify-center text-[10px] text-stone-400`}
      >
        görsel yok
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt || "siyakat örneği"}
      onError={() => setFailed(true)}
      className={`${className} w-full rounded object-contain bg-stone-50 border border-stone-200`}
    />
  );
}
