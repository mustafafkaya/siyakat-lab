import Link from "next/link";
import SampleThumb from "./SampleThumb";
import StatusBadge from "./StatusBadge";
import type { Sample } from "@/lib/api";

export default function SampleCard({ sample }: { sample: Sample }) {
  const meta = [sample.region, sample.century].filter(Boolean).join(" · ");
  return (
    <Link
      href={`/samples/${sample.id}`}
      className="border border-stone-200 rounded p-3 hover:shadow-sm block"
    >
      <SampleThumb url={sample.croppedImageUrl} alt={sample.readValue ?? undefined} />
      <div className="text-sm font-medium mt-2">{sample.readValue || "— okunmamış —"}</div>
      <div className="text-xs text-stone-500">{meta || "belge bilgisi yok"}</div>
      <StatusBadge status={sample.verificationStatus} className="mt-1" />
    </Link>
  );
}
