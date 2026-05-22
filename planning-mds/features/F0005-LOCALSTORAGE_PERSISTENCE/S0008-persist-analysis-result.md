# S0008 — Persist analysis result after refresh

**Feature:** F0005
**Priority:** P1

## As a
User

## I want
The latest analysis result to persist after a page refresh

## So that
I don’t lose my ATS score and recommendations

## Acceptance Criteria
- After a successful analysis, `analysisResult` is saved to localStorage.
- Reloading the page rehydrates the UI with the saved result.

