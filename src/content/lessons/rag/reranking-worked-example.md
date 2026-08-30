---
title: "Reranking, Worked: Fixing a Wrong Top-1"
track: "rag"
status: live
summary: "A tricky query where vector search confidently returns the wrong passage at #1 — and a cross-encoder rerank that fixes it, with scores and latency shown step by step."
duration: "7 min read"
---

Vector search doesn't return the passage that answers your question. It returns the passage whose embedding sits closest to your query's embedding — and those are only sometimes the same thing. Here's a case where they diverge in a completely ordinary way, and the two-line fix that pulls the right answer back to #1.

## The setup

You're building a support bot over a SaaS API's documentation — 50-odd short passages covering auth, errors, rate limits, and plan tiers, indexed with a standard bi-encoder embedding model and an ANN index. A user asks:

> **Query:** "How many requests per minute am I allowed on the free plan?"

Your retriever pulls the top 50 candidates by cosine similarity. This corpus is small enough that "top 50" is almost the whole thing, which matters later. Two passages you should know about going in:

**Passage A — "Rate Limit Errors (HTTP 429)"**
> When you exceed your plan's rate limit, the API returns a 429 status code with a `Retry-After` header telling you how long to wait before retrying. Rate limits are enforced per API key on a rolling window, and repeated 429s can trigger temporary key suspension.

**Passage B — "Free Plan Quotas"**
> Accounts on the Free plan can make up to 60 calls per minute and 1,000 calls per day. Upgrading to Pro raises the per-minute cap to 600.

Passage B is the answer. It has the number, the unit, the plan name — everything the question needs. Passage A never mentions a number, a plan, or "free" at all. If you only read the two of them, there's no contest.

## Step by step

### 1. Retrieve the top 50 with the bi-encoder

The query gets embedded once, compared against 50-ish precomputed passage vectors via [ANN search](/learn/rag/similarity-search-and-ann-indexes), and ranked by cosine similarity. Here's what the top of that list looks like (scores are illustrative, on a 0–1 cosine scale, to show the *shape* of the problem — not measurements from a real run):

| Rank | Passage | Cosine sim |
|---|---|---|
| 1 | A — Rate Limit Errors (429) | 0.84 |
| 2 | C — Rate Limits by Plan Tier (Pro/Enterprise) | 0.81 |
| 3 | D — Understanding Retry-After Headers | 0.79 |
| 4 | E — API Authentication & Rate Limiting Overview | 0.77 |
| 5 | F — Free Plan Overview (features, no numbers) | 0.74 |
| ⋮ | ⋮ | ⋮ |
| 7 | **B — Free Plan Quotas (the answer)** | 0.71 |

Passage A comes out on top. Passage B — the one with the actual number — is sitting at rank 7, below three other passages about rate limits in general and one about the free plan's *features* rather than its *quota*.

> **Why this step?** This is the step every RAG pipeline runs first, and it's worth seeing it fail cleanly before fixing it. The retriever isn't broken — B *is* in the candidate set, at a respectable 0.71. The problem is purely about ordering, which is exactly the kind of problem reranking exists to solve. If B weren't in the top 50 at all, no amount of reranking downstream would help (more on that in [Where it breaks](#where-it-breaks)).

### 2. See why the bi-encoder got it wrong

A bi-encoder compresses each passage into a single fixed vector *before* it ever sees your query — that's what makes it fast enough to precompute over millions of passages (see [embeddings and semantic similarity](/learn/rag/embeddings-and-semantic-similarity)). Passage A is dense with the vocabulary your query cares about — "rate," "limit," "requests," "plan," "allowed" — because it's a general explainer that touches all of those words repeatedly. Passage B says "calls" instead of "requests" and spends most of its short length on a specific number, so its vector ends up a little further from the query's vector, geometrically, even though a human reads it and immediately says "that's the answer."

This is the recurring failure shape for bi-encoders: **topically-broad passages that share vocabulary with the query can out-rank narrow, correct passages that phrase things slightly differently.** The embedding sees word overlap; it doesn't check whether the passage actually resolves the question.

### 3. Rerank the 50 candidates with a cross-encoder

A cross-encoder takes the query and *one* candidate passage together, as a single input, and lets attention run across both at once — no separate compression step, so it can notice that "60... per minute... Free plan" in the passage directly satisfies "how many... per minute... free plan" in the query. The cost is that it can't be precomputed: every pair needs its own forward pass through the model.

```python
from sentence_transformers import CrossEncoder
import time

query = "How many requests per minute am I allowed on the free plan?"

# candidates: the 50 passages already pulled by the vector index,
# e.g. [{"id": "B", "text": "...free plan quotas..."}, ...]
pairs = [(query, c["text"]) for c in candidates]

reranker = CrossEncoder("cross-encoder/ms-marco-MiniLM-L-6-v2")

t0 = time.perf_counter()
scores = reranker.predict(pairs, batch_size=32)
elapsed_ms = (time.perf_counter() - t0) * 1000
print(f"{elapsed_ms:.0f} ms to score {len(pairs)} pairs")

for c, s in zip(candidates, scores):
    c["rerank_score"] = float(s)

reranked = sorted(candidates, key=lambda c: c["rerank_score"], reverse=True)
```

Illustrative reranker output for the same handful of passages (`ms-marco`-style cross-encoders return an unbounded relevance logit, not a 0–1 score, so don't expect these on the same scale as the cosine numbers above):

| Rank | Passage | Rerank score |
|---|---|---|
| 1 | **B — Free Plan Quotas** | 6.8 |
| 2 | F — Free Plan Overview | 2.1 |
| 3 | A — Rate Limit Errors (429) | -1.4 |
| 4 | C — Rate Limits by Plan Tier | -3.9 |
| 5 | D — Retry-After Headers | -5.2 |

B jumps from rank 7 to rank 1. A, the old top-1, drops below every free-plan-adjacent passage — the cross-encoder isn't fooled by A's vocabulary density once it can actually check whether A answers the question.

On latency: the bi-encoder step above cost you one query embedding plus an ANN lookup — sub-millisecond to low-single-digit milliseconds regardless of corpus size, because the 50 passage vectors were already sitting in the index. The cross-encoder step is doing 50 full forward passes. If a single (query, passage) pair takes on the order of 5–10ms on a batch-friendly GPU, 50 pairs batched together lands you somewhere around 50–150ms rather than 50× a single pair's time, because the GPU parallelizes the batch. Run serially, or on CPU, that same job can stretch into the hundreds of milliseconds to low seconds. Those are illustrative orders of magnitude, not a benchmark — the `elapsed_ms` print in the snippet above is there so you measure your own model, your own hardware, your own batch size, instead of trusting a number from an article.

> **Why this step?** Reranking 50 candidates with a cross-encoder is markedly more expensive per-candidate than the vector search that produced them — that's the trade you're making deliberately. You're spending latency you didn't spend at retrieval time to buy precision at the position that matters most: whatever you truncate to and hand the LLM. That trade only pays off if you actually cut the candidate count somewhere before generation — which is the next step.

### 4. Cut to top-k and hand it to the LLM

```python
top_k = reranked[:5]
context = "\n\n".join(c["text"] for c in top_k)
```

You retrieved 50 to give the reranker enough to work with, but you don't send 50 passages into the prompt — you send the 3–5 the cross-encoder is now confident about. B leads; A is gone from the context the model sees.

## Where it breaks

Reranking only reorders what retrieval already handed it. It cannot promote a passage that never made the top 50 in the first place — and that's a real failure mode on this exact corpus, not a hypothetical one.

Suppose the docs also contain a legacy page: **"Community Tier Throttling"** — *"Community accounts (the free tier's old name) are throttled to 60 requests per minute."* Same fact as Passage B, different vocabulary: "Community" instead of "Free," "throttled" instead of "rate limit" or "quota." Its embedding drifts further from the query than A, C, D, E, or F do, and it lands at, say, rank 63 in the full corpus — outside the top-50 window your retriever cut at.

The cross-encoder never sees it. You can rerank those 50 candidates as carefully as you like; a passage that isn't in the batch can't win the batch. Precision at the top is bounded by recall further down — a sharp reranker sitting on top of a lossy retrieval cutoff still ships a wrong or missing answer, and it'll look like a "reranking problem" when it's actually a retrieval-recall problem.

**The fix isn't a bigger reranker — it's better coverage before you rerank:**

- **Widen the retrieval window** (top-100 instead of top-50) if your latency budget has room — but remember from step 3 that rerank cost scales roughly with candidate count, so this isn't free.
- **Add lexical retrieval alongside vector search.** A BM25-style pass matches "Community" and "throttled" literally, regardless of where they sit in embedding space, and a hybrid merge gives the reranker a candidate set that vector similarity alone would've missed — see [hybrid search: lexical and vector](/learn/rag/hybrid-search-lexical-and-vector).
- **Rewrite the query** to add synonyms ("free / community," "rate limit / throttle") before embedding it, so the retriever's own vector lands closer to passages that used the other vocabulary — see [query rewriting and expansion](/learn/rag/query-rewriting-and-expansion).

None of these are things the reranker can do for you. They all happen upstream of it.

## Takeaways

- **Bi-encoders and cross-encoders disagree because they're doing different comparisons.** A bi-encoder compresses each passage to one vector *before* seeing the query, so vocabulary-dense-but-generic passages can out-rank concise-but-correct ones. A cross-encoder reads query and passage together and can check whether the passage actually resolves the question. That's the trade-off explained in [Reranking Retrieved Results](/learn/rag/reranking-retrieved-results) — this page just runs it on one query end to end.
- **Reranking fixes order, not coverage.** If the right passage is missing from your final answer, check whether it was even in the retrieved candidate set before you touch the reranker — a recall problem dressed up as a ranking problem wastes a lot of debugging time.
- **The latency cost of reranking scales with how many candidates you rerank**, not with your corpus size — batching on GPU helps a lot, but "just rerank everything" is a real cost decision, not a free upgrade. Measure it on your own stack rather than trusting a rule of thumb.
- **Illustrative scores are for intuition, not proof.** Before you decide a cross-encoder earns its latency, check whether it actually moves precision/recall on your own held-out queries — see [evaluating RAG quality](/learn/rag/evaluating-rag-quality).

**Related:** [Reranking Retrieved Results](/learn/rag/reranking-retrieved-results) · [Similarity Search and ANN Indexes](/learn/rag/similarity-search-and-ann-indexes) · [Embeddings and Semantic Similarity](/learn/rag/embeddings-and-semantic-similarity) · [Hybrid Search: Lexical and Vector](/learn/rag/hybrid-search-lexical-and-vector) · [Query Rewriting and Expansion](/learn/rag/query-rewriting-and-expansion) · [Evaluating RAG Quality](/learn/rag/evaluating-rag-quality)
