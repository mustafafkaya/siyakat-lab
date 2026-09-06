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
    id: uuid.UUID
    document_id: uuid.UUID
    cropped_image_path: str
    coordinates: Optional[Dict[str, Any]]
    read_value: Optional[str]
    variant_type: Optional[str]
    expert_note: Optional[str]
    verification_status: VerificationStatus
    ai_prediction: Optional[str]
    ai_confidence: Optional[float]
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class SampleFilter(BaseModel):
    region: Optional[str] = None
    century: Optional[str] = None
    document_type: Optional[str] = None
    verification_status: Optional[VerificationStatus] = None
    query: Optional[str] = None  # serbest metin arama (read_value, expert_note vs.)
