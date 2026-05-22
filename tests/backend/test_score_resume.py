from __future__ import annotations

import json
import pytest

from engine.app import create_app


@pytest.fixture()
def client():
    app = create_app()
    app.config.update(TESTING=True)
    with app.test_client() as c:
        yield c


def test_score_resume_success(client):
    payload = {
        "resume_text": "I am an expert Python and React software engineer with extensive SQL experience.",
        "job_description": "We are seeking a senior engineer with expertise in Python, React, and Docker.",
        "skills": ["python", "react", "sql"]
    }
    resp = client.post(
        "/api/score-resume",
        data=json.dumps(payload),
        content_type="application/json"
    )
    assert resp.status_code == 200
    j = resp.get_json()
    assert "ats_score" in j
    assert "skill_match_score" in j
    assert "relevance_score" in j
    assert "coverage_score" in j
    assert "matched_skills" in j
    assert "missing_skills" in j
    assert "recommendations" in j

    # Check skill matching
    assert "python" in j["matched_skills"]
    assert "react" in j["matched_skills"]
    assert "docker" in j["missing_skills"]


def test_score_resume_empty_rejected(client):
    payload = {
        "resume_text": "",
        "job_description": "Looking for React developer."
    }
    resp = client.post(
        "/api/score-resume",
        data=json.dumps(payload),
        content_type="application/json"
    )
    assert resp.status_code == 400
    j = resp.get_json()
    assert j["error"]["code"] in ["invalid_input_schema", "empty_resume_text"]


def test_score_resume_non_json_rejected(client):
    resp = client.post(
        "/api/score-resume",
        data="plain text request",
        content_type="text/plain"
    )
    assert resp.status_code == 400
    j = resp.get_json()
    assert j["error"]["code"] == "missing_json"
