---
title: "Choosing a Vector DB: Check Yourself"
track: "rag"
status: live
summary: "Six scenario-based questions on filtered search, metadata modeling, metric mismatches, managed vs."
duration: "7 min read"
---

Knowing the trade-off table from [Choosing a Vector Database](/learn/rag/choosing-a-vector-database) and knowing what to do when a filtered query silently returns three results instead of twenty are different skills. These six questions are built from the failure modes, not the feature comparisons — read the stem carefully, pick your answer, then check the reasoning even if you got it right. The wrong-answer explanations are where the real debugging instinct gets built.

## 1. The filter that quietly starves your results

You run vector search over 10M product vectors. Categories are evenly split across 500 of them, so roughly 20K vectors match any given category. A user filters to one category and asks for the top 20 results. Some queries come back with only 2-3 matches — even though you can confirm 20K+ matching vectors exist. There's no error, and unfiltered queries work fine.

- **A.** The vector database applies the metadata filter *after* running ANN search: it retrieves the top-k nearest neighbors from the whole 10M-vector index first, then drops anything that fails the filter — so if few of those top-k happened to be in the right category, almost everything gets thrown away.
- **B.** The embeddings aren't normalized, so the distance metric is unstable for this category.
- **C.** The HNSW index is stale and hasn't been rebuilt to include recently added vectors.
- **D.** The category field needs a full-text index instead of an exact-match index.

<details><summary>Answer</summary>

**Correct: A.** This is post-filtering, and it's the single most common filtered-search gotcha: the ANN graph traversal is capped by a candidate-list size (often called `ef_search` or similar) that's set for the *unfiltered* case, so if your target category is sparse within that candidate list, you filter down to almost nothing even though plenty of matches exist elsewhere in the index. The fix is pre-filtering (restrict the search space before or during traversal) or a filtered-ANN-aware index — worth reading [Metadata Filtering in Retrieval](/learn/rag/metadata-filtering-in-retrieval) before you pick a vector DB if this pattern matters to you. **B** describes a real bug (magnitude sensitivity), but it produces subtly wrong rankings, not missing results — it wouldn't explain queries returning almost nothing. **C** would explain missing *recent* documents specifically, not a systematic shortfall tied to filter selectivity across all categories. **D** confuses filter type with filter timing — category is exact-match and doesn't need text search; the problem here is when the filter is applied, not how it's matched.

</details>

## 2. Metadata that's technically there but not actually filterable

Your 200K-vector corpus stores each document's metadata as one JSON blob — `author`, `date`, `region`, `permission_tags`, and 35 other fields all in a single opaque field. At query time you need to filter by `permission_tags` and a date range together. These queries are slow, even though 200K vectors is a small corpus by vector-DB standards.

- **A.** Increase `ef_search` (or your index's equivalent recall/candidate-list parameter) so the ANN search casts a wider net.
- **B.** Pull `permission_tags` and `date` out as separate, indexed metadata fields instead of leaving them buried inside an unindexed blob.
- **C.** Switch to a different distance metric.
- **D.** Reduce the embedding dimension to shrink the index.

<details><summary>Answer</summary>

**Correct: B.** Most vector databases only filter efficiently on fields you've explicitly declared and indexed as metadata — a JSON blob has to be deserialized and scanned per candidate (or filtered app-side after retrieval), which throws away the whole point of database-level filtering. Structuring `permission_tags` and `date` as first-class fields lets the DB use its own filter index (a B-tree, inverted index, or similar) instead of paying parse-and-scan cost per query. **A** is a real ANN tuning knob, but it controls *recall* of the vector search, not the *speed* of metadata evaluation — it won't fix a filtering bottleneck. **C** is unrelated: metric choice affects how distances are computed between vectors, not how metadata is matched. **D** shrinks vector storage and distance-computation cost, but your metadata problem lives entirely outside the vector math — a smaller embedding doesn't make blob deserialization faster.

</details>

## 3. The metric that used to be "free" and now isn't

Your original embedding model output normalized unit vectors, so dot product and cosine similarity gave identical rankings — you configured the index metric as dot product and never thought about it again. You swap in a new embedding model whose output vectors are *not* normalized and vary a lot in magnitude, but you leave the index metric set to dot product "because it was working fine." No errors appear, but retrieval quality quietly degrades, and results don't match what a manual cosine calculation would rank first.

- **A.** Dot product is sensitive to vector magnitude as well as direction, so with unnormalized vectors, longer vectors get ranked higher regardless of semantic closeness — switch the index metric to cosine, or normalize vectors before indexing.
- **B.** The HNSW graph needs more connections per node (a higher `M`) to keep up with the new embedding model.
- **C.** This is almost certainly a chunking regression from the model swap, not a metric issue.
- **D.** Dot product and cosine similarity always produce identical rankings, so the metric setting can't be the cause.
</details>

<details><summary>Answer</summary>

**Correct: A.** Dot product equals cosine similarity times the product of the two vectors' magnitudes — they only agree when vectors are normalized to unit length. Once magnitude varies by document, dot product starts rewarding "long" vectors independent of actual semantic match, which is exactly the kind of silent, no-error quality drop described here. See [Dot Product, Explained](/learn/maths-foundations/dot-product-explained) and [Cosine Similarity & Angular Distance](/learn/maths-foundations/cosine-similarity-angular-distance-embedding-retrieval) for the full geometric picture. **B** is an ANN graph-quality knob; it has nothing to do with which vectors get ranked highest for a given distance metric. **C** is a plausible-sounding decoy — a model swap easily makes you suspect the chunking pipeline — but the stem gives you the actual mechanism (magnitude variance + unnormalized vectors) directly, and chasing chunking here would waste real debugging time. **D** is the misconception the whole question is testing: that equivalence only holds for normalized vectors, and the scenario explicitly says the new model doesn't normalize.

</details>

## 4. Managed vs. self-hosted, framed honestly

A team picks a managed vector database because "obviously it's cheaper — we don't need an infra team." Eight months later, they're paying more in managed fees than a comparable self-hosted cluster would cost. They still don't regret the decision. Which framing best explains why?

- **A.** The real trade-off isn't infra dollars vs. managed fees — it's engineering time and operational risk (upgrades, backups, failover, capacity planning) against that fee. Managed wins when that time is worth more than the premium; self-hosting wins when you have the ops capacity and a reason (cost at real scale, compliance, control) to spend it there.
- **B.** They made a mistake — managed is always more expensive, so they should migrate to self-hosted immediately regardless of team size.
- **C.** Self-hosting only becomes viable above roughly a million vectors; below that, managed is effectively required.
- **D.** Managed vector databases can't support metadata filtering, so any team that needs filters has to self-host.

<details><summary>EAnswer</summary>

**Correct: A.** "Cheaper" only means something once you decide what you're pricing — infra spend alone, or infra spend plus the salaried time of whoever would otherwise be patching, scaling, and getting paged for a self-hosted cluster. A team without spare ops capacity can rationally pay a premium indefinitely and be making the right call every month. **B** treats a real cost difference as automatically a mistake, ignoring that the team is trading dollars for time and risk on purpose — that's not the same as being wrong. **C** invents a scale threshold that doesn't generally hold; the right side of this trade-off depends on team capacity and requirements (compliance, data residency, control), not a fixed vector count. **D** was true of some early products but isn't a property of "managed" as a category — plenty of managed vector databases support rich metadata filtering; don't let one vendor's gap become your mental model for the whole category.

</details>

## 5. Scaling a multi-tenant filter, not just a dataset

You run a multi-tenant SaaS product: each of your customers has their own document set, all stored in one shared vector index with a `tenant_id` metadata filter applied per query. At 5,000 customers this is fine. You grow to 50,000 customers and 500M total vectors (still only ~10K vectors per tenant on average), and filtered query latency keeps climbing even though each individual tenant's data is small. What's the structural fix?

- **A.** Add more read replicas to spread query load across more machines.
- **B.** Partition by `tenant_id` — separate indexes or shards per tenant (or per tenant group) — so each query only ever searches that tenant's small index instead of filtering a query against one enormous shared one.
- **C.** Switch from HNSW to IVF, since IVF is inherently better suited to metadata-filtered queries.
- **D.** Add more metadata fields so filters are more selective.

<details><summary>Answer</summary>

**Correct: B.** The problem isn't dataset size in the abstract — it's that every query still has to traverse (or apply the filter within) one graph built across all 500M vectors, even though it only cares about 10K of them. Sharding by tenant collapses each query's actual search space back down to tenant-sized, which is the standard pattern once "filter on tenant_id" stops scaling inside a single collection. **A** helps with concurrent query *throughput* across tenants, but does nothing for the latency of any single query, which is still searching the same oversized shared index. **C** treats index type as if it were the lever here — HNSW vs. IVF is a real trade-off (build time, recall, memory), but neither one solves the "your filter is a needle in a 500M-vector haystack" problem; that's a partitioning problem, not an index-family problem. **D** assumes the issue is filter expressiveness, but the filter is already perfectly selective (one tenant) — the cost is running that filter against a shared structure sized for everyone, not a lack of precision in the filter itself.

</details>

## 6. Scaling a single index without buying infinite RAM

Your HNSW index held 2M vectors comfortably in memory. You've grown to 40M vectors. The index barely fits on your largest instance, and you've had to lower `ef_search` to keep latency in check — which is now costing you recall on exactly the queries that matter most. What's the most direct lever to reclaim headroom, short of an indefinite hardware-scaling treadmill?

- **A.** Apply vector quantization (scalar or product quantization) to shrink the memory footprint per vector, giving you room to raise `ef_search` back up within your existing RAM budget.
- **B.** Switch the distance metric from cosine to Euclidean, which uses less memory per vector.
- **C.** Reduce the embedding dimension, since higher-dimensional vectors always hurt recall at scale anyway.
- **D.** Turn off metadata filtering, since filters are what's consuming the extra memory as the index grows.

<details><summary>Answer</summary>

**Correct: A.** Quantization trades a small, usually acceptable amount of precision for a large reduction in per-vector memory (and often faster distance computation), which is exactly the lever that lets you afford a higher `ef_search` — and therefore better recall — within the RAM you already have. It's the standard move to reach for before, or alongside, sharding across more machines. **B** is a category error: which distance metric you compute has no bearing on how many bytes each stored vector occupies — memory is driven by dimensionality, precision (float32 vs. int8, etc.), and graph edge count, not metric choice. **C** contains a false universal claim — lower dimensions don't "always" help recall, they trade off against how much semantic distinction the embedding can represent — and it requires re-embedding your entire 40M-vector corpus with a different model, which is a far bigger undertaking than quantizing vectors you already have. **D** misattributes the memory pressure: raw vector storage plus the HNSW graph's edge lists are what dominate index memory at this scale; metadata filters add comparatively little, and disabling them wouldn't meaningfully change the picture your latest numbers describe.

</details>

If more than one of these caught you off guard, it's worth working through the [Vector DB Worked Example](/learn/rag/vector-db-worked-example) end to end rather than re-reading definitions — these mistakes show up as behavior, not as facts you forgot.

**Related:** [Choosing a Vector Database](/learn/rag/choosing-a-vector-database) · [Metadata Filtering in Retrieval](/learn/rag/metadata-filtering-in-retrieval) · [Similarity Search & ANN Indexes](/learn/rag/similarity-search-and-ann-indexes) · [Vector DB: Common Mistakes](/learn/rag/vector-db-common-mistakes) · [Vector DB Cheatsheet](/learn/rag/vector-db-cheatsheet) · [Cosine Similarity & Angular Distance](/learn/maths-foundations/cosine-similarity-angular-distance-embedding-retrieval)
