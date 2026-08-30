---
title: "Reranking Cheatsheet"
track: "rag"
status: live
summary: "A dense reference for reranking: how many candidates to pull, cutoff strategies, when the latency is worth it, the RRF formula worked by hand, and copy-paste snippets."
duration: "7 min read"
---

You already know why [reranking](/learn/rag/reranking-retrieved-results) helps. This page is the reference you keep open while you're actually setting the numbers: how many candidates to pull, where to cut, whether it's worth the extra hop at all, and the RRF math you'll inevitably need to explain to a teammate.

## How many candidates to rerank

The rule that matters: **only rerank candidates you didn't already trust enough to keep.** If your context window fits 5 chunks and you retrieve exactly 5, a reranker has nothing to fix — you already committed. The point of reranking is to pull a wider net (where recall is good but ordering is sloppy) and then sort hard within it.

Decision rule:

- If recall@50 is a lot higher than recall@5 on your eval set — the right chunk shows up, just buried — that gap is exactly what reranking fixes. Pull as many candidates as the gap suggests.
- If recall@5 already ≈ recall@50, reranking has nothing to sort — your first-stage retriever is doing the job alone.
- If you don't know your recall@k numbers yet, get them before tuning rerank depth — see [evaluating RAG quality](/learn/rag/evaluating-rag-quality). Tuning this blind is guesswork.

Starting points, then measure:

| First-stage retrieval depth | Rerank down to | When |
|---|---|---|
| 20–50 candidates | top 3–5 | default for chat/QA, tight context budget |
| 50–100 candidates | top 5–10 | multi-doc synthesis, more context room |
| 100+ candidates | top 10–20 | agentic/multi-hop RAG casting a wide net |

Cost doesn't stay flat as you widen the net. A cross-encoder scores each query–document pair with a full forward pass — there's no precomputed-vector shortcut the way there is in [ANN search](/learn/rag/similarity-search-and-ann-indexes). If scoring one pair takes some fixed unit of time `t`, scoring 100 pairs costs roughly `100t`. Go from 50 to 100 candidates and you've roughly doubled rerank latency for a shot at pulling one more good doc into the top slots — worth knowing before you reflexively widen the net "to be safe."

## Cutoff strategies

Three ways to decide how many reranked results actually survive into the prompt:

**1. Fixed top-k** — simplest, deterministic, matches a fixed context budget. Default choice when you don't yet have calibrated scores.

**2. Absolute score threshold** — keep everything above a fixed value. Only works cleanly with a reranker that outputs calibrated, comparable scores (a hosted rerank API returning a 0–1 relevance score, not a raw cross-encoder logit that isn't comparable across queries).

**3. Relative/gap cutoff** — walk down the sorted scores and cut at the biggest drop between consecutive items, capped by a min and max:

```python
def gap_cutoff(scored_docs, min_k=1, max_k=10):
    scores = [s for _, s in scored_docs]
    best_gap_idx, best_gap = max_k, 0
    for i in range(min_k, min(max_k, len(scores) - 1)):
        gap = scores[i - 1] - scores[i]
        if gap > best_gap:
            best_gap, best_gap_idx = gap, i
    return scored_docs[:best_gap_idx]
```

If X then Y: if your queries vary a lot in how many chunks are genuinely relevant (sometimes 1, sometimes 8), use gap cutoff — fixed top-k either starves multi-fact queries or stuffs single-fact ones with noise.

## Is a reranker worth the latency?

| Signal from your eval set | Verdict |
|---|---|
| Top-5 precision from first-stage retrieval already looks right | Skip it, or make it optional |
| Recall@50 ≫ recall@5 — good docs exist, just buried mid-list | Yes, textbook case |
| Small corpus where first-stage retrieval is already near-perfect | Skip, nothing to fix |
| Hard sub-100ms budget, high QPS, no batching | Try a smaller/distilled cross-encoder, or skip |
| Agentic/multi-hop RAG re-querying several times per turn | Rerank once at the end, not after every hop |

Cross-encoders are markedly more accurate at judging query-document relevance than bi-encoder similarity, precisely because they attend across the pair instead of comparing two fixed vectors — see [embeddings and semantic similarity](/learn/rag/embeddings-and-semantic-similarity) if you want the "why" underneath that. That accuracy is real, but it's not free, and it's only worth paying for when your first-stage list has good candidates in the wrong order — not when it's missing them entirely (that's a retrieval problem, not a reranking one) or when it's already ordered fine.

## RRF: the formula, worked by hand

Reciprocal Rank Fusion combines multiple ranked lists (e.g. BM25 + vector, as in [hybrid search](/learn/rag/hybrid-search-lexical-and-vector)) using only rank position — no need for scores to be comparable across systems:

```
RRF(d) = Σ over each ranker r of  1 / (k + rank_r(d))
```

`rank_r(d)` is d's 1-indexed rank in list r. `k` is a constant that dampens how much rank 1 dominates rank 2 — a small k makes top ranks matter a lot more; a larger k flattens the curve.

Worked example, three docs, two rankers, k=60:

```
BM25 ranks:   A=1, C=2, B=3
Vector ranks: B=1, A=2, C=3

RRF(A) = 1/61 + 1/62 ≈ 0.016393 + 0.016129 ≈ 0.032522
RRF(B) = 1/63 + 1/61 ≈ 0.015873 + 0.016393 ≈ 0.032266
RRF(C) = 1/62 + 1/63 ≈ 0.016129 + 0.015873 ≈ 0.032002

Fused order: A > B > C
```

A ranked #1 in one list and #2 in the other, edging out B and C, who each had one strong and one weak rank. That's RRF's whole job: reward consistent placement across lists without needing the underlying scores to mean the same thing.

Starting point: k=60 (the common default in practice). Lower it (10–20) if you trust your first-stage rankers and want top positions to dominate; raise it (100+) if your rankers are noisy and you'd rather flatten differences. Then measure — this constant is cheap to sweep on your own eval set.

RRF and a learned reranker aren't either/or — RRF is a good cheap fusion step *before* the expensive cross-encoder pass, not a replacement for it. [Compared reranking methods](/learn/rag/reranking-methods-compared) covers where RRF, cross-encoders, and other approaches each fit.

## Quick snippets

RRF fusion:

```python
def reciprocal_rank_fusion(ranked_lists, k=60):
    """ranked_lists: e.g. [bm25_ranked_ids, vector_ranked_ids]"""
    scores = {}
    for ranked_list in ranked_lists:
        for rank, doc_id in enumerate(ranked_list, start=1):
            scores[doc_id] = scores.get(doc_id, 0.0) + 1.0 / (k + rank)
    return dict(sorted(scores.items(), key=lambda x: x[1], reverse=True))
```

Cross-encoder rerank:

```python
from sentence_transformers import CrossEncoder

reranker = CrossEncoder("cross-encoder/ms-marco-MiniLM-L-6-v2")

def rerank(query, candidates, top_k=5):
    pairs = [(query, doc.text) for doc in candidates]
    scores = reranker.predict(pairs)
    ranked = sorted(zip(candidates, scores), key=lambda x: x[1], reverse=True)
    return ranked[:top_k]
```

Full pipeline — fuse cheaply, then rerank the fused shortlist:

```python
def hybrid_rerank_pipeline(query, bm25_search, vector_search, reranker,
                            first_stage_k=50, final_k=5):
    bm25_ids = bm25_search(query, k=first_stage_k)
    vector_ids = vector_search(query, k=first_stage_k)

    fused = reciprocal_rank_fusion([bm25_ids, vector_ids], k=60)
    candidate_ids = list(fused.keys())[:first_stage_k]  # cap before the expensive step

    candidates = fetch_docs(candidate_ids)
    return rerank(query, candidates, top_k=final_k)
```

## Starting points, then measure

| Parameter | Starting point | Adjust when |
|---|---|---|
| First-stage candidates per retriever | 20–50 | Widen toward 100 if recall@5 ≪ recall@50 |
| Candidates sent to reranker (post-fusion, deduped) | 20–50 | Rerank cost scales ~linearly with this count |
| Final top-k kept | 3–8 | Set by your context budget, not a round number |
| RRF constant k | 60 | Lower to trust top ranks more, raise to flatten noisy lists |
| Cutoff strategy | Fixed top-k | Switch to score threshold once your reranker gives calibrated scores |

**Related:** [Reranking Retrieved Results](/learn/rag/reranking-retrieved-results) · [Reranking Worked Example](/learn/rag/reranking-worked-example) · [Reranking Methods Compared](/learn/rag/reranking-methods-compared) · [Hybrid Search: Lexical and Vector](/learn/rag/hybrid-search-lexical-and-vector) · [Evaluating RAG Quality](/learn/rag/evaluating-rag-quality) · [Similarity Search and ANN Indexes](/learn/rag/similarity-search-and-ann-indexes)
