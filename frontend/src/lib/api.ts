// Basit API istemcisi: token yönetimi, snake_case <-> camelCase dönüşümü, fetch sarmalayıcı.

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";
const TOKEN_KEY = "siyakat_token";

// ---- Token saklama (localStorage, güvenli) ----
export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}
export function setToken(token: string) {
  try {
    window.localStorage.setItem(TOKEN_KEY, token);
  } catch {}
}
export function clearToken() {
  try {
    window.localStorage.removeItem(TOKEN_KEY);
  } catch {}
}

// ---- snake_case <-> camelCase ----
function snakeToCamel(s: string): string {
  return s.replace(/_([a-z0-9])/g, (_, c) => c.toUpperCase());
}
function camelToSnake(s: string): string {
  return s.replace(/[A-Z]/g, (c) => "_" + c.toLowerCase());
}
export function keysToCamel(input: any): any {
  if (Array.isArray(input)) return input.map(keysToCamel);
  if (input !== null && typeof input === "object") {
    const out: Record<string, any> = {};
    for (const [k, v] of Object.entries(input)) out[snakeToCamel(k)] = keysToCamel(v);
    return out;
  }
  return input;
}
export function keysToSnake(input: any): any {
  if (Array.isArray(input)) return input.map(keysToSnake);
  if (input !== null && typeof input === "object") {
    const out: Record<string, any> = {};
    for (const [k, v] of Object.entries(input)) out[camelToSnake(k)] = keysToSnake(v);
    return out;
  }
  return input;
}

// ---- Ortak hata tipi ----
export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

// ---- Genel fetch sarmalayıcı (JSON) ----
// body camelCase verilir -> snake_case'e çevrilir; dönen veri camelCase'e çevrilir.
export async function apiFetch<T = any>(
  path: string,
  opts: { method?: string; body?: any; auth?: boolean } = {}
): Promise<T> {
  const { method = "GET", body, auth = true } = opts;
  const headers: Record<string, string> = {};
  if (body !== undefined) headers["Content-Type"] = "application/json";
  if (auth) {
    const t = getToken();
    if (t) headers["Authorization"] = `Bearer ${t}`;
  }
  const res = await fetch(`${API_URL}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(keysToSnake(body)) : undefined,
  });
  const text = await res.text();
  const data = text ? JSON.parse(text) : null;
  if (!res.ok) {
    const detail = (data && (data.detail || data.message)) || `İstek başarısız (${res.status})`;
    throw new ApiError(res.status, typeof detail === "string" ? detail : "Hata");
  }
  return keysToCamel(data) as T;
}

// ---- Auth ----
export interface AuthUser {
  id: string;
  email: string;
  fullName: string | null;
  role: "user" | "expert" | "admin";
  isActive: boolean;
  createdAt: string;
}

// /auth/login OAuth2PasswordRequestForm bekler -> form-urlencoded, alan adı "username".
export async function login(email: string, password: string): Promise<string> {
  const form = new URLSearchParams();
  form.set("username", email);
  form.set("password", password);
  const res = await fetch(`${API_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: form.toString(),
  });
  const data = await res.json().catch(() => null);
  if (!res.ok) throw new ApiError(res.status, (data && data.detail) || "Giriş başarısız");
  const token = data.access_token as string;
  setToken(token);
  return token;
}

export async function getMe(): Promise<AuthUser> {
  return apiFetch<AuthUser>("/users/me");
}
