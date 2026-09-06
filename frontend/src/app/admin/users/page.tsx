"use client";

/**
 * F11 · Kullanıcı yönetimi — E1 adım 5: gerçek API'ye bağlı.
 *
 * GET   /users        → liste (admin)
 * POST  /users        → rol seçerek kullanıcı oluşturma (admin)
 * PATCH /users/{id}   → rol / aktiflik güncelleme (admin)
 *
 * Not: Backend admin'in kendi rolünü düşürmesini ve kendini pasifleştirmesini
 * engeller; arayüz de bu iki eylemi kapatır.
 */
import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth";
import { createUser, listUsers, updateUser, type AuthUser } from "@/lib/api";
import { roleLabels, roleOrder, type UserRole } from "@/lib/labels";

export default function UsersAdminPage() {
  const { user: me, loading: authLoading } = useAuth();
  const isAdmin = me?.role === "admin";

  const [users, setUsers] = useState<AuthUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  // yeni kullanıcı formu
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<UserRole>("user");
  const [formError, setFormError] = useState<string | null>(null);
  const [formOk, setFormOk] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isAdmin) return;
    let active = true;
    setLoading(true);
    listUsers()
      .then((list) => active && setUsers(list))
      .catch((e: any) => active && setError(e?.message || "Kullanıcılar alınamadı."))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [isAdmin]);

  async function patch(u: AuthUser, body: { role?: UserRole; isActive?: boolean }) {
    setBusyId(u.id);
    setError(null);
    try {
      const updated = await updateUser(u.id, body);
      setUsers((list) => list.map((x) => (x.id === u.id ? updated : x)));
    } catch (e: any) {
      setError(e?.message || "Güncelleme başarısız.");
    } finally {
      setBusyId(null);
    }
  }

  async function addUser(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    setFormOk(null);
    if (!email.trim() || password.length < 6) {
      setFormError("E-posta gerekli, parola en az 6 karakter olmalı.");
      return;
    }
    setSaving(true);
    try {
      const created = await createUser({
        email: email.trim(),
        password,
        fullName: fullName.trim() || undefined,
        role,
      });
      setUsers((list) => [...list, created]);
      setFormOk(`${created.email} eklendi.`);
      setFullName("");
      setEmail("");
      setPassword("");
      setRole("user");
    } catch (e: any) {
      setFormError(e?.message || "Kullanıcı eklenemedi.");
    } finally {
      setSaving(false);
    }
  }

  if (authLoading) return <p className="text-sm text-stone-400">Yükleniyor…</p>;

  if (!me)
    return (
      <p className="text-sm text-stone-600">
        Bu sayfa için giriş yapmalısınız.{" "}
        <Link href="/login" className="underline underline-offset-2">
          Giriş yap
        </Link>
      </p>
    );

  if (!isAdmin)
    return (
      <div className="text-sm text-stone-600">
        <h1 className="text-xl font-semibold mb-2">Kullanıcı Yönetimi</h1>
        <p>Bu sayfaya yalnızca yönetici rolü erişebilir.</p>
      </div>
    );

  return (
    <div className="max-w-3xl">
      <Link href="/admin" className="text-sm text-stone-500 hover:underline">
        ← Uzman Paneli
      </Link>
      <h1 className="text-xl font-semibold mt-1 mb-1">Kullanıcı Yönetimi</h1>
      <p className="text-sm text-stone-500 mb-6">
        Kullanıcıları görüntüleyin, rollerini ve durumlarını değiştirin.
      </p>

      {error && <p className="text-sm text-red-700 mb-3">{error}</p>}
      {loading ? (
        <p className="text-sm text-stone-400">Yükleniyor…</p>
      ) : (
        <div className="border border-stone-200 rounded overflow-x-auto mb-8">
          <table className="w-full text-sm">
            <thead className="bg-stone-100 text-stone-600 text-left">
              <tr>
                <th className="p-3">Ad</th>
                <th className="p-3">E-posta</th>
                <th className="p-3">Rol</th>
                <th className="p-3">Durum</th>
                <th className="p-3"></th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => {
                const self = u.id === me.id;
                return (
                  <tr key={u.id} className="border-t border-stone-200">
                    <td className="p-3 font-medium">
                      {u.fullName || "—"}
                      {self && <span className="ml-2 text-xs text-stone-400">(siz)</span>}
                    </td>
                    <td className="p-3 text-stone-500">{u.email}</td>
                    <td className="p-3">
                      <select
                        aria-label={`${u.email} rolü`}
                        value={u.role}
                        disabled={self || busyId === u.id}
                        onChange={(e) => patch(u, { role: e.target.value as UserRole })}
                        className="border border-stone-300 rounded px-2 py-1 disabled:opacity-60"
                      >
                        {roleOrder.map((r) => (
                          <option key={r} value={r}>
                            {roleLabels[r]}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="p-3">
                      <span
                        className={`text-xs px-2 py-0.5 rounded ${
                          u.isActive ? "bg-green-100 text-green-800" : "bg-stone-100 text-stone-500"
                        }`}
                      >
                        {u.isActive ? "Aktif" : "Pasif"}
                      </span>
                    </td>
                    <td className="p-3 text-right">
                      <button
                        disabled={self || busyId === u.id}
                        onClick={() => patch(u, { isActive: !u.isActive })}
                        className="text-xs px-2 py-1 rounded bg-stone-100 hover:bg-stone-200 disabled:opacity-50"
                      >
                        {u.isActive ? "Pasifleştir" : "Aktifleştir"}
                      </button>
                    </td>
                  </tr>
                );
              })}
              {users.length === 0 && (
                <tr>
                  <td className="p-3 text-stone-400" colSpan={5}>
                    Kullanıcı yok.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      <h2 className="text-sm font-semibold mb-3">Yeni Kullanıcı Ekle</h2>
      <form onSubmit={addUser} className="flex flex-wrap gap-3 items-end text-sm">
        <div>
          <label htmlFor="nu-name" className="block text-stone-500 mb-1">
            Ad
          </label>
          <input
            id="nu-name"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="border border-stone-300 rounded p-2"
          />
        </div>
        <div>
          <label htmlFor="nu-email" className="block text-stone-500 mb-1">
            E-posta
          </label>
          <input
            id="nu-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="border border-stone-300 rounded p-2"
          />
        </div>
        <div>
          <label htmlFor="nu-pass" className="block text-stone-500 mb-1">
            Parola
          </label>
          <input
            id="nu-pass"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="border border-stone-300 rounded p-2"
          />
        </div>
        <div>
          <label htmlFor="nu-role" className="block text-stone-500 mb-1">
            Rol
          </label>
          <select
            id="nu-role"
            value={role}
            onChange={(e) => setRole(e.target.value as UserRole)}
            className="border border-stone-300 rounded p-2"
          >
            {roleOrder.map((r) => (
              <option key={r} value={r}>
                {roleLabels[r]}
              </option>
            ))}
          </select>
        </div>
        <button
          type="submit"
          disabled={saving}
          className="px-4 py-2 rounded bg-amber-500 text-white disabled:opacity-50"
        >
          {saving ? "Ekleniyor…" : "Ekle"}
        </button>
      </form>
      {formError && <p className="text-xs text-red-700 mt-2">{formError}</p>}
      {formOk && <p className="text-xs text-green-700 mt-2">{formOk}</p>}
    </div>
  );
}
