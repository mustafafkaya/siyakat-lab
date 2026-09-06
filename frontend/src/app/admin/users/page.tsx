"use client";

/**
 * F11 · Kullanıcı yönetimi ekranı (admin).
 *
 * Kullanıcı listesi, rol değiştirme, aktif/pasif ve yeni kullanıcı ekleme.
 * Dummy: değişiklikler yerel state'te. E1'de GET/PATCH /users ve rol uçlarına bağlanacak
 * (backend B3 rol sistemi hazır: user / expert / admin).
 */
import { useState } from "react";
import { dummyUsers, roleLabels, type DummyUser, type UserRole } from "@/lib/dummyData";

const roles: UserRole[] = ["user", "expert", "admin"];

export default function UsersAdminPage() {
  const [users, setUsers] = useState<DummyUser[]>(dummyUsers);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<UserRole>("user");

  function setUserRole(id: string, r: UserRole) {
    setUsers((us) => us.map((u) => (u.id === id ? { ...u, role: r } : u)));
  }
  function toggleActive(id: string) {
    setUsers((us) => us.map((u) => (u.id === id ? { ...u, active: !u.active } : u)));
  }
  function addUser(e: React.FormEvent) {
    e.preventDefault();
    if (!name || !email) return;
    setUsers((us) => [...us, { id: `u${us.length + 1}`, name, email, role, active: true }]);
    setName("");
    setEmail("");
    setRole("user");
  }

  return (
    <div className="max-w-3xl">
      <div className="flex items-center gap-3 mb-1">
        <a href="/admin" className="text-sm text-stone-500 hover:underline">← Uzman Paneli</a>
      </div>
      <h1 className="text-xl font-semibold mb-1">Kullanıcı Yönetimi</h1>
      <p className="text-sm text-stone-500 mb-6">Kullanıcıları görüntüleyin, rollerini ve durumlarını değiştirin.</p>

      <div className="border border-stone-200 rounded overflow-hidden mb-8">
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
            {users.map((u) => (
              <tr key={u.id} className="border-t border-stone-200">
                <td className="p-3 font-medium">{u.name}</td>
                <td className="p-3 text-stone-500">{u.email}</td>
                <td className="p-3">
                  <select
                    value={u.role}
                    onChange={(e) => setUserRole(u.id, e.target.value as UserRole)}
                    className="border border-stone-300 rounded px-2 py-1"
                  >
                    {roles.map((r) => (
                      <option key={r} value={r}>{roleLabels[r]}</option>
                    ))}
                  </select>
                </td>
                <td className="p-3">
                  <span className={`text-xs px-2 py-0.5 rounded ${u.active ? "bg-green-100 text-green-800" : "bg-stone-100 text-stone-500"}`}>
                    {u.active ? "Aktif" : "Pasif"}
                  </span>
                </td>
                <td className="p-3 text-right">
                  <button onClick={() => toggleActive(u.id)} className="text-xs px-2 py-1 rounded bg-stone-100 hover:bg-stone-200">
                    {u.active ? "Pasifleştir" : "Aktifleştir"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h2 className="text-sm font-semibold mb-3">Yeni Kullanıcı Ekle</h2>
      <form onSubmit={addUser} className="flex flex-wrap gap-3 items-end text-sm">
        <div>
          <label className="block text-stone-500 mb-1">Ad</label>
          <input value={name} onChange={(e) => setName(e.target.value)} className="border border-stone-300 rounded p-2" />
        </div>
        <div>
          <label className="block text-stone-500 mb-1">E-posta</label>
          <input value={email} onChange={(e) => setEmail(e.target.value)} className="border border-stone-300 rounded p-2" />
        </div>
        <div>
          <label className="block text-stone-500 mb-1">Rol</label>
          <select value={role} onChange={(e) => setRole(e.target.value as UserRole)} className="border border-stone-300 rounded p-2">
            {roles.map((r) => (
              <option key={r} value={r}>{roleLabels[r]}</option>
            ))}
          </select>
        </div>
        <button type="submit" className="px-4 py-2 rounded bg-amber-500 text-white">Ekle</button>
      </form>
      <p className="text-xs text-stone-400 mt-4">Not: Değişiklikler şimdilik yerel (dummy). E1'de gerçek API'ye bağlanacak.</p>
    </div>
  );
}
