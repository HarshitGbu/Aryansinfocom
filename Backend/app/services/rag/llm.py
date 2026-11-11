from __future__ import annotations

import re

from app.services.rag.embeddings import EmbeddingProvider


class LLMProvider:
    async def generate(self, system: str, prompt: str, max_tokens: int = 400) -> str:
        raise NotImplementedError


class MockLLMProvider(LLMProvider):
    async def generate(self, system: str, prompt: str, max_tokens: int = 400) -> str:
        # extractive: first sentence-ish of retrieved context
        m = re.search(r"<retrieved_context>\s*(.*?)\s*</retrieved_context>", prompt, re.S)
        if m is None:
            m = re.search(r"Context:\s*(.+)", prompt, re.S)
        ctx = (m.group(1).strip() if m else prompt.strip())[:600]
        # first two sentences
        sents = re.split(r"(?<=[.!?])\s+", ctx)
        out = " ".join(sents[:2]).strip()
        if not out:
            out = "The provided context does not contain the answer."
        return out[:600]


class AnthropicLLMProvider(LLMProvider):
    def __init__(self, api_key: str, model: str) -> None:
        self.api_key = api_key
        self.model = model

    async def generate(self, system: str, prompt: str, max_tokens: int = 400) -> str:
        import httpx

        async with httpx.AsyncClient(timeout=8) as c:
            last: Exception | None = None
            for _ in range(2):
                try:
                    r = await c.post(
                        "https://api.anthropic.com/v1/messages",
                        headers={"x-api-key": self.api_key, "anthropic-version": "2023-06-01"},
                        json={
                            "model": self.model,
                            "max_tokens": min(max_tokens, 400),
                            "system": system,
                            "messages": [{"role": "user", "content": prompt}],
                        },
                    )
                    r.raise_for_status()
                    data = r.json()
                    blocks = data.get("content", [])
                    text = "".join(b.get("text", "") for b in blocks if isinstance(b, dict))
                    return sanitize_output(text)
                except Exception as e:
                    last = e
                    continue
            raise RuntimeError(f"llm failed: {last}")


def sanitize_output(text: str) -> str:
    t = re.sub(r"[#*`<>]", "", text).strip()
    t = re.sub(r"\s+", " ", t)
    if len(t) > 600:
        # truncate at sentence boundary
        cut = t[:600]
        m = max(cut.rfind(". "), cut.rfind("! "), cut.rfind("? "))
        t = cut[: m + 1] if m > 200 else cut
    return t


def get_providers() -> tuple[EmbeddingProvider, LLMProvider]:
    from app.config import get_settings
    from app.services.rag.embeddings import FakeEmbeddingProvider, OpenAIEmbeddingProvider

    s = get_settings()
    if s.EMBEDDING_PROVIDER == "openai" and s.OPENAI_API_KEY:
        emb: EmbeddingProvider = OpenAIEmbeddingProvider(s.OPENAI_API_KEY)
    else:
        emb = FakeEmbeddingProvider()
    if s.LLM_PROVIDER == "anthropic" and s.ANTHROPIC_API_KEY and s.LLM_MODEL:
        llm: LLMProvider = AnthropicLLMProvider(s.ANTHROPIC_API_KEY, s.LLM_MODEL)
    else:
        llm = MockLLMProvider()
    return emb, llm
