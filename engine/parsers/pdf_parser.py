from __future__ import annotations

import io
from typing import List

import pdfplumber


def extract_text_from_pdf_bytes(file_bytes: bytes) -> str:
    with pdfplumber.open(io.BytesIO(file_bytes)) as pdf:
        texts: List[str] = []
        for page in pdf.pages:
            page_text = page.extract_text() or ""
            if page_text:
                texts.append(page_text)
        return "\n".join(texts).strip()

