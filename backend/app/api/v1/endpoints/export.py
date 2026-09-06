"""
B12 · Export altyapısı (JSON / CSV).

Atlas/arama ile aynı filtreleri kabul eder; sonuçları indirilebilir dosya olarak döner.
Belge metadata'sı örnekle birlikte tek satırda düzleştirilir (araştırmacı için kullanışlı).
V2/V3 alanları (ai_prediction, ductus vb.) şema büyüdükçe buraya eklenir; sözleşme bozulmaz.
"""
import csv
import io
import json
from datetime import datetime, timezone

from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse
from sqlalchemy import or_
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.sample import SiyakatSample, VerificationStatus
from app.models.document import Document

router = APIRouter(prefix="/export", tags=["export"])

# Dışa aktarımda yer alacak sütunlar (örnek + bağlı belge metadata'sı düzleştirilmiş)
EXPORT_FIELDS = [
    "sample_id",
    "read_value",
    "variant_type",
    "verification_status",
    "expert_note",
    "coordinates",
    "cropped_image_path",
    "created_at",
    "document_id",
    "archive_ref",
    "source_ref",
    "date_text",
    "century",
    "region",
    "document_type",
]


def _filtered_query(db: Session, region, century, document_type, verification_status, query):
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
    return q.order_by(SiyakatSample.created_at.desc())


def _row(s: SiyakatSample) -> dict:
    d = s.document
    return {
        "sample_id": str(s.id),
        "read_value": s.read_value,
        "variant_type": s.variant_type,
        "verification_status": s.verification_status.value if s.verification_status else None,
        "expert_note": s.expert_note,
        "coordinates": json.dumps(s.coordinates, ensure_ascii=False) if s.coordinates else None,
        "cropped_image_path": s.cropped_image_path,
        "created_at": s.created_at.isoformat() if s.created_at else None,
        "document_id": str(s.document_id),
        "archive_ref": d.archive_ref if d else None,
        "source_ref": d.source_ref if d else None,
        "date_text": d.date_text if d else None,
        "century": d.century if d else None,
        "region": d.region if d else None,
        "document_type": d.document_type if d else None,
    }


@router.get("/samples")
def export_samples(
    format: str = "json",
    region: str | None = None,
    century: str | None = None,
    document_type: str | None = None,
    verification_status: VerificationStatus | None = None,
    query: str | None = None,
    db: Session = Depends(get_db),
):
    """format=json (varsayılan) ya da format=csv. Arama ekranıyla aynı filtreler."""
    samples = _filtered_query(db, region, century, document_type, verification_status, query).all()
    rows = [_row(s) for s in samples]
    stamp = datetime.now(timezone.utc).strftime("%Y%m%d_%H%M%S")

    if format == "csv":
        buf = io.StringIO()
        buf.write("﻿")  # Excel'de Türkçe karakterler için BOM
        writer = csv.DictWriter(buf, fieldnames=EXPORT_FIELDS)
        writer.writeheader()
        writer.writerows(rows)
        buf.seek(0)
        return StreamingResponse(
            iter([buf.getvalue()]),
            media_type="text/csv; charset=utf-8",
            headers={"Content-Disposition": f'attachment; filename="siyakat_samples_{stamp}.csv"'},
        )

    payload = json.dumps(
        {"count": len(rows), "exported_at": stamp, "samples": rows},
        ensure_ascii=False,
        indent=2,
    )
    return StreamingResponse(
        iter([payload]),
        media_type="application/json; charset=utf-8",
        headers={"Content-Disposition": f'attachment; filename="siyakat_samples_{stamp}.json"'},
    )
