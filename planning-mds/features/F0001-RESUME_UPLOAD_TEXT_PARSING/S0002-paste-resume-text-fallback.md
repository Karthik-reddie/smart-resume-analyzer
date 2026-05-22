# S0002 — Paste resume text fallback

**Feature:** F0001
**Priority:** P0

## As a
User

## I want
A fallback path to paste resume text when parsing fails

## So that
I can still get ATS scoring and skill extraction

## Acceptance Criteria
- If backend resume parsing fails (recoverable error), UI shows a paste-text textarea.
- Submitting pasted text proceeds through the same scoring flow.
- UI displays a helpful error message explaining next step.

