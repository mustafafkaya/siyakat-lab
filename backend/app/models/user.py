"""
Kullanıcı ve rol modeli.

Roller:
- admin   : tam yetki
- expert  : doğrulama/onay yapabilir, uzman notu girebilir
- user    : belge/örnek yükleyebilir, kendi katkılarını görebilir
"""
import enum
import uuid
from datetime import datetime, timezone

from sqlalchemy import Column, String, DateTime, Enum, Boolean
from sqlalchemy.dialects.postgresql import UUID

from app.core.database import Base


class UserRole(str, enum.Enum):
    ADMIN = "admin"
    EXPERT = "expert"
    USER = "user"


class User(Base):
    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email = Column(String, unique=True, index=True, nullable=False)
    full_name = Column(String, nullable=True)
    hashed_password = Column(String, nullable=False)
    role = Column(Enum(UserRole), default=UserRole.USER, nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
