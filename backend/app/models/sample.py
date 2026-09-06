"""
Siyakat örneği modeli.

V1 alanları temel bilgileri kapsar. V2/V3'te eklenecek AI ve biçimsel analiz
alanları şimdiden nullable JSON/String olarak tanımlanmıştır; böylece ileride
yeni bir tablo veya büyük migration gerekmeden doldurulabilir.
"""
import enum
import uuid
from datetime import datetime, timezone

from sqlalchemy import Column, String, Text, DateTime, ForeignKey, JSON, Float, Enum
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.core.database import Base


class VerificationStatus(str, enum.Enum):
    DRAFT = "draft"                    # taslak
    PENDING_REVIEW = "pending_review"  # inceleme bekliyor
    VERIFIED = "verified"               # doğrulandı
    REJECTED = "rejected"               # reddedildi / düzeltme gerekli


class SiyakatSample(Base):
    __tablename__ = "siyakat_samples"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    document_id = Column(UUID(as_uuid=True), ForeignKey("documents.id"), nullable=False)

    cropped_image_path = Column(String, nullable=False)
    coordinates = Column(JSON, nullable=True)   # {x, y, width, height} - belge üzerindeki konum

    read_value = Column(String, nullable=True)       # okunan değer (örn. "1250")
    variant_type = Column(String, nullable=True)      # varyant/tip

    expert_note = Column(Text, nullable=True)

    verification_status = Column(
        Enum(VerificationStatus), default=VerificationStatus.DRAFT, nullable=False
    )
    verified_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)

    # --- V3: Açıklanabilir Siyakat için ileri alanlar (şimdilik boş kalabilir) ---
    grid_features = Column(JSON, nullable=True)         # grid system özellikleri
    ductus_annotation = Column(JSON, nullable=True)      # kalem hareketi/nokta/çizgi anotasyonu
    formal_features = Column(JSON, nullable=True)        # biçimsel özellik analizi
    philological_note = Column(Text, nullable=True)      # HER ZAMAN hipotez olarak işaretlenmeli
    alternative_interpretations = Column(JSON, nullable=True)

    # --- V2: AI tanıma/benzerlik için ileri alanlar ---
    ai_prediction = Column(String, nullable=True)
    ai_confidence = Column(Float, nullable=True)
    ai_alternatives = Column(JSON, nullable=True)
    embedding = Column(JSON, nullable=True)   # V1'de JSON; veri büyüyünce pgvector'e taşınabilir
    model_version = Column(String, nullable=True)

    created_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    document = relationship("Document", back_populates="samples")
