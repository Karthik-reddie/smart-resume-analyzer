from __future__ import annotations

from dataclasses import dataclass
from typing import Any, Dict, List

import re


WHITESPACE_RE = re.compile(r"[\t\r\n]+")
NON_PRINTING_RE = re.compile(r"[^\x09\x0A\x0D\x20-\x7E\u0080-\uFFFF]")


def normalize_text(text: str) -> str:
    text = text or ""
    text = NON_PRINTING_RE.sub(" ", text)
    text = WHITESPACE_RE.sub(" ", text)
    text = re.sub(r"\s+", " ", text).strip()
    return text

from neuron.skill_extraction.extractor import extract_skills


@dataclass
class ParsedResume:
    name: str = ""
    email: str = ""
    skills: List[str] = None
    education: List[Dict[str, Any]] = None
    experience: List[Dict[str, Any]] = None
    raw_text: str = ""


def structured_profile_from_text(*, text: str, filename: str = "") -> Dict[str, Any]:
    normalized = normalize_text(text)
    skills = extract_skills(normalized)

    # MVP: lightweight structured generation; other sections are empty arrays
    profile: Dict[str, Any] = {
        "name": "",
        "email": "",
        "skills": skills,
        "education": [],
        "experience": [],
        "raw_text": normalized,
    }
    return profile

