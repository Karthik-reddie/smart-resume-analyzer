# S0001 — Upload resume to extract readable text

**Feature:** F0001
**Priority:** P0

## As a
User

## I want
Upload a resume (PDF/DOCX/text) so the system extracts readable text and builds a structured candidate profile.

## So that
I can improve my ATS score later using extracted profile data.

## Requirements
- Frontend: React + Tailwind UI
- Upload area for PDF/DOCX/text
- Show upload progress
- Display extracted profile preview
- Save parsed result in browser localStorage
- Handle invalid file formats gracefully

## Backend
- Flask API

## Endpoint
- `POST /api/upload-resume`
  - **Input:** `multipart/form-data` with a `resume` file
  - **Output (JSON):**

```json
{
  "name": "",
  "email": "",
  "skills": [],
  "education": [],
  "experience": [],
  "raw_text": ""
}
```

## AI / Parsing
Pipeline:
1. Extract text from PDF/DOCX.
2. Normalize content.
3. Skill extraction.
4. Generate structured JSON.
5. Persist parsed output.

Suggested libraries:
- PDF: `pdfplumber`, `PyPDF2`
- DOCX: `python-docx`
- NLP: `spaCy`, regex preprocessing

## Acceptance Criteria
- Upload PDF works.
- Upload DOCX works.
- Invalid files are rejected.
- Skills extracted correctly (within MVP expectations).
- Structured JSON generated and returned.
- Data persisted in localStorage.
- API returns validation errors when needed.


