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


def test_contract_response_shape_for_txt(client):
    content = "Python Flask React SQL"
    resp = client.post(
        "/api/upload-resume",
        data={"resume": (io.BytesIO(content.encode('utf-8')), 'resume.txt')},
        content_type='multipart/form-data',
    )
    assert resp.status_code == 200
    j = resp.get_json()
    assert set(["name", "email", "skills", "education", "experience", "raw_text"]).issubset(j.keys())
    assert isinstance(j["skills"], list)

