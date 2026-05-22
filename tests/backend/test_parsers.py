from __future__ import annotations

import pytest


# This project scaffold expects optional third-party parsing deps.
# In CI/environments without those packages installed, we skip these tests.

try:
    from engine.parsers.doc_parser import extract_text_from_txt_bytes
    from engine.parsers.doc_parser import extract_text_from_pdf_bytes_fallback
except Exception:  # pragma: no cover
    extract_text_from_txt_bytes = None
    extract_text_from_pdf_bytes_fallback = None


def test_txt_parser_extracts_text():
    if extract_text_from_txt_bytes is None:
        pytest.skip("doc_parser deps not installed")

    content = "Python Flask React"
    out = extract_text_from_txt_bytes(content.encode("utf-8"))
    assert "python" in out.lower()
    assert "flask" in out.lower()


def test_pdf_fallback_handles_invalid_pdf_gracefully():
    if extract_text_from_pdf_bytes_fallback is None:
        pytest.skip("pdf parsing deps not installed")

    with pytest.raises(Exception):
        extract_text_from_pdf_bytes_fallback(b"not-a-pdf")

