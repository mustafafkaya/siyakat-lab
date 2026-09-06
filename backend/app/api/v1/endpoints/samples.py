import json

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy import or_
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.models.sample import SiyakatSample, VerificationStatus
from app.models.document import Document
from app.models.verification import VerificationHistory
from app.schemas.sample import SampleOut, SampleUpdate
from app.services.storage import get_storage

router = APIRouter(prefix="/samples", tags=["samples"])


@router.post("", response_model=SampleOut, status_code=201)
def create_sample(
    document_id: str = Form(...),
    cropped_image: UploadFile = File(...),
    coordinates: str | None = Form(None),  # JSON string: {"x":.., "y":.., "width":.., "height":..}
    read_value: str | None = Form(None),
    variant_type: str | None = Form(None),
    expert_note: str | None = Form(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    document = db.query(Document).filter(Document.id == document_id).first()
    if not document:
        raise HTTPException(status_code=404, detail="Bağlı belge bulunamadı")

    storage = get_storage()
    file_bytes = cropped_image.file.read()
    path = storage.save(file_bytes, cropped_image.filename, subfolder="samples")

    coords = json.loads(coordinates) if coordinates else None

    sample = SiyakatSample(
        document_id=document_id,
        cropped_image_path=path,
        coordinates=coords,
        read_value=read_value,
        variant_type=variant_type,
        expert_note=expert_note,
        verification_status=VerificationStatus.DRAFT,
        created_by=current_user.id,
    )
    db.add(sample)
    db.commit()
    db.refresh(sample)
    return sample


@router.get("", response_model=list[SampleOut])
def search_samples(
    region: str | None = None,
    century: str | None = None,
    document_type: str | None = None,
    verification_status: VerificationStatus | None = None,
    query: str | None = None,
    db: Session = Depends(get_db),
):
    """
    Atlas/katalog için ana arama-filtreleme endpoint'i.
    Belge metadata'sı üzerinden join ile filtreler (V1 madde: arama, filtreleme).
    """
    q = db.query(SiyakatSample).join(Document, SiyakatSample.document_id == Document.id)

    if region:
        q = q.filter(Document.region == region)
    if century:
        q = q.filter(Document.century == century)
    if document_type:
        q = q.filter(Document.document_type == document_type)
    if verification_status:
        q = q.filter(SiyakatSample.verification_status == verification_status)
    if query:
        like = f"%{query}%"
        q = q.filter(or_(SiyakatSample.read_value.ilike(like), SiyakatSample.expert_note.ilike(like)))

    return q.order_by(SiyakatSample.created_at.desc()).all()


@router.get("/compare", response_model=list[SampleOut])
def compare_samples(ids: str, db: Session = Depends(get_db)):
    """İki veya daha fazla örneği karşılaştırma. ids=uuid1,uuid2,uuid3"""
    id_list = [i.strip() for i in ids.split(",") if i.strip()]
    if len(id_list) < 2:
        raise HTTPException(status_code=400, detail="Karşılaştırma için en az 2 örnek ID'si gerekli")
    samples = db.query(SiyakatSample).filter(SiyakatSample.id.in_(id_list)).all()
    return samples


@router.get("/{sample_id}", response_model=SampleOut)
def get_sample(sample_id: str, db: Session = Depends(get_db)):
    sample = db.query(SiyakatSample).filter(SiyakatSample.id == sample_id).first()
    if not sample:
        raise HTTPException(status_code=404, detail="Örnek bulunamadı")
    return sample


@router.patch("/{sample_id}", response_model=SampleOut)
def update_sample(
    sample_id: str,
    payload: SampleUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    sample = db.query(SiyakatSample).filter(SiyakatSample.id == sample_id).first()
    if not sample:
        raise HTTPException(status_code=404, detail="Örnek bulunamadı")

    changes = payload.model_dump(exclude_unset=True)
    for field, value in changes.items():
        old_value = getattr(sample, field)
        old_str = old_value.value if hasattr(old_value, "value") else (str(old_value) if old_value is not None else None)
        new_str = value.value if hasattr(value, "value") else (str(value) if value is not None else None)
        if old_str != new_str:
            db.add(VerificationHistory(
                sample_id=sample.id,
                changed_by=current_user.id,
                field_changed=field,
                old_value=old_str,
                new_value=new_str,
            ))
        setattr(sample, field, value)

    db.commit()
    db.refresh(sample)
    return sample
