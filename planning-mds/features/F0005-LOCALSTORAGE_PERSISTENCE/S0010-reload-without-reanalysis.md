# S0010 — Re-load saved analysis without re-running AI

**Feature:** F0005
**Priority:** P1

## As a
User

## I want
To re-load my saved analysis without re-running AI

## So that
I can quickly review results

## Acceptance Criteria
- If `analysisResult` exists in localStorage, UI loads it on boot.
- UI does not call backend scoring/LLM endpoints during re-hydration.
- User can still run a new analysis explicitly.

