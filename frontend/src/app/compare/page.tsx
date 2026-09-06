"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import SampleThumb from "@/components/SampleThumb";
import StatusBadge from "@/components/StatusBadge";
import FilterBar from "@/components/FilterBar";
import { compareSamples, type Sample } from "@/lib/api";
import { useSamples } from "@/lib/useSamples";

const MAX_SELECTION = 6;

export default function ComparePage() {
  const { filters, setFilters, samples, facets, loading, error } = useSamples();
  const [selected, setSelected] = useState<string[]>([]);
  const [compared, setCompared] = useState<Sample[]>([]);
  const [cmpLoading, setCmpLoading] = useState(false);
  const [cmpError, setCmpError] = useState<string | null>(null);

  const toggle = (id: string) =>
    setSelected((prev) =>
      prev.includes(id)
        ? prev.filter((x) => x !== id)
        : prev.length >= MAX_SELECTION
        ? prev
        : [...prev, id]
    );

  // Seçim 2+ olunca backend'in karşılaştırma ucundan tam kayıtları çek.
  useEffect(() => {
    if (selected.length < 2) {
      setCompared([]);
      setCmpError(null);
      return;
    }
    let active = true;
    setCmpLoading(true);
    compareSamples(selected)
      .then((rows) => {
        if (!active) return;
        // seçim sırasını koru
        const byId = new Map(rows.map((r) => [r.id, r]));
        setCompared(selected.map((id) => byId.get(id)).filter(Boolean) as Sample[]);
        setCmpError(null);
      })
      .catch((e: any) => active && setCmpError(e?.message || "Karşılaştırma alınamadı"))
      .finally(() => active && setCmpLoading(false));
    return () => {
      active = false;
    };
  }, [selected]);

  const rows: { label: string; get: (s: Sample) => string }[] = [
    { label: "Okunan Değer", get: (s) => s.readValue || "—" },
    { label: "Bölge", get: (s) => s.region || "—" },
    { label: "Dönem", get: (s) => s.century || "—" },
    { label: "Belge Türü", get: (s) => s.documentType || "—" },
    { label: "Varyant / Tip", get: (s) => s.variantType || "—" },
    { label: "Arşiv Referansı", get: (s) => s.archiveRef || "—" },
    { label: "Tarih (metin)", get: (s) => s.dateText || "—" },
  ];

  return (
    <div>
      <h1 className="text-xl font-semibold mb-4">Karşılaştırma</h1>
      <p className="text-sm text-stone-500 mb-4">
        En az iki örnek seçin (en çok {MAX_SELECTION}).
      </p>

      <FilterBar facets={facets} filters={filters} onChange={setFilters} showQuery />

      {error && (
        <div className="border border-red-200 bg-red-50 text-red-700 text-sm rounded p-3 mb-4">
          {error}
        </div>
      )}

      {loading ? (
        <p className="text-sm text-stone-400 mb-6">Örnekler yükleniyor…</p>
      ) : samples.length === 0 ? (
        <p className="text-sm text-stone-400 mb-6">Seçilebilecek örnek yok.</p>
      ) : (
        <div className="flex flex-wrap gap-2 mb-6">
          {samples.map((s) => {
            const on = selected.includes(s.id);
            return (
              <button
                key={s.id}
                onClick={() => toggle(s.id)}
                disabled={!on && selected.length >= MAX_SELECTION}
                className={`px-3 py-1.5 rounded text-sm border disabled:opacity-40 ${
                  on ? "bg-stone-900 text-white border-stone-900" : "border-stone-300"
                }`}
              >
                {s.readValue || "—"}
                <span className={`ml-1 text-[10px] ${on ? "text-stone-300" : "text-stone-400"}`}>
                  {s.region || ""}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {cmpError && (
        <div className="border border-red-200 bg-red-50 text-red-700 text-sm rounded p-3 mb-4">
          {cmpError}
        </div>
      )}

      {selected.length >= 2 && cmpLoading && (
        <p className="text-sm text-stone-400">Karşılaştırma yükleniyor…</p>
      )}

      {compared.length >= 2 && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
            {compared.map((s) => (
              <div key={s.id} className="border border-stone-200 rounded p-3">
                <SampleThumb url={s.croppedImageUrl} alt={s.readValue ?? undefined} className="h-28" />
                <div className="text-sm font-medium mt-2">{s.readValue || "—"}</div>
                <div className="text-xs text-stone-500">
                  {[s.region, s.century].filter(Boolean).join(" · ") || "—"}
                </div>
                <div className="mt-1 flex items-center justify-between">
                  <StatusBadge status={s.verificationStatus} />
                  <Link href={`/samples/${s.id}`} className="text-[11px] underline text-stone-500">
                    detay
                  </Link>
                </div>
              </div>
            ))}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm border border-stone-200 rounded">
              <thead>
                <tr className="bg-stone-50">
                  <th className="text-left font-medium text-stone-500 px-3 py-2 w-40">Alan</th>
                  {compared.map((s) => (
                    <th key={s.id} className="text-left font-medium px-3 py-2">
                      {s.readValue || "—"}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => {
                  const values = compared.map(r.get);
                  const allSame = values.every((v) => v === values[0]);
                  return (
                    <tr key={r.label} className="border-t border-stone-200">
                      <td className="px-3 py-2 text-stone-500">{r.label}</td>
                      {values.map((v, i) => (
                        <td
                          key={i}
                          className={`px-3 py-2 ${allSame ? "" : "bg-amber-50/60"}`}
                        >
                          {v}
                        </td>
                      ))}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <p className="text-xs text-stone-400 mt-2">
            Sarı hücreler: örnekler arasında farklılık gösteren alanlar.
          </p>
        </>
      )}
    </div>
  );
}
