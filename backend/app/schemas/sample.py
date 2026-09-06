import uuid
from datetime import datetime
from typing import Optional, Any, Dict, List

from pydantic import BaseModel

from app.models.sample import VerificationStatus


class Coordinates(BaseModel):
    x: float
    y: float
    width: float
    height: float


class SampleCreate(BaseModel):
    document_id: uuid.UUID
    coordinates: Optional[Coordinates] = None
    read_value: Optional[str] = None
    variant_type: Optional[str] = None
    expert_note: Optional[str] = None


class SampleUpdate(BaseModel):
    read_value: Optional[str] = None
    variant_type: Optional[str] = None
    expert_note: Optional[str] = None
    verification_status: Optional[VerificationStatus] = None


class SampleOut(BaseModel):
    """
    Atlas/arama/karşılaştırma kartlarının ihtiyaç duyduğu her şeyi TEK yanıtta verir:
    örnek alanları + bağlı belgenin metadata'sı (düzleştirilmiş) + görsel URL'si.
    Böylece frontend her kart için ayrı belge isteği atmaz.
    """
    id: uuid.UUID
    document_id: uuid.UUID
    cropped_image_path: str
    cropped_image_url: Optional[str] = None
    coordinates: Optional[Dict[str, Any]] = None
    read_value: Optional[str] = None
    variant_type: Optional[str] = None
    expert_note: Optional[str] = None
    verification_status: VerificationStatus
    ai_prediction: Optional[str] = None
    ai_confidence: Optional[float] = None
    created_at: datetime
    updated_at: datetime

    # --- bağlı belgeden düzleştirilen alanlar (frontend kartları bunları gösterir) ---
    archive_ref: Optional[str] = None
    source_ref: Optional[str] = None
    date_text: Optional[str] = None
    century: Optional[str] = None
    region: Optional[str] = None
    document_type: Optional[str] = None
    document_image_path: Optional[str] = None
    document_image_url: Optional[str] = None

    class Config:
        from_attributes = True

    @classmethod
    def from_sample(cls, sample, storage=None) -> "SampleOut":
        """ORM örneğinden (belge alanları gömülü) yanıt üretir."""
        from app.services.storage import get_storage

        storage = storage or get_storage()
        doc = getattr(sample, "document", None)
        return cls(
            id=sample.id,
            document_id=sample.document_id,
            cropped_image_path=sample.cropped_image_path,
            cropped_image_url=storage.get_url(sample.cropped_image_path)
            if sample.cropped_image_path
            else None,
            coordinates=sample.coordinates,
            read_value=sample.read_value,
            variant_type=sample.variant_type,
            expert_note=sample.expert_note,
            verification_status=sample.verification_status,
            ai_prediction=sample.ai_prediction,
            ai_confidence=sample.ai_confidence,
            created_at=sample.created_at,
            updated_at=sample.updated_at,
            archive_ref=doc.archive_ref if doc else None,
            source_ref=doc.source_ref if doc else None,
            date_text=doc.date_text if doc else None,
            century=doc.century if doc else None,
            region=doc.region if doc else None,
            document_type=doc.document_type if doc else None,
            document_image_path=doc.image_path if doc else None,
            document_image_url=storage.get_url(doc.image_path) if doc and doc.image_path else None,
        )


class SampleFilter(BaseModel):
    region: Optional[str] = None
    century: Optional[str] = None
    document_type: Optional[str] = None
    verification_status: Optional[VerificationStatus] = None
    query: Optional[str] = None  # serbest metin arama (read_value, expert_note vs.)


class FacetItem(BaseModel):
    """Bir filtre seçeneği ve o seçenekle eşleşen örnek sayısı."""
    value: str
    count: int


class SampleFacets(BaseModel):
    """
    Filtre ekranının (F4) seçenek listeleri. Her boyut, DİĞER aktif filtreler
    uygulanmış hâlde hesaplanır; kendi filtresi hesaba katılmaz ki kullanıcı
    seçimini değiştirebilsin.
    """
    regions: List[FacetItem] = []
    centuries: List[FacetItem] = []
    document_types: List[FacetItem] = []
    verification_statuses: List[FacetItem] = []
    total: int = 0
