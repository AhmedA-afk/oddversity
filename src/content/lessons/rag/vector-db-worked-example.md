---
title: "Sizing a Vector DB, Worked: 5M Vectors"
track: "rag"
status: live
summary: "Work the actual memory math for 5M vectors — raw float32 storage, HNSW graph overhead, and product quantization — to size and justify a real index config."
duration: "7 min read"
---

You can't size a vector index by vibes. Before you provision hardware or pick a managed tier, you need to actually add up the bytes — and the arithmetic is simple enough to do on a napkin, once you know which three numbers matter.

## The setup

Say you're building semantic search over a company's support-ticket archive: 5,000,000 historical tickets, one embedding per ticket, produced by a 1024-dimensional embedding model (a common size among current embedding models — the math below works the same at 384 or 3072, only the constants change). You've already thought through *which* database to use — if you haven't, [Choosing a Vector Database](/learn/rag/choosing-a-vector-database) covers that decision. This page assumes you're past that and need to answer a narrower question: how much memory does this actually take, and what index config do you configure it with?

Three numbers, in order: the raw vectors, the index structure on top of them, and what happens if you compress.

## Step by step

### Step 1: Raw float32 memory

Every vector is 1024 floats, each 4 bytes. That's the floor — before any index structure exists at all.

```python
n_vectors = 5_000_000
dim = 1024
bytes_per_float = 4

raw_bytes = n_vectors * dim * bytes_per_float
print(f"{raw_bytes:,} bytes")        # 20,480,000,000 bytes
print(f"{raw_bytes / 1e9:.2f} GB")   # 20.48 GB
```

20.48 GB (decimal; ~19.07 GiB if you're counting in binary units). That's just the numbers sitting in an array — no search structure yet.

> **Why this step?** Because everything else in this page is additive on top of it. If you can't state this number cold, you can't sanity-check any vendor's memory estimate, and you definitely can't tell whether a "compressed" index is actually saving you anything.

### Step 2: HNSW graph overhead

If you're using HNSW (the default in most vector DBs — see [Similarity Search and ANN Indexes](/learn/rag/similarity-search-and-ann-indexes) for how the layered graph itself works), every vector becomes a node with outgoing links to its neighbors, stored as integer IDs. The standard construction uses a parameter `M` (commonly 16): the base layer gets `2M` links per node, every layer above it gets `M` links, and the number of vectors that actually reach a higher layer shrinks geometrically — roughly `1/M` reach layer 1, `1/M²` reach layer 2, and so on.

```python
M = 16
id_bytes = 4   # 5M fits easily inside a 32-bit id (max ~4.29 billion)

level0_bytes_per_vector = (2 * M) * id_bytes          # 128 bytes
higher_bytes_per_vector = id_bytes * M / (M - 1)      # ~4.3 bytes (geometric sum)

graph_bytes_per_vector = level0_bytes_per_vector + higher_bytes_per_vector
graph_overhead_total = n_vectors * graph_bytes_per_vector

print(f"{graph_bytes_per_vector:.1f} bytes/vector")   # ~132.3
print(f"{graph_overhead_total / 1e9:.2f} GB")          # ~0.66 GB
```

Total full-precision index: 20.48 GB + 0.66 GB ≈ **21.1 GB** of pure link-array math. Real implementations also store per-node IDs, level assignments, and allocator padding on top of that, so a practical budget is closer to the mid-20s GB, not the clean 21.1.

> **Why this step?** Notice how small the graph overhead is here — about 3% on top of the raw vectors. That's specific to high dimensions: at d=1024, the raw vector bytes dwarf a few hundred bytes of link IDs. Drop to d=128 (older, smaller embedding models) and the same graph math is a much bigger fraction of the total — the same formula, a very different verdict. Never assume "HNSW overhead is negligible" without redoing this for your own `d`. And this number still only covers the index — metadata payloads (source IDs, text snippets, permission tags) and replicas for availability are separate line items you have to add on your own.

### Step 3: Product quantization compression

Product quantization (PQ) shrinks what you store per vector. Split each 1024-dim vector into `m` subvectors, run k-means on each subvector's slice of the training data to learn 256 centroids (8 bits — fits in one byte), and store just the centroid index per subvector instead of the raw floats. Distance comparisons then use precomputed distance tables between the query's subvectors and each subquantizer's centroids, so you never have to decompress to search.

```python
m = 64                      # number of subvectors
nbits = 8                   # 256 centroids/subvector -> 1 byte/code
sub_dim = dim // m          # 16 dims per subvector

code_bytes_per_vector = m * (nbits // 8)          # 64 bytes (was 4096)
pq_total = n_vectors * code_bytes_per_vector
codebook_bytes = m * (2 ** nbits) * sub_dim * bytes_per_float

print(f"{code_bytes_per_vector} bytes/vector")           # 64
print(f"{4096 / code_bytes_per_vector:.0f}x compression") # 64x
print(f"{pq_total / 1e9:.2f} GB for all codes")           # 0.32 GB
print(f"{codebook_bytes / 1e6:.2f} MB codebooks (one-time)") # ~1.05 MB
```

20.48 GB of raw vectors becomes 0.32 GB of codes plus about 1 MB of shared codebooks — a 64x reduction. But it's lossy: quantizing throws away the exact position of each vector inside its subvector cell, so distances become approximate. Illustratively, a corpus that gets ~0.93 recall@10 with exact float32 search might land somewhere like ~0.85 with PQ, depending entirely on `m`, how well the codebooks were trained, and your own data — a number you have to measure, never assume.

> **Why this step?** PQ isn't a competing *index* to HNSW — it's an answer to "how many bytes per vector," not "how do I avoid scanning everything." In practice it's usually paired with something that organizes the search (an inverted file via IVF, or quantized codes layered under a graph), which is a separate structural question covered in [Similarity Search and ANN Indexes](/learn/rag/similarity-search-and-ann-indexes).

### Step 4: Pick a config and justify it

Line up the numbers: full-precision HNSW costs you roughly 21–25 GB for this collection. PQ-compressed costs roughly 0.3–1 GB but trades away some recall. At 5,000,000 vectors and 1024 dimensions, 21–25 GB fits comfortably on a single reasonably-provisioned server or managed instance today, with headroom to spare.

So the default call here is **plain HNSW, M=16, `ef_construction` ≈ 200, `ef_search` tuned per query** — not because PQ doesn't work, but because you don't pay its recall cost until the memory math actually forces you to. Reach for PQ (or the gentler scalar quantization) when:

- you scale another order of magnitude — 50M+ vectors would push raw+graph into the hundreds of GB, where compression stops being optional
- you're memory-constrained (edge deployment, a small instance, a tight multi-tenant budget)
- you've measured the recall tradeoff on your own eval set and it's acceptable for the query volume you're saving money on

```python
import faiss

# the default call at this scale: full precision, no compression
index = faiss.IndexHNSWFlat(dim, M)
index.hnsw.efConstruction = 200
# index.add(vectors)  # vectors: float32 ndarray, shape (5_000_000, 1024)
```

## Where it breaks

Suppose you outgrow that budget later and switch to PQ. You train the codebooks on the first 50,000 tickets ingested — the easiest sample to grab — which happen to come from one product line's Q1 backlog. You validate against a small eval set built from that same batch and see recall@10 around ~0.93. It ships.

Once PQ is live against the full 5,000,000-ticket corpus, spanning every product line and both languages your support team handles, recall on a broader eval set (see [Evaluating RAG Quality](/learn/rag/evaluating-rag-quality) for how to build one properly) drops to something like ~0.75. The codebooks never saw what embeddings from the other product lines or the second language look like, so those vectors get quantized into centroids that don't fit them well — and their true neighbors end up scored as farther away than they really are.

**The fix** is two-part:

```python
# train PQ codebooks on a sample that actually represents production,
# not whatever ingested first
sample_ids = np.random.choice(n_vectors, size=150_000, replace=False)
training_sample = vectors[sample_ids]   # uniform across product lines, languages, time

quantizer = faiss.IndexFlatL2(dim)
index_ivfpq = faiss.IndexIVFPQ(quantizer, dim, 4096, m, nbits)
index_ivfpq.train(training_sample)
index_ivfpq.add(vectors)
```

And add a cheap re-ranking pass: retrieve the top ~100–200 candidates with the PQ-approximate search, then rescore just those against the original float32 vectors (kept in cheap storage, not the hot index) before returning the top-k. Reranking 100–200 vectors is nearly free computationally, and it recovers most of what quantization cost you — you're only ever paying the approximation error on the ranking of a shortlist, not on retrieval itself.

## Takeaways

- Sizing starts with `N × d × 4` bytes, but treat it as a floor, not the final answer — the index structure, metadata payloads, and any replicas all stack on top of it, and none of them are optional to budget for.
- HNSW's graph overhead is a formula (`2M` links at the base layer, a fast-converging geometric sum above it), not a mystery constant — and its *proportional* weight depends heavily on your dimension, so recompute it rather than reusing someone else's rule of thumb.
- Product quantization buys real compression, but it's only as good as the sample you trained the codebooks on — train on a representative slice of production data, not whichever batch ingested first, and always measure recall before and after.
- Don't reach for compression before the memory math forces you to. At 5M vectors and 1024 dimensions, full-precision HNSW fits on ordinary hardware — save PQ, and the recall tradeoff that comes with it, for when scale or budget actually demands it.

**Related:** [Choosing a Vector Database](/learn/rag/choosing-a-vector-database) · [Similarity Search and ANN Indexes](/learn/rag/similarity-search-and-ann-indexes) · [Evaluating RAG Quality](/learn/rag/evaluating-rag-quality) · [Vector DB Common Mistakes](/learn/rag/vector-db-common-mistakes) · [Vector DB Cheatsheet](/learn/rag/vector-db-cheatsheet)
