from __future__ import annotations

import io
from typing import Optional

import PyPDF2
from docx import Document


def extract_text_from_docx_bytes(file_bytes: bytes) -> str:
    doc = Document(io.BytesIO(file_bytes))
    parts = []
    for p in doc.paragraphs:
        t = p.text.strip()
        if t:
            parts.append(t)
    return "\n".join(parts).strip()


def extract_text_from_txt_bytes(file_bytes: bytes) -> str:
    try:
        return file_bytes.decode("utf-8", errors="ignore").strip()
    except Exception:
        return file_bytes.decode("latin-1", errors="ignore").strip()


def extract_text_from_pdf_bytes_fallback(file_bytes: bytes) -> str:
    reader = PyPDF2.PdfReader(io.BytesIO(file_bytes))
    parts = []
    for page in reader.pages:
        try:
            parts.append((page.extract_text() or "").strip())
        except Exception:
            continue
    return "\n".join([p for p in parts if p]).strip()

