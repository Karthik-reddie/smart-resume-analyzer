from __future__ import annotations

import io
import os
from typing import Any, Dict, Optional

from flask import Flask, jsonify, request
from werkzeug.datastructures import FileStorage
from werkzeug.utils import secure_filename

from neuron.pipelines.resume_pipeline import parse_resume_to_profile


ALLOWED_EXTENSIONS = {".pdf", ".doc", ".docx", ".txt"}
MAX_CONTENT_LENGTH_MB = int(os.environ.get("MAX_RESUME_MB", "10"))


def _error(message: str, code: str, status_code: int):
    return jsonify({"error": {"code": code, "message": message}}), status_code


def _get_resume_file() -> Optional[FileStorage]:
    # Expect multipart/form-data with key 'resume'
    f = request.files.get("resume")
    return f


def _validate_extension(filename: str):
    _, ext = os.path.splitext(filename.lower())
    if ext not in ALLOWED_EXTENSIONS:
        return False, ext
    return True, ext


def register_upload_resume_routes(app: Flask):
    @app.route("/api/upload-resume", methods=["POST"])
    def upload_resume():
        # Basic size limit
        if request.content_length is not None:
            max_bytes = MAX_CONTENT_LENGTH_MB * 1024 * 1024
            if request.content_length > max_bytes:
                return _error(
                    f"File too large. Max {MAX_CONTENT_LENGTH_MB}MB.",
                    code="file_too_large",
                    status_code=413,
                )

        resume_file = _get_resume_file()
        if not resume_file:
            return _error("No resume file provided.", code="missing_resume", status_code=400)

        original_name = resume_file.filename or ""
        if not original_name:
            return _error("Invalid resume filename.", code="invalid_filename", status_code=400)

        ok, _ext = _validate_extension(original_name)
        if not ok:
            return _error(
                "Invalid file extension. Allowed: PDF, DOC, DOCX, TXT.",
                code="invalid_extension",
                status_code=400,
            )

        # Read bytes and ensure non-empty
        file_bytes = resume_file.read()
        if not file_bytes or len(file_bytes.strip(b" \n\r\t")) == 0:
            return _error("Empty upload.", code="empty_upload", status_code=400)

        filename = secure_filename(original_name)

        try:
            profile = parse_resume_to_profile(
                filename=filename,
                file_bytes=file_bytes,
            )
        except ValueError as e:
            return _error(str(e), code="parse_failed", status_code=400)
        except Exception:
            return _error("Failed to parse resume.", code="internal_error", status_code=500)

        return jsonify(profile), 200

