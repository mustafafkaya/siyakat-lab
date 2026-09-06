"use client";
import { useState } from "react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  return (
    <div className="max-w-sm">
      <h1 className="text-xl font-semibold mb-4">Giriş Yap</h1>
      <form className="space-y-3">
        <input
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="E-posta"
          className="w-full border border-stone-300 rounded px-3 py-2 text-sm"
        />
        <input
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          type="password"
          placeholder="Parola"
          className="w-full border border-stone-300 rounded px-3 py-2 text-sm"
        />
        <button type="submit" className="w-full bg-stone-900 text-white rounded py-2 text-sm">
          Giriş Yap
        </button>
      </form>
      <p className="text-xs text-stone-400 mt-3">
        Bu form henüz backend'e bağlı değil — POST /api/v1/auth/login endpoint'i hazır.
      </p>
    </div>
  );
}
