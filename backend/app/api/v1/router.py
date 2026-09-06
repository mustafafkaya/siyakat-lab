"""
Tüm v1 endpoint'lerini tek çatı altında toplar.
Yeni bir modül (V2, V3, V4) eklendiğinde tek yapılacak şey burada bir satır eklemek.
"""
from fastapi import APIRouter

from app.api.v1.endpoints import auth, users, documents, samples, verification, ai, export

api_router = APIRouter()

api_router.include_router(auth.router)
api_router.include_router(users.router)
api_router.include_router(documents.router)
api_router.include_router(samples.router)
api_router.include_router(verification.router)
api_router.include_router(ai.router)  # V2 gerçek modelle güçlenecek, sözleşme sabit
api_router.include_router(export.router)  # B12: JSON/CSV dışa aktarım
