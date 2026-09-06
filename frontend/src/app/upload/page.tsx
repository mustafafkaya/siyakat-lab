"use client";

/**
 * F8 · Veri ekleme akışı: yükle → görüntüle → kırp → gir → kaydet.
 *
 * Yol haritası D maddesindeki iş akışının frontend karşılığı. Şu an dummy:
 * "Kaydet" gerçek API'ye gitmez; E1'de (Faz 4) POST /documents + POST /samples
 * çağrılarına bağlanacak. Adım yapısı ve toplanan alanlar backend sözleşmesiyle birebir.
 */
import { useState } from "react";
import CropTool, { CropRect } from "@/components/CropTool";

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
  const [step, setStep] = useState(0);
  const [imageSrc, setImageSrc] = useState<string | undefined>();
  const [fileName, setFileName] = useState<string>("");
  const [crop, setCrop] = useState<CropRect | null>(null);
  const [meta, setMeta] = useState<Meta>(emptyMeta);
  const [saved, setSaved] = useState(false);

  function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    setFileName(f.name);
    const reader = new FileReader();
    reader.onload = () => setImageSrc(reader.result as string);
    reader.readAsDataURL(f);
  }

  function reset() {
    setStep(0);
    setImageSrc(undefined);
    setFileName("");
    setCrop(null);
    setMeta(emptyMeta);
    setSaved(false);
  }

  const payload = {
    document: {
      archive_ref: meta.archiveRef,
      region: meta.region,
      century: meta.century,
      document_type: meta.documentType,
      image: fileName,
    },
    sample: {
      coordinates: crop,
      read_value: meta.readValue,
      variant_type: meta.variantType,
      expert_note: meta.expertNote,
      verification_status: "draft",
    },
  };

  return (
    <div className="max-w-2xl">
      <h1 className="text-xl font-semibold mb-1">Veri Ekle</h1>
      <p className="text-sm text-stone-500 mb-6">
        Belge yükleyin, rakam alanını seçin, bilgileri girin ve taslak olarak kaydedin.
      </p>

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
              {fileName ? `Seçildi: ${fileName}` : "Belge görselini seçmek için tıklayın"}
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
            <div className="p-4 rounded bg-green-50 border border-green-200 text-sm text-green-800">
              Örnek <b>taslak</b> olarak kaydedildi. (Dummy — E1'de gerçek API'ye yazılacak.)
              Uzman panelinde inceleme sırasına eklenecek.
            </div>
          ) : (
            <>
              <p className="text-sm text-stone-500">Kaydedilecek veri (backend'e gidecek yük):</p>
              <pre className="text-xs bg-stone-900 text-stone-100 rounded p-3 overflow-x-auto">
                {JSON.stringify(payload, null, 2)}
              </pre>
            </>
          )}
          <div className="flex justify-between">
            {!saved ? (
              <>
                <button onClick={() => setStep(2)} className="px-4 py-2 rounded bg-stone-100 text-sm">
                  Geri
                </button>
                <button onClick={() => setSaved(true)} className="px-4 py-2 rounded bg-green-600 text-white text-sm">
                  Kaydet (Taslak)
                </button>
              </>
            ) : (
              <button onClick={reset} className="px-4 py-2 rounded bg-amber-500 text-white text-sm ml-auto">
                Yeni Örnek Ekle
              </button>
            )}
          </div>
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
