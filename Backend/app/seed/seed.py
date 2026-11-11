from __future__ import annotations

import asyncio
import json
from pathlib import Path
from typing import Any, cast

from sqlalchemy import select

from app.seed.helpers import FULL_CONTENT

DATA = Path(__file__).parent / "data"


def _load(name: str) -> list[dict[str, Any]]:
    with open(DATA / name, encoding="utf-8") as f:
        return cast(list[dict[str, Any]], json.load(f))


async def seed_async() -> dict[str, int]:
    from app.config import get_settings
    from app.core.db import get_session_factory
    from app.models.tables import CaseStudy, HardwareBlueprint, KnowledgeChunk, Service
    from app.services.rag.embeddings import EmbeddingProvider, FakeEmbeddingProvider, OpenAIEmbeddingProvider

    counts: dict[str, int] = {"services": 0, "case_studies": 0, "blueprints": 0, "chunks": 0}
    factory = get_session_factory()
    async with factory() as s:
        # services
        for row in _load("services.json"):
            existing_svc = (await s.execute(select(Service).where(Service.slug == row["slug"]))).scalar_one_or_none()
            fc = FULL_CONTENT.get(row["slug"], "## Overview\n\nContent.")
            if existing_svc is None:
                s.add(Service(full_content=fc, **row))
                counts["services"] += 1
            else:
                changed = False
                for k, v in {**row, "full_content": fc}.items():
                    if getattr(existing_svc, k) != v:
                        setattr(existing_svc, k, v)
                        changed = True
                if changed:
                    counts["services"] += 1
        # case studies
        for row in _load("case_studies.json"):
            existing_cs = (await s.execute(select(CaseStudy).where(CaseStudy.slug == row["slug"]))).scalar_one_or_none()
            payload = {**row, "is_placeholder": True}
            if existing_cs is None:
                s.add(CaseStudy(**payload))
                counts["case_studies"] += 1
            else:
                changed = False
                for k, v in payload.items():
                    if getattr(existing_cs, k) != v:
                        setattr(existing_cs, k, v)
                        changed = True
                if changed:
                    counts["case_studies"] += 1
        # blueprints
        for row in _load("blueprints.json"):
            existing_bp = (
                await s.execute(
                    select(HardwareBlueprint).where(HardwareBlueprint.blueprint_code == row["blueprint_code"])
                )
            ).scalar_one_or_none()
            if existing_bp is None:
                s.add(HardwareBlueprint(**row))
                counts["blueprints"] += 1
            else:
                changed = False
                for k, v in row.items():
                    cur = getattr(existing_bp, k)
                    if k == "base_estimated_cost":
                        if float(cur) != float(v):
                            setattr(existing_bp, k, v)
                            changed = True
                    elif cur != v:
                        setattr(existing_bp, k, v)
                        changed = True
                if changed:
                    counts["blueprints"] += 1
        await s.flush()
        # knowledge base: upsert by (title, chunk)
        settings = get_settings()
        provider_name = settings.EMBEDDING_PROVIDER
        emb: EmbeddingProvider
        if provider_name == "openai" and settings.OPENAI_API_KEY:
            emb = OpenAIEmbeddingProvider(settings.OPENAI_API_KEY)
        else:
            emb = FakeEmbeddingProvider()
        for row in _load("knowledge_base.json"):
            existing_chunk = (
                await s.execute(
                    select(KnowledgeChunk).where(
                        KnowledgeChunk.document_title == row["document_title"],
                        KnowledgeChunk.content_chunk == row["content_chunk"],
                    )
                )
            ).scalar_one_or_none()
            meta = {"provider": ("openai" if provider_name == "openai" and settings.OPENAI_API_KEY else "fake")}
            if existing_chunk is None:
                try:
                    vec: list[float] | None = await emb.embed(row["content_chunk"])
                except Exception:
                    vec = None
                s.add(
                    KnowledgeChunk(
                        document_title=row["document_title"],
                        content_chunk=row["content_chunk"],
                        embedding=vec,
                        chunk_metadata=meta,
                    )
                )
                counts["chunks"] += 1
            elif (existing_chunk.chunk_metadata or {}).get("provider") != meta["provider"]:
                try:
                    existing_chunk.embedding = await emb.embed(row["content_chunk"])
                except Exception:
                    pass
                existing_chunk.chunk_metadata = meta
                counts["chunks"] += 1
        await s.commit()
    return counts


def main() -> None:
    counts = asyncio.run(seed_async())
    print(f"seed done: {counts} (re-run changes nothing when 0 across second run for core tables)")


if __name__ == "__main__":
    main()
