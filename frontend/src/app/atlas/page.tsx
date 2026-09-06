import { dummySamples } from "@/lib/dummyData";

export default function AtlasPage() {
  return (
    <div>
      <h1 className="text-xl font-semibold mb-4">Atlas</h1>
      <p className="text-sm text-stone-500 mb-6">
        Şu an gösterilen örnekler sahte (dummy) verilerdir — gerçek arşiv verisi eklendiğinde
        bu grid otomatik olarak API'den beslenecektir.
      </p>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        {dummySamples.map((s) => (
          <a key={s.id} href={`/samples/${s.id}`} className="border border-stone-200 rounded p-3 hover:shadow-sm">
            <div className={`h-24 rounded mb-2 ${s.thumbnailColor}`} />
            <div className="text-sm font-medium">{s.readValue}</div>
            <div className="text-xs text-stone-500">{s.region} · {s.century}</div>
            <span className="inline-block mt-1 text-[10px] px-2 py-0.5 rounded bg-stone-100">
              {s.verificationStatus}
            </span>
          </a>
        ))}
      </div>
    </div>
  );
}
