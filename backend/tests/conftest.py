"""
Test altyapısı.

- Testler ayrı bir veritabanına bağlanır (TEST_DATABASE_URL). Böylece geliştirme
  verisi bozulmaz.
- Her test oturumundan önce tablolar oluşturulur, sonra silinir.
- get_db bağımlılığı test oturumuna yönlendirilir.
- FastAPI TestClient ile gerçek HTTP akışı test edilir.
"""
import os

# App import edilmeden ÖNCE DB adresini test veritabanına çevir.
os.environ["DATABASE_URL"] = os.environ.get(
    "TEST_DATABASE_URL",
    "postgresql://siyakat:siyakat@127.0.0.1:5432/siyakat_test",
)
os.environ.setdefault("STORAGE_ROOT", "/tmp/siyakat_test_storage")
# StaticFiles mount (app import anında) için klasör hazır olmalı
os.makedirs(os.environ["STORAGE_ROOT"], exist_ok=True)

import pytest
from fastapi.testclient import TestClient

from app import models as _models  # noqa: F401 - tüm modeller metadata'ya kaydolsun
from app.core.database import Base, engine, get_db, SessionLocal
from app.main import app


@pytest.fixture(scope="session", autouse=True)
def _create_schema():
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)


@pytest.fixture()
def db_session():
    session = SessionLocal()
    try:
        yield session
    finally:
        session.close()


@pytest.fixture()
def client():
    def _get_db_override():
        db = SessionLocal()
        try:
            yield db
        finally:
            db.close()

    app.dependency_overrides[get_db] = _get_db_override
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.clear()


def register_and_login(client, email, password="pass1234"):
    client.post("/api/v1/auth/register", json={"email": email, "password": password})
    r = client.post("/api/v1/auth/login", data={"username": email, "password": password})
    token = r.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}
