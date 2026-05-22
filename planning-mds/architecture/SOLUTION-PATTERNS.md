# Solution Patterns

> Scaffolded from template during init. Populate/override as the Architect defines product-specific conventions.

## Backend (Flask) solution patterns

## MVP entity definitions (high level)


- **ResumeIngestRequest**: raw resume file/text + optional metadata (filename, mime type).
- **ParsedResumeText**: extracted plain text + extraction diagnostics (success flag, errors).
- **JobDescription**: target role description text.
- **SkillExtractionOutput**: candidate skills (raw + canonical) + evidence snippets.
- **ATSScore**: numerical score + breakdown components with evidence.
- **FeedbackReport**: missing skills + recommendations.



### Boundary
- Expose a small set of HTTP endpoints under `/api/*`.
- Keep AI/NLP logic behind service modules (no model logic in route handlers).

### Suggested endpoints (MVP)
- `POST /api/parse_resume`
  - Input: resume file/text + metadata
  - Output: extracted_text + normalization info
- `POST /api/score_resume`
  - Input: extracted_resume_text + job_description_text
  - Output: ats_score + skill_match_breakdown + missing_skills + recommendations

### Error handling
- Return structured JSON errors with a stable shape:
  - `code`, `message`, `details`, and (optional) `recoverable`.
- Client must handle recoverable parsing failures by enabling resume-text paste.

---

## Frontend (React + Tailwind) solution patterns

### State model
- Keep “inputs” and “analysis result” separate:
  - `resumeInput` (file/text)
  - `jobDescriptionInput` (text)
  - `analysisResult` (ATS score + feedback)
- Use a single request lifecycle state: `idle | parsing | scoring | error`.

### localStorage persistence (MVP)
- Store:
  - last successful `analysisResult`
  - minimal inputs needed to re-render (optional)
- On boot:
  - hydrate UI from localStorage if present.
- Provide a “Clear” action.

---

## AI/LLM integration and safety patterns

### Structured outputs
- Require the LLM to emit JSON matching a predefined schema.
- Validate schema server-side; retry with repair prompt on failure.

### Prompting strategy
- Use a fixed template containing:
  - resume text (or excerpted relevant parts)
  - job description
  - explicit instruction to return:
    - missing skills (array)
    - recommendations (bulleted sections)
    - evidence snippets for key claims

### Guardrails
- Timeouts + max retries.
- Never execute code from the model.
- Ensure recommendations are framed as suggestions, not guarantees.

---

## Resume parsing pipeline structure

1. **Ingest**: receive file or pasted text.
2. **Extract**: convert to plain text (best-effort; record failure reasons).
3. **Normalize**:
   - whitespace normalization
   - section heading detection (optional)
   - lowercasing for matching
4. **Skill candidate generation**:
   - deterministic keyword heuristics (baseline)
   - optional NLP/LLM extraction when heuristic confidence is low
5. **Canonicalization**:
   - map extracted skills to canonical forms (simple synonym mapping MVP).

---

## ATS scoring explanation and auditability

### Score breakdown components (MVP)
- **Skill Match**: overlap between canonical resume skills and job-required skills.
- **Relevance**: high-level relevance derived from matched skill clusters / keywords.
- **Coverage**: how distributed the matched skills are across key areas (e.g., skills vs experience).

### Evidence requirement
- For each major component, return:
  - which skills/keywords were considered
  - short evidence snippets (or extracted phrases) supporting the assessment

---

## Architecture decisions (initial)
- Single synchronous request flow for MVP.
- Deterministic baseline for scoring + LLM augmentation for recommendations.
- Schema-first interface between LLM output and app UI.



