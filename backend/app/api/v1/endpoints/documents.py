from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.models.document import Document
from app.schemas.document import DocumentOut
from app.services.storage import get_storage

router = APIRouter(prefix="/documents", tags=["documents"])


@router.post("", response_model=DocumentOut, status_code=201)
def upload_document(
    file: UploadFile = File(...),
    archive_ref: str | None = Form(None),
    source_ref: str | None = Form(None),
    date_text: str | None = Form(None),
    century: str | None = Form(None),
    region: str | None = Form(None),
    document_type: str | None = Form(None),
    description: str | None = Form(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    storage = get_storage()
    file_bytes = file.file.read()
    path = storage.save(file_bytes, file.filename, subfolder="documents")

    doc = Document(
        archive_ref=archive_ref,
        source_ref=source_ref,
        date_text=date_text,
        century=century,
        region=region,
        document_type=document_type,
        description=description,
        image_path=path,
        uploaded_by=current_user.id,
    )
    db.add(doc)
    db.commit()
    db.refresh(doc)
    return doc


@router.get("", response_model=list[DocumentOut])
def list_documents(
    region: str | None = None,
    century: str | None = None,
    document_type: str | None = None,
    db: Session = Depends(get_db),
):
    q = db.query(Document)
    if region:
        q = q.filter(Document.region == region)
    if century:
        q = q.filter(Document.century == century)
    if document_type:
        q = q.filter(Document.document_type == document_type)
    return q.order_by(Document.created_at.desc()).all()


@router.get("/{document_id}", response_model=DocumentOut)
def get_document(document_id: str, db: Session = Depends(get_db)):
    doc = db.query(Document).filter(Document.id == document_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Belge bulunamadı")
    return doc
