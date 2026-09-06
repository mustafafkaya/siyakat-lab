"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import SampleThumb from "@/components/SampleThumb";
import StatusBadge from "@/components/StatusBadge";
import VerificationHistory from "@/components/VerificationHistory";
import { getSample, getSampleHistory, type Sample } from "@/lib/api";
import type { HistoryEntry } from "@/lib/labels";

export default function SampleDetailPage({ params }: { params: { id: string } }) {
  const [sample, setSample] = useState<Sample | null>(null);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    getSample(params.id)
      .then((s) => {
        if (!active) return;
        setSample(s);
        setError(null);
        return getSampleHistory(params.id)
          .then((h) => active && setHistory(h))
          .catch(() => active && setHistory([]));
      })
      .catch((e: any) => active && setError(e?.message || "Örnek bulunamadı."))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [params.id]);

  if (loading) return <p className="text-sm text-stone-400">Yükleniyor…</p>;
  if (error || !sample)
    return (
      <div className="text-sm text-stone-500">
        <p className="mb-2">{error || "Örnek bulunamadı."}</p>
        <Link href="/atlas" className="underline underline-offset-2">
          Atlas'a dön
        </Link>
      </div>
    );

  const field = (label: string, value: string | null | undefined) => (
    <>
      <dt className="text-stone-500">{label}</dt>
      <dd>{value || "—"}</dd>
    </>
  );

  return (
    <div className="max-w-2xl">
      <h1 className="text-xl font-semibold mb-4">Örnek: {sample.readValue || "—"}</h1>
      <SampleThumb url={sample.croppedImageUrl} alt={sample.readValue ?? undefined} className="h-48" />

      <dl className="grid grid-cols-2 gap-y-2 text-sm mt-4">
        {field("Okunan Değer", sample.readValue)}
        {field("Bölge", sample.region)}
        {field("Dönem", sample.century)}
        {field("Belge Türü", sample.documentType)}
        {field("Arşiv Referansı", sample.archiveRef)}
        {field("Tarih (metin)", sample.dateText)}
        {field("Varyant / Tip", sample.variantType)}
        <dt className="text-stone-500">Doğrulama Durumu</dt>
        <dd>
          <StatusBadge status={sample.verificationStatus} />
        </dd>
      </dl>

      {sample.expertNote && (
        <p className="text-sm text-stone-600 mt-4 italic border-l-2 border-stone-200 pl-3">
          {sample.expertNote}
        </p>
      )}

      {sample.documentImageUrl && (
        <p className="mt-4 text-sm">
          <Link href={`/documents/${sample.documentId}`} className="underline underline-offset-2">
            Kaynak belgeyi aç
          </Link>
        </p>
      )}

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
