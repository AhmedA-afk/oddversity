---
title: "Filtering vs Reranking"
track: "context-engineering"
status: live
summary: "Reranking orders candidates by relevance; filtering decides which ones earn a seat at all — conflating them wastes both."
duration: "7 min read"
---

Ask a retrieval pipeline to "just rerank the results" and you'll often get twenty documents in a better order — still twenty documents. Reranking answers "which of these is more relevant than which," a comparative question. It never answers "should this be here at all." That's a separate job, and treating them as one step is how pipelines end up sending well-sorted noise into the context window.

## Optional depth: why these are genuinely different problems

Reranking takes a candidate set as fixed and produces an ordering — typically via a cross-encoder or a more expensive relevance model than whatever produced the initial candidate list, since reranking a shortlist can afford compute that scoring the full corpus can't (see [Reranking Retrieved Results](/learn/rag/reranking-retrieved-results) for the mechanics). It optimizes precision *within* a set. It has no native concept of "none of these are good enough" — a reranker will confidently order ten irrelevant documents from "least bad" to "most bad," because ordering is all it was asked to do.

Filtering takes the same or a different candidate set and produces a subset — some candidates admitted, some rejected, independent of their relative order. It's the step that can say "only two of these ten clear the bar; cut the other eight," which reranking structurally cannot do on its own. See [Relevance Filtering in Depth](/learn/context-engineering/relevance-filtering-in-depth) for the three filters (threshold, redundancy, task-conditioning) that do this work.

The confusion happens because both steps consume the same input — a scored candidate list — and it's tempting to assume a good score ordering already implies a good cutoff. It doesn't: reranking can correctly determine that document 3 is more relevant than document 4 while both are, in absolute terms, unhelpful for the query. Order and quality are different axes.

## What each step actually optimizes

| | Reranking | Filtering |
|---|---|---|
| Question answered | Which is more relevant than which? | Which ones are relevant enough to include, and are any redundant with each other? |
| Output shape | Same set, new order | Smaller (or equal) set, order-agnostic |
| Fails silently when | Every candidate is bad — still produces a confident order | Threshold or redundancy check is skipped — a bad candidate rides through untouched |
| Typical mechanism | Cross-encoder, LLM-as-judge pairwise comparison | Similarity threshold, dedup pass, task-conditioning rules (see [Relevance Filtering in Depth](/learn/context-engineering/relevance-filtering-in-depth)) |

## A pipeline that does both, in the right order

Run reranking first, on the full candidate pool, because a cutoff decided on the *initial* retrieval score (often cheap, embedding-only similarity) is less reliable than one decided after a more accurate reranked score. Then apply a budget-aware filter on the reranked order:

```python
def retrieve_and_filter(query, top_k_initial=30, token_budget=1200):
    candidates = initial_retrieve(query, k=top_k_initial)       # cheap, wide net
    reranked = rerank(query, candidates)                         # expensive, accurate order
    reranked = drop_near_duplicates(reranked, sim_fn=text_similarity)  # cut redundancy
    kept, used = [], 0
    for doc in reranked:
        if doc.rerank_score < MIN_RERANK_SCORE:
            break                          # score has dropped below the bar — stop, don't just cap by count
        if used + doc.tokens > token_budget:
            continue                        # skip if it doesn't fit, but keep checking smaller ones behind it
        kept.append(doc)
        used += doc.tokens
    return kept
```

Two things matter in this order: the redundancy pass runs *after* reranking (so it's comparing accurately-scored candidates, keeping the higher-ranked half of any near-duplicate pair), and the cutoff is score-based with a token-budget ceiling, not a fixed count — a `top_k_initial=30` candidate pool might legitimately filter down to 3 good documents or up to 8, depending on how many actually clear both the relevance bar and the redundancy check.

## Where conflating them goes wrong

A pipeline that treats "rerank to top-5" as the whole job will faithfully hand over five documents even on a query where only one is genuinely relevant — the other four are just the "best of the bad," still competing for attention and still diluting signal (see [Signal-to-Noise in the Window](/learn/context-engineering/signal-to-noise-in-context)). Conversely, a pipeline that filters by a fixed similarity threshold on cheap initial-retrieval scores, then never reranks, can admit a set where a lower-quality document sits ahead of a better one purely because the initial retriever's coarse similarity metric doesn't distinguish them well — and if that unordered set then gets fed straight into a context window without a subsequent ordering pass (see [Ordering Context for Attention](/learn/context-engineering/ordering-context-for-attention)), the actually-best document might land in the worst position by accident.

The two jobs are complementary precisely because they fail in different, non-overlapping ways: reranking's failure is confidently ordering junk; filtering's failure is admitting junk that never gets reordered away.

## How to choose the split in your own pipeline

Rerank whenever your initial retrieval is coarse (pure embedding similarity, keyword match) and you have a small enough candidate pool that a more expensive reranker is affordable — reranking cost typically scales with candidate count, so it's usually applied to a pre-narrowed top-N, not the whole corpus. Filter always, regardless of whether you rerank — even a perfectly reranked list can have a bad tail, and reranking alone will never tell you where to cut it. If you can only afford one of the two, filtering is the higher-leverage investment: a mediocre order of the right documents beats a great order of the wrong ones.

**Related:** [Reranking Retrieved Results](/learn/rag/reranking-retrieved-results), [Relevance Filtering in Depth](/learn/context-engineering/relevance-filtering-in-depth), [Chunking Strategies for Documents](/learn/rag/chunking-strategies-for-documents), [Ordering Context for Attention](/learn/context-engineering/ordering-context-for-attention)
