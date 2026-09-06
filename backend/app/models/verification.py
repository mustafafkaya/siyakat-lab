"""
Her değişiklikte kim/ne/ne zaman/neden bilgisini saklayan denetim (audit) tablosu.
Yol haritası madde D: "Uzman doğrulama sistemi" gereksinimi.
"""
import uuid
from datetime import datetime, timezone

from sqlalchemy import Column, String, Text, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import UUID

from app.core.database import Base


class VerificationHistory(Base):
    __tablename__ = "verification_history"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    sample_id = Column(UUID(as_uuid=True), ForeignKey("siyakat_samples.id"), nullable=False)
    changed_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)

    field_changed = Column(String, nullable=True)
    old_value = Column(Text, nullable=True)
    new_value = Column(Text, nullable=True)
    note = Column(Text, nullable=True)

    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
