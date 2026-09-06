import "./globals.css";
import type { Metadata } from "next";
import { AuthProvider } from "@/lib/auth";
import NavBar from "@/components/NavBar";

export const metadata: Metadata = {
  title: "SİYAKAT-LAB",
  description: "Dijital Siyakat Atlası ve Paleografi Araştırma Platformu",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="tr">
      <body className="min-h-screen bg-stone-50 text-stone-900">
        <AuthProvider>
          <header className="border-b border-stone-200 bg-white">
            <NavBar />
          </header>
          <main className="max-w-5xl mx-auto px-4 py-8">{children}</main>
        </AuthProvider>
      </body>
    </html>
  );
}
