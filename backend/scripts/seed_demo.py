"""
E2 · Demo veri tohumlama.

Boş bir veritabanını uçtan uca akışı (ve E2E testini) çalıştırmaya hazır hâle getirir:
  - 3 kullanıcı: admin / uzman / katılımcı
  - Sentetik belge görselleri + kırpılmış örnekler (farklı bölge, yüzyıl, belge türü, durum)

Kullanım:
    python -m scripts.seed_demo             # eksikleri ekler (idempotent)
    python -m scripts.seed_demo --reset     # önce demo örnekleri/belgeleri siler

DİKKAT: geliştirme/test içindir; üretimde çalıştırmayın.
"""
import argparse
import io
import sys

from PIL import Image, ImageDraw

from app.core.database import SessionLocal
from app.core.security import hash_password
from app.models.document import Document
from app.models.sample import SiyakatSample, VerificationStatus
from app.models.user import User, UserRole
from app.models.verification import VerificationHistory
from app.services.storage import get_storage

DEMO_TAG = "DEMO"

DEMO_USERS = [
    ("admin@siyakat-lab.com", "Sistem Yöneticisi", UserRole.ADMIN, "admin1234"),
    ("uzman@siyakat-lab.com", "Uzman Demo", UserRole.EXPERT, "uzman1234"),
    ("katilimci@siyakat-lab.com", "Katılımcı Demo", UserRole.USER, "katilimci1234"),
]

# (arşiv ref, bölge, yüzyıl, belge türü, okunan değer, durum)
DEMO_SAMPLES = [
    ("BOA.TS.MA.d 1250", "İstanbul", "12. yy (H.)", "Tereke Defteri", "1250", VerificationStatus.VERIFIED),
    ("BOA.MAD.d 375", "Bursa", "10. yy (H.)", "Vergi Defteri", "375", VerificationStatus.PENDING_REVIEW),
    ("BOA.KK.d 8420", "Edirne", "11. yy (H.)", "Mukataa Kaydı", "8420", VerificationStatus.PENDING_REVIEW),
    ("BOA.TS.MA.d 62", "İstanbul", "12. yy (H.)", "Tereke Defteri", "62", VerificationStatus.DRAFT),
]


def _page_image(text: str) -> bytes:
    """Belge sayfası taklidi: açık zeminli, üzerinde okunabilir bir 'rakam alanı'."""
    img = Image.new("RGB", (600, 400), (245, 240, 228))
    d = ImageDraw.Draw(img)
    for y in range(60, 360, 40):
        d.line([(60, y), (540, y)], fill=(214, 205, 186), width=1)
    d.rectangle([150, 150, 450, 250], outline=(160, 120, 60), width=2)
    d.text((170, 190), text, fill=(60, 45, 30))
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    return buf.getvalue()


def _crop_image(text: str) -> bytes:
    img = Image.new("RGB", (300, 100), (250, 246, 236))
    ImageDraw.Draw(img).text((20, 40), text, fill=(60, 45, 30))
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    return buf.getvalue()


def ensure_users(db) -> dict[str, User]:
    users: dict[str, User] = {}
    for email, full_name, role, password in DEMO_USERS:
        user = db.query(User).filter(User.email == email).first()
        if not user:
            user = User(
                email=email,
                full_name=full_name,
                hashed_password=hash_password(password),
                role=role,
            )
            db.add(user)
            db.flush()
            print(f"  + kullanıcı: {email} ({role.value}) / parola: {password}")
        users[role.value] = user
    db.commit()
    return users


def reset_demo(db, storage) -> None:
    docs = db.query(Document).filter(Document.description == DEMO_TAG).all()
    doc_ids = [d.id for d in docs]
    if not doc_ids:
        print("  temizlenecek demo verisi yok")
        return
    samples = db.query(SiyakatSample).filter(SiyakatSample.document_id.in_(doc_ids)).all()
    sample_ids = [s.id for s in samples]
    if sample_ids:
        db.query(VerificationHistory).filter(
            VerificationHistory.sample_id.in_(sample_ids)
        ).delete(synchronize_session=False)
        db.query(SiyakatSample).filter(SiyakatSample.id.in_(sample_ids)).delete(
            synchronize_session=False
        )
    db.query(Document).filter(Document.id.in_(doc_ids)).delete(synchronize_session=False)
    db.commit()
    print(f"  - {len(doc_ids)} demo belge, {len(sample_ids)} örnek silindi")


def seed(reset: bool = False) -> None:
    db = SessionLocal()
    storage = get_storage()
    try:
        print("Demo veri tohumlanıyor...")
        users = ensure_users(db)
        if reset:
            reset_demo(db, storage)

        uploader = users[UserRole.USER.value]
        expert = users[UserRole.EXPERT.value]

        for archive_ref, region, century, doc_type, value, status in DEMO_SAMPLES:
            if db.query(Document).filter(Document.archive_ref == archive_ref).first():
                continue

            doc = Document(
                archive_ref=archive_ref,
                source_ref="Demo koleksiyonu",
                date_text=f"{century} · {region}",
                century=century,
                region=region,
                document_type=doc_type,
                description=DEMO_TAG,
                image_path=storage.save(_page_image(value), "demo-belge.png", subfolder="documents"),
                uploaded_by=uploader.id,
            )
            db.add(doc)
            db.flush()

            sample = SiyakatSample(
                document_id=doc.id,
                cropped_image_path=storage.save(_crop_image(value), "demo-kirpma.png", subfolder="samples"),
                coordinates={"x": 0.25, "y": 0.375, "width": 0.5, "height": 0.25},
                read_value=value,
                variant_type="standart",
                verification_status=status,
                created_by=uploader.id,
            )
            if status in (VerificationStatus.VERIFIED, VerificationStatus.REJECTED):
                sample.verified_by = expert.id
                sample.expert_note = "Demo: uzman tarafından doğrulandı."
            db.add(sample)
            db.flush()

            # Geçmiş kaydı: taslak -> mevcut durum (audit zinciri boş kalmasın)
            if status is not VerificationStatus.DRAFT:
                db.add(
                    VerificationHistory(
                        sample_id=sample.id,
                        changed_by=(expert.id if sample.verified_by else uploader.id),
                        field_changed="verification_status",
                        old_value=VerificationStatus.DRAFT.value,
                        new_value=status.value,
                        note="Demo tohumlama",
                    )
                )
            print(f"  + örnek: {value} · {region} · {status.value}")

        db.commit()
        total = db.query(SiyakatSample).count()
        print(f"Bitti. Toplam örnek: {total}")
    finally:
        db.close()


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="SİYAKAT-LAB demo veri tohumlama")
    parser.add_argument("--reset", action="store_true", help="Önce demo belge/örnekleri sil")
    args = parser.parse_args()
    try:
        seed(reset=args.reset)
    except Exception as exc:  # pragma: no cover - operasyonel betik
        print(f"HATA: {exc}", file=sys.stderr)
        raise SystemExit(1)
