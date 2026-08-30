---
title: "Hybrid Search, Worked: When Vectors Miss the Exact Term"
track: "rag"
status: live
summary: "A rare product code exposes dense retrieval's blind spot: walk the BM25 hit, the vector miss, and the RRF fusion arithmetic that fixes it."
duration: "7 min read"
---

Type a product code into a search box and you expect one thing: the page that has that code on it. Dense retrieval doesn't promise that — it promises the page that's *about* the same thing, which is usually fine and occasionally means the one document with the exact string you typed doesn't crack the top five. Here's the arithmetic behind that failure, and behind the fusion trick that fixes it.

## The setup

You're building search for a parts catalog. Six documents, one query:

```
gasket for PX-7734 pump
```

PX-7734 is a specific pump model — rare enough that it appears in exactly two of your six documents. Here's the corpus:

| doc | text |
|---|---|
| `doc_A` | "PX-7734 pump — spare parts: gasket kit GSK-118, seal kit SLK-22, impeller IMP-9" |
| `doc_B` | "How to replace a gasket on an industrial pump — a general step-by-step guide" |
| `doc_C` | "PX-7734 installation and mounting manual" |
| `doc_D` | "Pump maintenance schedule and troubleshooting for centrifugal pump systems" |
| `doc_E` | "Gasket sizing and material chart for various pump models" |
| `doc_F` | "PX-6521 pump — spare parts list" |

`doc_A` is the only correct answer — it's the only document that names both the part (gasket) and the model (PX-7734). Everything else is either the wrong product (`doc_F` is a *different* pump), generic (`doc_B`, `doc_D`, `doc_E`), or half-relevant (`doc_C` has the model but not the part). This is exactly the shape covered conceptually in [Hybrid Search: Lexical and Vector Combined](/learn/rag/hybrid-search-lexical-and-vector) — here we run the actual numbers.

## Step by step

### 1. Tokenize the query

After basic normalization the query terms are `gasket`, `pump`, `px-7734`. Nothing exotic — this is where both retrieval paths start from the same input and immediately diverge.

### 2. BM25 finds it in one pass

BM25 scores a document by summing, over each query term, how much that term's document frequency across the corpus makes it *rare* (IDF), scaled by how often it shows up in this document (TF, with diminishing returns). Here's the IDF for each term, using `idf(t) = ln((N − df + 0.5) / (df + 0.5) + 1)` over your 6-document corpus:

| term | docs containing it | idf |
|---|---|---|
| `gasket` | 3 of 6 | 0.69 |
| `pump` | 5 of 6 | 0.24 |
| `px-7734` | 2 of 6 | 1.03 |

Notice `pump` is nearly a stopword in this corpus — it's in five of six documents, so BM25 barely credits it. `px-7734` is the opposite: only two documents have it, so a match on that term carries roughly 4x the weight of a match on `pump`.

Now plug into the full formula for `doc_A` (12 tokens, avg doc length 9, `k1=1.5`, `b=0.75`):

```
score(D, Q) = Σ idf(t) · (f(t,D) · (k1+1)) / (f(t,D) + k1·(1 − b + b·|D|/avgdl))
```

`doc_A` contains all three terms once each, so the length-normalization factor is identical for each: `1·2.5 / (1 + 1.875) ≈ 0.87`. Multiply that by each term's IDF and sum: `(0.69 + 0.24 + 1.03) × 0.87 ≈ 1.71`. Run the same formula over all six documents:

```python
import math
from collections import Counter

docs = {
    "doc_A": "px-7734 pump spare parts gasket kit gsk-118 seal kit slk-22 impeller imp-9",
    "doc_B": "how to replace a gasket on an industrial pump general step by step guide",
    "doc_C": "px-7734 installation and mounting manual",
    "doc_D": "pump maintenance schedule and troubleshooting for centrifugal pump systems",
    "doc_E": "gasket sizing and material chart for various pump models",
    "doc_F": "px-6521 pump spare parts list",
}
query_terms = ["gasket", "pump", "px-7734"]

tokens = {d: t.split() for d, t in docs.items()}
doc_len = {d: len(toks) for d, toks in tokens.items()}
avgdl = sum(doc_len.values()) / len(doc_len)
N = len(docs)

def idf(term):
    df = sum(1 for toks in tokens.values() if term in toks)
    return math.log((N - df + 0.5) / (df + 0.5) + 1)

def bm25(doc_id, k1=1.5, b=0.75):
    freqs = Counter(tokens[doc_id])
    total = 0.0
    for term in query_terms:
        f = freqs[term]
        if f == 0:
            continue
        denom = f + k1 * (1 - b + b * doc_len[doc_id] / avgdl)
        total += idf(term) * (f * (k1 + 1)) / denom
    return total

for d in sorted(docs, key=bm25, reverse=True):
    print(d, round(bm25(d), 2))
```

Which gives you:

| doc | BM25 score | rank |
|---|---|---|
| `doc_A` | 1.71 | 1 |
| `doc_C` | 1.29 | 2 |
| `doc_E` | 0.93 | 3 |
| `doc_B` | 0.75 | 4 |
| `doc_D` | 0.34 | 5 |
| `doc_F` | 0.30 | 6 |

`doc_A` wins clearly, and `doc_C` — the *other* document with the exact code — takes second, purely on the strength of matching a rare token.

> **Why this step?** BM25's IDF term does the opposite of what a dense encoder tends to do with a token like `px-7734`. The rarer a term is across your corpus, the more weight BM25 gives a document for containing it — no understanding required, just counting. That's precisely the lever a bi-encoder doesn't have.

### 3. The same query, through a bi-encoder — and it misses

Real embeddings have hundreds or thousands of dimensions that nobody hand-labels. To keep the arithmetic checkable, here's a 3-axis cartoon standing in for the real thing — treat it as illustrative geometry, not a literal model output, in the spirit of [embeddings and semantic similarity](/learn/rag/embeddings-and-semantic-similarity):

| | axis 1: gasket topic | axis 2: general pump upkeep | axis 3: "this is model PX-7734" |
|---|---|---|---|
| query | 0.80 | 0.50 | 0.20 |
| `doc_A` | 0.10 | 0.05 | 0.60 |
| `doc_B` | 0.85 | 0.55 | 0.00 |
| `doc_C` | 0.05 | 0.35 | 0.40 |
| `doc_D` | 0.15 | 0.80 | 0.00 |
| `doc_E` | 0.80 | 0.35 | 0.00 |
| `doc_F` | 0.05 | 0.60 | 0.05 |

Notice the query itself only weighs 0.20 on the "PX-7734" axis — even the query's own embedding underrepresents the code, because a rare alphanumeric token doesn't get a strong, well-trained direction in embedding space. `doc_A` is mostly a terse parts list, not a sentence about gaskets, so it leans hard on that same weak axis and light on everything else.

Worked [cosine similarity](/learn/maths-foundations/cosine-similarity-angular-distance-embedding-retrieval) for `doc_A`:

```
dot   = 0.8×0.10 + 0.5×0.05 + 0.2×0.60 = 0.225
|q|   = √(0.8² + 0.5² + 0.2²)          ≈ 0.964
|A|   = √(0.10² + 0.05² + 0.60²)       ≈ 0.610
cos   = 0.225 / (0.964 × 0.610)        ≈ 0.38
```

```python
import numpy as np

vectors = {
    "query": [0.80, 0.50, 0.20],
    "doc_A": [0.10, 0.05, 0.60],
    "doc_B": [0.85, 0.55, 0.00],
    "doc_C": [0.05, 0.35, 0.40],
    "doc_D": [0.15, 0.80, 0.00],
    "doc_E": [0.80, 0.35, 0.00],
    "doc_F": [0.05, 0.60, 0.05],
}

def cosine(u, v):
    u, v = np.array(u), np.array(v)
    return float(u @ v / (np.linalg.norm(u) * np.linalg.norm(v)))

q = vectors["query"]
for d in sorted((d for d in vectors if d != "query"),
                key=lambda d: cosine(q, vectors[d]), reverse=True):
    print(d, round(cosine(q, vectors[d]), 2))
```

| doc | cosine similarity | rank |
|---|---|---|
| `doc_B` | 0.98 | 1 |
| `doc_E` | 0.97 | 2 |
| `doc_D` | 0.66 | 3 |
| `doc_F` | 0.60 | 4 |
| `doc_C` | 0.57 | 5 |
| `doc_A` | 0.38 | 6 |

`doc_A` — the only correct answer — comes back **dead last**. The two documents that are generically "about gaskets" or "about pumps" win, because they align with the broad topic the query embedding actually encodes.

> **Why this step?** A subword tokenizer typically splits `PX-7734` into fragments like `PX`, `-`, `77`, `34` before it ever reaches the encoder. None of those fragments carries the specific meaning "this exact model" — so the resulting vector leans on the surrounding words instead, landing in the same generic neighborhood as documents that were never about this product at all. This isn't a bug you can patch by re-training on more text; it's what happens when a continuous representation meets a discrete identifier it's supposed to treat as atomic.

### 4. Fuse the two ranked lists with RRF

Reciprocal Rank Fusion scores a document by its position in each ranked list, not its raw score — which is exactly what you want when BM25 and cosine similarity live on incomparable scales:

```
RRF(d) = Σ over each ranked list:  1 / (k + rank(d))
```

`k` is a smoothing constant; a common default — the one Elasticsearch's RRF implementation ships with — is `k = 60`. Using the ranks from steps 2 and 3:

```python
def rrf_fuse(ranked_lists, k=60, weights=None):
    weights = weights or [1.0] * len(ranked_lists)
    scores = {}
    for ranked, w in zip(ranked_lists, weights):
        for rank, doc_id in enumerate(ranked, start=1):
            scores[doc_id] = scores.get(doc_id, 0.0) + w * (1.0 / (k + rank))
    return sorted(scores.items(), key=lambda kv: kv[1], reverse=True)

bm25_ranked   = ["doc_A", "doc_C", "doc_E", "doc_B", "doc_D", "doc_F"]
vector_ranked = ["doc_B", "doc_E", "doc_D", "doc_F", "doc_C", "doc_A"]

for doc_id, score in rrf_fuse([bm25_ranked, vector_ranked]):
    print(f"{doc_id}: {score:.5f}")
```

| doc | BM25 rank | vector rank | RRF score (k=60) |
|---|---|---|---|
| `doc_B` | 4 | 1 | 0.03202 |
| `doc_E` | 3 | 2 | 0.03200 |
| `doc_A` | 1 | 6 | 0.03154 |
| `doc_C` | 2 | 5 | 0.03151 |
| `doc_D` | 5 | 3 | 0.03126 |
| `doc_F` | 6 | 4 | 0.03078 |

Fusion was supposed to be the fix. Instead, `doc_A` — the document that unambiguously answers the query — lands **third**, beaten by two pages about gaskets on the wrong or unspecified pump.

> **Why this step?** RRF is designed so a document doesn't have to win on both signals, just place well on at least one. That premise holds when a document places *reasonably* on the signal it loses. It doesn't hold here, because `doc_A` didn't place reasonably on vectors — it placed last.

## Where it breaks

Look at the actual gap between first and third place: `0.03202` vs `0.03154` — a difference smaller than the rounding you'd normally throw away. That's `k=60` doing its job as designed: it's a constant tuned for candidate pools of hundreds or thousands of results, where rank 1 and rank 6 out of, say, 500 are genuinely close in expected relevance. Over a six-document candidate set, the same constant crushes every meaningful rank difference into a sliver a few thousandths wide — including the one BM25 was extremely confident about (`doc_A` beat the runner-up by 33% in raw score) and the one vectors were also confident about, just in the wrong direction (`doc_A`'s cosine was well under half the leader's).

That points at the real limitation: RRF only sees rank position, never score magnitude. A landslide win and a photo finish look identical to it unless you tell it otherwise. And dropping `k` doesn't rescue this case by itself — a rank of 6-out-of-6 is the worst possible input to `1/(k+rank)` no matter what `k` is, so a document that one retriever ranks dead last can't out-arithmetic that with any *equally weighted* combination.

The fix is to stop weighting the two signals equally. This query contains an obvious identifier pattern — something a simple check can catch before you ever call the retrievers:

```python
import re
looks_like_a_code = re.search(r"[A-Za-z]{1,4}-?\d{3,6}", query) is not None
```

When that fires, shift trust toward the lexical signal instead of splitting it 50/50 — say 0.8 BM25 / 0.2 vector:

```python
for doc_id, score in rrf_fuse([bm25_ranked, vector_ranked], weights=[0.8, 0.2]):
    print(f"{doc_id}: {score:.5f}")
```

| doc | weighted RRF (0.8 / 0.2) |
|---|---|
| `doc_A` | 0.01615 |
| `doc_C` | 0.01598 |
| `doc_E` | 0.01592 |
| `doc_B` | 0.01578 |
| `doc_D` | 0.01548 |
| `doc_F` | 0.01525 |

`doc_A` is back on top — and `doc_C`, the other document that actually contains the code, jumps to second. Reweighting toward BM25 didn't just fix one document; it pulled both code-bearing pages toward the front, which is exactly the behavior you want for an identifier-shaped query.

Two more durable options worth knowing, both cheaper than tuning fusion weights per query shape:

- If the product code lives in structured metadata (a `model_number` field, say) rather than only in free text, skip this whole negotiation and filter or exact-match-boost on that field directly — see [metadata filtering in retrieval](/learn/rag/metadata-filtering-in-retrieval). Fusion arithmetic is a workaround for not having a structured field to filter on.
- Take the union of both ranked lists and rerank it with a cross-encoder, which reads the query and each candidate together instead of separately. It's markedly slower per document than either bi-encoder or BM25 alone, but it isn't fooled by embedding dilution the way a bi-encoder is — see [reranking retrieved results](/learn/rag/reranking-retrieved-results). Combined with regex-based query routing (a cousin of [query rewriting and expansion](/learn/rag/query-rewriting-and-expansion)), this is what most production hybrid systems actually reach for instead of hand-picking fusion weights per query.

## Takeaways

- Rare identifiers are BM25's home turf: the rarer a token is across your corpus, the more weight IDF gives it — which is exactly the signal a dense encoder dilutes when it subword-splits that same token.
- RRF's default constant assumes large candidate pools. Over a short ranked list, or when one retriever fully misses, that constant can flatten a decisive win into a rounding error — check the actual score gaps before trusting the default.
- Rank-based fusion is blind to score magnitude by construction. A landslide and a photo finish look the same to it unless you weight the inputs toward the signal you trust more for that query shape.
- For known identifier patterns (SKUs, error codes, ticket IDs), the cheapest fix usually isn't fusion tuning at all — it's a structured field you can filter or boost on before fusion ever runs.

**Related:** [Hybrid Search: Lexical and Vector Combined](/learn/rag/hybrid-search-lexical-and-vector) · [Hybrid search common mistakes](/learn/rag/hybrid-search-common-mistakes) · [Hybrid search cheatsheet](/learn/rag/hybrid-search-cheatsheet) · [Reranking, worked example](/learn/rag/reranking-worked-example) · [Hybrid search quiz](/learn/rag/hybrid-search-quiz)
