from __future__ import annotations

import time
from typing import Any

from fastapi import APIRouter, Request
from fastapi.responses import JSONResponse

from app.schemas.requests import PromptParseRequest, RagRequest

router = APIRouter(tags=["playground"])

_INJECTION_REFUSAL = (
    "I cannot process queries that contain instruction-override or prompt-injection patterns. "
    "Please ask a question about our services or infrastructure."
)


@router.post("/playground/prompt-parse")
async def prompt_parse(payload: PromptParseRequest) -> JSONResponse:
    from app.services.prompt_parser import parse_prompt

    parsed = parse_prompt(payload.prompt)
    resp = JSONResponse(content={"success": True, **parsed})
    resp.headers["Cache-Control"] = "no-store"
    return resp


@router.post("/playground/rag-simulation")
async def rag_simulation(payload: RagRequest, request: Request) -> JSONResponse:
    import hashlib
    import json as _j
    import re as _re

    from sqlalchemy import text

    from app.config import get_settings
    from app.core.db import get_session_factory
    from app.core.redis import get_redis_client
    from app.core.security import client_ip, escape_like, hash_ip
    from app.services.prompt_parser import is_prompt_injection

    query = _re.sub(r"[\x00-\x1f\x7f]", " ", payload.query)
    query = _re.sub(r"\s+", " ", query).strip()
    if not (3 <= len(query) <= 300):
        return JSONResponse(
            status_code=422,
            content={"success": False, "error": {"code": "validation_error", "message": "Query must be 3..300 chars"}},
        )
    top_k = payload.top_k
    settings = get_settings()

    if is_prompt_injection(query):
        pipeline = [
            {"stage": st, "duration_ms": 0.0, "detail": "Blocked (prompt-injection guard)"}
            for st in ("embed_query", "vector_search", "rerank", "prompt_assembly", "generation")
        ]
        return JSONResponse(
            content={
                "success": True,
                "retrieved_chunks": [],
                "llm_response": _INJECTION_REFUSAL,
                "pipeline": pipeline,
                "total_ms": 0.0,
                "mode": "fallback",
            },
            headers={"Cache-Control": "no-store"},
        )

    norm = query.lower().strip()
    cache_key = f"rag:{hashlib.sha256(f'{norm}:{top_k}'.encode()).hexdigest()}"
    redis = get_redis_client()
    if redis is not None:
        try:
            cached = await redis.get(cache_key)
            if cached:
                body = _j.loads(cached)
                body["mode"] = "cached"
                return JSONResponse(content=body, headers={"Cache-Control": "no-store"})
        except Exception:
            pass
    total_start = time.perf_counter()
    timings: dict[str, tuple[float, str]] = {}
    # decide mode
    live_ok = bool(
        settings.EMBEDDING_PROVIDER == "openai"
        and settings.OPENAI_API_KEY
        and settings.LLM_PROVIDER == "anthropic"
        and settings.ANTHROPIC_API_KEY
        and settings.LLM_MODEL
    )
    # budget check: fail closed on Redis unavailability/error; enforce per-IP + global daily cap
    over_budget = False
    if live_ok:
        if redis is None:
            over_budget = True
        else:
            ip_hash = hash_ip(client_ip(request))
            ip_key = f"rag:budget:ip:{ip_hash}"
            global_key = "rag:budget:global"
            per_ip_limit = min(20, settings.RAG_DAILY_BUDGET)
            try:
                ip_cnt = await redis.incr(ip_key)
                if await redis.ttl(ip_key) == -1:
                    await redis.expire(ip_key, 86400)
                if ip_cnt > per_ip_limit:
                    over_budget = True
                else:
                    global_cnt = await redis.incr(global_key)
                    if await redis.ttl(global_key) == -1:
                        await redis.expire(global_key, 86400)
                    if global_cnt > settings.RAG_DAILY_BUDGET:
                        over_budget = True
            except Exception:
                over_budget = True
    mode = "live" if (live_ok and not over_budget) else "fallback"
    chunks: list[dict[str, Any]] = []
    try:
        factory = get_session_factory()
        async with factory() as s:
            if mode == "live":
                from app.services.rag.llm import get_providers as _gp

                # actually run vector search
                t0 = time.perf_counter()
                emb, _ = _gp()
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
                        escaped_q = escape_like(query)
                        res2 = await s.execute(
                            text(
                                "SELECT document_title, content_chunk, "
                                "COALESCE(("
                                "  SELECT COUNT(*) FROM unnest(regexp_split_to_array(lower(:q), '\\s+')) AS w"
                                "  WHERE w <> '' AND (lower(content_chunk) LIKE '%' || w || '%' ESCAPE '\\' "
                                "    OR lower(document_title) LIKE '%' || w || '%' ESCAPE '\\')"
                                "), 0)::float / GREATEST(1, array_length(regexp_split_to_array(lower(:q), '\\s+'), 1)) AS r "
                                "FROM ai_lab_knowledge_base "
                                "WHERE EXISTS ("
                                "  SELECT 1 FROM unnest(regexp_split_to_array(lower(:q), '\\s+')) AS w"
                                "  WHERE w <> '' AND (lower(content_chunk) LIKE '%' || w || '%' ESCAPE '\\' "
                                "    OR lower(document_title) LIKE '%' || w || '%' ESCAPE '\\')"
                                ") "
                                "ORDER BY r DESC LIMIT :k"
                            ),
                            {"q": escaped_q, "k": top_k},
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
    if mode == "live" and not is_prompt_injection(query):
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
    if redis is not None and (mode == "live" or not live_ok):
        try:
            await redis.setex(cache_key, 86400, _j.dumps(body))
        except Exception:
            pass
    resp = JSONResponse(content=body)
    resp.headers["Cache-Control"] = "no-store"
    return resp
