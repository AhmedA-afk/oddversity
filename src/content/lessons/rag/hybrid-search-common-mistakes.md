---
title: "Hybrid Search: Common Mistakes"
track: "rag"
status: live
summary: "Five ways hybrid search fusion quietly breaks in production — score scales, RRF's k, normalization, dropping lexical, and duplicate documents — with concrete fixes for each."
duration: "7 min read"
---

Hybrid search rarely fails because the retrievers are bad. It fails in the ten or twenty lines of code that combine their outputs — and that code gets written once, under time pressure, and then never revisited. If you already know how [lexical and vector retrieval combine](/learn/rag/hybrid-search-lexical-and-vector) in principle, this page is about the specific, recurring ways that combination goes wrong in real systems.

## Adding raw lexical and vector scores together

### The mistake
You have a BM25 score for each candidate and a cosine similarity score for each candidate, so you add them: `final_score = bm25_score + cosine_score`, maybe with a weight on one term. It compiles, it returns results, it looks like hybrid search.

**Why it's wrong.** BM25 scores are unbounded and corpus-dependent — they scale with term rarity (IDF) and document length, so a score of 4 on one query and 4 on another mean nothing comparable. Cosine similarity, by contrast, is bounded (typically 0 to 1 after normalization, per [the geometry of embedding similarity](/learn/maths-foundations/cosine-similarity-angular-distance-embedding-retrieval)). Summing an unbounded score with a bounded one means whichever happens to produce bigger raw numbers dominates the ranking — not whichever signal is actually more relevant. Say a document scores `bm25 = 12.4, cosine = 0.52` and another scores `bm25 = 3.1, cosine = 0.97`. Naive addition gives 12.92 vs 4.07 — the near-perfect semantic match loses badly to a mediocre one, purely because BM25's numbers run an order of magnitude larger.

**Symptom.** Your "hybrid" ranking looks almost identical to pure lexical search, regardless of how much weight you thought you gave the vector side. Or the reverse: you rescale the vector score at some point and it silently swamps lexical entirely. Either way, changing the vector model or the BM25 parameters barely moves the final ranking — a sign one channel has no real influence.

**Fix.** Never add raw scores from different retrievers. Either normalize both to a shared, comparable range before combining (min-max or z-score, computed per query — see the next mistake) or skip score arithmetic altogether and fuse on rank position using Reciprocal Rank Fusion, which never touches the raw scores at all.

```python
def minmax(scores):
    lo, hi = min(scores), max(scores)
    if hi - lo < 1e-9:
        return [0.0 for _ in scores]
    return [(s - lo) / (hi - lo) for s in scores]

lexical_norm = minmax(bm25_scores)   # now in [0, 1]
vector_norm  = minmax(cosine_scores)  # now in [0, 1]
combined = [0.5 * l + 0.5 * v for l, v in zip(lexical_norm, vector_norm)]
```

## Copying k = 60 into RRF without knowing what it does

### The mistake
You skip score normalization entirely by fusing on rank with Reciprocal Rank Fusion — a good instinct — but you paste in `k = 60` because that's the constant everyone's blog post and library default uses, without checking whether it fits your setup.

**Why it's wrong.** RRF scores each document as `sum(1 / (k + rank))` across the lists it appears in. The constant `k` controls how sharply the curve favors top ranks versus flattening out across the list. `k = 60` comes from the original Cormack/Clarke/Buettcher paper, which fused rankings hundreds of documents deep. If you're fusing only the top 10 or 20 results per retriever — normal for a latency-constrained production system — `k = 60` makes rank 1 and rank 10 contribute almost the same amount, because 60 dwarfs the rank differences:

```python
def rrf(rank, k):
    return 1 / (k + rank)

rrf(1, k=60)   # 0.01639
rrf(10, k=60)  # 0.01429   -> only ~13% lower than rank 1

rrf(1, k=1)    # 0.5
rrf(10, k=1)   # 0.0909    -> rank 1 is now 5.5x rank 10
```

With `k = 60` on a shallow list, fusion barely discriminates between "this retriever's best guess" and "this retriever's tenth-best guess" — which quietly defeats the point of ranking at all.

**Symptom.** The fused top result changes very little when you swap in a noticeably better or worse retriever on either side. Precision at the top of the list looks worse than either individual retriever's precision at the top of its own list — because a mediocre document ranked 8th on both sides can out-score a document ranked 1st on only one side.

**Fix.** Treat `k` as a hyperparameter tied to how deep your candidate lists actually are, not a constant you inherited. As a starting point, keep `k` in the same order of magnitude as your candidate-list depth, then tune it against a labeled query set the way you would any other hyperparameter — see [evaluating RAG quality](/learn/rag/evaluating-rag-quality) — and re-check it whenever you change how many candidates each retriever returns. The [hybrid search worked example](/learn/rag/hybrid-search-worked-example) shows this arithmetic run end to end on a real query.

## Normalizing once, globally, instead of per query

### The mistake
You do normalize before combining scores — but you compute the min and max once, from a sample of historical queries or at index-build time, and reuse those fixed bounds for every query afterward.

**Why it's wrong.** Score distributions shift per query, not just per corpus. A query with several strong matches produces a tight cluster of high BM25 and cosine scores; a query with only weak, tangential matches produces a wide, low-lying spread. Applying one global min/max to both cases means the "easy" query's uniformly-good scores get flattened toward the top of the fixed range, and the "hard" query's uniformly-mediocre scores get flattened toward the bottom — regardless of which documents are actually best *for that query*. Rare-term queries (an exact product code, an error string, a name that appears once in the corpus) are hit hardest, because their absolute score range often falls outside whatever range your global sample happened to capture.

**Symptom.** Hybrid ranking looks fine in aggregate evaluation, but degrades specifically on queries whose score profile differs from your original sample — new content types, unusually short or long queries, or exact-match lookups. This is easy to miss because an aggregate metric averages over many typical queries and hides a failure that's concentrated in a minority.

**Fix.** Normalize within the current result set, for the current query — min-max or z-score computed over just the top-N candidates you actually retrieved this time, not a precomputed global scale. If maintaining per-query normalization correctly feels fragile, that's a real signal to fuse on rank (RRF) instead, since rank-based fusion sidesteps this entire class of bug by never looking at absolute score values.

## Dropping lexical search because vectors feel more modern

### The mistake
After seeing embeddings retrieve conceptually related passages that keyword search missed, a team downweights or removes the lexical channel — vector search feels like the more sophisticated technology, so it's assumed to subsume the older one.

**Why it's wrong.** Embedding models are trained to capture semantic similarity, not exact-token overlap, and that's a real tradeoff, not a strictly better version of matching. Product SKUs, error codes, legal clause numbers, API identifiers, acronyms, and exact-phrase or negation queries all depend on exact term matches that a dense embedding may represent only generically — a novel or rare token can land in an unhelpful region of the embedding space simply because the model saw little like it in training. BM25 has no such blind spot: exact overlap is exact overlap. This is precisely why [hybrid search](/learn/rag/hybrid-search-lexical-and-vector) exists rather than either method alone.

**Symptom.** Overall retrieval metrics look stable or even improve after dropping lexical, but quality regresses sharply on a specific slice of queries — the ones containing identifiers, codes, or exact phrases. Because that slice is usually a minority of your query traffic, it gets diluted into an aggregate number and doesn't show up until users complain about a specific class of lookup failing.

**Fix.** Decide the lexical/vector balance from evidence, not from which technology feels newer. Evaluate lexical-only, vector-only, and hybrid separately, and break the evaluation out by query type — see [evaluating RAG quality](/learn/rag/evaluating-rag-quality) — including a dedicated rare-term or exact-match slice. If vectors genuinely win on every slice for your corpus, that's a legitimate reason to simplify; assuming it without measuring is the mistake. For background on what embeddings do and don't capture, see [embeddings and semantic similarity](/learn/rag/embeddings-and-semantic-similarity).

## Letting the same document score twice

### The mistake
Your lexical retriever and vector retriever both return the same document — often the same chunk — near the top of their respective lists, since both are searching over the same underlying content. The fusion code concatenates both lists without keying by a stable document ID, so that document effectively gets counted as two separate candidates.

**Why it's wrong.** RRF and score-sum fusion are both defined *per document*: when a document appears in multiple ranked lists, its contributions from each list should accumulate into one combined score for one document. If your code instead treats each list's entry as an independent row — for instance, appending both lists into one array and sorting by score without deduplication — the same chunk can occupy two slots in your final top-k, or its score can be computed inconsistently depending on which occurrence downstream code happens to keep.

**Symptom.** The same passage shows up twice in the context you hand to the LLM, sometimes with two different scores attached. Your effective top-k is smaller than intended, because one slot is spent repeating content already present elsewhere — which crowds out coverage and can bias the model toward over-trusting whatever got duplicated. This is easiest to catch by counting unique document IDs in your final result set and finding it's less than `k`.

**Fix.** Dedupe by canonical document or chunk ID *before* computing the fused score, and accumulate contributions into that one key — this is exactly what a correct RRF implementation does when you key a running-total dictionary by document ID:

```python
from collections import defaultdict

def fuse_rrf(rank_lists, k=60):
    scores = defaultdict(float)
    for ranked_ids in rank_lists:
        for rank, doc_id in enumerate(ranked_ids, start=1):
            scores[doc_id] += 1 / (k + rank)  # same doc_id accumulates here
    return sorted(scores.items(), key=lambda kv: kv[1], reverse=True)
```

If you add a [reranking](/learn/rag/reranking-retrieved-results) step after fusion, verify it's deduping too — a reranker scoring the same chunk twice wastes a scoring call and can still let a duplicate through to the final context.

## Pre-flight checklist

- Never add a lexical score and a vector score directly — normalize both to a comparable range first, or fuse on rank (RRF) instead of raw scores.
- Don't copy `k = 60` into RRF by default — pick `k` relative to how deep your candidate lists actually are, then validate it against labeled queries.
- Normalize per query, using the current result set's own min/max — not a fixed global scale computed once.
- Evaluate lexical-only, vector-only, and hybrid separately, with a rare-term or exact-match query slice broken out, before downweighting or dropping lexical.
- Dedupe by canonical document/chunk ID before scoring — a document in both lists must merge into one row, not two.
- Count unique document IDs in your final top-k as a cheap sanity check for silent duplication.
- Re-run your fusion on a handful of exact-identifier queries and a handful of purely semantic queries — if the ranking barely changes between them, one channel isn't actually contributing.

**Related:** [Hybrid Search: Lexical and Vector Combined](/learn/rag/hybrid-search-lexical-and-vector) · [Hybrid Search Worked Example](/learn/rag/hybrid-search-worked-example) · [Evaluating RAG Quality](/learn/rag/evaluating-rag-quality) · [Reranking Retrieved Results](/learn/rag/reranking-retrieved-results) · [Embeddings and Semantic Similarity](/learn/rag/embeddings-and-semantic-similarity) · [Hybrid Search Cheatsheet](/learn/rag/hybrid-search-cheatsheet)
