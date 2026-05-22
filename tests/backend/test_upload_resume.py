from __future__ import annotations

import io

import pytest

from engine.app import create_app


@pytest.fixture()
def client():
    app = create_app()
    app.config.update(TESTING=True)
    with app.test_client() as c:
        yield c


def _make_multipart(file_bytes: bytes, filename: str, content_type: str = "application/octet-stream"):
    return {
        "resume": (io.BytesIO(file_bytes), filename, content_type),
    }


def test_valid_extension_empty_rejected(client):
    resp = client.post("/api/upload-resume", data=_make_multipart(b"", "resume.pdf"))
    assert resp.status_code == 400
    j = resp.get_json()
    assert j["error"]["code"] == "empty_upload"


def test_invalid_extension_rejected(client):
    resp = client.post(
        "/api/upload-resume",
        data=_make_multipart(b"hello", "resume.exe", "application/octet-stream"),
    )
    assert resp.status_code == 400
    j = resp.get_json()
    assert j["error"]["code"] == "invalid_extension"


def test_txt_upload_works(client):
    content = "Python JavaScript Flask React SQL"
    resp = client.post(
        "/api/upload-resume",
        data=_make_multipart(content.encode("utf-8"), "resume.txt", "text/plain"),
    )
    assert resp.status_code == 200
    j = resp.get_json()
    assert "skills" in j
    assert "python" in {s.lower() for s in j["skills"]}

