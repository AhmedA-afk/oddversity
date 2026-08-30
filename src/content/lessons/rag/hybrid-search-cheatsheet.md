---
title: "Hybrid Search Cheatsheet"
track: "rag"
status: live
summary: "RRF formula and defaults, a decision table for when hybrid beats pure vector, normalization options compared, and copy-paste fusion code."
duration: "7 min read"
---

You already know *why* [hybrid search](/learn/rag/hybrid-search-lexical-and-vector) combines lexical and vector retrieval. This page is the reference you keep open while you actually build it: the fusion math, the knobs, and the code.

## The RRF formula

Reciprocal Rank Fusion (RRF) is the default fusion method almost everyone reaches for first, because it needs no score normalization — it only looks at *rank position*, not the raw scores, so it doesn't care that BM25 scores live on a wildly different scale than cosine similarities.

```text
score(d) = Σ over each ranker r of  1 / (k + rank_r(d))
```

For each document `d`, you look up its rank in every ranked list it appears in (1st, 2nd, 3rd...), take `1 / (k + rank)`, and sum across rankers. A document missing from a list simply contributes 0 for that list. Sort by the summed score, descending, and that's your fused ranking.

The constant `k` softens the curve — without it, rank 1 vs rank 2 would swing the score far more than rank 50 vs rank 51 does, which over-rewards a single ranker's top pick. Higher `k` flattens the differences between ranks; lower `k` sharpens them.

## Starting points, then measure

| Parameter | Starting point | Why |
|---|---|---|
| RRF `k` | **60** | The constant most fusion implementations (Elasticsearch, Weaviate, and the original RRF literature) ship as default. It's a reasonable flat prior, not a law of nature. |
| Candidates per branch before fusion | **top 50–100** from BM25 *and* top 50–100 from vector | Fusion can only promote a document that's *in* the candidate set. Starve either branch and hybrid degrades to whichever branch you didn't starve. |
| Final results after fusion | top 10–20, then optionally rerank | Fuse wide, truncate late — see [reranking retrieved results](/learn/rag/reranking-retrieved-results) for the stage after this one. |
| Weighted-sum `alpha` (if you skip RRF) | **0.5** (even split) | Only a starting point — see the normalization section below; this one actually needs tuning per corpus. |

Treat every number above as a dial to sweep against your own eval set, not a benchmark to trust blind — see [evaluating RAG quality](/learn/rag/evaluating-rag-quality) for how to set up that sweep.

## When hybrid beats pure vector

| If your queries/corpus have... | Then... | Because |
|---|---|---|
| Exact identifiers — SKUs, error codes, part numbers, ticket IDs | Hybrid, non-negotiable | Embeddings blur exact strings into "similar" neighborhoods; BM25 matches them exactly |
| Domain jargon or acronyms rare in general text | Hybrid | The embedding model likely under-represents them in its training distribution; see [embeddings and semantic similarity](/learn/rag/embeddings-and-semantic-similarity) |
| Short, keyword-style queries (2–3 words) | Hybrid, or expand the query first | Vector similarity needs enough semantic signal; a 2-word query is thin. Also consider [query rewriting and expansion](/learn/rag/query-rewriting-and-expansion) |
| Negation ("without dairy", "excluding 2023") | Hybrid | Bi-encoder embeddings notoriously flatten negation — "with X" and "without X" often land close together in vector space |
| Long, conversational, paraphrased questions over prose | Pure vector is often enough | This is the case dense retrieval was built for; lexical overlap is low but meaning overlap is high |
| Small, homogeneous corpus, single domain vocabulary | Pure vector, or skip retrieval entirely | Less lexical variance to exploit; check [when RAG is the wrong tool](/learn/rag/when-rag-is-the-wrong-tool) if the corpus is small enough to just prompt with |
| Numbers, dates, units | Hybrid | Same failure mode as identifiers — "5kg" and "5lb" can look deceptively close in embedding space |

Rule of thumb: if you can imagine a user typing the *exact substring* they want matched, add lexical. If every query is a full natural-language question, vector alone gets you further than you'd expect.

## Normalizing scores before fusion

RRF sidesteps this entirely by fusing on rank, not score — that's its main practical advantage. If you fuse on raw scores instead (a weighted sum), you have to normalize first, and the method you pick matters:

| Method | How | Watch out for |
|---|---|---|
| **RRF (rank-based)** | No normalization — fuse ranks directly | Loses magnitude information: a landslide top result and a photo-finish top result score identically |
| **Min-max** | `(score - min) / (max - min)` per ranked list | One outlier score compresses everything else toward 0 |
| **Z-score** | `(score - mean) / std` per ranked list | More outlier-resistant than min-max, but assumes a roughly normal score distribution, which BM25 scores often aren't |
| **Softmax** | Exponentiate and normalize to sum to 1 | Sharpens the gap between top and rest — good if you want confident results to dominate, bad if score gaps aren't meaningful |

If you're unsure which to reach for: start with RRF. Only move to weighted-score fusion if you have a concrete reason (e.g., you want to tune the lexical/vector balance continuously with an `alpha` instead of RRF's implicit equal weighting), and you're prepared to normalize per query, not once globally — score distributions shift with query difficulty.

## Copy-paste: RRF fusion

```python
def reciprocal_rank_fusion(ranked_lists, k=60):
    """
    ranked_lists: list of ranked doc-id lists, one per retriever,
                  each already sorted best-first, e.g.:
                  [bm25_doc_ids, vector_doc_ids]
    returns: doc_id -> fused_score, sorted descending
    """
    scores = {}
    for ranked in ranked_lists:
        for rank, doc_id in enumerate(ranked, start=1):
            scores[doc_id] = scores.get(doc_id, 0.0) + 1.0 / (k + rank)

    return dict(sorted(scores.items(), key=lambda kv: kv[1], reverse=True))

# usage
bm25_ids   = ["docA", "docC", "docB", "docE"]      # top-4 from lexical search
vector_ids = ["docB", "docA", "docF", "docD"]      # top-4 from vector search

fused = reciprocal_rank_fusion([bm25_ids, vector_ids], k=60)
top_results = list(fused.keys())[:10]
```

`docA` and `docB` show up in both lists, so they accumulate score from both — that's the whole mechanism. `docC`, `docE`, `docF`, `docD` each only get credit from the list they appeared in. No score normalization, no scale-matching, no fuss.

## Alternative: weighted score fusion

If you need a tunable dial instead of RRF's fixed rank-based weighting:

```python
def weighted_fusion(bm25_scores, vector_scores, alpha=0.5):
    """
    bm25_scores, vector_scores: dict of doc_id -> raw score
    Normalize each independently first (min-max shown here),
    then blend. alpha=1.0 is pure vector, alpha=0.0 is pure lexical.
    """
    def normalize(scores):
        vals = list(scores.values())
        lo, hi = min(vals), max(vals)
        span = hi - lo or 1.0  # guard divide-by-zero when all scores tie
        return {d: (s - lo) / span for d, s in scores.items()}

    bm25_norm = normalize(bm25_scores)
    vec_norm = normalize(vector_scores)
    all_ids = set(bm25_norm) | set(vec_norm)

    fused = {
        d: alpha * vec_norm.get(d, 0.0) + (1 - alpha) * bm25_norm.get(d, 0.0)
        for d in all_ids
    }
    return dict(sorted(fused.items(), key=lambda kv: kv[1], reverse=True))
```

This gives you a continuous knob (`alpha`) instead of RRF's implicit equal weighting — useful once you have an eval set to tune it against, painful before that, since you're now tuning a hyperparameter on vibes.

## Pitfalls to check before you ship

- **Dedupe by document ID, not by chunk text.** If your chunking overlaps (see [chunking strategies for documents](/learn/rag/chunking-strategies-for-documents)), the same source paragraph can appear as near-identical chunks from both branches and falsely look like strong agreement.
- **Retrieve enough candidates per branch.** Fusion can't fix a branch that never surfaced the right document in its top-k to begin with — widen before you fuse, narrow after.
- **Don't tune `k` or `alpha` on one query.** Score distributions differ by query type; tune against a representative eval set, not the three examples you keep testing with.
- **Check your ANN index isn't the bottleneck first.** If vector recall is low because of aggressive approximate search settings, no amount of fusion tuning will compensate — see [similarity search and ANN indexes](/learn/rag/similarity-search-and-ann-indexes).
- **Fusion is not reranking.** RRF and weighted-sum are cheap, coarse combination methods over two candidate sets. A cross-encoder reranker afterward is a different, more expensive, more accurate step — don't expect fusion alone to do a reranker's job.

**Related:** [Hybrid search: lexical and vector combined](/learn/rag/hybrid-search-lexical-and-vector) · [Hybrid search worked example](/learn/rag/hybrid-search-worked-example) · [Hybrid search common mistakes](/learn/rag/hybrid-search-common-mistakes) · [Reranking retrieved results](/learn/rag/reranking-retrieved-results) · [Evaluating RAG quality](/learn/rag/evaluating-rag-quality) · [Hybrid search quiz](/learn/rag/hybrid-search-quiz)
