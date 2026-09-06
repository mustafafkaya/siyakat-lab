/**
 * Ortak etiketler ve tipler (dummy veriden bağımsız).
 * E1: sayfalar artık gerçek API'den beslendiği için durum etiketleri
 * dummyData.ts yerine bu dosyada tek kaynakta tutulur.
 */

export type VerificationStatus = "draft" | "pending_review" | "verified" | "rejected";

export const statusLabels: Record<VerificationStatus, string> = {
  draft: "Taslak",
  pending_review: "İnceleme Bekliyor",
  verified: "Doğrulandı",
  rejected: "Reddedildi",
};

export const statusStyles: Record<VerificationStatus, string> = {
  draft: "bg-stone-100 text-stone-600",
  pending_review: "bg-amber-100 text-amber-800",
  verified: "bg-green-100 text-green-800",
  rejected: "bg-red-100 text-red-800",
};

export const statusOrder: VerificationStatus[] = [
  "draft",
  "pending_review",
  "verified",
  "rejected",
];

/** Doğrulama/değişiklik geçmişi kaydı (GET /verification/{id}/history). */
export type HistoryEntry = {
  id: string;
  changedBy: string | null;
  /** E1 adım 5: backend kullanıcının görünen adını da döndürür. */
  changedByName?: string | null;
  fieldChanged: string;
  oldValue: string | null;
  newValue: string | null;
  note: string | null;
  createdAt: string; // ISO
};

/** Kullanıcı rolleri (backend UserRole ile birebir). */
export type UserRole = "user" | "expert" | "admin";

export const roleLabels: Record<UserRole, string> = {
  user: "Kullanıcı",
  expert: "Uzman",
  admin: "Yönetici",
};

export const roleOrder: UserRole[] = ["user", "expert", "admin"];

/** Uzman paneline erişebilen roller. */
export function canReview(role?: string | null): boolean {
  return role === "expert" || role === "admin";
}
