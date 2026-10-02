from __future__ import annotations

import hashlib
import math


class EmbeddingProvider:
    async def embed(self, text: str) -> list[float]:
        raise NotImplementedError


class FakeEmbeddingProvider(EmbeddingProvider):
    async def embed(self, text: str) -> list[float]:
        # deterministic hash-based unit vector, 1536 dims
        vec = [0.0] * 1536
        for i in range(1536):
            h = hashlib.sha256(f"{text}:{i}".encode()).digest()
            vec[i] = (int.from_bytes(h[:2], "big") / 65535.0) - 0.5
        n = math.sqrt(sum(x * x for x in vec)) or 1.0
        return [x / n for x in vec]


class OpenAIEmbeddingProvider(EmbeddingProvider):
    def __init__(self, api_key: str) -> None:
        self.api_key = api_key

    async def embed(self, text: str) -> list[float]:
        import httpx

        async with httpx.AsyncClient(timeout=8) as c:
            last: Exception | None = None
            for _ in range(2):
                try:
                    r = await c.post(
                        "https://api.openai.com/v1/embeddings",
                        headers={"Authorization": f"Bearer {self.api_key}"},
                        json={"model": "text-embedding-3-small", "input": text},
                    )
                    r.raise_for_status()
                    data = r.json()
                    return list(data["data"][0]["embedding"])
                except Exception as e:
                    last = e
                    if "5" not in str(getattr(e, "response", "")):
                        break
            raise RuntimeError(f"embedding failed: {last}")
