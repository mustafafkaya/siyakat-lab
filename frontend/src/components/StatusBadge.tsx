import { statusLabels, statusStyles, type VerificationStatus } from "@/lib/labels";

export default function StatusBadge({
  status,
  className = "",
}: {
  status: VerificationStatus;
  className?: string;
}) {
  return (
    <span
      className={`inline-block text-[10px] px-2 py-0.5 rounded ${
        statusStyles[status] ?? "bg-stone-100 text-stone-600"
      } ${className}`}
    >
      {statusLabels[status] ?? status}
    </span>
  );
}
