"""
İlk yönetici (admin) bootstrap script'i.

Kullanım:
    python -m app.seed

Ayarları `app/core/config.py` (ve .env) üzerinden okur:
    FIRST_SUPERUSER_EMAIL / FIRST_SUPERUSER_PASSWORD / FIRST_SUPERUSER_NAME

Neden gerekli: kayıt (register) endpoint'i herkesi 'user' rolüyle oluşturur.
Doğrulama (verification) ve kullanıcı yönetimi ise 'expert'/'admin' ister.
Bu script, taze veritabanında SQL'e girmeden ilk admin'i oluşturur.

Idempotent: admin zaten varsa tekrar oluşturmaz, gerekiyorsa rolünü admin'e yükseltir.
"""
import logging

from app.core.database import SessionLocal
from app.core.security import hash_password
from app.core.config import settings
from app.models.user import User, UserRole

logger = logging.getLogger("siyakat.seed")


def create_first_superuser() -> None:
    db = SessionLocal()
    try:
        email = settings.FIRST_SUPERUSER_EMAIL
        existing = db.query(User).filter(User.email == email).first()

        if existing:
            if existing.role != UserRole.ADMIN:
                existing.role = UserRole.ADMIN
                db.commit()
                logger.info("Mevcut kullanıcı admin'e yükseltildi: %s", email)
            else:
                logger.info("Admin zaten mevcut, işlem yok: %s", email)
            return

        admin = User(
            email=email,
            full_name=settings.FIRST_SUPERUSER_NAME,
            hashed_password=hash_password(settings.FIRST_SUPERUSER_PASSWORD),
            role=UserRole.ADMIN,
        )
        db.add(admin)
        db.commit()
        logger.info("İlk admin oluşturuldu: %s", email)
    finally:
        db.close()


if __name__ == "__main__":
    logging.basicConfig(level=settings.LOG_LEVEL)
    create_first_superuser()
    print(f"Bootstrap tamam. Admin e-postası: {settings.FIRST_SUPERUSER_EMAIL}")
