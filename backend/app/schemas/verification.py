import uuid
from datetime import datetime
from typing import Optional

from pydantic import BaseModel


class VerificationAction(BaseModel):
    status: str  # "verified" | "rejected"
    note: Optional[str] = None


class VerificationHistoryOut(BaseModel):
    id: uuid.UUID
    sample_id: uuid.UUID
    changed_by: Optional[uuid.UUID]
    field_changed: Optional[str]
    old_value: Optional[str]
    new_value: Optional[str]
    note: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True
