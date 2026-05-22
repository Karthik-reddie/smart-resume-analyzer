from __future__ import annotations

import pytest

from neuron.schemas.profile_schema import validate_profile


def test_profile_schema_accepts_mvp_shape():
    profile = {
        "name": "",
        "email": "",
        "skills": ["python"],
        "education": [],
        "experience": [],
        "raw_text": "some text",
        "extra": {"x": 1},
    }
    validate_profile(profile)


def test_profile_schema_rejects_missing_required_fields():
    with pytest.raises(Exception):
        validate_profile({"skills": []})

