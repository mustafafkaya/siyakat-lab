export default function DocumentDetailPage({ params }: { params: { id: string } }) {
  return (
    <div>
      <h1 className="text-xl font-semibold mb-4">Belge #{params.id}</h1>
      <p className="text-sm text-stone-500">
        Bu sayfa gerçek belge görüntüleme ve üzerinde rakam alanı seçme/kırpma aracını
        barındıracak (V1 madde: "Belge içerisinden rakam alanı seçme/kırpma").
      </p>
    </div>
  );
}
