"""
Örnek (SiyakatSample) sorgu filtreleri — tek kaynak.

Arama (`/samples`), filtre seçenekleri (`/samples/facets`) ve export
(`/export/samples`) aynı filtre mantığını kullanır. Filtre kuralı değişirse
SADECE bu dosya değişir; üç uç birden tutarlı kalır.
"""
from sqlalchemy import or_
from sqlalchemy.orm import Query

from app.models.document import Document
from app.models.sample import SiyakatSample

# Desteklenen filtre boyutları
FILTER_DIMENSIONS = ("region", "century", "document_type", "verification_status", "query")


def apply_sample_filters(
    q: Query,
    *,
    region=None,
    century=None,
    document_type=None,
    verification_status=None,
    query=None,
    exclude: tuple = (),
) -> Query:
    """
    Verilen sorguya filtreleri uygular.

    exclude: uygulanmayacak boyutlar. Facet hesabında kullanılır — bir boyutun
    seçenekleri listelenirken kendi filtresi dışarıda bırakılır ki kullanıcı
    diğer seçeneklere de geçebilsin.
    """
    if region and "region" not in exclude:
        q = q.filter(Document.region == region)
    if century and "century" not in exclude:
        q = q.filter(Document.century == century)
    if document_type and "document_type" not in exclude:
        q = q.filter(Document.document_type == document_type)
    if verification_status and "verification_status" not in exclude:
        q = q.filter(SiyakatSample.verification_status == verification_status)
    if query and "query" not in exclude:
        like = f"%{query}%"
        q = q.filter(
            or_(
                SiyakatSample.read_value.ilike(like),
                SiyakatSample.expert_note.ilike(like),
            )
        )
    return q
