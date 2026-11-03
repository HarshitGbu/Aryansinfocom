from __future__ import annotations

import time

from fastapi import APIRouter
from fastapi.responses import JSONResponse

from app.schemas.requests import PromptParseRequest, RagRequest

router = APIRouter(tags=["playground"])


@router.post("/playground/prompt-parse")
async def prompt_parse(payload: PromptParseRequest):  # type: ignore[no-untyped-def]
    from app.services.prompt_parser import parse_prompt

    parsed = parse_prompt(payload.prompt)
    resp = JSONResponse(content={"success": True, **parsed})
    resp.headers["Cache-Control"] = "no-store"
    return resp


@router.post("/playground/rag-simulation")
async def rag_simulation(payload: RagRequest):  # type: ignore[no-untyped-def]
    import hashlib
    import json as _j
    import re as _re

    from sqlalchemy import text

    from app.config import get_settings
    from app.core.db import get_session_factory
    from app.core.redis import get_redis_client

    # need request for IP: get from context? use payload only + budget keyed loosely
    query = _re.sub(r"[\x00-\x1f\x7f]", " ", payload.query)
    query = _re.sub(r"\s+", " ", query).strip()
    if not (3 <= len(query) <= 300):
        return JSONResponse(
            status_code=422,
            content={"success": False, "error": {"code": "validation_error", "message": "Query must be 3..300 chars"}},
        )
    top_k = payload.top_k
    settings = get_settings()
    norm = query.lower().strip()
    cache_key = f"rag:{hashlib.sha256(f'{norm}:{top_k}'.encode()).hexdigest()}"
    redis = get_redis_client()
    if redis is not None:
        try:
            cached = await redis.get(cache_key)
            if cached:
                body = _j.loads(cached)
                body["mode"] = "cached"
                return body
        except Exception:
            pass
    total_start = time.perf_counter()
    timings: dict[str, tuple[float, str]] = {}
    # decide mode
    live_ok = (
        settings.EMBEDDING_PROVIDER == "openai"
        and settings.OPENAI_API_KEY
        and settings.LLM_PROVIDER == "anthropic"
        and settings.ANTHROPIC_API_KEY
        and settings.LLM_MODEL
    )
    # budget check (per IP placeholder: global per query hash? use daily counter)
    over_budget = False
    if redis is not None and live_ok:
        try:
            budget_key = f"rag:budget:{hashlib.sha256(b'ip-global').hexdigest()}"
            # simplified: count all live runs
            cnt = await redis.incr(budget_key)
            if cnt == 1:
                await redis.expire(budget_key, 86400)
            if cnt > settings.RAG_DAILY_BUDGET:  # per-day cap on live runs
                over_budget = True
        except Exception:
            pass
    mode = "live" if (live_ok and not over_budget) else "fallback"
    chunks: list[dict] = []
    try:
        factory = get_session_factory()
        async with factory() as s:
            if mode == "live":
                from app.services.rag.embeddings import get_providers as _gp

                # actually run vector search
                t0 = time.perf_counter()
                emb, llm = _gp()
                qvec = await emb.embed(query)
                timings["embed_query"] = ((time.perf_counter() - t0) * 1000, f"Embedded query ({len(qvec)} dims)")
                t1 = time.perf_counter()
                # pgvector cosine: 1 - (embedding <=> :q)
                try:
                    res = await s.execute(
                        text(
                            "SELECT document_title, content_chunk, 1 - (embedding <=> CAST(:q AS vector)) AS score FROM ai_lab_knowledge_base ORDER BY embedding <=> CAST(:q AS vector) LIMIT :k"
                        ),
                        {"q": str(qvec), "k": top_k},
                    )
                    rows = res.fetchall()
                    chunks = [
                        {"source": r[0], "score": round(max(0.0, min(1.0, float(r[2] or 0))), 4), "chunk": r[1]}
                        for r in rows
                    ]
                except Exception:
                    # fallback to lexical
                    mode = "fallback"
                    chunks = []
                timings["vector_search"] = (
                    (time.perf_counter() - t1) * 1000,
                    f"Searched knowledge base, returned {len(chunks)}",
                )
            if mode == "fallback":
                t1 = time.perf_counter()
                # lexical
                try:
                    res = await s.execute(
                        text(
                            "SELECT document_title, content_chunk, ts_rank_cd(tsv, websearch_to_tsquery('english', :q)) AS r FROM ai_lab_knowledge_base WHERE tsv @@ websearch_to_tsquery('english', :q) ORDER BY r DESC LIMIT :k"
                        ),
                        {"q": query, "k": top_k},
                    )
                    rows = res.fetchall()
                    mx = max([float(r[2] or 0) for r in rows], default=0.0) or 1.0
                    chunks = [
                        {"source": r[0], "score": round(max(0.0, min(1.0, float(r[2] or 0) / mx)), 4), "chunk": r[1]}
                        for r in rows
                    ]
                    if not chunks:
                        # ILIKE fallback: real lexical match — only rows sharing at
                        # least one query term; score = share of query terms matched.
                        res2 = await s.execute(
                            text(
                                "SELECT document_title, content_chunk, "
                                "COALESCE(("
                                "  SELECT COUNT(*) FROM unnest(regexp_split_to_array(lower(:q), '\\s+')) AS w"
                                "  WHERE w <> '' AND (lower(content_chunk) LIKE '%' || w || '%' "
                                "    OR lower(document_title) LIKE '%' || w || '%')"
                                "), 0)::float / GREATEST(1, array_length(regexp_split_to_array(lower(:q), '\\s+'), 1)) AS r "
                                "FROM ai_lab_knowledge_base "
                                "WHERE EXISTS ("
                                "  SELECT 1 FROM unnest(regexp_split_to_array(lower(:q), '\\s+')) AS w"
                                "  WHERE w <> '' AND (lower(content_chunk) LIKE '%' || w || '%' "
                                "    OR lower(document_title) LIKE '%' || w || '%')"
                                ") "
                                "ORDER BY r DESC LIMIT :k"
                            ),
                            {"q": query, "k": top_k},
                        )
                        rows2 = res2.fetchall()
                        chunks = [
                            {"source": r[0], "score": round(max(0.0, min(1.0, float(r[2] or 0))), 4), "chunk": r[1]}
                            for r in rows2
                        ]
                except Exception:
                    return JSONResponse(
                        status_code=503,
                        content={
                            "success": False,
                            "error": {"code": "ai_unavailable", "message": "Search unavailable"},
                        },
                    )
                timings["embed_query"] = (0.0, "Skipped (demo mode)")
                timings["vector_search"] = (
                    (time.perf_counter() - t1) * 1000,
                    f"Lexical search, returned {len(chunks)}",
                )
    except Exception:
        return JSONResponse(
            status_code=503,
            content={"success": False, "error": {"code": "ai_unavailable", "message": "Search unavailable"}},
        )
    # rerank
    t2 = time.perf_counter()
    from app.services.rag.retriever import extractive_answer, rerank

    chunks = rerank(query, chunks)
    timings["rerank"] = ((time.perf_counter() - t2) * 1000, f"Reranked {len(chunks)} chunks")
    t3 = time.perf_counter()
    if mode == "live":
        from app.services.rag.llm import get_providers, sanitize_output
        from app.services.rag.prompts import SYSTEM_PROMPT, build_prompt

        _, llm = get_providers()
        prompt = build_prompt(query, chunks)
        timings["prompt_assembly"] = ((time.perf_counter() - t3) * 1000, "Built grounded prompt")
        t4 = time.perf_counter()
        try:
            ans = await llm.generate(SYSTEM_PROMPT, prompt)
        except Exception:
            mode = "fallback"
            ans = extractive_answer(chunks)
            timings["prompt_assembly"] = (0.0, "Skipped (demo mode)")
        else:
            ans = sanitize_output(ans)
        timings["generation"] = ((time.perf_counter() - t4) * 1000, "Generated answer")
    else:
        timings["prompt_assembly"] = (0.0, "Skipped (demo mode)")
        t4 = time.perf_counter()
        ans = extractive_answer(chunks)
        timings["generation"] = ((time.perf_counter() - t4) * 1000, "Composed extractive answer")
        # ensure fallback honest embed timing already set
        timings.setdefault("embed_query", (0.0, "Skipped (demo mode)"))
    order = ["embed_query", "vector_search", "rerank", "prompt_assembly", "generation"]
    pipeline = [
        {"stage": st, "duration_ms": round(timings.get(st, (0.0, ""))[0], 2), "detail": timings.get(st, (0.0, ""))[1]}
        for st in order
    ]
    total_ms = round((time.perf_counter() - total_start) * 1000, 2)
    body = {
        "success": True,
        "retrieved_chunks": chunks[:top_k],
        "llm_response": ans[:600],
        "pipeline": pipeline,
        "total_ms": total_ms,
        "mode": mode,
    }
    if redis is not None:
        try:
            await redis.setex(cache_key, 86400, _j.dumps(body))
        except Exception:
            pass
    resp = JSONResponse(content=body)
    resp.headers["Cache-Control"] = "no-store"
    return resp
