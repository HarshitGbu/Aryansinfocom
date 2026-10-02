from __future__ import annotations


async def run_pipeline(
    query: str, top_k: int, db_chunks: list[dict], mode: str, llm_answer: str, timings: dict[str, tuple[float, str]]
) -> dict:
    # timings: stage -> (duration_ms, detail)
    order = ["embed_query", "vector_search", "rerank", "prompt_assembly", "generation"]
    pipeline = [
        {"stage": s, "duration_ms": round(timings.get(s, (0.0, ""))[0], 2), "detail": timings.get(s, (0.0, ""))[1]}
        for s in order
    ]
    total = round(sum(t[0] for t in timings.values()), 2)
    return {
        "retrieved_chunks": db_chunks,
        "llm_response": llm_answer[:600],
        "pipeline": pipeline,
        "total_ms": total,
        "mode": mode,
    }
