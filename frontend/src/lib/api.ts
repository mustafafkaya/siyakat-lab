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
  let res: Response;
  try {
    res = await fetch(`${API_URL}${path}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(keysToSnake(body)) : undefined,
    });
  } catch {
    // Ağ hatası / API kapalı: kullanıcıya anlaşılır Türkçe mesaj.
    throw new ApiError(0, "Sunucuya ulaşılamadı. API çalışıyor mu?");
  }
  const text = await res.text();
  const data = text ? JSON.parse(text) : null;
  if (!res.ok) throw new ApiError(res.status, extractDetail(data, `İstek başarısız (${res.status})`));
  return keysToCamel(data) as T;
}

/**
 * FastAPI hata gövdesinden okunabilir mesaj çıkarır.
 * `detail` string olabilir; 422'de ise [{loc, msg, type}] dizisi gelir.
 */
function extractDetail(data: any, fallback: string): string {
  const d = data && (data.detail ?? data.message);
  if (typeof d === "string" && d.trim()) return d;
  if (Array.isArray(d) && d.length) {
    const first: any = d[0];
    if (typeof first === "string") return first;
    if (first && typeof first.msg === "string") {
      const loc = Array.isArray(first.loc) ? first.loc[first.loc.length - 1] : null;
      return loc ? `${loc}: ${first.msg}` : first.msg;
    }
  }
  return fallback;
}

// ---- Dosya yükleme sarmalayıcı (multipart/form-data) ----
// apiFetch JSON içindir; belge ve örnek yükleme uçları FormData bekler.
// DİKKAT: Content-Type ELLE SET EDİLMEZ — boundary'yi tarayıcı ekler.
export async function apiUpload<T = any>(
  path: string,
  form: FormData,
  opts: { method?: string } = {}
): Promise<T> {
  const { method = "POST" } = opts;
  const headers: Record<string, string> = {};
  const t = getToken();
  if (t) headers["Authorization"] = `Bearer ${t}`;

  let res: Response;
  try {
    res = await fetch(`${API_URL}${path}`, { method, headers, body: form });
  } catch {
    throw new ApiError(0, "Sunucuya ulaşılamadı. API çalışıyor mu?");
  }
  const text = await res.text();
  const data = text ? JSON.parse(text) : null;
  if (!res.ok) throw new ApiError(res.status, extractDetail(data, `Yükleme başarısız (${res.status})`));
  return keysToCamel(data) as T;
}

/** Boş/undefined alanları FormData'ya hiç koymaz (backend hepsini opsiyonel bekliyor). */
function appendOptional(form: FormData, fields: Record<string, string | undefined | null>) {
  for (const [k, v] of Object.entries(fields)) {
    if (v !== undefined && v !== null && String(v).trim() !== "") form.append(k, String(v).trim());
  }
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

// ---------------------------------------------------------------------------
// E1 adım 3 — Örnek (sample) uçları: atlas / arama / karşılaştırma / detay
// Bu uçlar herkese açık (token zorunlu değil); apiFetch token varsa ekler.
// ---------------------------------------------------------------------------

import type { VerificationStatus, HistoryEntry } from "./labels";

/** Statik dosyaların (görsellerin) kökü: API_URL'den /api/v1 çıkarılır. */
export const API_HOST = API_URL.replace(/\/api\/v1\/?$/, "");

/** Backend'den gelen "/static/..." yolunu tam URL'ye çevirir. */
export function assetUrl(path?: string | null): string | null {
  if (!path) return null;
  if (/^https?:\/\//.test(path)) return path;
  return `${API_HOST}${path.startsWith("/") ? "" : "/"}${path}`;
}

export interface Sample {
  id: string;
  documentId: string;
  croppedImagePath: string;
  croppedImageUrl: string | null;
  coordinates: Record<string, number> | null;
  readValue: string | null;
  variantType: string | null;
  expertNote: string | null;
  verificationStatus: VerificationStatus;
  aiPrediction: string | null;
  aiConfidence: number | null;
  createdAt: string;
  updatedAt: string;
  // bağlı belgeden düzleştirilen alanlar
  archiveRef: string | null;
  sourceRef: string | null;
  dateText: string | null;
  century: string | null;
  region: string | null;
  documentType: string | null;
  documentImagePath: string | null;
  documentImageUrl: string | null;
}

export interface FacetItem {
  value: string;
  count: number;
}

export interface SampleFacets {
  regions: FacetItem[];
  centuries: FacetItem[];
  documentTypes: FacetItem[];
  verificationStatuses: FacetItem[];
  total: number;
}

export interface SampleFilters {
  region?: string;
  century?: string;
  documentType?: string;
  verificationStatus?: string;
  query?: string;
}

/** Filtreleri backend'in beklediği snake_case query string'e çevirir. */
function filterQuery(f: SampleFilters = {}): string {
  const p = new URLSearchParams();
  if (f.region) p.set("region", f.region);
  if (f.century) p.set("century", f.century);
  if (f.documentType) p.set("document_type", f.documentType);
  if (f.verificationStatus) p.set("verification_status", f.verificationStatus);
  if (f.query && f.query.trim()) p.set("query", f.query.trim());
  const qs = p.toString();
  return qs ? `?${qs}` : "";
}

/** GET /samples — atlas ve arama listesi. */
export function listSamples(filters: SampleFilters = {}): Promise<Sample[]> {
  return apiFetch<Sample[]>(`/samples${filterQuery(filters)}`);
}

/** GET /samples/facets — filtre seçenekleri + sayılar. */
export function getFacets(filters: SampleFilters = {}): Promise<SampleFacets> {
  return apiFetch<SampleFacets>(`/samples/facets${filterQuery(filters)}`);
}

/** GET /samples/{id} — örnek detayı. */
export function getSample(id: string): Promise<Sample> {
  return apiFetch<Sample>(`/samples/${id}`);
}

/** GET /samples/compare?ids=a,b — 2+ örnek karşılaştırma. */
export function compareSamples(ids: string[]): Promise<Sample[]> {
  return apiFetch<Sample[]>(`/samples/compare?ids=${encodeURIComponent(ids.join(","))}`);
}

/** GET /verification/{id}/history — doğrulama/değişiklik geçmişi. */
export function getSampleHistory(id: string): Promise<HistoryEntry[]> {
  return apiFetch<HistoryEntry[]>(`/verification/${id}/history`);
}


// ---------------------------------------------------------------------------
// E1 adım 4 — Veri ekleme akışı: POST /documents + POST /samples (multipart)
// Her ikisi de token ZORUNLU (get_current_user).
// ---------------------------------------------------------------------------

export interface SiyakatDocument {
  id: string;
  archiveRef: string | null;
  sourceRef: string | null;
  dateText: string | null;
  century: string | null;
  region: string | null;
  documentType: string | null;
  description: string | null;
  imagePath: string;
  createdAt: string;
}

export interface DocumentInput {
  archiveRef?: string;
  sourceRef?: string;
  dateText?: string;
  century?: string;
  region?: string;
  documentType?: string;
  description?: string;
}

/** POST /documents — belge görseli + metadata. Dönen `id` örnek kaydında kullanılır. */
export function createDocument(
  file: File | Blob,
  meta: DocumentInput = {},
  fileName?: string
): Promise<SiyakatDocument> {
  const form = new FormData();
  form.append("file", file, fileName ?? (file instanceof File ? file.name : "document"));
  appendOptional(form, {
    archive_ref: meta.archiveRef,
    source_ref: meta.sourceRef,
    date_text: meta.dateText,
    century: meta.century,
    region: meta.region,
    document_type: meta.documentType,
    description: meta.description,
  });
  return apiUpload<SiyakatDocument>("/documents", form);
}

export interface SampleInput {
  documentId: string;
  /** Tarayıcıda kırpılmış görsel (lib/cropImage.ts). */
  croppedImage: File | Blob;
  /** Normalize (0..1) koordinatlar; backend'e JSON string olarak gider. */
  coordinates?: { x: number; y: number; width: number; height: number } | null;
  readValue?: string;
  variantType?: string;
  expertNote?: string;
}

/** POST /samples — kırpılmış görsel + koordinat + okuma. Taslak (draft) olarak kaydedilir. */
export function createSample(input: SampleInput, fileName = "crop.png"): Promise<Sample> {
  const form = new FormData();
  form.append("document_id", input.documentId);
  form.append("cropped_image", input.croppedImage, fileName);
  if (input.coordinates) form.append("coordinates", JSON.stringify(input.coordinates));
  appendOptional(form, {
    read_value: input.readValue,
    variant_type: input.variantType,
    expert_note: input.expertNote,
  });
  return apiUpload<Sample>("/samples", form);
}


// ---------------------------------------------------------------------------
// E1 adım 5 — Uzman paneli + kullanıcı yönetimi
// PATCH /samples/{id} (JSON) · GET/POST /users · PATCH /users/{id}
// ---------------------------------------------------------------------------

import type { UserRole } from "./labels";

export interface SampleUpdateInput {
  readValue?: string | null;
  variantType?: string | null;
  expertNote?: string | null;
  verificationStatus?: VerificationStatus;
}

/**
 * PATCH /samples/{id} — yalnızca gönderilen alanlar değişir; her değişiklik
 * backend'de VerificationHistory'ye düşer. Token zorunlu;
 * `verificationStatus` yalnızca uzman/yönetici tarafından değiştirilebilir.
 */
export function updateSample(id: string, patch: SampleUpdateInput): Promise<Sample> {
  return apiFetch<Sample>(`/samples/${id}`, { method: "PATCH", body: patch });
}

export interface AdminUserInput {
  email: string;
  password: string;
  fullName?: string;
  role?: UserRole;
}

export interface UserPatch {
  fullName?: string;
  role?: UserRole;
  isActive?: boolean;
}

/** GET /users — kullanıcı listesi (admin). */
export function listUsers(): Promise<AuthUser[]> {
  return apiFetch<AuthUser[]>("/users");
}

/** POST /users — rol seçerek kullanıcı oluşturma (admin). */
export function createUser(input: AdminUserInput): Promise<AuthUser> {
  return apiFetch<AuthUser>("/users", { method: "POST", body: input });
}

/** PATCH /users/{id} — ad / rol / aktiflik güncelleme (admin). */
export function updateUser(id: string, patch: UserPatch): Promise<AuthUser> {
  return apiFetch<AuthUser>(`/users/${id}`, { method: "PATCH", body: patch });
}
