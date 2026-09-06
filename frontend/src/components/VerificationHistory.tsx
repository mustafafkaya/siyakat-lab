/**
 * F12 · Doğrulama / değişiklik geçmişi görünümü (audit timeline).
 *
 * Backend B11 (verification_history) tablosunun frontend karşılığı: kim / ne / ne zaman / not.
 * Sunum bileşeni (hook yok) — örnek detay sayfasında render edilir.
 * E1: veri GET /verification/{id}/history ucundan gelir.
 */
import { statusLabels, type HistoryEntry } from "@/lib/labels";

function fmt(iso: string) {
  return new Date(iso).toLocaleString("tr-TR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function label(field: string, value: string | null) {
  if (value === null) return "—";
  if (field === "verification_status" || field === "created") {
    return statusLabels[value as keyof typeof statusLabels] ?? value;
  }
  return value;
}

const fieldLabels: Record<string, string> = {
  created: "Oluşturuldu",
  verification_status: "Durum",
  read_value: "Okunan Değer",
  variant_type: "Varyant/Tip",
  expert_note: "Uzman Notu",
};

/** E1 adım 5: backend `changedByName` döndürür; yoksa kısaltılmış id'ye düşülür. */
function who(e: HistoryEntry): string {
  if (e.changedByName) return e.changedByName;
  if (e.changedBy) return `Kullanıcı #${String(e.changedBy).slice(0, 8)}`;
  return "—";
}

export default function VerificationHistory({ entries }: { entries: HistoryEntry[] }) {
  if (!entries || entries.length === 0) {
    return <p className="text-sm text-stone-400">Bu örnek için henüz geçmiş kaydı yok.</p>;
  }

  // en yeni üstte
  const sorted = [...entries].sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  return (
    <ol className="relative border-l border-stone-200 ml-2">
      {sorted.map((e) => (
        <li key={e.id} className="mb-5 ml-4">
          <span className="absolute -left-1.5 w-3 h-3 rounded-full bg-amber-400 border border-white" />
          <div className="text-xs text-stone-400">{fmt(e.createdAt)}</div>
          <div className="text-sm">
            <span className="font-medium">{who(e)}</span>{" "}
            <span className="text-stone-500">
              — {fieldLabels[e.fieldChanged] ?? e.fieldChanged}
            </span>
          </div>
          {e.fieldChanged !== "created" && (
            <div className="text-xs text-stone-500 mt-0.5">
              {label(e.fieldChanged, e.oldValue)} <span className="text-stone-300">→</span>{" "}
              <span className="text-stone-700">{label(e.fieldChanged, e.newValue)}</span>
            </div>
          )}
          {e.note && <div className="text-xs text-stone-600 mt-1 italic">“{e.note}”</div>}
        </li>
      ))}
    </ol>
  );
}
