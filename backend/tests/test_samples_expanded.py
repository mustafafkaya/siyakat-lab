"""
E1 · Genişletilmiş örnek yanıtı (belge alanları gömülü) ve filtre seçenekleri (facets).

Frontend'in atlas/arama/karşılaştırma kartları region/century/documentType ve
görsel URL'sini TEK istekte alabilmeli; filtre ekranı seçenekleri veriden
öğrenmeli. Bu testler o sözleşmeyi korur.
"""
import io

from tests.conftest import register_and_login


def _png():
    return ("t.png", io.BytesIO(b"fake-image-bytes"), "image/png")


def _make(client, email, *, region, century, document_type, read_value):
    headers = register_and_login(client, email)
    doc = client.post(
        "/api/v1/documents",
        headers=headers,
        files={"file": _png()},
        data={
            "region": region,
            "century": century,
            "document_type": document_type,
            "archive_ref": "BOA-001",
            "date_text": "1250 H.",
        },
    ).json()
    sample = client.post(
        "/api/v1/samples",
        headers=headers,
        files={"cropped_image": _png()},
        data={"document_id": doc["id"], "read_value": read_value},
    ).json()
    return headers, doc, sample


def test_create_returns_document_fields(client):
    _, doc, sample = _make(
        client, "exp1@e.com", region="Trabzon", century="12", document_type="Tereke", read_value="1250"
    )
    assert sample["region"] == "Trabzon"
    assert sample["century"] == "12"
    assert sample["document_type"] == "Tereke"
    assert sample["archive_ref"] == "BOA-001"
    assert sample["date_text"] == "1250 H."
    assert sample["cropped_image_url"].startswith("/static/")
    assert sample["document_image_url"].startswith("/static/")


def test_search_and_detail_and_compare_carry_document_fields(client):
    _, _, s1 = _make(
        client, "exp2@e.com", region="Konya", century="11", document_type="Mukataa", read_value="500"
    )
    _, _, s2 = _make(
        client, "exp3@e.com", region="Konya", century="11", document_type="Mukataa", read_value="600"
    )

    r = client.get("/api/v1/samples?region=Konya")
    assert r.status_code == 200
    rows = r.json()
    assert all(row["region"] == "Konya" and row["document_type"] == "Mukataa" for row in rows)

    r = client.get(f"/api/v1/samples/{s1['id']}")
    assert r.status_code == 200
    assert r.json()["century"] == "11"

    r = client.get(f"/api/v1/samples/compare?ids={s1['id']},{s2['id']}")
    assert r.status_code == 200
    assert {row["region"] for row in r.json()} == {"Konya"}


def test_facets_lists_values_with_counts(client):
    _make(client, "fac1@e.com", region="Facet-A", century="13", document_type="Vergi", read_value="10")
    _make(client, "fac2@e.com", region="Facet-A", century="14", document_type="Vergi", read_value="20")

    r = client.get("/api/v1/samples/facets")
    assert r.status_code == 200
    data = r.json()
    regions = {f["value"]: f["count"] for f in data["regions"]}
    assert regions.get("Facet-A") == 2
    assert data["total"] >= 2
    assert any(f["value"] == "draft" for f in data["verification_statuses"])


def test_facets_apply_other_filters_but_not_own(client):
    _make(client, "fac3@e.com", region="Facet-B", century="15", document_type="Tereke", read_value="30")
    _make(client, "fac4@e.com", region="Facet-B", century="16", document_type="Tereke", read_value="40")

    r = client.get("/api/v1/samples/facets?region=Facet-B&century=15")
    data = r.json()

    # century filtresi uygulandığı için bölge sayısı 1'e düşer
    regions = {f["value"]: f["count"] for f in data["regions"]}
    assert regions.get("Facet-B") == 1

    # kendi boyutunda filtre uygulanmaz: her iki yüzyıl da seçenek olarak kalır
    centuries = {f["value"] for f in data["centuries"]}
    assert {"15", "16"} <= centuries

    assert data["total"] == 1
