import uuid
from datetime import datetime
from typing import Optional, Any, Dict

from pydantic import BaseModel


class DocumentCreate(BaseModel):
    archive_ref: Optional[str] = None
    source_ref: Optional[str] = None
    date_text: Optional[str] = None
    century: Optional[str] = None
    region: Optional[str] = None
    document_type: Optional[str] = None
    description: Optional[str] = None
    metadata_extra: Optional[Dict[str, Any]] = None


class DocumentOut(BaseModel):
    id: uuid.UUID
    archive_ref: Optional[str]
    source_ref: Optional[str]
    date_text: Optional[str]
    century: Optional[str]
    region: Optional[str]
    document_type: Optional[str]
    description: Optional[str]
    image_path: str
    created_at: datetime

    class Config:
        from_attributes = True
