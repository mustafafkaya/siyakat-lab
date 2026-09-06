"""
Uygulama genelinde kullanılan ayarlar.
Yeni bir ayar eklemek gerektiğinde SADECE bu dosya değişir.
"""
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    PROJECT_NAME: str = "SİYAKAT-LAB"
    API_V1_PREFIX: str = "/api/v1"

    DATABASE_URL: str = "postgresql://siyakat:siyakat@db:5432/siyakat_lab"

    SECRET_KEY: str = "dev-secret-key"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440

    STORAGE_BACKEND: str = "local"  # ileride: "s3"
    STORAGE_ROOT: str = "./storage"

    AI_SERVICE_MODE: str = "dummy"  # V2'de "real" olacak

    # İlk yönetici (bootstrap): `python -m app.seed` bu bilgilerle bir admin oluşturur.
    FIRST_SUPERUSER_EMAIL: str = "admin@siyakat-lab.com"
    FIRST_SUPERUSER_PASSWORD: str = "changeme"
    FIRST_SUPERUSER_NAME: str = "Sistem Yöneticisi"

    # Loglama
    LOG_LEVEL: str = "INFO"

    class Config:
        env_file = ".env"


settings = Settings()
