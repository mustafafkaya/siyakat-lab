"""
Dosya depolama soyutlaması.

Neden önemli: Yol haritasında "dosya/görsel depolama sistemi" V1'de kurulacak,
ama ileride bulut depolamaya (S3 vb.) geçiş ihtiyacı doğabilir. Bu dosya
haricindeki hiçbir kod, dosyaların diskte mi yoksa S3'te mi durduğunu bilmez.
Sadece bu sınıfın metodlarını çağırır.

İleride S3StorageBackend eklemek için: aynı arayüzü (save/get_url/delete)
uygulayan yeni bir sınıf yaz, get_storage() içinde seçimi ayarlar üzerinden yap.
"""
import os
import uuid
from abc import ABC, abstractmethod

from app.core.config import settings


class StorageBackend(ABC):
    @abstractmethod
    def save(self, file_bytes: bytes, original_filename: str, subfolder: str) -> str:
        """Dosyayı kaydeder, erişim için kullanılacak 'path/key' döner."""

    @abstractmethod
    def get_url(self, path: str) -> str:
        """Kaydedilen dosyaya erişim URL'sini döner."""

    @abstractmethod
    def delete(self, path: str) -> None:
        ...


class LocalStorageBackend(StorageBackend):
    def __init__(self, root: str):
        self.root = root
        os.makedirs(root, exist_ok=True)

    def save(self, file_bytes: bytes, original_filename: str, subfolder: str) -> str:
        ext = os.path.splitext(original_filename)[1]
        filename = f"{uuid.uuid4()}{ext}"
        folder = os.path.join(self.root, subfolder)
        os.makedirs(folder, exist_ok=True)
        full_path = os.path.join(folder, filename)
        with open(full_path, "wb") as f:
            f.write(file_bytes)
        return os.path.join(subfolder, filename)

    def get_url(self, path: str) -> str:
        # V1'de backend aynı sunucudan statik dosya servis eder
        return f"/static/{path}"

    def delete(self, path: str) -> None:
        full_path = os.path.join(self.root, path)
        if os.path.exists(full_path):
            os.remove(full_path)


def get_storage() -> StorageBackend:
    if settings.STORAGE_BACKEND == "local":
        return LocalStorageBackend(settings.STORAGE_ROOT)
    # elif settings.STORAGE_BACKEND == "s3":
    #     return S3StorageBackend(...)
    raise ValueError(f"Bilinmeyen STORAGE_BACKEND: {settings.STORAGE_BACKEND}")
