"use client";
import { useState } from "react";
import { dummySamples } from "@/lib/dummyData";

export default function ComparePage() {
  const [selected, setSelected] = useState<string[]>([]);

  const toggle = (id: string) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const selectedSamples = dummySamples.filter((s) => selected.includes(s.id));

  return (
    <div>
      <h1 className="text-xl font-semibold mb-4">Karşılaştırma</h1>
      <p className="text-sm text-stone-500 mb-4">En az iki örnek seçin.</p>

      <div className="flex flex-wrap gap-2 mb-6">
        {dummySamples.map((s) => (
          <button
            key={s.id}
            onClick={() => toggle(s.id)}
            className={`px-3 py-1.5 rounded text-sm border ${
              selected.includes(s.id) ? "bg-stone-900 text-white border-stone-900" : "border-stone-300"
            }`}
          >
            {s.readValue}
          </button>
        ))}
      </div>

      {selectedSamples.length >= 2 && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {selectedSamples.map((s) => (
            <div key={s.id} className="border border-stone-200 rounded p-3">
              <div className={`h-24 rounded mb-2 ${s.thumbnailColor}`} />
              <div className="text-sm font-medium">{s.readValue}</div>
              <div className="text-xs text-stone-500">{s.region} · {s.century}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
