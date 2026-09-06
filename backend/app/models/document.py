"""
Belge modeli (Osmanlı mali belgesi).

metadata_extra: yol haritasında belirtilmeyen ama ileride ihtiyaç duyulabilecek
ek alanlar için JSON alan. Şema kesinleşene kadar esneklik sağlar.
"""
import uuid
from datetime import datetime, timezone

from sqlalchemy import Column, String, Text, DateTime, ForeignKey, JSON
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.core.database import Base


class Document(Base):
    __tablename__ = "documents"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    archive_ref = Column(String, nullable=True)      # arşiv/koleksiyon
    source_ref = Column(String, nullable=True)        # kaynak/referans
    date_text = Column(String, nullable=True)         # serbest metin tarih (örn. "1250 H.")
    century = Column(String, nullable=True)            # dönem/yüzyıl
    region = Column(String, nullable=True)              # coğrafi bölge
    document_type = Column(String, nullable=True)       # belge türü
    description = Column(Text, nullable=True)

    image_path = Column(String, nullable=False)        # storage service üzerinden erişilir

    metadata_extra = Column(JSON, nullable=True, default=dict)

    uploaded_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    samples = relationship("SiyakatSample", back_populates="document")
