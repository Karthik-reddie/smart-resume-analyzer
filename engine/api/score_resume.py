from __future__ import annotations

import os
from flask import Flask, jsonify, request
from jsonschema import validate, ValidationError

from engine.services.score_service import score_resume_against_job

SCORE_INPUT_SCHEMA = {
    "type": "object",
    "required": ["resume_text", "job_description"],
    "properties": {
        "resume_text": {"type": "string", "minLength": 1},
        "job_description": {"type": "string", "minLength": 1},
        "skills": {
            "type": "array",
            "items": {"type": "string"}
        }
    },
    "additionalProperties": True
}


def _error(message: str, code: str, status_code: int):
    return jsonify({"error": {"code": code, "message": message}}), status_code


def register_score_resume_routes(app: Flask):
    @app.route("/api/score-resume", methods=["POST"])
    def score_resume():
        if not request.is_json:
            return _error("Request payload must be JSON.", code="missing_json", status_code=400)

        try:
            data = request.get_json()
            validate(instance=data, schema=SCORE_INPUT_SCHEMA)
        except ValidationError as e:
            return _error(f"Invalid input schema: {e.message}", code="invalid_input_schema", status_code=400)
        except Exception:
            return _error("Malformed JSON payload.", code="malformed_json", status_code=400)

        resume_text = data.get("resume_text")
        job_description = data.get("job_description")
        skills = data.get("skills")

        # Basic validations
        if not resume_text.strip():
            return _error("Resume text cannot be empty.", code="empty_resume_text", status_code=400)
        if not job_description.strip():
            return _error("Job description text cannot be empty.", code="empty_job_description", status_code=400)

        try:
            report = score_resume_against_job(
                resume_text=resume_text,
                resume_skills=skills,
                job_description=job_description
            )
            return jsonify(report), 200
        except Exception as e:
            # Prevent leaking sensitive backend errors, but log them locally
            print(f"Scoring endpoint error: {e}")
            return _error("Failed to calculate ATS score.", code="internal_scoring_error", status_code=500)
