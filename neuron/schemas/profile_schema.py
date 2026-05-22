from __future__ import annotations

from typing import Any, Dict

from jsonschema import validate


PROFILE_SCHEMA: Dict[str, Any] = {
    "type": "object",
    "required": ["name", "email", "skills", "education", "experience", "raw_text"],
    "properties": {
        "name": {"type": "string"},
        "email": {"type": "string"},
        "skills": {
            "type": "array",
            "items": {"type": "string"},
        },
        "education": {"type": "array", "items": {"type": "object"}},
        "experience": {"type": "array", "items": {"type": "object"}},
        "raw_text": {"type": "string"},
    },
    "additionalProperties": True,
}


def validate_profile(profile: Dict[str, Any]) -> None:
    validate(instance=profile, schema=PROFILE_SCHEMA)

