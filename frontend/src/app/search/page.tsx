"use client";
import { useState } from "react";
import { dummySamples } from "@/lib/dummyData";

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const [region, setRegion] = useState("");

  const results = dummySamples.filter((s) => {
    const matchesQuery = query ? s.readValue.includes(query) : true;
    const matchesRegion = region ? s.region === region : true;
    return matchesQuery && matchesRegion;
  });

  return (
    <div>
      <h1 className="text-xl font-semibold mb-4">Arama ve Filtreleme</h1>
      <div className="flex gap-3 mb-6">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Değer ara (örn. 1250)"
          className="border border-stone-300 rounded px-3 py-2 text-sm flex-1"
        />
        <select value={region} onChange={(e) => setRegion(e.target.value)} className="border border-stone-300 rounded px-3 py-2 text-sm">
          <option value="">Tüm Bölgeler</option>
          <option value="İstanbul">İstanbul</option>
          <option value="Bursa">Bursa</option>
          <option value="Edirne">Edirne</option>
        </select>
      </div>
      <div className="space-y-2">
        {results.map((s) => (
          <a key={s.id} href={`/samples/${s.id}`} className="flex items-center gap-3 border border-stone-200 rounded p-2 hover:bg-stone-50">
            <div className={`w-10 h-10 rounded ${s.thumbnailColor}`} />
            <div className="text-sm">
              <div className="font-medium">{s.readValue}</div>
              <div className="text-xs text-stone-500">{s.region} · {s.documentType}</div>
            </div>
          </a>
        ))}
        {results.length === 0 && <p className="text-sm text-stone-400">Sonuç bulunamadı.</p>}
      </div>
    </div>
  );
}
