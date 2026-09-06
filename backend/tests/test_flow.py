"""Uçtan uca akış + doğrulama + bootstrap testleri (B4, B5, B6, B10, B11, A1)."""
import io

from app.models.user import User, UserRole
from tests.conftest import register_and_login


def _png():
    return ("t.png", io.BytesIO(b"fake-image-bytes"), "image/png")


def test_document_and_sample_flow(client):
    headers = register_and_login(client, "flow@e.com")

    # Belge yükle
    r = client.post(
        "/api/v1/documents",
        headers=headers,
        files={"file": _png()},
        data={"region": "Erzurum", "century": "19"},
    )
    assert r.status_code == 201
    doc_id = r.json()["id"]

    # Örnek oluştur
    r = client.post(
        "/api/v1/samples",
        headers=headers,
        files={"cropped_image": _png()},
        data={
            "document_id": doc_id,
            "coordinates": '{"x":10,"y":20,"width":100,"height":50}',
            "read_value": "1250",
        },
    )
    assert r.status_code == 201
    sample = r.json()
    assert sample["read_value"] == "1250"
    assert sample["verification_status"] == "draft"

    # Arama: bölgeye göre filtre
    r = client.get("/api/v1/samples?region=Erzurum")
    assert r.status_code == 200
    assert any(s["id"] == sample["id"] for s in r.json())


def test_compare_needs_two_ids(client):
    r = client.get("/api/v1/samples/compare?ids=only-one")
    assert r.status_code == 400


def test_ai_predict_dummy(client):
    r = client.post("/api/v1/ai/predict", files={"image": _png()})
    assert r.status_code == 200
    assert r.json()["model_version"] == "dummy-v0"


def test_seed_creates_admin_and_can_verify(client, db_session):
    """Bootstrap ile admin oluşur ve doğrulama (verification) akışını yürütebilir."""
    from app.seed import create_first_superuser
    from app.core.config import settings

    create_first_superuser()
    admin = db_session.query(User).filter(User.email == settings.FIRST_SUPERUSER_EMAIL).first()
    assert admin is not None
    assert admin.role == UserRole.ADMIN

    # admin login
    r = client.post(
        "/api/v1/auth/login",
        data={"username": settings.FIRST_SUPERUSER_EMAIL, "password": settings.FIRST_SUPERUSER_PASSWORD},
    )
    admin_headers = {"Authorization": f"Bearer {r.json()['access_token']}"}

    # bir örnek hazırla (normal kullanıcı ile)
    user_headers = register_and_login(client, "owner@e.com")
    doc = client.post(
        "/api/v1/documents", headers=user_headers, files={"file": _png()}, data={"region": "Bursa"}
    ).json()
    sample = client.post(
        "/api/v1/samples",
        headers=user_headers,
        files={"cropped_image": _png()},
        data={"document_id": doc["id"], "read_value": "375"},
    ).json()

    # admin doğrular
    r = client.post(
        f"/api/v1/verification/{sample['id']}/decide",
        headers=admin_headers,
        json={"status": "verified", "note": "doğru"},
    )
    assert r.status_code == 200
    assert r.json()["new_status"] == "verified"

    # audit geçmişi kaydı oluştu
    r = client.get(f"/api/v1/verification/{sample['id']}/history")
    assert r.status_code == 200
    history = r.json()
    assert len(history) >= 1
    assert history[0]["new_value"] == "verified"
