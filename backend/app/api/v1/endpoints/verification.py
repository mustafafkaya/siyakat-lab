from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.api.deps import require_role
from app.models.user import User, UserRole
from app.models.sample import SiyakatSample, VerificationStatus
from app.models.verification import VerificationHistory
from app.schemas.verification import VerificationAction, VerificationHistoryOut

router = APIRouter(prefix="/verification", tags=["verification"])


@router.post("/{sample_id}/decide", status_code=200)
def decide(
    sample_id: str,
    payload: VerificationAction,
    db: Session = Depends(get_db),
    expert: User = Depends(require_role(UserRole.EXPERT, UserRole.ADMIN)),
):
    sample = db.query(SiyakatSample).filter(SiyakatSample.id == sample_id).first()
    if not sample:
        raise HTTPException(status_code=404, detail="Örnek bulunamadı")

    if payload.status not in (VerificationStatus.VERIFIED.value, VerificationStatus.REJECTED.value):
        raise HTTPException(status_code=400, detail="Geçersiz durum. 'verified' ya da 'rejected' olmalı")

    old_status = sample.verification_status.value
    sample.verification_status = VerificationStatus(payload.status)
    sample.verified_by = expert.id

    history = VerificationHistory(
        sample_id=sample.id,
        changed_by=expert.id,
        field_changed="verification_status",
        old_value=old_status,
        new_value=payload.status,
        note=payload.note,
    )
    db.add(history)
    db.commit()
    return {"detail": "Durum güncellendi", "new_status": payload.status}


@router.get("/{sample_id}/history", response_model=list[VerificationHistoryOut])
def get_history(sample_id: str, db: Session = Depends(get_db)):
    return (
        db.query(VerificationHistory)
        .filter(VerificationHistory.sample_id == sample_id)
        .order_by(VerificationHistory.created_at.desc())
        .all()
    )
