"use client";
import type { SampleFacets, SampleFilters } from "@/lib/api";
import { statusLabels, type VerificationStatus } from "@/lib/labels";

/**
 * F4 · Filtreleme çubuğu. Seçenekler `GET /samples/facets`ten gelir
 * (değer + sayı), yani veride olmayan seçenek gösterilmez.
 */
export default function FilterBar({
  facets,
  filters,
  onChange,
  showQuery = false,
}: {
  facets: SampleFacets | null;
  filters: SampleFilters;
  onChange: (next: SampleFilters) => void;
  showQuery?: boolean;
}) {
  const set = (key: keyof SampleFilters, value: string) =>
    onChange({ ...filters, [key]: value || undefined });

  const hasFilter = Boolean(
    filters.region || filters.century || filters.documentType || filters.verificationStatus || filters.query
  );

  const select = (
    key: keyof SampleFilters,
    all: string,
    items: { value: string; count: number }[] | undefined,
    label?: (v: string) => string
  ) => (
    <select
      value={(filters[key] as string) || ""}
      onChange={(e) => set(key, e.target.value)}
      className="border border-stone-300 rounded px-3 py-2 text-sm bg-white"
    >
      <option value="">{all}</option>
      {(items ?? []).map((it) => (
        <option key={it.value} value={it.value}>
          {(label ? label(it.value) : it.value)} ({it.count})
        </option>
      ))}
    </select>
  );

  return (
    <div className="flex flex-wrap gap-3 mb-6 items-center">
      {showQuery && (
        <input
          value={filters.query || ""}
          onChange={(e) => set("query", e.target.value)}
          placeholder="Değer / not ara (örn. 1250)"
          className="border border-stone-300 rounded px-3 py-2 text-sm flex-1 min-w-[200px]"
        />
      )}
      {select("region", "Tüm Bölgeler", facets?.regions)}
      {select("century", "Tüm Dönemler", facets?.centuries)}
      {select("documentType", "Tüm Belge Türleri", facets?.documentTypes)}
      {select(
        "verificationStatus",
        "Tüm Durumlar",
        facets?.verificationStatuses,
        (v) => statusLabels[v as VerificationStatus] ?? v
      )}
      {hasFilter && (
        <button
          onClick={() => onChange({})}
          className="text-sm text-stone-500 underline underline-offset-2 hover:text-stone-800"
        >
          Filtreleri temizle
        </button>
      )}
    </div>
  );
}
