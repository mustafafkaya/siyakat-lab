import { dummySamples, dummyHistory, statusLabels, statusStyles } from "@/lib/dummyData";
import VerificationHistory from "@/components/VerificationHistory";

export default function SampleDetailPage({ params }: { params: { id: string } }) {
  const sample = dummySamples.find((s) => s.id === params.id);

  if (!sample) {
    return <p className="text-sm text-stone-400">Örnek bulunamadı.</p>;
  }

  const history = dummyHistory[sample.id] ?? [];

  return (
    <div className="max-w-2xl">
      <h1 className="text-xl font-semibold mb-4">Örnek: {sample.readValue}</h1>
      <div className={`h-48 rounded mb-4 ${sample.thumbnailColor}`} />
      <dl className="grid grid-cols-2 gap-y-2 text-sm">
        <dt className="text-stone-500">Okunan Değer</dt>
        <dd>{sample.readValue}</dd>
        <dt className="text-stone-500">Bölge</dt>
        <dd>{sample.region}</dd>
        <dt className="text-stone-500">Dönem</dt>
        <dd>{sample.century}</dd>
        <dt className="text-stone-500">Belge Türü</dt>
        <dd>{sample.documentType}</dd>
        <dt className="text-stone-500">Doğrulama Durumu</dt>
        <dd>
          <span className={`text-xs px-2 py-0.5 rounded ${statusStyles[sample.verificationStatus]}`}>
            {statusLabels[sample.verificationStatus]}
          </span>
        </dd>
      </dl>

      <section className="mt-8">
        <h2 className="text-sm font-semibold mb-3">Doğrulama Geçmişi</h2>
        <VerificationHistory entries={history} />
      </section>

      <div className="mt-6 p-4 border border-dashed border-stone-300 rounded text-xs text-stone-500">
        V2'de burada: AI tahmini, güven skoru ve benzer tarihî örnekler listelenecek.
        V3'te: biçimsel/ductus analizleri eklenecek.
      </div>
    </div>
  );
}
