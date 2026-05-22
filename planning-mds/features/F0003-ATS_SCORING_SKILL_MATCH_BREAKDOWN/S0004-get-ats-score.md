# S0004 — Get ATS score

**Feature:** F0003
**Priority:** P0

## As a
User

## I want
To submit my resume and a job description and receive an ATS score

## So that
I can understand my alignment to the target role

## Acceptance Criteria
- User can submit resume text (from extracted or pasted resume) + job description.
- Backend returns an `ats_score` and breakdown object.
- UI renders score and breakdown without leaking raw backend errors.

