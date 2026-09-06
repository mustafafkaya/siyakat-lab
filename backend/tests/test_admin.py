"""E1 adım 5 testleri: kullanıcı yönetimi (admin), rol kısıtları ve geçmişte kullanıcı adı."""
import io

from app.models.user import User, UserRole
from tests.conftest import register_and_login


def _png():
    return ("t.png", io.BytesIO(b"fake-image-bytes"), "image/png")


def _promote(db_session, email: str, role: UserRole, full_name: str | None = None) -> User:
    user = db_session.query(User).filter(User.email == email).first()
    user.role = role
    if full_name:
        user.full_name = full_name
    db_session.commit()
    return user


def _make_sample(client, headers) -> str:
    r = client.post(
        "/api/v1/documents", headers=headers, files={"file": _png()}, data={"region": "Erzurum"}
    )
    doc_id = r.json()["id"]
    r = client.post(
        "/api/v1/samples",
        headers=headers,
        files={"cropped_image": _png()},
        data={"document_id": doc_id, "read_value": "1250"},
    )
    return r.json()["id"]


def test_non_admin_cannot_manage_users(client):
    headers = register_and_login(client, "plain@e.com")
    assert client.get("/api/v1/users", headers=headers).status_code == 403
    assert client.get("/api/v1/users").status_code == 401


def test_admin_lists_creates_and_updates_users(client, db_session):
    headers = register_and_login(client, "admin1@e.com")
    _promote(db_session, "admin1@e.com", UserRole.ADMIN)

    r = client.get("/api/v1/users", headers=headers)
    assert r.status_code == 200
    assert any(u["email"] == "admin1@e.com" for u in r.json())

    # Admin rol seçerek kullanıcı oluşturur
    r = client.post(
        "/api/v1/users",
        headers=headers,
        json={"email": "expert1@e.com", "full_name": "Uzman Bir", "password": "pass1234", "role": "expert"},
    )
    assert r.status_code == 201, r.text
    created = r.json()
    assert created["role"] == "expert"
    assert created["is_active"] is True

    # Aynı e-posta ikinci kez -> 400
    r = client.post(
        "/api/v1/users",
        headers=headers,
        json={"email": "expert1@e.com", "password": "pass1234", "role": "expert"},
    )
    assert r.status_code == 400

    # Rol ve aktiflik güncelleme
    r = client.patch(
        f"/api/v1/users/{created['id']}", headers=headers, json={"role": "user", "is_active": False}
    )
    assert r.status_code == 200
    assert r.json()["role"] == "user"
    assert r.json()["is_active"] is False

    # Pasif kullanıcı giriş yapsa da yetkilendirilemez
    r = client.post("/api/v1/auth/login", data={"username": "expert1@e.com", "password": "pass1234"})
    token = r.json()["access_token"]
    r = client.get("/api/v1/users/me", headers={"Authorization": f"Bearer {token}"})
    assert r.status_code == 401


def test_admin_cannot_demote_or_deactivate_self(client, db_session):
    headers = register_and_login(client, "admin2@e.com")
    me = _promote(db_session, "admin2@e.com", UserRole.ADMIN)

    r = client.patch(f"/api/v1/users/{me.id}", headers=headers, json={"role": "user"})
    assert r.status_code == 400
    r = client.patch(f"/api/v1/users/{me.id}", headers=headers, json={"is_active": False})
    assert r.status_code == 400
    # Ad değişikliği serbest
    r = client.patch(f"/api/v1/users/{me.id}", headers=headers, json={"full_name": "Yönetici"})
    assert r.status_code == 200
    assert r.json()["full_name"] == "Yönetici"


def test_verification_status_requires_expert_role(client, db_session):
    owner = register_and_login(client, "owner@e.com")
    sample_id = _make_sample(client, owner)

    # Sıradan kullanıcı okuma değerini değiştirebilir ve incelemeye gönderebilir
    r = client.patch(f"/api/v1/samples/{sample_id}", headers=owner, json={"read_value": "1251"})
    assert r.status_code == 200
    r = client.patch(
        f"/api/v1/samples/{sample_id}", headers=owner, json={"verification_status": "pending_review"}
    )
    assert r.status_code == 200

    # ...ama onay/ret kararını veremez
    r = client.patch(
        f"/api/v1/samples/{sample_id}", headers=owner, json={"verification_status": "verified"}
    )
    assert r.status_code == 403

    # Uzman değiştirebilir
    expert = register_and_login(client, "expert2@e.com")
    _promote(db_session, "expert2@e.com", UserRole.EXPERT, full_name="Uzman İki")
    r = client.patch(
        f"/api/v1/samples/{sample_id}",
        headers=expert,
        json={"verification_status": "verified", "expert_note": "Doğru okundu"},
    )
    assert r.status_code == 200
    assert r.json()["verification_status"] == "verified"


def test_history_returns_changed_by_name(client, db_session):
    expert = register_and_login(client, "expert3@e.com")
    _promote(db_session, "expert3@e.com", UserRole.EXPERT, full_name="Uzman Üç")
    sample_id = _make_sample(client, expert)

    client.patch(
        f"/api/v1/samples/{sample_id}", headers=expert, json={"verification_status": "pending_review"}
    )
    r = client.get(f"/api/v1/verification/{sample_id}/history")
    assert r.status_code == 200
    entries = r.json()
    assert entries, "geçmiş boş olmamalı"
    assert entries[0]["changed_by_name"] == "Uzman Üç"
    assert entries[0]["field_changed"] == "verification_status"
