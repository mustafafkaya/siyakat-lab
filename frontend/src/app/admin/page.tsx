import { dummySamples } from "@/lib/dummyData";

export default function AdminPage() {
  const pending = dummySamples.filter((s) => s.verificationStatus === "pending_review");

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-semibold">Uzman Paneli</h1>
        <a href="/admin/users" className="text-sm text-amber-700 hover:underline">Kullanıcı Yönetimi →</a>
      </div>
      <p className="text-sm text-stone-500 mb-6">İncelemeyi bekleyen örnekler</p>
      <div className="space-y-2">
        {pending.map((s) => (
          <div key={s.id} className="flex items-center justify-between border border-stone-200 rounded p-3">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded ${s.thumbnailColor}`} />
              <div className="text-sm">
                <div className="font-medium">{s.readValue}</div>
                <div className="text-xs text-stone-500">{s.region} · {s.documentType}</div>
              </div>
            </div>
            <div className="flex gap-2 text-sm">
              <button className="px-3 py-1 bg-green-100 text-green-800 rounded">Onayla</button>
              <button className="px-3 py-1 bg-red-100 text-red-800 rounded">Reddet</button>
            </div>
          </div>
        ))}
        {pending.length === 0 && <p className="text-sm text-stone-400">Bekleyen örnek yok.</p>}
      </div>
    </div>
  );
}
