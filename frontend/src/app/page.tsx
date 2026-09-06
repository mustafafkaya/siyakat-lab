export default function HomePage() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">SİYAKAT-LAB</h1>
      <p className="text-stone-600 max-w-2xl">
        Osmanlı mali belgelerindeki siyakat rakamlarının dijital atlası, yapay zekâ destekli
        tanınması ve bilimsel incelenmesi için geliştirilen araştırma platformu.
      </p>
      <div className="flex gap-4 text-sm">
        <a href="/atlas" className="px-4 py-2 bg-stone-900 text-white rounded">Atlası Görüntüle</a>
        <a href="/search" className="px-4 py-2 border border-stone-300 rounded">Örnek Ara</a>
      </div>
    </div>
  );
}
