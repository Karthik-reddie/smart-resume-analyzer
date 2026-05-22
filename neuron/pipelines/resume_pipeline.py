from __future__ import annotations

import re
from typing import Dict

from engine.parsers.doc_parser import (
    extract_text_from_docx_bytes,
    extract_text_from_pdf_bytes_fallback,
    extract_text_from_txt_bytes,
)
from engine.parsers.pdf_parser import extract_text_from_pdf_bytes

from engine.services.resume_service import structured_profile_from_text
from neuron.schemas.profile_schema import validate_profile
from neuron.skill_extraction.extractor import extract_skills



"""Neural pipeline for resume parsing.


MVP: deterministic extraction + lightweight skill detection.

Important: this module must not import from engine to avoid circular imports.
"""




WHITESPACE_RE = re.compile(r"[\t\r\n]+")
NON_PRINTING_RE = re.compile(r"[^\x09\x0A\x0D\x20-\x7E\u0080-\uFFFF]")


def normalize_text(text: str) -> str:
    # Basic cleanup only for MVP determinism.
    text = text or ""
    text = NON_PRINTING_RE.sub(" ", text)
    text = WHITESPACE_RE.sub(" ", text)
    text = re.sub(r"\s+", " ", text).strip()
    return text


def extract_text_by_extension(*, filename: str, file_bytes: bytes) -> str:
    lower = filename.lower()
    if lower.endswith(".pdf"):
        try:
            extracted = extract_text_from_pdf_bytes(file_bytes)
        except Exception:
            extracted = ""

        if not extracted:
            extracted = extract_text_from_pdf_bytes_fallback(file_bytes)

        return extracted.strip()

    if lower.endswith(".docx"):
        return extract_text_from_docx_bytes(file_bytes)

    if lower.endswith(".doc"):
        # MVP: treat .doc as docx isn't guaranteed; raise so client can fallback.
        # Without OCR, .doc parsing is unreliable.
        raise ValueError("DOC parsing is not supported reliably in MVP. Please use DOCX/PDF or paste text.")

    if lower.endswith(".txt"):
        return extract_text_from_txt_bytes(file_bytes)

    raise ValueError("Unsupported file type")


def parse_resume_to_profile(*, filename: str, file_bytes: bytes) -> Dict:
    raw_text = extract_text_by_extension(filename=filename, file_bytes=file_bytes)
    if not raw_text or len(raw_text.strip()) == 0:
        raise ValueError("Could not extract any readable text from the resume.")

    normalized = normalize_text(raw_text)
    # MVP: allow short text uploads for unit tests / text-only resumes.
    if len(normalized) < 1:
        raise ValueError("Extracted text is too short to parse. Try another file.")


    # Delegate structured generation (skills+basic fields)
    profile = structured_profile_from_text(text=normalized, filename=filename)
    validate_profile(profile)
    return profile



