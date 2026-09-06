import uuid
from datetime import datetime
from typing import Optional

from pydantic import BaseModel, EmailStr

from app.models.user import UserRole


class UserCreate(BaseModel):
    email: EmailStr
    full_name: Optional[str] = None
    password: str


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserOut(BaseModel):
    id: uuid.UUID
    email: EmailStr
    full_name: Optional[str]
    role: UserRole
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


class AdminUserCreate(BaseModel):
    """Admin panelinden kullanıcı oluşturma (rol seçilebilir)."""
    email: EmailStr
    full_name: Optional[str] = None
    password: str
    role: UserRole = UserRole.USER


class UserUpdate(BaseModel):
    """Admin panelinden güncelleme; yalnızca gönderilen alanlar değişir."""
    full_name: Optional[str] = None
    role: Optional[UserRole] = None
    is_active: Optional[bool] = None
