# Tracker Governance

> Copied/scaffolded from nebula-agents template (init).

## Purpose

Keep all tracker documents in sync:
- `REGISTRY.md`
- `ROADMAP.md`
- `STORY-INDEX.md`
- `BLUEPRINT.md`
- per-feature `STATUS.md`

## Rules

1. **Single source of truth:** updates must be applied consistently across related tracker docs.
2. **No orphaned stories:** every story must be either completed, deferred with a tracking link, or re-homed into a different feature ID.
3. **Archive transition:** completed features move into `features/archive/` and all links are updated.
4. **Regeneration:** after story changes, regenerate `STORY-INDEX.md`.

## Validation Commands (product repo)

- `python3 agents/product-manager/scripts/generate-story-index.py {PRODUCT_ROOT}/planning-mds/features/`
- `python3 agents/product-manager/scripts/validate-trackers.py`

