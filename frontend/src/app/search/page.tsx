"use client";
import Link from "next/link";
import FilterBar from "@/components/FilterBar";
import SampleThumb from "@/components/SampleThumb";
import StatusBadge from "@/components/StatusBadge";
import { useSamples } from "@/lib/useSamples";

export default function SearchPage() {
  const { filters, setFilters, samples, facets, loading, error, reload } = useSamples();

  return (
    <div>
      <div className="flex items-baseline justify-between mb-4">
        <h1 className="text-xl font-semibold">Arama ve Filtreleme</h1>
        {facets && !loading && (
          <span className="text-xs text-stone-500">{samples.length} sonuç</span>
        )}
      </div>

      <FilterBar facets={facets} filters={filters} onChange={setFilters} showQuery />

      {error && (
        <div className="border border-red-200 bg-red-50 text-red-700 text-sm rounded p-3 mb-4">
          {error}{" "}
          <button onClick={reload} className="underline underline-offset-2">
            Tekrar dene
          </button>
        </div>
      )}

      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-14 border border-stone-200 rounded animate-pulse bg-stone-50" />
          ))}
        </div>
      ) : samples.length === 0 ? (
        <p className="text-sm text-stone-400">Sonuç bulunamadı.</p>
      ) : (
        <div className="space-y-2">
          {samples.map((s) => (
            <Link
              key={s.id}
              href={`/samples/${s.id}`}
              className="flex items-center gap-3 border border-stone-200 rounded p-2 hover:bg-stone-50"
            >
              <div className="w-12 shrink-0">
                <SampleThumb url={s.croppedImageUrl} alt={s.readValue ?? undefined} className="h-12" />
              </div>
              <div className="text-sm flex-1 min-w-0">
                <div className="font-medium truncate">{s.readValue || "— okunmamış —"}</div>
                <div className="text-xs text-stone-500 truncate">
                  {[s.region, s.century, s.documentType].filter(Boolean).join(" · ") ||
                    "belge bilgisi yok"}
                </div>
              </div>
              <StatusBadge status={s.verificationStatus} />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
