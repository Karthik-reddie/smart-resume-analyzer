from __future__ import annotations

import re
from typing import List

from rapidfuzz import fuzz


# MVP: regex-based keyword extraction with lightweight canonicalization.
SKILL_KEYWORDS = [
    "python",
    "javascript",
    "typescript",
    "react",
    "node",
    "node.js",
    "flask",
    "django",
    "fastapi",
    "sql",
    "postgres",
    "mysql",
    "mongodb",
    "redis",
    "aws",
    "gcp",
    "azure",
    "docker",
    "kubernetes",
    "k8s",
    "pytorch",
    "tensorflow",
    "spacy",
    "nlp",
    "machine learning",
    "ml",
    "data analysis",
    "pandas",
    "numpy",
    "scikit-learn",
    "jest",
    "cypress",
    "tailwind",
    "css",
    "html",
    "git",
    "rest",
    "graphql",
    "spark",
]

CANONICAL_MAP = {
    "node": "node.js",
    "k8s": "kubernetes",
    "ml": "machine learning",
}


def _find_skill_mentions(text: str) -> List[str]:
    found = set()
    # normalize for search
    t = text.lower()
    for kw in SKILL_KEYWORDS:
        pattern = re.escape(kw.lower())
        if re.search(rf"(?<![a-z0-9]){pattern}(?![a-z0-9])", t):
            found.add(kw)

        # Special case for multiword
        if " " in kw:
            if kw.lower() in t:
                found.add(kw)

    return list(found)


def canonicalize_skills(skills: List[str]) -> List[str]:
    if not skills:
        return []

    canon = []
    for s in skills:
        s_norm = s.lower().strip()
        s_norm = CANONICAL_MAP.get(s_norm, s_norm)
        canon.append(s_norm)

    # De-duplicate with fuzzy merge (very light)
    unique: List[str] = []
    for s in canon:
        matched = False
        for u in unique:
            if fuzz.ratio(s, u) >= 92:
                matched = True
                break
        if not matched:
            unique.append(s)

    # sort for stable output
    return sorted(unique)


def extract_skills(text: str) -> List[str]:
    mentions = _find_skill_mentions(text)
    return canonicalize_skills(mentions)

