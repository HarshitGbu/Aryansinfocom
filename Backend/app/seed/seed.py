from __future__ import annotations

import asyncio
import json
from pathlib import Path

from sqlalchemy import select

DATA = Path(__file__).parent / "data"

FULL_CONTENT = {
    "web-apps": "## What we build\n\nWe build custom web applications with microservices, scalable frontends, and high-concurrency backends. Typical builds include customer portals, operations dashboards, and multi-tenant SaaS.\n\n## How we deliver\n\nWe work in weekly milestones with a staging link from week one. Each milestone includes automated tests and a short demo.\n\n- Discovery and scope lock in week one\n- API-first builds with typed contracts\n\n## Typical outcomes\n\n- Faster page loads and fewer production incidents\n- Clear ownership of each service\n\n## Technology\n\n- Python, TypeScript, Postgres, Redis\n- Docker and CI for every change\n\n## What you need to provide\n\n- A product contact and sample data\n- Access to existing systems for integration\n",
    "erp-systems": "## What we build\n\nWe build modular ERPs with CRM and supply-chain integration, legacy migration, and API bridges. Modules cover inventory, orders, billing, and reporting.\n\n## How we deliver\n\nWe map current spreadsheets and tools first, then replace them module by module. Data migration is tested twice before cutover.\n\n- Fit-gap review and module plan\n- Parallel run before go-live\n\n## Typical outcomes\n\n- One source of truth for stock and orders\n- Fewer manual entries\n\n## Technology\n\n- Python, Postgres, message queues\n- Role-based access and audit logs\n\n## What you need to provide\n\n- Current process docs and exports\n- A finance reviewer for billing rules\n",
    "ai-solutions": "## What we build\n\nWe build fine-tuned LLMs, custom RAG pipelines, agentic workflows, and AI injection into existing software. Every build includes evaluation and guardrails.\n\n## How we deliver\n\nWe start with a small grounded pilot on your documents. We measure retrieval quality before any production rollout.\n\n- Pilot on 20 to 50 sample documents\n- Human review of edge cases\n\n## Typical outcomes\n\n- Shorter search time across documents\n- Draft answers with cited sources\n\n## Technology\n\n- Embeddings, pgvector, retrieval pipelines\n- Model gateways with audit logs\n\n## What you need to provide\n\n- Sample documents and access rules\n- Reviewers for accuracy checks\n",
    "infrastructure": "## What we build\n\nWe deliver structured cabling, enterprise Wi-Fi and networks, local GPU racks, air-gapped compute, and workstation provisioning. Each site includes diagrams and test reports.\n\n## How we deliver\n\nWe survey the site, then install in zones with labeled patching. Every handover includes cable maps and Wi-Fi heatmaps.\n\n- Site survey and bill of materials\n- Staged install with minimal downtime\n\n## Typical outcomes\n\n- Stable Wi-Fi and clear cable runs\n- Documented racks and backups\n\n## Technology\n\n- Managed switches, firewalls, access points\n- UPS, racks, and patch panels\n\n## What you need to provide\n\n- Floor plans and access windows\n- A facilities contact on site\n",
}


def _load(name: str):  # type: ignore[no-untyped-def]
    with open(DATA / name, encoding="utf-8") as f:
        return json.load(f)


async def seed_async() -> dict[str, int]:
    from app.config import get_settings
    from app.core.db import get_session_factory
    from app.models.tables import CaseStudy, HardwareBlueprint, KnowledgeChunk, Service
    from app.services.rag.embeddings import FakeEmbeddingProvider, OpenAIEmbeddingProvider

    counts: dict[str, int] = {"services": 0, "case_studies": 0, "blueprints": 0, "chunks": 0}
    factory = get_session_factory()
    async with factory() as s:
        # services
        for row in _load("services.json"):
            existing = (await s.execute(select(Service).where(Service.slug == row["slug"]))).scalar_one_or_none()
            fc = FULL_CONTENT.get(row["slug"], "## Overview\n\nContent.")
            if existing is None:
                s.add(Service(full_content=fc, **row))
                counts["services"] += 1
            else:
                changed = False
                for k, v in {**row, "full_content": fc}.items():
                    if getattr(existing, k) != v:
                        setattr(existing, k, v)
                        changed = True
                if changed:
                    counts["services"] += 1
        # case studies
        for row in _load("case_studies.json"):
            existing = (await s.execute(select(CaseStudy).where(CaseStudy.slug == row["slug"]))).scalar_one_or_none()
            payload = {**row, "is_placeholder": True}
            if existing is None:
                s.add(CaseStudy(**payload))
                counts["case_studies"] += 1
            else:
                changed = False
                for k, v in payload.items():
                    if getattr(existing, k) != v:
                        setattr(existing, k, v)
                        changed = True
                if changed:
                    counts["case_studies"] += 1
        # blueprints
        for row in _load("blueprints.json"):
            existing = (
                await s.execute(
                    select(HardwareBlueprint).where(HardwareBlueprint.blueprint_code == row["blueprint_code"])
                )
            ).scalar_one_or_none()
            if existing is None:
                s.add(HardwareBlueprint(**row))
                counts["blueprints"] += 1
            else:
                changed = False
                for k, v in row.items():
                    cur = getattr(existing, k)
                    if k == "base_estimated_cost":
                        if float(cur) != float(v):
                            setattr(existing, k, v)
                            changed = True
                    elif cur != v:
                        setattr(existing, k, v)
                        changed = True
                if changed:
                    counts["blueprints"] += 1
        await s.flush()
        # knowledge base: upsert by (title, chunk)
        settings = get_settings()
        provider_name = settings.EMBEDDING_PROVIDER
        if provider_name == "openai" and settings.OPENAI_API_KEY:
            emb = OpenAIEmbeddingProvider(settings.OPENAI_API_KEY)  # type: ignore[assignment]
        else:
            emb = FakeEmbeddingProvider()  # type: ignore[assignment]
        for row in _load("knowledge_base.json"):
            existing = (
                await s.execute(
                    select(KnowledgeChunk).where(
                        KnowledgeChunk.document_title == row["document_title"],
                        KnowledgeChunk.content_chunk == row["content_chunk"],
                    )
                )
            ).scalar_one_or_none()
            meta = {"provider": ("openai" if provider_name == "openai" and settings.OPENAI_API_KEY else "fake")}
            if existing is None:
                try:
                    vec = await emb.embed(row["content_chunk"])
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
            elif (existing.chunk_metadata or {}).get("provider") != meta["provider"]:
                try:
                    existing.embedding = await emb.embed(row["content_chunk"])  # type: ignore[assignment]
                except Exception:
                    pass
                existing.chunk_metadata = meta
                counts["chunks"] += 1
        await s.commit()
    return counts


def main() -> None:
    counts = asyncio.run(seed_async())
    print(f"seed done: {counts} (re-run changes nothing when 0 across second run for core tables)")


if __name__ == "__main__":
    main()
