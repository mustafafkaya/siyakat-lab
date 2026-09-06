"use client";

/**
 * F10 · Uzman paneli — E1 adım 5: gerçek API'ye bağlı.
 *
 * Kuyruk: GET /samples?verification_status=...  (sayılar GET /samples/facets)
 * Karar : PATCH /samples/{id}  → verification_status / read_value / expert_note
 *         (her değişiklik backend'de VerificationHistory'ye düşer)
 * Yetki : yalnızca "expert" ve "admin" rolleri.
 */
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import SampleThumb from "@/components/SampleThumb";
import StatusBadge from "@/components/StatusBadge";
import { useAuth } from "@/lib/auth";
import { getFacets, listSamples, updateSample, type Sample } from "@/lib/api";
import { canReview, statusLabels, statusOrder, type VerificationStatus } from "@/lib/labels";

export default function AdminPage() {
  const { user, loading: authLoading } = useAuth();
  const allowed = canReview(user?.role);

  const [tab, setTab] = useState<VerificationStatus>("pending_review");
  const [samples, setSamples] = useState<Sample[]>([]);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [openId, setOpenId] = useState<string | null>(null);
  const [readValue, setReadValue] = useState("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [rowError, setRowError] = useState<string | null>(null);

  const load = useCallback(
    async (status: VerificationStatus) => {
      setLoading(true);
      setError(null);
      try {
        const [list, facets] = await Promise.all([
          listSamples({ verificationStatus: status }),
          getFacets({}),
        ]);
        setSamples(list);
        const map: Record<string, number> = {};
        for (const f of facets.verificationStatuses) map[f.value] = f.count;
        setCounts(map);
      } catch (e: any) {
        setError(e?.message || "Liste alınamadı.");
        setSamples([]);
      } finally {
        setLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    if (allowed) load(tab);
  }, [allowed, tab, load]);

  function openRow(s: Sample) {
    if (openId === s.id) {
      setOpenId(null);
      return;
    }
    setOpenId(s.id);
    setReadValue(s.readValue ?? "");
    setNote(s.expertNote ?? "");
    setRowError(null);
  }

  /** Karar ver / kaydet. `status` verilmezse yalnızca alanlar güncellenir. */
  async function apply(s: Sample, status?: VerificationStatus) {
    setBusy(true);
    setRowError(null);
    try {
      const patch: Record<string, any> = {};
      if (readValue !== (s.readValue ?? "")) patch.readValue = readValue || null;
      if (note !== (s.expertNote ?? "")) patch.expertNote = note || null;
      if (status && status !== s.verificationStatus) patch.verificationStatus = status;
      if (Object.keys(patch).length === 0) {
        setRowError("Değişiklik yok.");
        return;
      }
      const updated = await updateSample(s.id, patch);
      setOpenId(null);
      // Durum değiştiyse örnek bu sekmeden çıkar; değişmediyse yerinde güncelle.
      if (updated.verificationStatus !== tab) {
        setSamples((list) => list.filter((x) => x.id !== s.id));
      } else {
        setSamples((list) => list.map((x) => (x.id === s.id ? updated : x)));
      }
      getFacets({})
        .then((f) => {
          const map: Record<string, number> = {};
          for (const it of f.verificationStatuses) map[it.value] = it.count;
          setCounts(map);
        })
        .catch(() => {});
    } catch (e: any) {
      setRowError(e?.message || "İşlem başarısız.");
    } finally {
      setBusy(false);
    }
  }

  if (authLoading) return <p className="text-sm text-stone-400">Yükleniyor…</p>;

  if (!user)
    return (
      <div className="text-sm text-stone-600">
        <h1 className="text-xl font-semibold mb-2">Uzman Paneli</h1>
        <p>
          Bu sayfa için giriş yapmalısınız.{" "}
          <Link href="/login" className="underline underline-offset-2">
            Giriş yap
          </Link>
        </p>
      </div>
    );

  if (!allowed)
    return (
      <div className="text-sm text-stone-600">
        <h1 className="text-xl font-semibold mb-2">Uzman Paneli</h1>
        <p>Bu sayfaya yalnızca uzman ve yönetici rolleri erişebilir.</p>
      </div>
    );

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <h1 className="text-xl font-semibold">Uzman Paneli</h1>
        {user.role === "admin" && (
          <Link href="/admin/users" className="text-sm text-amber-700 hover:underline">
            Kullanıcı Yönetimi →
          </Link>
        )}
      </div>
      <p className="text-sm text-stone-500 mb-4">
        Örnekleri inceleyin; okuma değerini ve uzman notunu düzenleyip karar verin.
      </p>

      <div className="flex flex-wrap gap-2 mb-4 text-sm">
        {statusOrder.map((s) => (
          <button
            key={s}
            onClick={() => {
              setTab(s);
              setOpenId(null);
            }}
            className={`px-3 py-1 rounded border ${
              tab === s
                ? "bg-amber-500 text-white border-amber-500"
                : "bg-white text-stone-600 border-stone-300 hover:bg-stone-50"
            }`}
          >
            {statusLabels[s]}
            <span className={tab === s ? "ml-1 opacity-80" : "ml-1 text-stone-400"}>
              {counts[s] ?? 0}
            </span>
          </button>
        ))}
      </div>

      {loading && <p className="text-sm text-stone-400">Yükleniyor…</p>}
      {error && <p className="text-sm text-red-700">{error}</p>}
      {!loading && !error && samples.length === 0 && (
        <p className="text-sm text-stone-400">Bu durumda örnek yok.</p>
      )}

      <div className="space-y-2">
        {samples.map((s) => (
          <div key={s.id} className="border border-stone-200 rounded">
            <div className="flex items-center justify-between gap-3 p-3">
              <button
                onClick={() => openRow(s)}
                className="flex items-center gap-3 text-left flex-1 min-w-0"
              >
                <span className="block w-12 shrink-0">
                  <SampleThumb url={s.croppedImageUrl} alt={s.readValue ?? undefined} className="h-12" />
                </span>
                <span className="text-sm min-w-0">
                  <span className="font-medium block truncate">{s.readValue || "—"}</span>
                  <span className="text-xs text-stone-500 block truncate">
                    {[s.region, s.century, s.documentType].filter(Boolean).join(" · ") || "—"}
                  </span>
                </span>
              </button>
              <div className="flex items-center gap-2 shrink-0">
                <StatusBadge status={s.verificationStatus} />
                <Link
                  href={`/samples/${s.id}`}
                  className="text-xs text-stone-500 hover:underline"
                >
                  Detay
                </Link>
                <button
                  onClick={() => openRow(s)}
                  className="text-xs px-2 py-1 rounded bg-stone-100 hover:bg-stone-200"
                >
                  {openId === s.id ? "Kapat" : "İncele"}
                </button>
              </div>
            </div>

            {openId === s.id && (
              <div className="border-t border-stone-200 p-3 bg-stone-50 text-sm">
                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="block">
                    <span className="block text-xs text-stone-500 mb-1" id={`rv-${s.id}-label`}>
                      Okunan Değer
                    </span>
                    <input
                      id={`rv-${s.id}`}
                      value={readValue}
                      onChange={(e) => setReadValue(e.target.value)}
                      className="w-full border border-stone-300 rounded p-2"
                    />
                  </label>
                  <label className="block">
                    <span className="block text-xs text-stone-500 mb-1">Uzman Notu</span>
                    <textarea
                      id={`note-${s.id}`}
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      rows={2}
                      className="w-full border border-stone-300 rounded p-2"
                    />
                  </label>
                </div>

                {rowError && <p className="text-xs text-red-700 mt-2">{rowError}</p>}

                <div className="flex flex-wrap gap-2 mt-3">
                  <button
                    disabled={busy}
                    onClick={() => apply(s, "verified")}
                    className="px-3 py-1 rounded bg-green-600 text-white disabled:opacity-50"
                  >
                    Onayla
                  </button>
                  <button
                    disabled={busy}
                    onClick={() => apply(s, "rejected")}
                    className="px-3 py-1 rounded bg-red-600 text-white disabled:opacity-50"
                  >
                    Reddet
                  </button>
                  {s.verificationStatus !== "pending_review" && (
                    <button
                      disabled={busy}
                      onClick={() => apply(s, "pending_review")}
                      className="px-3 py-1 rounded bg-amber-100 text-amber-800 disabled:opacity-50"
                    >
                      İncelemeye Al
                    </button>
                  )}
                  <button
                    disabled={busy}
                    onClick={() => apply(s)}
                    className="px-3 py-1 rounded bg-stone-200 text-stone-700 disabled:opacity-50"
                  >
                    Yalnızca Kaydet
                  </button>
                  {busy && <span className="text-xs text-stone-500 self-center">Kaydediliyor…</span>}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
