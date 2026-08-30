---
title: "Vector Retrieval Cheatsheet"
track: "rag"
status: live
summary: "Quick-reference for HNSW and IVF index parameters, distance-metric selection rules, and rough memory math — starting points to tune from, not benchmarks."
duration: "7 min read"
---

Index tuning is the part of retrieval people either skip entirely (and live with mediocre recall forever) or over-invest in (and burn a week on a knob that doesn't matter at their scale). This page is the reference you pull up mid-build: what each parameter does, where to start, and which knob to turn first when recall or latency is off. It assumes you already know how these indexes work structurally — if not, read [Similarity Search and ANN Indexes](/learn/rag/similarity-search-and-ann-indexes) first. This page is the tuning reference, not the explainer.

Every number below is a **starting point, then measure** — not a benchmark. Your actual recall/latency curve depends on dimensionality, cluster structure, and hardware, and the only way to know it is to measure recall@k against brute-force ground truth on your own data.

## The 5-second version

| Index | Turn first (no rebuild) | Turn second (rebuild required) |
|---|---|---|
| HNSW | `ef_search` | `M`, `ef_construction` |
| IVF | `nprobe` | `nlist` |

Query-time knobs are free to change per-request. Build-time knobs bake into the index structure — changing them means re-indexing your whole collection. Always exhaust the free knob before paying for a rebuild.

## HNSW: `M`, `ef_construction`, `ef_search`

| Param | Controls | Starting point | Raise when | Lower when |
|---|---|---|---|---|
| `M` | max graph connections per node | 16 | recall too low, high-dim (>512d) or messy/clustered data | memory tight, build too slow |
| `ef_construction` | search width while building the graph | 100–200 | recall still low after raising `M` | one-time build cost is too slow and you can tolerate slightly worse recall |
| `ef_search` (`ef`) | search width at query time | 50–100, and always **≥ k** | recall too low, latency has headroom | latency too high, recall already sufficient |

If `ef_search` is below `k`, you can silently get back fewer or worse results than you asked for — check this first when recall looks wrong for no obvious reason.

```python
# hnswlib — starting points, then measure
import hnswlib

index = hnswlib.Index(space='cosine', dim=768)
index.init_index(
    max_elements=1_000_000,
    M=16,                  # 16 is a common default; try 32-48 for high-dim/hard data
    ef_construction=200,   # build-time recall knob, one-time cost
)
index.add_items(vectors, ids)

index.set_ef(100)          # query-time knob: no rebuild, tune freely, must be >= k
labels, distances = index.knn_query(query_vector, k=10)
```

## IVF: `nlist`, `nprobe`

| Param | Controls | Starting point | Raise when | Lower when |
|---|---|---|---|---|
| `nlist` | number of coarse clusters (Voronoi cells) | `≈ sqrt(N)`, rounded | collection is very large (tens of millions+) and clusters are getting too big to scan fast | collection is small and clusters are already tiny — fewer, bigger clusters beat overhead |
| `nprobe` | clusters searched per query | 1–2% of `nlist` | recall too low | latency too high, recall already sufficient |

Worked example: say you have 5,000,000 vectors. `sqrt(5,000,000) ≈ 2,236` → round to `nlist = 2048` or `4096`. Start `nprobe` at ~1% of that (`~20–40`) and raise until recall stabilizes.

`nlist` is fixed at training time — `index.train()` sets the centroids once, and growing your collection 5–10x without retraining means each cluster is now 5–10x bigger, so an `nprobe` that used to give good recall quietly stops being enough. Re-check `nlist` whenever your collection grows by an order of magnitude.

```python
# FAISS IVF-Flat — starting points, then measure
import faiss

d = 768
nlist = 4096                          # ~sqrt(N), rounded; rebuild to change this

quantizer = faiss.IndexFlatIP(d)      # coarse quantizer, same metric as your final search
index = faiss.IndexIVFFlat(quantizer, d, nlist, faiss.METRIC_INNER_PRODUCT)

index.train(training_vectors)         # needs a representative sample — well more than nlist points
index.add(vectors)

index.nprobe = 32                     # query-time knob, no rebuild needed
```

## Distance metric: pick once, get it right

| Situation | Use | Why |
|---|---|---|
| Model card specifies a metric | Whatever it says | The embedding was optimized for that geometry — this overrides every other rule |
| You L2-normalize vectors yourself | Dot product | Ranking is identical to cosine, and dot product skips the sqrt/division cosine needs |
| Model relies on un-normalized magnitude (e.g. magnitude encodes something like confidence or popularity) | Dot product, **don't normalize** | Normalizing throws away the signal the magnitude was carrying |
| Mixed embedding sources, or you're unsure | Cosine | Robust default — ignores scale differences between sources |

Useful identity, worth deriving once so you trust it: for unit vectors, `‖a − b‖² = ‖a‖² + ‖b‖² − 2·a·b = 2 − 2·cos(a, b)`. Squared Euclidean distance and cosine similarity are a monotonic flip of each other when vectors are normalized — so ranking by L2, by dot product, or by [cosine similarity](/learn/maths-foundations/cosine-similarity-angular-distance-embedding-retrieval) gives you the *same order of results*. Pick whichever your index library computes fastest (usually dot product — no square roots) rather than whichever sounds most "correct."

## Memory, roughly

Back-of-envelope numbers, derived so you can redo them for your own dims:

| Representation | Bytes per vector | 768-dim example |
|---|---|---|
| fp32 raw | `4 × dim` | 3,072 B (~3 KB) |
| int8 scalar quantization | `1 × dim` | 768 B (4× smaller) |
| Product quantization, `m` subquantizers @ 8 bits | `m` bytes | 96 subquantizers → 96 B (32× smaller) |

HNSW adds graph links on top of whichever representation you store: roughly `2M` neighbor ids per vector at the base layer, so overhead ≈ `2M × 4 bytes`. At `M=16` that's ~128 bytes/vector — under 5% of a 768-dim fp32 vector, but a quarter of a 512-byte (128-dim) vector. **The lower your embedding dimension, the more the graph itself dominates memory** — worth remembering before you assume HNSW overhead is always negligible.

IVF-Flat stores full vectors in inverted lists (same footprint as raw or quantized storage) plus `nlist × dim × 4` bytes for centroids — usually a rounding error unless `nlist` is huge. IVF-PQ combines the cluster structure with product-quantized codes, which is how you get both index families down to tens of millions of vectors on modest hardware. This is exactly the tradeoff to weigh when picking an engine — see [Choosing a Vector Database](/learn/rag/choosing-a-vector-database) for how different systems expose it.

None of this includes per-vector ids, metadata, or a database's own bookkeeping — treat these numbers as a floor, not a final answer.

## The tuning loop

1. Fix your metric first (table above) — this isn't something you tune later.
2. Start at the defaults in the tables above and build the index.
3. Build a small labeled eval set and measure recall@k against brute-force search — see [Evaluating RAG Quality](/learn/rag/evaluating-rag-quality).
4. Recall too low, latency has room → raise the query-time knob (`ef_search` or `nprobe`). No rebuild.
5. Recall still too low after maxing that out → raise the build-time knob (`M`/`ef_construction`, or `nlist`) and rebuild.
6. Latency too high, recall has room → back the query-time knob back down before touching anything else.
7. Re-run step 3 whenever your collection grows by an order of magnitude — the params that hit your target at 500K vectors won't automatically hold at 5M.

## The gotcha: filters shrink the pool

If you apply metadata filters before or alongside ANN search, the index is effectively searching a smaller, differently-shaped subset of the data than the `nprobe`/`ef_search` you tuned assumed. A filter that's selective enough can tank recall even though nothing about the index itself changed. If your filters are tight, re-measure recall with them applied, not against the unfiltered baseline — see [Metadata Filtering in Retrieval](/learn/rag/metadata-filtering-in-retrieval) for how different engines handle pre- vs. post-filtering.

**Related:** [Similarity Search and ANN Indexes](/learn/rag/similarity-search-and-ann-indexes) · [Choosing a Vector Database](/learn/rag/choosing-a-vector-database) · [Evaluating RAG Quality](/learn/rag/evaluating-rag-quality) · [Metadata Filtering in Retrieval](/learn/rag/metadata-filtering-in-retrieval) · [Cosine Similarity and Angular Distance](/learn/maths-foundations/cosine-similarity-angular-distance-embedding-retrieval)
