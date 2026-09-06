"use client";
import { useAuth } from "@/lib/auth";
import { canReview } from "@/lib/labels";

export default function NavBar() {
  const { user, logout, loading } = useAuth();
  return (
    <nav className="max-w-5xl mx-auto px-4 py-3 flex gap-6 text-sm items-center">
      <a href="/" className="font-semibold">SİYAKAT-LAB</a>
      <a href="/atlas">Atlas</a>
      <a href="/search">Ara</a>
      <a href="/compare">Karşılaştır</a>
      <a href="/upload">Ekle</a>
      {canReview(user?.role) && <a href="/admin">Uzman Paneli</a>}
      {!loading && user ? (
        <span className="ml-auto flex items-center gap-3">
          <span className="text-stone-500">
            {user.fullName || user.email} · {user.role}
          </span>
          <button onClick={logout} className="text-stone-700 hover:text-stone-900">
            Çıkış
          </button>
        </span>
      ) : (
        <a href="/login" className="ml-auto">Giriş</a>
      )}
    </nav>
  );
}
