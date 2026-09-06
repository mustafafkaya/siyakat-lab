/**
 * Gerçek siyakat veri seti gelene kadar arayüzü test etmek için kullanılan sahte veri.
 * Gerçek API bağlandığında bu dosyanın yerini `lib/api.ts` çağrıları alacak;
 * bileşenlerin prop şekli DEĞİŞMEYECEK şekilde tasarlandı.
 */
export type DummySample = {
  id: string;
  readValue: string;
  region: string;
  century: string;
  documentType: string;
  verificationStatus: "draft" | "pending_review" | "verified" | "rejected";
  thumbnailColor: string; // gerçek görsel yerine renkli blok
};

export const dummySamples: DummySample[] = [
  { id: "s1", readValue: "1250", region: "İstanbul", century: "13. yy (H.)", documentType: "Tereke Defteri", verificationStatus: "verified", thumbnailColor: "bg-amber-200" },
  { id: "s2", readValue: "375", region: "Bursa", century: "10. yy (H.)", documentType: "Vergi Defteri", verificationStatus: "pending_review", thumbnailColor: "bg-orange-200" },
  { id: "s3", readValue: "8420", region: "Edirne", century: "11. yy (H.)", documentType: "Mukataa Kaydı", verificationStatus: "verified", thumbnailColor: "bg-stone-300" },
  { id: "s4", readValue: "62", region: "İstanbul", century: "12. yy (H.)", documentType: "Tereke Defteri", verificationStatus: "draft", thumbnailColor: "bg-amber-100" },
];

// ---------------------------------------------------------------------------
// Faz 3 eklemeleri — F8 / F11 / F12 ekranları için sahte veri.
// E1'de (Faz 4) bu yapıların yerini gerçek API çağrıları alacak; tipler korunur.
// ---------------------------------------------------------------------------

export const statusLabels: Record<DummySample["verificationStatus"], string> = {
  draft: "Taslak",
  pending_review: "İnceleme Bekliyor",
  verified: "Doğrulandı",
  rejected: "Reddedildi",
};

export const statusStyles: Record<DummySample["verificationStatus"], string> = {
  draft: "bg-stone-100 text-stone-600",
  pending_review: "bg-amber-100 text-amber-800",
  verified: "bg-green-100 text-green-800",
  rejected: "bg-red-100 text-red-800",
};

export type UserRole = "user" | "expert" | "admin";

export type DummyUser = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  active: boolean;
};

export const roleLabels: Record<UserRole, string> = {
  user: "Kullanıcı",
  expert: "Uzman",
  admin: "Yönetici",
};

export const dummyUsers: DummyUser[] = [
  { id: "u1", name: "Mustafa Kaya", email: "admin@siyakat-lab.com", role: "admin", active: true },
  { id: "u2", name: "Ayşe Yıldız", email: "ayse@siyakat-lab.com", role: "expert", active: true },
  { id: "u3", name: "Kemal Demir", email: "kemal@siyakat-lab.com", role: "expert", active: true },
  { id: "u4", name: "Zeynep Aksoy", email: "zeynep@siyakat-lab.com", role: "user", active: true },
  { id: "u5", name: "Test Kullanıcı", email: "test@siyakat-lab.com", role: "user", active: false },
];

export type HistoryEntry = {
  id: string;
  changedBy: string;
  fieldChanged: string;
  oldValue: string | null;
  newValue: string | null;
  note: string | null;
  createdAt: string; // ISO
};

// sample id -> doğrulama/değişiklik geçmişi
export const dummyHistory: Record<string, HistoryEntry[]> = {
  s1: [
    { id: "h1", changedBy: "Mustafa Kaya", fieldChanged: "created", oldValue: null, newValue: "draft", note: "Örnek oluşturuldu", createdAt: "2026-08-20T09:12:00Z" },
    { id: "h2", changedBy: "Mustafa Kaya", fieldChanged: "verification_status", oldValue: "draft", newValue: "pending_review", note: "İncelemeye gönderildi", createdAt: "2026-08-21T14:03:00Z" },
    { id: "h3", changedBy: "Ayşe Yıldız", fieldChanged: "read_value", oldValue: "1200", newValue: "1250", note: "Okuma düzeltildi", createdAt: "2026-08-23T10:41:00Z" },
    { id: "h4", changedBy: "Ayşe Yıldız", fieldChanged: "verification_status", oldValue: "pending_review", newValue: "verified", note: "Tereke defteri karşılaştırıldı, doğru.", createdAt: "2026-08-23T10:45:00Z" },
  ],
  s2: [
    { id: "h5", changedBy: "Zeynep Aksoy", fieldChanged: "created", oldValue: null, newValue: "draft", note: "Örnek oluşturuldu", createdAt: "2026-08-28T08:00:00Z" },
    { id: "h6", changedBy: "Zeynep Aksoy", fieldChanged: "verification_status", oldValue: "draft", newValue: "pending_review", note: "İncelemeye gönderildi", createdAt: "2026-08-29T16:20:00Z" },
  ],
};
