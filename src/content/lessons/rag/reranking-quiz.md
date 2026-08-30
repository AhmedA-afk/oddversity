---
title: "Reranking: Check Yourself"
track: "rag"
status: live
summary: "Six scenario-based questions on why rerank, how many candidates to pass in, cross-encoders vs bi-encoders, latency levers, and RRF — with per-option feedback."
duration: "7 min read"
---

You've read how [reranking](/learn/rag/reranking-retrieved-results) fits into a pipeline. This page doesn't re-teach it — it's six scenarios that check whether the mental model actually holds up when something's ambiguous, expensive, or half-broken. If a question stings a little, that's the point: these target the exact spots where "I get it" and "I could debug it at 2am" diverge.

## 1. Why bother reranking at all?

Your vector search already returns results sorted by cosine similarity. What's the actual justification for adding a reranking stage after that?

- A. Reranking fixes bad chunking by re-splitting retrieved documents into better chunks
- B. The bi-encoder that produced those similarity scores was optimized to embed millions of documents fast and independently, not to precisely judge the top handful for *this* query — a model that looks at the query and document together can correct that ordering
- C. Reranking is required because vector databases don't support sorting by score
- D. Reranking replaces the need for a good embedding model, so you can use a cheaper one for initial retrieval

<details><summary>Answer</summary>

**Correct: B.** Bi-encoders embed query and document separately so you can precompute and index millions of vectors — that speed comes from *not* letting the query and document interact, which caps how precise the resulting similarity score can be. A cross-encoder trades that precomputability for accuracy by attending across both texts at once. **A** is a category error — reranking reorders candidates you already chunked and retrieved; it never touches how documents were split. See [chunking strategies](/learn/rag/chunking-strategies-for-documents) if that's the actual problem. **C** is false — sorting by similarity score is exactly how [ANN indexes](/learn/rag/similarity-search-and-ann-indexes) produce your initial ranked list in the first place. **D** is the tempting one: reranking does absorb some first-stage weakness, but it can't rescue a candidate set that never contained the right document — that's question 6.

</details>

## 2. Trimming the candidate count

You retrieve the top 100 candidates from vector search, then rerank them. To save cost, you drop that to the top 10 before reranking. What's the actual risk?

- A. The reranker will run out of memory since it needs more documents to compare against
- B. Cross-encoder accuracy degrades on any individual pair when it's given fewer candidates overall
- C. You've capped the reranker's ceiling — it can only reorder what's inside those 10, so a genuinely relevant document sitting at rank 40 in the first-stage list is now excluded before reranking ever runs, and no reordering step downstream can bring it back
- D. RRF requires at least 50 candidates per source to compute correctly

<details><summary>Answer</summary>

**Correct: C.** Reranking is strictly a reordering operation over whatever set it's handed — shrinking the candidate pool trades recall (does the right doc even make the cut) for latency and cost, and that trade is invisible until you hit a query where it bites. **A** is wrong — memory isn't the constraint; a cross-encoder scores one query-document pair at a time, so the set size affects total compute, not memory pressure. **B** is wrong — a cross-encoder's judgment of a single pair doesn't depend on how many other pairs are in the batch; each score is computed independently. **D** is a fabricated constraint smuggled in from a different technique (see question 5) — RRF has no minimum-candidate requirement.

</details>

## 3. Cross-encoder vs. bi-encoder, mechanically

A colleague says: "the cross-encoder is more accurate, so let's just use it for initial retrieval too and skip the bi-encoder stage." Why doesn't that work at corpus scale?

- A. Cross-encoders can only score text pairs shorter than 128 tokens, making them incompatible with full documents
- B. Cross-encoders need labeled query-document pairs collected from your specific corpus, so they can't generalize to a new domain
- C. A cross-encoder feeds the query and a candidate document into the model together in one forward pass, so its score can't be precomputed or stored in an index — every query would require one fresh inference call per document, meaning millions of forward passes just to answer a single question
- D. Cross-encoders only do lexical matching, not semantic similarity

<details><summary>Answer</summary>

**Correct: C.** This is the structural reason reranking exists as a *second stage* rather than a replacement for retrieval: the bi-encoder's separability (query and doc encoded independently) is what lets you index ahead of time; the cross-encoder's joint encoding is what makes it accurate — and those two properties are mutually exclusive. You use the cheap, indexable one to narrow millions down to dozens, then spend the cross-encoder's cost only on those dozens. **A** names a real practical limit (context window) but not the reason full-corpus use is infeasible — even a cross-encoder with no length limit would still cost one inference per document per query. **B** is backwards — cross-encoders are generally pretrained/fine-tuned like other transformer models and transfer reasonably across domains; that's not the blocker here. **D** is simply false — semantic scoring via joint attention is precisely the cross-encoder's advantage over lexical methods like [hybrid keyword search](/learn/rag/hybrid-search-lexical-and-vector).

</details>

## 4. Fixing a latency budget

Your pipeline retrieves 50 candidates, then reranks all 50 with a cross-encoder, and your P99 latency now blows your SLA. Which change actually addresses this without giving up most of the accuracy you added reranking for?

- A. Remove reranking entirely and fall back to the bi-encoder's raw similarity order
- B. Shrink the candidate set the reranker sees — say from 50 down to 15–20 — since cross-encoder cost scales roughly linearly with candidate count, and the documents the first-stage retriever ranked 20th–50th rarely turn out to be the ones reranking would have promoted to the top anyway
- C. Increase the bi-encoder's embedding dimensionality so first-stage retrieval is more precise
- D. Switch to a larger cross-encoder model, since bigger models batch more efficiently and end up faster per query

<details><summary>Answer</summary>

**Correct: B.** If a 50-candidate rerank takes, say, ~1 second at ~20ms per pair, cutting to 15 candidates gets you to roughly ~300ms — a real latency win — while sacrificing only the long tail of candidates that were unlikely to be the answer anyway (that's the tradeoff from question 2, run in the other direction, deliberately and measured). **A** overcorrects: it recovers all the latency but also throws away the entire accuracy improvement you built the stage for. **C** doesn't touch the problem — dimensionality affects first-stage embedding storage and comparison cost, not the reranking stage's per-candidate cost, and higher dimensions aren't latency-free either. **D** has the relationship backwards: a larger model does more computation per pair, and batching reduces overhead, it doesn't erase the extra FLOPs — bigger models are typically slower, not faster.

</details>

## 5. Fusing two ranked lists

You're combining results from a BM25 keyword search and a vector search into one list. Why does Reciprocal Rank Fusion (RRF) fit this better than averaging the two systems' raw scores?

- A. RRF trains a small cross-encoder on the fly to blend the two score distributions
- B. BM25 scores and cosine similarities live on incomparable scales with different ranges and distributions — RRF sidesteps that entirely by using only each document's *rank position* in each list, not its raw score
- C. RRF is a drop-in replacement for cross-encoder reranking that gets you the same accuracy for a fraction of the compute
- D. RRF requires normalizing both score distributions to [0,1] before it can fuse them

<details><summary>Answer</summary>

**Correct: B.** The formula per document is a sum over each list it appears in:

```text
score(d) = Σ  1 / (k + rank_i(d))
```

where `rank_i(d)` is the document's position in list *i* and `k` is a small constant (often 60) that dampens the effect of any single very-high rank. Because it only needs ranks, not scores, RRF fuses [hybrid search](/learn/rag/hybrid-search-lexical-and-vector) legs without you ever having to make BM25 and cosine similarity commensurable — which is genuinely hard to do well. **A** invents a training step; RRF is a fixed, deterministic formula with no learning involved. **C** is the most common mix-up on this page: RRF only reorders based on *where* candidates ranked across lists — it never looks at query-document content the way a cross-encoder does, so it's a cheap fusion step, not a substitute for the accuracy gain in question 1. The two compose well: RRF-fuse two retrievers, *then* cross-encoder rerank the fused top-k. **D** describes exactly the score-normalization problem RRF was designed to avoid — needing it would defeat the point.

</details>

## 6. What reranking can't touch

Your retrieval-only pipeline had a known gap: for some queries, the actually-relevant document never showed up in the top 100 results at all. You add a cross-encoder reranker on top of that top-100. What happens to that class of queries?

- A. The reranker fixes them, because cross-encoders are more accurate than bi-encoders at judging relevance
- B. They're unaffected — the reranker can only reorder documents that made it into the candidate set. If the relevant document never made the top 100, no amount of reranking surfaces it. This is a retrieval problem, not a ranking problem, and it needs fixing upstream — better embeddings, [hybrid search](/learn/rag/hybrid-search-lexical-and-vector), [query rewriting](/learn/rag/query-rewriting-and-expansion), or a larger candidate pool
- C. RRF automatically recovers the missing documents by fusing in a keyword search
- D. The reranker still improves these queries' answer quality because it re-scores against the whole corpus, not just the retrieved candidates

<details><summary>Answer</summary>

**Correct: B.** This is the ceiling from question 2, at its most consequential: reranking is a precision tool applied *after* recall has already been decided. Being more accurate at judging relevance (A's claim) is irrelevant if the relevant document was never handed to the judge — accuracy can't manufacture documents that aren't there. **A** conflates "more accurate ranker" with "can find things that were never retrieved" — those are different problems addressed by different parts of the pipeline. **C** is wrong because nothing about RRF is automatic — adding a keyword-search leg to catch what vector search misses is a deliberate architecture decision you have to make, not a side effect of reranking. **D** is the misconception to root out completely: cross-encoders are far too expensive to run against a full corpus per query (that's the whole argument in question 3) — they only ever see the candidate set you hand them. If this gap shows up in your own [RAG evaluation](/learn/rag/evaluating-rag-quality) numbers, the fix is a better first-stage retriever, not a better reranker.

</details>

**Related:** [Reranking Retrieved Results](/learn/rag/reranking-retrieved-results) · [Hybrid Search: Lexical and Vector](/learn/rag/hybrid-search-lexical-and-vector) · [Similarity Search and ANN Indexes](/learn/rag/similarity-search-and-ann-indexes) · [Reranking Worked Example](/learn/rag/reranking-worked-example) · [Reranking Common Mistakes](/learn/rag/reranking-common-mistakes) · [Evaluating RAG Quality](/learn/rag/evaluating-rag-quality)
