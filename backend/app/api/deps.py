"""
Endpoint'lerde ortak kullanılan dependency'ler: mevcut kullanıcıyı çözme,
rol bazlı yetki kontrolü.
"""
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import decode_access_token
from app.models.user import User, UserRole

oauth2_scheme = OAuth2PasswordBearer(tokenUrl=f"/api/v1/auth/login")


def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)) -> User:
    email = decode_access_token(token)
    if not email:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Geçersiz veya süresi dolmuş token")
    user = db.query(User).filter(User.email == email).first()
    if not user or not user.is_active:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Kullanıcı bulunamadı")
    return user


def require_role(*roles: UserRole):
    """Kullanım: Depends(require_role(UserRole.EXPERT, UserRole.ADMIN))"""
    def checker(user: User = Depends(get_current_user)) -> User:
        if user.role not in roles:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Bu işlem için yetkiniz yok")
        return user
    return checker
