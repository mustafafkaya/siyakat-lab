"use client";

/**
 * F8 · Veri ekleme akışı: yükle → kırp → bilgileri gir → kaydet.
 *
 * E1 adım 4: GERÇEK API'ye bağlı.
 *   1) POST /documents  (multipart: belge görseli + metadata) → document_id
 *   2) POST /samples    (multipart: document_id + kırpılmış görsel + koordinat + okuma)
 * Her iki uç da token ister; giriş yapılmamışsa kaydetme kapalıdır.
 */
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import CropTool, { CropRect } from "@/components/CropTool";
import StatusBadge from "@/components/StatusBadge";
import { useAuth } from "@/lib/auth";
import { ApiError, createDocument, createSample, assetUrl, Sample } from "@/lib/api";
import { cropToBlob, cropFileName } from "@/lib/cropImage";

type Meta = {
  archiveRef: string;
  region: string;
  century: string;
  documentType: string;
  readValue: string;
  variantType: string;
  expertNote: string;
};

const emptyMeta: Meta = {
  archiveRef: "",
  region: "",
  century: "",
  documentType: "",
  readValue: "",
  variantType: "",
  expertNote: "",
};

const steps = ["Belge Yükle", "Alan Seç (Kırp)", "Bilgileri Gir", "Kaydet"];

export default function UploadPage() {
  const { user, loading: authLoading } = useAuth();

  const [step, setStep] = useState(0);
  const [file, setFile] = useState<File | null>(null);
  const [imageSrc, setImageSrc] = useState<string | undefined>();
  const [crop, setCrop] = useState<CropRect | null>(null);
  const [meta, setMeta] = useState<Meta>(emptyMeta);

  const [preview, setPreview] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState<Sample | null>(null);
  const previewRef = useRef<string | null>(null);

  function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    setCrop(null);
    setError(null);
    const reader = new FileReader();
    reader.onload = () => setImageSrc(reader.result as string);
    reader.readAsDataURL(f);
  }

  // Özet adımında kırpılan alanın önizlemesini üret (kaydetmeden önce göz kontrolü).
  useEffect(() => {
    let active = true;
    function clear() {
      if (previewRef.current) URL.revokeObjectURL(previewRef.current);
      previewRef.current = null;
    }
    if (step !== 3 || !imageSrc || !crop || saved) {
      clear();
      setPreview(null);
      return;
    }
    cropToBlob(imageSrc, crop)
      .then((blob) => {
        if (!active) return;
        clear();
        const url = URL.createObjectURL(blob);
        previewRef.current = url;
        setPreview(url);
      })
      .catch(() => active && setPreview(null));
    return () => {
      active = false;
    };
  }, [step, imageSrc, crop, saved]);

  useEffect(() => () => {
    if (previewRef.current) URL.revokeObjectURL(previewRef.current);
  }, []);

  function reset() {
    setStep(0);
    setFile(null);
    setImageSrc(undefined);
    setCrop(null);
    setMeta(emptyMeta);
    setSaved(null);
    setError(null);
    setPreview(null);
  }

  async function handleSave() {
    if (!file || !imageSrc || !crop) return;
    setSaving(true);
    setError(null);
    try {
      // 1) Belge
      const doc = await createDocument(file, {
        archiveRef: meta.archiveRef,
        region: meta.region,
        century: meta.century,
        documentType: meta.documentType,
      });
      // 2) Kırpılan alan → örnek
      const blob = await cropToBlob(imageSrc, crop);
      const sample = await createSample(
        {
          documentId: doc.id,
          croppedImage: blob,
          coordinates: crop,
          readValue: meta.readValue,
          variantType: meta.variantType,
          expertNote: meta.expertNote,
        },
        cropFileName(file.name)
      );
      setSaved(sample);
    } catch (err) {
      const msg =
        err instanceof ApiError
          ? err.status === 401
            ? "Oturum süresi dolmuş görünüyor. Yeniden giriş yapın."
            : err.message
          : err instanceof Error
          ? err.message
          : "Kayıt sırasında beklenmeyen bir hata oluştu.";
      setError(msg);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="max-w-2xl">
      <h1 className="text-xl font-semibold mb-1">Veri Ekle</h1>
      <p className="text-sm text-stone-500 mb-6">
        Belge yükleyin, rakam alanını seçin, bilgileri girin ve taslak olarak kaydedin.
      </p>

      {!authLoading && !user && (
        <div className="mb-6 p-3 rounded bg-amber-50 border border-amber-200 text-sm text-amber-900">
          Veri eklemek için giriş yapmalısınız.{" "}
          <Link href="/login" className="underline font-medium">
            Giriş yap
          </Link>
        </div>
      )}

      {/* Adım göstergesi */}
      <ol className="flex items-center gap-2 mb-6 text-xs">
        {steps.map((label, i) => (
          <li key={label} className="flex items-center gap-2">
            <span
              className={`w-6 h-6 rounded-full flex items-center justify-center ${
                i <= step ? "bg-amber-500 text-white" : "bg-stone-200 text-stone-500"
              }`}
            >
              {i + 1}
            </span>
            <span className={i === step ? "font-medium" : "text-stone-500"}>{label}</span>
            {i < steps.length - 1 && <span className="text-stone-300">→</span>}
          </li>
        ))}
      </ol>

      {/* Adım 1: yükle */}
      {step === 0 && (
        <div className="space-y-4">
          <label className="block border-2 border-dashed border-stone-300 rounded p-8 text-center cursor-pointer hover:border-amber-400">
            <input type="file" accept="image/*" onChange={onFile} className="hidden" />
            <span className="text-sm text-stone-500">
              {file ? `Seçildi: ${file.name}` : "Belge görselini seçmek için tıklayın"}
            </span>
          </label>
          {imageSrc && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={imageSrc} alt="önizleme" className="max-h-48 rounded border border-stone-200" />
          )}
          <div className="flex justify-end">
            <button
              disabled={!imageSrc}
              onClick={() => setStep(1)}
              className="px-4 py-2 rounded bg-amber-500 text-white text-sm disabled:opacity-40"
            >
              İleri
            </button>
          </div>
        </div>
      )}

      {/* Adım 2: kırp */}
      {step === 1 && (
        <div className="space-y-4">
          <CropTool imageSrc={imageSrc} onChange={setCrop} />
          <div className="flex justify-between">
            <button onClick={() => setStep(0)} className="px-4 py-2 rounded bg-stone-100 text-sm">
              Geri
            </button>
            <button
              disabled={!crop}
              onClick={() => setStep(2)}
              className="px-4 py-2 rounded bg-amber-500 text-white text-sm disabled:opacity-40"
            >
              İleri
            </button>
          </div>
        </div>
      )}

      {/* Adım 3: bilgi gir */}
      {step === 2 && (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <Field label="Okunan Değer" value={meta.readValue} onChange={(v) => setMeta({ ...meta, readValue: v })} />
            <Field label="Varyant/Tip" value={meta.variantType} onChange={(v) => setMeta({ ...meta, variantType: v })} />
            <Field label="Arşiv/Referans" value={meta.archiveRef} onChange={(v) => setMeta({ ...meta, archiveRef: v })} />
            <Field label="Bölge" value={meta.region} onChange={(v) => setMeta({ ...meta, region: v })} />
            <Field label="Dönem/Yüzyıl" value={meta.century} onChange={(v) => setMeta({ ...meta, century: v })} />
            <Field label="Belge Türü" value={meta.documentType} onChange={(v) => setMeta({ ...meta, documentType: v })} />
          </div>
          <div className="text-sm">
            <label className="block text-stone-500 mb-1">Uzman Notu</label>
            <textarea
              value={meta.expertNote}
              onChange={(e) => setMeta({ ...meta, expertNote: e.target.value })}
              className="w-full border border-stone-300 rounded p-2 h-20"
            />
          </div>
          <div className="flex justify-between">
            <button onClick={() => setStep(1)} className="px-4 py-2 rounded bg-stone-100 text-sm">
              Geri
            </button>
            <button onClick={() => setStep(3)} className="px-4 py-2 rounded bg-amber-500 text-white text-sm">
              İleri
            </button>
          </div>
        </div>
      )}

      {/* Adım 4: kaydet / özet */}
      {step === 3 && (
        <div className="space-y-4">
          {saved ? (
            <div className="space-y-4">
              <div className="p-4 rounded bg-green-50 border border-green-200 text-sm text-green-800">
                Örnek kaydedildi. Uzman panelinde inceleme sırasına eklendi.
              </div>
              <div className="flex items-start gap-4 border border-stone-200 rounded p-3">
                {assetUrl(saved.croppedImageUrl) && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={assetUrl(saved.croppedImageUrl) as string}
                    alt="kaydedilen örnek"
                    className="h-20 rounded border border-stone-200 bg-stone-50"
                  />
                )}
                <div className="text-sm space-y-1">
                  <div className="font-medium">{saved.readValue || "— okuma girilmedi —"}</div>
                  <StatusBadge status={saved.verificationStatus} />
                  <div className="text-xs text-stone-500">ID: {saved.id}</div>
                </div>
              </div>
              <div className="flex gap-2">
                <Link
                  href={`/samples/${saved.id}`}
                  className="px-4 py-2 rounded bg-stone-100 text-sm hover:bg-stone-200"
                >
                  Örneği aç
                </Link>
                <Link href="/atlas" className="px-4 py-2 rounded bg-stone-100 text-sm hover:bg-stone-200">
                  Atlas'a git
                </Link>
                <button onClick={reset} className="px-4 py-2 rounded bg-amber-500 text-white text-sm ml-auto">
                  Yeni Örnek Ekle
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="border border-stone-200 rounded p-3 space-y-3">
                <p className="text-sm text-stone-500">Kaydedilecek örnek:</p>
                <div className="flex items-start gap-4">
                  {preview ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={preview}
                      alt="kırpılan alan"
                      className="h-20 rounded border border-stone-200 bg-stone-50"
                    />
                  ) : (
                    <div className="h-20 w-28 rounded border border-dashed border-stone-300 text-[11px] text-stone-400 flex items-center justify-center">
                      önizleme
                    </div>
                  )}
                  <dl className="text-sm grid grid-cols-[auto_1fr] gap-x-3 gap-y-1">
                    <Row label="Belge" value={file?.name} />
                    <Row label="Okunan değer" value={meta.readValue} />
                    <Row label="Varyant" value={meta.variantType} />
                    <Row label="Arşiv" value={meta.archiveRef} />
                    <Row label="Bölge / Dönem" value={[meta.region, meta.century].filter(Boolean).join(" · ")} />
                    <Row label="Belge türü" value={meta.documentType} />
                  </dl>
                </div>
              </div>

              {error && (
                <div className="p-3 rounded bg-red-50 border border-red-200 text-sm text-red-700">{error}</div>
              )}

              <div className="flex justify-between">
                <button
                  onClick={() => setStep(2)}
                  disabled={saving}
                  className="px-4 py-2 rounded bg-stone-100 text-sm disabled:opacity-40"
                >
                  Geri
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving || !user || !file || !crop}
                  className="px-4 py-2 rounded bg-green-600 text-white text-sm disabled:opacity-40"
                >
                  {saving ? "Kaydediliyor…" : "Kaydet (Taslak)"}
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

function Field({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <label className="block text-stone-500 mb-1">{label}</label>
      <input value={value} onChange={(e) => onChange(e.target.value)} className="w-full border border-stone-300 rounded p-2" />
    </div>
  );
}

function Row({ label, value }: { label: string; value?: string | null }) {
  return (
    <>
      <dt className="text-stone-500">{label}</dt>
      <dd className={value ? "" : "text-stone-400"}>{value || "—"}</dd>
    </>
  );
}
