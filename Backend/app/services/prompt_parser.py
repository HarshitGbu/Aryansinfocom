from __future__ import annotations

import re
from typing import Any

KEYWORDS = {
    "vlan",
    "firewall",
    "gpu",
    "rack",
    "wi-fi",
    "wifi",
    "erp",
    "rag",
    "llm",
    "vpn",
    "air-gapped",
    "airgapped",
    "on-premise",
    "on-prem",
    "switch",
    "server",
    "cabinet",
    "patch",
    "ups",
    "subnet",
    "crm",
    "api",
    "database",
    "dashboard",
    "soc",
    "hipaa",
    "gdpr",
    "pci",
    "inference",
    "kubernetes",
    "fiber",
    "cabling",
}

HARDWARE_RE = [
    (re.compile(r"\bgpus?\b", re.I), "hardware"),
    (re.compile(r"\bswitch(es)?\b", re.I), "hardware"),
    (re.compile(r"\backs+\b", re.I), "hardware"),
    (re.compile(r"\bracks?\b", re.I), "hardware"),
    (re.compile(r"\bservers?\b", re.I), "hardware"),
    (re.compile(r"\baccess points?\b", re.I), "hardware"),
    (re.compile(r"\bups\b", re.I), "hardware"),
    (re.compile(r"\bpatch panels?\b", re.I), "hardware"),
]
NETWORK_RES = [
    (re.compile(r"\bvlan\s*\d+\b", re.I), "network"),
    (re.compile(r"\bfirewalls?\b", re.I), "network"),
    (re.compile(r"\bwi-?fi\b", re.I), "network"),
    (re.compile(r"\bvpn\b", re.I), "network"),
    (re.compile(r"\bsubnets?\b", re.I), "network"),
]
SOFTWARE_RES = [
    (re.compile(r"\berp\b", re.I), "software"),
    (re.compile(r"\bcrm\b", re.I), "software"),
    (re.compile(r"\bapi\b", re.I), "software"),
    (re.compile(r"\bdatabases?\b", re.I), "software"),
    (re.compile(r"\bdashboards?\b", re.I), "software"),
    (re.compile(r"\brag\b", re.I), "software"),
    (re.compile(r"\bllm\b", re.I), "software"),
]
COMPLIANCE_RES = [
    (re.compile(r"\bhipaa\b", re.I), "compliance"),
    (re.compile(r"\bgdpr\b", re.I), "compliance"),
    (re.compile(r"\bpci\b", re.I), "compliance"),
    (re.compile(r"\bsoc\s*2\b", re.I), "compliance"),
    (re.compile(r"\bair-?gapped\b", re.I), "compliance"),
    (re.compile(r"\bconfidential\b", re.I), "compliance"),
    (re.compile(r"\bprivate data\b", re.I), "compliance"),
]
QTY_RE = re.compile(r"\b\d+(\.\d+)?\s*(seats?|users?|nodes?|gpus?|racks?|aps?|sqft|m2|tb|gb)?\b", re.I)

EMAIL_RE = re.compile(r"[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}")
PHONE_RE = re.compile(r"(\+?\d[\d\s\-().]{7,}\d)")
CARD_RE = re.compile(r"\b(?:\d[ -]*?){13,19}\b")
APIKEY_RE = re.compile(r"\b(sk-[A-Za-z0-9]{8,}|AKIA[0-9A-Z]{16}|xox[bpas]-[A-Za-z0-9-]{8,})\b")
INJECTION_RES = [
    re.compile(r"ignore (all|previous|prior) instructions", re.I),
    re.compile(r"system prompt", re.I),
    re.compile(r"jailbreak", re.I),
    re.compile(r"do anything now", re.I),
    re.compile(r"reveal .*prompt", re.I),
]


def is_prompt_injection(text: str) -> bool:
    return any(r.search(text) for r in INJECTION_RES)

INTENT_KEYWORDS: dict[str, set[str]] = {
    "network_design": {"vlan", "firewall", "wi-fi", "wifi", "vpn", "subnet", "switch", "cabling", "rack", "network"},
    "ai_deployment": {"gpu", "llm", "rag", "inference", "air-gapped", "on-premise", "model"},
    "software_build": {"erp", "crm", "api", "database", "dashboard", "software", "app"},
    "compliance_question": {"hipaa", "gdpr", "pci", "soc", "compliance", "confidential", "private"},
}


def parse_prompt(prompt: str) -> dict[str, Any]:
    text = prompt.strip()
    # tokens
    parts = re.findall(r"[A-Za-z0-9_@.\-]+|[^\s\w]", text)
    entities: list[dict[str, str]] = []
    seen: set[tuple[str, str]] = set()

    def add_entity(t: str, typ: str) -> None:
        key = (t.lower(), typ)
        if key not in seen:
            seen.add(key)
            entities.append({"text": t, "type": typ})

    for pat, typ in HARDWARE_RE + NETWORK_RES + SOFTWARE_RES + COMPLIANCE_RES:
        for m in pat.finditer(text):
            add_entity(m.group(0), typ)
    for m in QTY_RE.finditer(text):
        add_entity(m.group(0).strip(), "quantity")

    # token kinds
    entity_texts = {e["text"].lower() for e in entities}
    tokens = []
    for p in parts:
        low = p.lower()
        if re.fullmatch(r"\d+(\.\d+)?", p):
            kind = "number"
        elif re.fullmatch(r"[^\w\s]", p):
            kind = "symbol"
        elif low in entity_texts or any(low in e for e in entity_texts):
            kind = "entity"
        elif low.strip("-") in KEYWORDS or low in KEYWORDS:
            kind = "keyword"
        else:
            kind = "word"
        tokens.append({"text": p, "kind": kind})

    # intent
    words = set(re.findall(r"[a-z0-9\-]+", text.lower()))
    scores: dict[str, int] = {k: len(v & words) for k, v in INTENT_KEYWORDS.items()}
    # also substring hits
    for label, kws in INTENT_KEYWORDS.items():
        extra = sum(1 for kw in kws if kw in text.lower() and kw not in words)
        scores[label] += extra
    best = max(scores, key=lambda k: scores[k])
    total = sum(scores.values())
    if total == 0:
        label, conf = "general_question", 0.45
    else:
        label = best
        conf = 0.35 + 0.6 * (scores[best] / max(1, total))
        # boost if multiple hits; formula max is 0.95
        conf = min(0.98, max(0.35, round(conf, 2)))
    intent = {"label": label, "confidence": conf}

    # guardrails
    has_sensitive = bool(EMAIL_RE.search(text) or CARD_RE.search(text) or APIKEY_RE.search(text) or _phone_like(text))
    has_injection = any(r.search(text) for r in INJECTION_RES)
    guardrails = [
        {
            "rule": "contains_sensitive_data",
            "passed": not has_sensitive,
            "note": "No emails, card numbers, phone numbers or API keys detected."
            if not has_sensitive
            else "Possible sensitive data detected.",
        },
        {
            "rule": "prompt_injection_patterns",
            "passed": not has_injection,
            "note": "No injection patterns detected."
            if not has_injection
            else "Known prompt-injection pattern detected.",
        },
        {
            "rule": "length_within_limit",
            "passed": 3 <= len(text) <= 500,
            "note": "Length within 3..500 chars." if 3 <= len(text) <= 500 else "Length out of bounds.",
        },
        {
            "rule": "topic_in_scope",
            "passed": _in_scope(text),
            "note": "Topic matches agency services." if _in_scope(text) else "Topic outside agency scope.",
        },
    ]
    # routing
    if has_sensitive or has_injection:
        routing = {
            "target": "blocked",
            "reason": "Blocked because sensitive data was detected."
            if has_sensitive
            else "Blocked because a prompt-injection pattern was detected.",
        }
    elif (
        any(e["type"] == "compliance" for e in entities)
        or "air-gapped" in text.lower()
        or "air gapped" in text.lower()
        or "private data" in text.lower()
    ):
        routing = {
            "target": "local_air_gapped_model",
            "reason": "Routed locally because compliance or private-data entities require an air-gapped model.",
        }
    else:
        routing = {"target": "cloud_model", "reason": "Routed to the cloud model by default keyword scoring."}
    return {"tokens": tokens, "intent": intent, "entities": entities, "guardrails": guardrails, "routing": routing}


def _phone_like(text: str) -> bool:
    # avoid flagging small quantities: require 10+ digits
    digits = re.sub(r"\D", "", text)
    # check phone regex but exclude pure small numbers
    if len(digits) >= 10 and PHONE_RE.search(text):
        # ensure not just a long VLAN/quantity? treat as sensitive anyway
        return True
    return False


def _in_scope(text: str) -> bool:
    low = text.lower()
    scope = [
        "network",
        "wifi",
        "wi-fi",
        "vlan",
        "erp",
        "crm",
        "gpu",
        " ai",
        "rag",
        "llm",
        "office",
        "server",
        "software",
        "web",
        "app",
        "infrastructure",
        "firewall",
        "vpn",
        "compliance",
        "data",
    ]
    return any(s in low for s in scope)
