import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "SİYAKAT-LAB",
  description: "Dijital Siyakat Atlası ve Paleografi Araştırma Platformu",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="tr">
      <body className="min-h-screen bg-stone-50 text-stone-900">
        <header className="border-b border-stone-200 bg-white">
          <nav className="max-w-5xl mx-auto px-4 py-3 flex gap-6 text-sm">
            <a href="/" className="font-semibold">SİYAKAT-LAB</a>
            <a href="/atlas">Atlas</a>
            <a href="/search">Ara</a>
            <a href="/compare">Karşılaştır</a>
            <a href="/upload">Ekle</a>
            <a href="/admin">Uzman Paneli</a>
            <a href="/login" className="ml-auto">Giriş</a>
          </nav>
        </header>
        <main className="max-w-5xl mx-auto px-4 py-8">{children}</main>
      </body>
    </html>
  );
}
