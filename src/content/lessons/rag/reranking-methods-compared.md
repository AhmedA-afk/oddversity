---
title: "Reranking Methods Compared"
track: "rag"
status: live
summary: "Cross-encoders, ColBERT, LLM rerankers, and RRF compared on quality, latency, and cost, with a decision table for picking one under a latency budget."
duration: "7 min read"
---

If you've read [Reranking Retrieved Results](/learn/rag/reranking-retrieved-results), you already know *why* you rerank — first-stage retrieval optimizes for speed over a huge candidate space, and a second pass buys back precision on a small shortlist. What that page doesn't tell you is which mechanism to reach for, because "add a reranker" isn't one decision. It's a choice between four genuinely different ways of computing relevance, and they sit at very different points on the cost-versus-quality curve. Get the choice wrong and you either overpay for precision you didn't need or ship a system that's technically more accurate and practically too slow to use.

## Cross-encoder rerankers

A cross-encoder concatenates the query and a candidate document and runs them through a single transformer together, so every query token can attend to every document token before the model outputs one relevance score. That joint attention is exactly what a bi-encoder retriever gives up for speed — bi-encoders embed query and document separately, which is why they need reranking in the first place.

Cross-encoders win when you have a shortlist — say the top 50 to 200 candidates from vector or hybrid search — and need to squeeze the true top 5 or 10 into the right order for generation or citation. Their failure mode is architectural: because scoring requires the query and document together, you can't precompute anything ahead of time, and cost grows linearly with shortlist size. Rerank 5,000 candidates this way and latency stops being "a second pass" and starts being the bottleneck of your whole pipeline. Relative cost/latency: moderate to high per pair, but bounded and predictable if you keep the shortlist small.

## ColBERT-style late interaction

Late interaction, popularized by ColBERT, keeps a separate embedding per token instead of collapsing a document into one vector — see [Multi-Vector Retrieval](/learn/rag/multi-vector-retrieval) for how that indexing works. At query time it computes MaxSim (the max token-level dot product) for each query token against all document tokens, then sums those maxes into a score. Because document token embeddings are precomputed and only the lightweight MaxSim aggregation happens at query time, you get a lot of the interaction quality of a cross-encoder without paying its per-query cost.

It wins when you need cross-encoder-like discrimination but at a scale where running an actual cross-encoder over every candidate is too slow — think reranking directly against a large index rather than a pre-filtered shortlist. The catch is infrastructure: storing one embedding per token instead of one per document multiplies your storage and index size, and you need retrieval tooling that supports multi-vector MaxSim search, which most single-vector stores don't do out of the box (see [Choosing a Vector Database](/learn/rag/choosing-a-vector-database) for what to check before committing). Relative cost/latency: low *query* latency at scale, but high storage and index-build cost — you're trading disk and engineering effort for speed.

## LLM-as-reranker

Here you prompt an LLM directly with the query and a batch of candidates and ask it to score, judge, or reorder them — pointwise (score each independently), pairwise (compare two at a time), or listwise (rank the whole batch in one call). Unlike the other two approaches, this one can reason: it can follow instructions like "prefer the more recent document" or "penalize passages that only mention the term in passing," and it can catch relevance that's about meaning and intent rather than textual or embedding similarity.

That reasoning is also its cost. Each rerank is a full generation call, so latency and price scale with both the number of candidates and how much of each document you feed into the prompt. Listwise prompts hit context-length ceilings once your candidate count grows, and outputs can be non-deterministic run to run. It wins on small shortlists where relevance genuinely requires judgment — multi-hop questions, negation, domain-specific criteria — or offline, where you're using it to build a training set or a quality bar for [evaluating RAG quality](/learn/rag/evaluating-rag-quality) rather than serving it live. Relative cost/latency: the highest of the four, often by an order of magnitude, which is why it's rarely the thing sitting in a synchronous request path at scale.

## Reciprocal Rank Fusion (RRF)

RRF isn't a relevance model at all — it's a way to merge multiple *ranked lists* without scoring anything new. For each item, you sum `1 / (k + rank)` across every list it appears in (k is a small constant, commonly around 60, that dampens the effect of rank 1 versus rank 2). Items that multiple retrievers agree are relevant, even at different ranks, float to the top; items only one retriever liked get diluted. This is the standard glue in [Hybrid Search](/learn/rag/hybrid-search-lexical-and-vector) for combining BM25 and vector results, and it works equally well fusing two differently-tuned vector retrievers.

It wins whenever you already have more than one ranked list and want a robust combination with zero training, zero extra model calls, and no need to normalize incompatible score scales — BM25 scores and cosine similarities aren't on the same axis, but ranks always are. Its failure mode is that it can only reorder based on *agreement between lists that already exist* — if every input retriever missed the genuinely relevant document, RRF has nothing to promote it with. It's a fusion step, not a precision upgrade. Relative cost/latency: negligible — it's arithmetic over rank positions, effectively free next to the other three.

## Decision table

| Approach | Best when | Avoid when | Relative cost/latency |
|---|---|---|---|
| Cross-encoder | You have a shortlist (tens to a few hundred) and need top-k precision | You'd need to score thousands of candidates directly, or your latency budget is single-digit milliseconds | Medium-high per pair; moderate overall on a small shortlist |
| ColBERT / late interaction | You need near-cross-encoder quality at large scale and can invest in multi-vector indexing | Small deployments, no appetite for extra storage/index complexity | Low query latency at scale; high storage & index cost |
| LLM-as-reranker | Relevance requires reasoning or instructions; candidate sets are small; offline eval/training data | Large candidate counts, tight cost or latency budget, hot production path | Highest of the four — often 10x+ a cross-encoder call |
| RRF | You already run multiple retrievers (e.g. hybrid search) and want cheap, robust fusion | You have only one ranked list, or need genuine new relevance judgment, not just agreement | Near-zero — simple rank arithmetic |

## How to choose

Start by asking whether you already run more than one retriever. If you do — lexical plus vector, or two embedding models — put RRF in front of everything else. It's free, it stabilizes results across retrievers that disagree on scale, and in practice it removes enough obviously-wrong candidates that whatever you layer on top has less work to do. This isn't an either/or with the other three; RRF is usually step one, not a competing choice.

From there, your latency budget decides the next layer. If you can spend tens to low hundreds of milliseconds on a shortlist of a few hundred candidates, add a cross-encoder — it's the best precision-per-millisecond tradeoff available and the most battle-tested option, which is also why it's the default assumed in [Reranking Retrieved Results](/learn/rag/reranking-retrieved-results). If your latency budget is tighter than that but you're reranking against a much larger pool than a cross-encoder can touch — you're not filtering a shortlist, you're scoring against the bulk of your [ANN index](/learn/rag/similarity-search-and-ann-indexes) — that's the specific gap late interaction fills, provided you're willing to build the multi-vector infrastructure for it.

Reach for an LLM reranker only when the failure you're seeing isn't a ranking-quality problem but a *reasoning* problem — the cross-encoder keeps promoting documents that are lexically and semantically close to the query but wrong for a reason a human would catch instantly (stale dates, wrong jurisdiction, contradicts an instruction in the query). Keep it out of the synchronous hot path; use it offline to audit your existing reranker, generate hard negatives, or build the labeled set you'll use for [evaluating RAG quality](/learn/rag/evaluating-rag-quality). And don't treat this as a one-time pick: as your traffic or corpus grows, revisit the choice — a cross-encoder that was fine at a 50-document shortlist can become the slowest hop in the pipeline once product growth pushes that shortlist to 500.

**Related:** [Reranking Retrieved Results](/learn/rag/reranking-retrieved-results) · [Multi-Vector Retrieval](/learn/rag/multi-vector-retrieval) · [Hybrid Search: Lexical and Vector](/learn/rag/hybrid-search-lexical-and-vector) · [Similarity Search and ANN Indexes](/learn/rag/similarity-search-and-ann-indexes) · [Evaluating RAG Quality](/learn/rag/evaluating-rag-quality) · [Reranking Worked Example](/learn/rag/reranking-worked-example)
