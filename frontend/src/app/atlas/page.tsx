"use client";
import Link from "next/link";
import FilterBar from "@/components/FilterBar";
import SampleCard from "@/components/SampleCard";
import { useSamples } from "@/lib/useSamples";

export default function AtlasPage() {
  const { filters, setFilters, samples, facets, loading, error, reload } = useSamples();

  return (
    <div>
      <div className="flex items-baseline justify-between mb-4">
        <h1 className="text-xl font-semibold">Atlas</h1>
        {facets && (
          <span className="text-xs text-stone-500">
            {samples.length} / {facets.total} örnek
          </span>
        )}
      </div>

      <FilterBar facets={facets} filters={filters} onChange={setFilters} />

      {error && (
        <div className="border border-red-200 bg-red-50 text-red-700 text-sm rounded p-3 mb-4">
          {error}{" "}
          <button onClick={reload} className="underline underline-offset-2">
            Tekrar dene
          </button>
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="border border-stone-200 rounded p-3 animate-pulse">
              <div className="h-24 rounded bg-stone-100" />
              <div className="h-3 w-16 bg-stone-100 rounded mt-3" />
              <div className="h-3 w-24 bg-stone-100 rounded mt-2" />
            </div>
          ))}
        </div>
      ) : samples.length === 0 ? (
        <div className="border border-dashed border-stone-300 rounded p-8 text-center text-sm text-stone-500">
          {error ? (
            "Örnekler yüklenemedi."
          ) : (
            <>
              Bu filtrelerle örnek bulunamadı.{" "}
              <Link href="/upload" className="underline underline-offset-2">
                Yeni örnek ekle
              </Link>
            </>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {samples.map((s) => (
            <SampleCard key={s.id} sample={s} />
          ))}
        </div>
      )}
    </div>
  );
}
