---
title: "ANN Index Methods Compared"
track: "rag"
status: live
summary: "Compares flat, HNSW, IVF, IVF-PQ, and ScaNN-style ANN indexes on recall, latency, memory, and updates, plus a decision table."
duration: "7 min read"
---

Every ANN index is a different bet on the same trade-off: how much recall are you willing to give up, and how much memory and build time are you willing to spend, to make search fast at your corpus size? The five approaches below cover what you'll actually be choosing between in practice — pick based on corpus size and update pattern, not on which one sounds newest.

## Exact kNN (flat)

How it works: compare the query vector against every vector in the corpus, compute the real distance to each, sort, return the top-k. No index structure, no approximation — it's the reference point that [Similarity Search and ANN Indexes](/learn/rag/similarity-search-and-ann-indexes) measures every other method against.

When it wins: the corpus is small enough that a full scan is cheap (low hundreds of thousands of vectors is a reasonable ceiling on a single machine), or you need a guaranteed-correct answer — for instance, building the ground-truth set you'll use to measure recall@k for whatever ANN index you're evaluating.

Failure mode: cost scales linearly with corpus size and with vector dimensionality (see [High-Dimensional Spaces](/learn/maths-foundations/high-dimensional-spaces) for why bigger vectors don't just cost more per comparison — "nearest" also gets fuzzier). Double the corpus, double the latency, with no shortcut available.

Cost/latency: memory is just the raw vectors, nothing extra. Build cost is zero. Updates are a trivial append. Query latency is the one bad number, and it gets worse in direct proportion to N.

## HNSW

How it works: builds a multi-layer graph where each vector connects to its approximate near neighbors — sparse "highway" edges at the top layers, dense local edges at the bottom. A query walks greedily downward from an entry point, narrowing toward the true neighborhood at each layer instead of touching every vector.

When it wins: you need both high recall and low latency, and you have RAM to spare — comfortably up to tens of millions of vectors on a single node. It's the reasonable default many teams reach for first when [choosing a vector database](/learn/rag/choosing-a-vector-database), since most engines ship it out of the box, and it handles steady growth well because new vectors get wired into the existing graph incrementally.

Failure mode: memory. The graph stores several edges per vector on top of the full vectors themselves, and that overhead doesn't compress away. Deletes are the other weak point — HNSW doesn't remove nodes cleanly, so most implementations tombstone them and periodically rebuild, which means delete-heavy workloads fight the structure instead of being served by it.

Cost/latency: memory is the highest of the group (vectors plus graph edges). Build cost is moderate-to-high but incremental. Query latency is very low, and recall is tunable at search time via the `ef` parameter — more effort per query buys more recall without rebuilding anything.

## IVF

How it works: partitions the vector space into `nlist` clusters via k-means, and assigns every vector to its nearest centroid at index time. At query time you probe only the `nprobe` clusters closest to the query, scanning a fraction of the corpus instead of all of it. Recall becomes a dial: raise `nprobe` toward flat's exhaustiveness, or lower it toward near-instant lookups.

When it wins: the corpus has outgrown flat, but you don't want a graph's memory overhead. IVF's overhead on top of storing raw vectors is just cluster assignments and centroids — small, and easy to reason about.

Failure mode: recall depends on cluster quality. A vector sitting near the boundary between two clusters can get missed entirely if the query probes the wrong few clusters, even though it's genuinely close. And if your data drifts — a new embedding model, a new content category, seasonal shifts — the clusters go stale and need retraining, which is a batch job, not something that happens automatically.

Cost/latency: memory is moderate, close to flat's, since IVF alone doesn't compress vectors. Build cost is a one-time (or periodic) k-means training pass. Query latency is low and directly tunable via `nprobe`. Updates: cheap to append new vectors to their nearest existing cluster; the real cost is retraining clusters as the corpus grows or shifts.

## IVF-PQ

How it works: keeps IVF's clustering for candidate narrowing and adds product quantization (PQ) for compression. Each vector is split into subvectors, and each subvector is replaced with the ID of its nearest centroid in a small codebook. Say you're working with 768-dimension float32 vectors — that's 768 × 4 = 3,072 bytes each. Split into 96 subvectors of 8 dimensions, quantize each to a 1-byte codebook ID, and you're storing 96 bytes per vector — a 32x compression, at the cost of representing each vector approximately rather than exactly. Because that's lossy, most pipelines [rerank](/learn/rag/reranking-retrieved-results) the top candidates against their real, uncompressed vectors before returning results.

When it wins: memory is the actual binding constraint — hundreds of millions to billions of vectors, where full-precision storage (let alone an HNSW graph) doesn't fit in RAM you're willing to pay for. At 5 million 768-dimension vectors, raw float32 storage runs about 5,000,000 × 768 × 4 bytes ≈ 15 GB; the same corpus compressed with the PQ scheme above is roughly 5,000,000 × 96 bytes ≈ 480 MB. At ten times that corpus, that gap is the difference between fitting on one box and not.

Failure mode: you're approximating twice — once from clustering, once from quantization — so recall takes a real hit, and skipping the rerank step to save time will visibly show up in result quality. It's also the most complex of these to build and tune (codebook training plus cluster training plus a rerank pipeline), and the compression overhead isn't worth it on a corpus small enough that plain IVF or HNSW would fit in memory anyway.

Cost/latency: memory is the lowest by a wide margin. Build cost is the highest (training clusters and codebooks). Query latency is low, plus whatever the rerank step adds — usually small, since rerank only touches the top few hundred candidates. Updates: cheap to append, expensive to retrain codebooks and clusters once the distribution has shifted.

## ScaNN-style

How it works: Google's ScaNN, and the quantization approach it popularized (now echoed in parts of the vector-search ecosystem), also partitions the space like IVF, but quantizes vectors with an "anisotropic" loss that specifically protects the error component that matters for ranking by inner product or cosine similarity, rather than minimizing raw reconstruction error the way plain PQ does. It pairs that with SIMD-optimized exact scoring over the shortlisted candidates, so final ranking stays cheap and unusually accurate for its compression level.

When it wins: you're at real scale, your similarity metric is inner product or cosine (true of most embedding retrieval), and you want a better recall-for-a-given-memory-budget curve than plain IVF-PQ delivers. It's a particularly good fit when the corpus is refreshed in batches — nightly reindex jobs, periodic re-embedding — rather than needing every write to land instantly.

Failure mode: it's built around batch (re)training, so it's a weaker fit for high-churn, single-record updates than HNSW or plain IVF. It's also less universally available — you'll find it as a standalone library or inside specific managed services rather than as a default toggle in most vector databases, so adopting it is a more deliberate infrastructure decision than flipping a config flag.

Cost/latency: memory is moderate — typically better than flat or HNSW, and competitive with or better than IVF-PQ at the same recall target, because the quantization loss is tuned for ranking rather than reconstruction. Build cost is moderate-to-high (the anisotropic quantizer needs training, much like PQ's codebooks). Query latency is very low, often with the best recall-per-byte of the group.

## Decision table

| Approach | Best when | Avoid when | Relative cost/latency |
|---|---|---|---|
| Exact kNN (flat) | Small corpus, need exact results, building a recall baseline | Corpus is large or query latency matters at all | Latency: high, scales with N · Memory: lowest · Build: none · Update: trivial |
| HNSW | High recall + low latency needed, corpus fits in RAM (up to tens of millions), steady growth | Memory is tight, or workload is delete-heavy | Latency: very low · Memory: highest (vectors + graph) · Build: moderate–high · Update: good inserts, poor deletes |
| IVF | Corpus too big for flat, want low memory overhead, willing to tune recall via `nprobe` | Data distribution drifts often, or many vectors sit near cluster boundaries | Latency: low, tunable · Memory: moderate (near-raw) · Build: moderate (train clusters) · Update: cheap append, periodic retrain |
| IVF-PQ | Memory is the binding constraint at hundreds of millions to billions of vectors | Corpus is small, or you can't afford a rerank step | Latency: low (+ rerank cost) · Memory: lowest · Build: highest · Update: cheap append, costly retrain |
| ScaNN-style | Large scale, inner-product/cosine metric, batch-refreshed corpus, want best recall-per-byte | High-churn single-record updates, or your stack doesn't support it | Latency: very low · Memory: moderate–low · Build: moderate–high · Update: batch-friendly, not streaming-friendly |

## How to choose

Start by asking two questions: how big is the corpus, and how does it change? Size sets your floor — under roughly a few hundred thousand vectors, flat is usually fine, and adding index complexity you don't need yet just gives you more to debug. Once flat's latency becomes a real problem, HNSW is the reasonable default: it's what most vector databases give you out of the box, and it stays the right call as long as the corpus fits in memory and updates are mostly inserts rather than deletes.

Move off HNSW when memory becomes the bottleneck rather than latency — that's the IVF family's territory. Reach for plain IVF when you need the memory savings of clustering but can still afford full-precision vectors; reach for IVF-PQ once even that's too much, and budget for the rerank step it needs to recover the recall the compression costs you. Consider a ScaNN-style index specifically when your metric is inner product or cosine and your corpus is refreshed in batches rather than streamed continuously — it can beat IVF-PQ's recall-per-byte, but only if your update pattern matches how it wants to be rebuilt.

The update pattern is the axis people forget. Two corpora of the same size can call for different indexes if one gets rewritten nightly and the other takes a thousand inserts and deletes a minute — bias toward HNSW or plain IVF for high-churn data, and toward IVF-PQ or ScaNN-style for large, mostly-static or batch-refreshed data. When you're unsure, benchmark rather than guess: build a flat index as ground truth, measure recall@k for your ANN candidate at the latency and memory budget you actually have, and only add compression once memory forces the issue.

One thing this page deliberately leaves out: everything above assumes an unfiltered search. Layering metadata filters — tenant IDs, date ranges, permissions — on top of any of these indexes changes its cost profile, sometimes a lot, depending on whether the filter is applied before or after the ANN search runs. That trade-off is its own decision; see [Metadata Filtering in Retrieval](/learn/rag/metadata-filtering-in-retrieval) when you get there.

**Related:** [Similarity Search and ANN Indexes](/learn/rag/similarity-search-and-ann-indexes) · [Choosing a Vector Database](/learn/rag/choosing-a-vector-database) · [Reranking Retrieved Results](/learn/rag/reranking-retrieved-results) · [High-Dimensional Spaces](/learn/maths-foundations/high-dimensional-spaces) · [Metadata Filtering in Retrieval](/learn/rag/metadata-filtering-in-retrieval) · [Vector DB Worked Example](/learn/rag/vector-db-worked-example)
