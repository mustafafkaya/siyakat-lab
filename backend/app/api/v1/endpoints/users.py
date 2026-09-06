"""
Kullanıcı uçları.

- GET  /users/me        : oturumdaki kullanıcı
- GET  /users           : liste (admin)
- POST /users           : yeni kullanıcı + rol ile (admin)
- PATCH /users/{id}     : ad / rol / aktiflik güncelle (admin)

Güvenlik notu: admin kendi rolünü düşüremez ve kendini pasifleştiremez
(sistemde yetkili kullanıcı kalmaması riskine karşı).
"""
import uuid

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import hash_password
from app.api.deps import get_current_user, require_role
from app.models.user import User, UserRole
from app.schemas.user import UserOut, UserUpdate, AdminUserCreate

router = APIRouter(prefix="/users", tags=["users"])


@router.get("/me", response_model=UserOut)
def read_me(current_user: User = Depends(get_current_user)):
    return current_user


@router.get("", response_model=list[UserOut])
def list_users(
    db: Session = Depends(get_db),
    _: User = Depends(require_role(UserRole.ADMIN)),
):
    return db.query(User).order_by(User.created_at.asc()).all()


@router.post("", response_model=UserOut, status_code=201)
def create_user(
    payload: AdminUserCreate,
    db: Session = Depends(get_db),
    _: User = Depends(require_role(UserRole.ADMIN)),
):
    """Admin, rolü belirlenmiş kullanıcı oluşturur (self-register yalnızca 'user' rolü verir)."""
    if db.query(User).filter(User.email == payload.email).first():
        raise HTTPException(status_code=400, detail="Bu e-posta zaten kayıtlı")
    user = User(
        email=payload.email,
        full_name=payload.full_name,
        hashed_password=hash_password(payload.password),
        role=payload.role,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def _get_user_or_404(db: Session, user_id: str) -> User:
    try:
        uid = uuid.UUID(str(user_id))
    except ValueError:
        raise HTTPException(status_code=404, detail="Kullanıcı bulunamadı")
    user = db.query(User).filter(User.id == uid).first()
    if not user:
        raise HTTPException(status_code=404, detail="Kullanıcı bulunamadı")
    return user


@router.patch("/{user_id}", response_model=UserOut)
def update_user(
    user_id: str,
    payload: UserUpdate,
    db: Session = Depends(get_db),
    admin: User = Depends(require_role(UserRole.ADMIN)),
):
    user = _get_user_or_404(db, user_id)
    changes = payload.model_dump(exclude_unset=True)

    if user.id == admin.id:
        if "role" in changes and changes["role"] != UserRole.ADMIN:
            raise HTTPException(status_code=400, detail="Kendi yönetici rolünüzü kaldıramazsınız")
        if changes.get("is_active") is False:
            raise HTTPException(status_code=400, detail="Kendi hesabınızı pasifleştiremezsiniz")

    for field, value in changes.items():
        setattr(user, field, value)

    db.commit()
    db.refresh(user)
    return user
