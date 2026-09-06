"""B12 · Export (JSON/CSV) ve örnek güncellemede audit log testleri."""
import io

from tests.conftest import register_and_login


def _png():
    return ("t.png", io.BytesIO(b"fake-image-bytes"), "image/png")


def _make_sample(client, region="Sivas", read_value="999"):
    headers = register_and_login(client, f"exp_{region}_{read_value}@e.com")
    doc = client.post(
        "/api/v1/documents", headers=headers, files={"file": _png()}, data={"region": region}
    ).json()
    sample = client.post(
        "/api/v1/samples",
        headers=headers,
        files={"cropped_image": _png()},
        data={"document_id": doc["id"], "read_value": read_value},
    ).json()
    return headers, sample


def test_export_json(client):
    _, sample = _make_sample(client, region="Sivas", read_value="111")
    r = client.get("/api/v1/export/samples?format=json&region=Sivas")
    assert r.status_code == 200
    assert "application/json" in r.headers["content-type"]
    assert "attachment" in r.headers["content-disposition"]
    body = r.json()
    assert body["count"] >= 1
    assert any(s["sample_id"] == sample["id"] and s["region"] == "Sivas" for s in body["samples"])


def test_export_csv(client):
    _, sample = _make_sample(client, region="Kars", read_value="222")
    r = client.get("/api/v1/export/samples?format=csv&region=Kars")
    assert r.status_code == 200
    assert "text/csv" in r.headers["content-type"]
    text = r.content.decode("utf-8-sig")
    lines = [l for l in text.splitlines() if l.strip()]
    assert lines[0].startswith("sample_id,")  # başlık satırı
    assert any("222" in l and "Kars" in l for l in lines[1:])


def test_update_writes_audit_history(client):
    headers, sample = _make_sample(client, region="Van", read_value="333")
    r = client.patch(
        f"/api/v1/samples/{sample['id']}",
        headers=headers,
        json={"read_value": "334", "verification_status": "pending_review"},
    )
    assert r.status_code == 200
    assert r.json()["read_value"] == "334"

    hist = client.get(f"/api/v1/verification/{sample['id']}/history").json()
    fields = {h["field_changed"]: h for h in hist}
    assert "read_value" in fields
    assert fields["read_value"]["old_value"] == "333"
    assert fields["read_value"]["new_value"] == "334"
    assert "verification_status" in fields
