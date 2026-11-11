from __future__ import annotations

from typing import Any

PAGES = [
    {"title": "Home", "href": "/", "keywords": ["home", "landing", "start"]},
    {"title": "Services", "href": "/services", "keywords": ["services", "offerings"]},
    {"title": "Web Apps", "href": "/services/web-apps", "keywords": ["web", "frontend", "backend", "microservices"]},
    {"title": "ERP Systems", "href": "/services/erp-systems", "keywords": ["erp", "crm", "supply chain", "migration"]},
    {"title": "AI Solutions", "href": "/services/ai-solutions", "keywords": ["ai", "llm", "rag", "agents"]},
    {
        "title": "Infrastructure",
        "href": "/services/infrastructure",
        "keywords": ["network", "wifi", "cabling", "gpu", "rack"],
    },
    {"title": "Case studies", "href": "/work", "keywords": ["work", "portfolio", "clients"]},
    {"title": "AI Lab", "href": "/ai-lab", "keywords": ["lab", "demo", "rag", "playground"]},
    {"title": "Estimator", "href": "/estimator", "keywords": ["pricing", "estimate", "scope", "cost"]},
    {"title": "About", "href": "/about", "keywords": ["about", "team", "company"]},
    {"title": "Contact", "href": "/contact", "keywords": ["contact", "email", "call"]},
]
ACTIONS = [
    {"title": "Calculate project scope", "href": "/estimator", "keywords": ["calculate", "scope", "estimate"]},
    {"title": "Book a discovery call", "href": "/contact#book", "keywords": ["book", "call", "discovery", "meeting"]},
]


def rank_static(query: str, items: list[dict[str, Any]], rtype: str) -> list[dict[str, Any]]:
    q = query.lower().strip()
    out: list[tuple[int, dict[str, Any]]] = []
    for it in items:
        t = it["title"].lower()
        score = -1
        if t == q:
            score = 100
        elif t.startswith(q):
            score = 80
        elif q in t:
            score = 60
        elif any(q in k or k in q for k in it.get("keywords", [])):
            score = 40
        if score >= 0:
            out.append((score, {"type": rtype, "title": it["title"], "subtitle": None, "href": it["href"]}))
    out.sort(key=lambda x: -x[0])
    return [x[1] for x in out]
