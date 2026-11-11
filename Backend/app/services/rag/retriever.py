from __future__ import annotations

import re
from typing import Any


def rerank(query: str, chunks: list[dict[str, Any]]) -> list[dict[str, Any]]:
    qwords = set(re.findall(r"[a-z0-9]+", query.lower()))
    out = []
    for c in chunks:
        cwords = set(re.findall(r"[a-z0-9]+", c["chunk"].lower()))
        overlap = len(qwords & cwords)
        boost = 0.1 if overlap >= 2 else 0.0
        score = min(1.0, max(0.0, float(c.get("score", 0)) + boost))
        out.append({**c, "score": round(score, 4)})
    out.sort(key=lambda x: -x["score"])
    return out


def extractive_answer(chunks: list[dict[str, Any]]) -> str:
    if not chunks:
        return "The provided context does not contain the answer."
    top = chunks[0]["chunk"].strip()
    sents = re.split(r"(?<=[.!?])\s+", top)
    out = " ".join(sents[:2]).strip()
    # template grounding
    if len(out) > 600:
        out = out[:600]
    return out or "The provided context does not contain the answer."
