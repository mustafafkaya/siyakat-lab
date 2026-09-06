"""Auth + rol yetkilendirme testleri (B2, B3)."""
from tests.conftest import register_and_login


def test_health(client):
    r = client.get("/health")
    assert r.status_code == 200
    assert r.json()["status"] == "ok"


def test_register_and_login(client):
    r = client.post(
        "/api/v1/auth/register",
        json={"email": "auth_user@e.com", "full_name": "U", "password": "pass1234"},
    )
    assert r.status_code == 201
    assert r.json()["role"] == "user"

    r = client.post(
        "/api/v1/auth/login",
        data={"username": "auth_user@e.com", "password": "pass1234"},
    )
    assert r.status_code == 200
    assert r.json()["access_token"]


def test_duplicate_email_rejected(client):
    client.post("/api/v1/auth/register", json={"email": "dup@e.com", "password": "pass1234"})
    r = client.post("/api/v1/auth/register", json={"email": "dup@e.com", "password": "pass1234"})
    assert r.status_code == 400


def test_me_requires_token(client):
    r = client.get("/api/v1/users/me")
    assert r.status_code == 401


def test_user_cannot_list_users(client):
    """Normal kullanıcı admin-only /users endpoint'ine erişemez (403)."""
    headers = register_and_login(client, "plainuser@e.com")
    r = client.get("/api/v1/users", headers=headers)
    assert r.status_code == 403
