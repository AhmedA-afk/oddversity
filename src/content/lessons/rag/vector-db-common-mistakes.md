---
title: "Choosing a Vector DB: Common Mistakes"
track: "rag"
status: live
summary: "Five real, recurring ways teams pick and configure a vector DB wrong — filtered search, metadata cardinality, distance metrics, deletes, and scale — with mechanisms and fixes."
duration: "7 min read"
---

Most vector DB regrets don't show up in week one. They show up three months later, when the filters get complicated, the corpus is 50x bigger, or someone edits a document and the old answer keeps coming back. Here are the mistakes that actually cause that, and how to catch them before they cost you a rewrite.

## Ignoring filtered-search performance until production

**The mistake:** You benchmark a vector DB on raw top-k similarity search — "how fast and accurate is retrieval over the whole corpus" — because that's what the marketing benchmarks measure. Then you ship, and every real query in production also filters on `tenant_id`, `date_range`, or `category`, because [metadata filtering](/learn/rag/metadata-filtering-in-retrieval) is how you actually scope search in a multi-tenant or multi-category app.

**Why it's wrong:** ANN indexes are built for the *unfiltered* vector space. A filter has to be reconciled with that structure somehow, and "somehow" varies a lot by engine: **pre-filtering** (find matching IDs first, then brute-force search only those — fine for a small candidate set, slow if the filter is broad), **post-filtering** (run ANN search for top-k, then drop results that fail the filter — fast, but if your filter is selective, you can end up with far fewer than k usable results), or genuinely **filter-aware ANN** (the index itself skips non-matching nodes during graph or cluster traversal). A lot of "we support metadata filtering" marketing quietly means post-filter, and that only becomes visible once your filters actually exclude most of the corpus.

**Symptom:** Unfiltered search looks great in your eval. Filtered search returns fewer results than requested, has inconsistent recall depending on filter selectivity, or gets noticeably slower the more selective the filter is — the opposite of what you'd expect ("filtering less data should be faster").

**Fix:** Build your eval set with your *actual* filter patterns, not unfiltered queries — test at a few realistic selectivities (say, a filter matching ~50% of the corpus, ~5%, and ~0.1%). Ask directly, for the engine you're evaluating, whether filtering is pre-, post-, or index-integrated, and whether you can over-fetch (`k=200`, then filter down) as a workaround if it's post-filter. Don't infer this from unfiltered benchmark numbers — they tell you nothing about this axis.

## Letting high-cardinality metadata blow up the index

**The mistake:** You index metadata fields as filterable because it's easy — `user_id`, `session_id`, a full timestamp, sometimes even raw text — treating "filterable" as a free property of any field you store.

**Why it's wrong:** Many vector DBs build a separate structure per filterable field (a payload index, an inverted index, or per-value partitioning) to make filtering fast. That structure's cost scales with *cardinality* — the number of distinct values — not with corpus size. A field with a handful of categories is cheap. A field like `user_id` with millions of distinct values can mean millions of tiny index entries, each with overhead that adds up to real memory pressure and slower writes, and in some architectures pushes the engine toward per-tenant partitioning that fragments what would otherwise be one coherent ANN graph.

**Symptom:** Memory usage grows faster than your vector count would suggest. Ingestion throughput drops as you onboard more distinct tenants or users, even though total vectors per tenant stayed the same. Filtered queries on the high-cardinality field get slower over time, not because the corpus got bigger but because the *value count* did.

**Fix:** Separate "metadata you store and return" from "metadata you filter on," and index only the latter. For genuinely high-cardinality filters like tenant or user isolation, check whether the DB has a real multi-tenancy primitive (separate namespaces/collections per tenant) rather than treating tenant ID as just another filter value — that's usually the difference between an architecture that scales and one that quietly degrades. Load a realistic cardinality distribution during evaluation, not three test values.

## Configuring the wrong distance metric

**The mistake:** You leave the DB on its default distance metric — often Euclidean (L2) — or you mix up cosine and dot product without checking what your embedding model actually expects.

**Why it's wrong:** Embedding models are trained (or at least evaluated and tuned) against a specific notion of similarity, and it isn't automatically "whatever the DB defaults to." Most modern text embedding models are meant to be compared with [cosine similarity](/learn/maths-foundations/cosine-similarity-angular-distance-embedding-retrieval) — direction matters, magnitude doesn't. If you instead run raw [dot product](/learn/maths-foundations/dot-product-explained) on unnormalized vectors, longer vectors can dominate rankings for reasons that have nothing to do with meaning. Run Euclidean distance instead of cosine and you're measuring something different from angular closeness — the two metrics don't just differ by a formula, they can produce different nearest-neighbor rankings for the same query, especially in the [high-dimensional spaces](/learn/maths-foundations/high-dimensional-spaces) embeddings live in.

**Symptom:** This is the nastiest one because it doesn't error — it just quietly degrades quality. Retrieval looks "okay but a bit off": some clearly relevant chunks rank below clearly irrelevant ones, or certain documents seem to dominate results regardless of query. Nothing in your logs points at the metric; it looks like a chunking or embedding-model problem, so people debug the wrong layer for a while.

**Fix:** Check your embedding model's documentation for the metric it was trained/evaluated against — it's usually cosine, sometimes dot product on pre-normalized vectors (functionally the same thing). Set that metric explicitly in the DB config; don't trust the default. Normalize vectors before indexing if you're using dot product for speed but the model assumes cosine. Sanity-check with a small hand-labeled query set before you scale — this bug is cheap to catch early and expensive to notice after you've indexed 10M vectors on the wrong metric.

## Having no plan for updates and deletes

**The mistake:** You design ingestion for a one-time bulk load — embed the corpus, index it, done — and treat the vector store as effectively append-only. Nobody designs for what happens when a source document is edited or removed.

**Why it's wrong:** Graph-based ANN indexes like HNSW aren't built for cheap in-place deletion — a "delete" is often a tombstone, not a removal, so the index keeps traversing and storing stale nodes until a compaction or rebuild happens. Meanwhile your actual documents change: a page gets edited, a policy gets superseded. If you don't track which chunks came from which document version, an edit doesn't cleanly replace the old vectors — it just adds new ones alongside stale ones, and now retrieval can surface both the outdated and current answer for the same query with no signal about which is which.

**Symptom:** Index size keeps growing even when your logical document count is flat (dead tombstones accumulating). Recall or latency slowly degrades over weeks or months with no code change. After a content update, you get duplicate or contradictory chunks in retrieved context — sometimes the stale one wins because it happens to embed slightly closer to the query.

**Fix:** Decide this at design time, not when it bites: pick a DB with native compaction, or explicitly schedule periodic index rebuilds. Track a source-document → chunk-ID mapping so an update can delete *all* associated old chunks before inserting new ones, rather than just adding. Include a delete-and-reinsert cycle in your evaluation, not just a one-way bulk load — it's a different workload with different failure modes.

## Benchmarking on toy data, then hitting scale

**The mistake:** You prototype against a dataset that comfortably fits in memory on one machine — tens of thousands of vectors — get results you're happy with, and assume the same configuration holds as you grow toward millions.

**Why it's wrong:** ANN behavior isn't scale-invariant. Parameters tuned for a small, single-node index (say, HNSW's `ef_search` or an IVF index's `nprobe`) were implicitly tuned against a small, simple graph or cluster structure. As the dataset grows by orders of magnitude, that structure gets deeper and more complex, and the same parameter values that gave you strong recall at 50k vectors can give you noticeably worse recall at 5M unless you retune. Worse, scale is exactly where the other four mistakes on this page stop being theoretical: filtered search selectivity, metadata cardinality, and delete/rebuild costs all get harder as N grows, so a toy-scale benchmark hides all of them at once.

**Symptom:** The migration to real data goes badly in more than one way simultaneously — memory use is much higher than the linear extrapolation suggested, ingestion takes far longer than projected, recall on your held-out eval set is visibly worse than it was at toy scale, and query latency under realistic concurrent load is far above the single-query number you tested.

**Fix:** Test at (or deliberately extrapolate from) an order of magnitude closer to your real target — even a resampled or synthetic 1–5M vector set surfaces scaling problems a 50k set can't. Re-tune ANN parameters at each scale checkpoint rather than carrying toy-scale settings forward unchanged. Test concurrent query load, not just one query at a time. And run the filtered-search, cardinality, and delete tests above *at* that scale — each one behaves differently there than it did in your first pass.

## Pre-flight checklist

- Eval filtered queries at realistic selectivity (broad, moderate, narrow) — don't judge on unfiltered top-k alone.
- Confirm whether the engine pre-filters, post-filters, or does filter-aware ANN, and plan around it.
- Index only the metadata fields you actually filter on; keep high-cardinality identifiers (user/tenant IDs) out of generic filters or use a real multi-tenancy primitive.
- Explicitly set the distance metric to match what your embedding model was trained for — don't rely on the DB's default.
- Normalize vectors if your model assumes cosine similarity but you're computing dot product for speed.
- Have an explicit answer for "what happens when a source document is edited or deleted" before you go to production, including who owns rebuild/compaction.
- Track document-version → chunk-ID mappings so updates replace rather than duplicate.
- Load-test at an order of magnitude near your real target corpus size, with concurrent queries, before committing to a configuration.
- Re-tune ANN parameters (`ef_search`, `nprobe`, etc.) at each scale checkpoint rather than assuming toy-scale values hold.
- Revisit [Choosing a Vector Database](/learn/rag/choosing-a-vector-database)'s evaluation criteria as a per-scale checklist, not a one-time decision.

**Related:** [Choosing a Vector Database](/learn/rag/choosing-a-vector-database) · [Metadata Filtering in Retrieval](/learn/rag/metadata-filtering-in-retrieval) · [Similarity Search and ANN Indexes](/learn/rag/similarity-search-and-ann-indexes) · [Cosine Similarity](/learn/maths-foundations/cosine-similarity-angular-distance-embedding-retrieval) · [Vector DB Worked Example](/learn/rag/vector-db-worked-example) · [Vector DB Cheatsheet](/learn/rag/vector-db-cheatsheet)
