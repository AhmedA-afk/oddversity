---
title: "Vector Retrieval: Check Yourself"
track: "rag"
status: live
summary: "Six scenario-based questions on ANN recall/latency tuning, distance-metric mismatches, normalization pitfalls, and picking an index for your actual scale."
duration: "7 min read"
---

These six questions aren't about remembering what HNSW stands for. They're about the calls you actually have to make once an index is live and something looks off — recall feels low, memory is climbing, or a teammate wants to swap a metric. If you haven't worked through [Similarity Search and ANN Indexes](/learn/rag/similarity-search-and-ann-indexes) yet, do that first — this assumes you know what an ANN index is and picks up where that leaves off.

## Question 1

You've deployed an HNSW index and recall@10 on a sample of test queries is lower than you'd like. The index was built with `M=16` and `efConstruction=200`. What's the fastest way to improve recall without rebuilding the index?

- A. Increase `ef_search` (the query-time candidate-list size)
- B. Increase `M` and rebuild the index
- C. Switch the distance metric from cosine to Euclidean
- D. Increase `efConstruction` and rebuild

<details><summary>Answer</summary>

**Correct: A.** `ef_search` (sometimes just `ef` at query time) is a runtime knob — raising it makes each query explore more candidates before returning, trading latency for recall, and it takes effect immediately with no reindex. **B** is a real lever, but `M` controls graph connectivity and is baked in at construction time — it's a valid fix, just a much more expensive one than trying `ef_search` first. **C** doesn't reliably move recall at all; a metric mismatch is a correctness problem, not a recall-tuning problem, and picking one at random can make results worse. **D** is a build-time parameter like `M` — same category as B, same cost.

</details>

## Question 2

A teammate says "our index has 95% recall" but can't explain how that number was computed. What's actually required to calculate recall@k for an ANN index?

- A. Compare each query's ANN top-k results against the true top-k from an exact (brute-force/flat) search on the same queries
- B. Check the recall estimate most vector databases report automatically
- C. Measure how often users click the top result
- D. Compare your `ef_search` setting against numbers published by the index library's authors

<details><summary>Answer</summary>

**Correct: A.** Recall@k is defined *relative to ground truth* — the actual nearest neighbors. There's no way to know how many of your ANN results are "real" hits without running (or sampling) an exact search to compare against. **B** is wrong for most setups: databases don't know your ground truth, so they can't self-report recall — some tuning utilities compute it as part of a parameter sweep, but that's still running exact search under the hood, not magic. **C** conflates recall with a UX signal; click-through is confounded by ranking, presentation, and relevance judgment — it's a different metric measuring a different thing. **D** is only ever a rough prior — published numbers come from someone else's data, dimensionality, and hardware, and won't transfer to your corpus.

</details>

## Question 3

You swap in a new embedding model whose docs say it was "trained with a dot-product objective for retrieval." Your vector DB defaults to cosine similarity. What's the risk of leaving it on cosine?

- A. If vectors aren't length-normalized, cosine instead of dot product silently changes the ranking the model was optimized to produce — with no error thrown
- B. None — cosine and dot product always return identical rankings regardless of vector length
- C. The database will throw an error because the metric doesn't match the model
- D. Cosine is strictly more accurate than dot product for any embedding model, so this is actually an improvement

<details><summary>Answer</summary>

**Correct: A.** Cosine similarity normalizes away magnitude and compares only direction. If the model was trained with dot product, it may be encoding real signal in vector *length* (e.g., how much a passage matters), and cosine throws that away. Nothing crashes — retrieval quality just quietly gets worse. See [dot product explained](/learn/maths-foundations/dot-product-explained) and [cosine similarity](/learn/maths-foundations/cosine-similarity-angular-distance-embedding-retrieval) for the actual math. **B** is the trap: that equivalence *only* holds once vectors are unit-normalized — which is exactly the condition this question is asking you not to assume. **C** — there's no built-in validation checking your metric against a model's training objective; the mismatch is invisible to the system. **D** is a myth. "Cosine is the safe default" isn't universally true — the right metric is a property of how the model was trained, not a ranking of metrics in the abstract.

</details>

## Question 4

You compute dot-product similarity directly on raw embeddings (no normalization step) and notice a handful of unusually long documents dominate the top of *every* result list, regardless of the query. What's going on, and what's the fix?

- A. Those documents' embeddings have larger norm, which inflates raw dot product regardless of relevance; normalize vectors to unit length before indexing, or use cosine similarity
- B. The index is corrupted — rebuild it from scratch
- C. Increase `ef_search`/`nprobe` so search explores more candidates instead of favoring long documents
- D. The embedding model is broken and needs retraining

<details><summary>Answer</summary>

**Correct: A.** Dot product is magnitude-sensitive: `score = |a| |b| cos(θ)`. If some vectors have a larger norm — often correlated with document length — they'll score higher across almost every query, independent of actual relevance. Normalizing to unit length (or switching to cosine, which does the normalizing for you) removes the magnitude term and leaves pure directional similarity. Background: [norms and distances](/learn/maths-foundations/norms-and-distances). **B** — the index is doing exactly what dot product asks of it; nothing is corrupted. **C** — recall/latency knobs don't touch which metric is used or how magnitude is weighted; irrelevant here. **D** — retraining a model is a massive overreaction to what's usually a one-line normalization fix.

</details>

## Question 5

Your corpus is about 20,000 document chunks — comfortably small, fits in memory. A teammate wants to set up an IVF-PQ index with product quantization "to future-proof for scale." What should you push back on?

- A. At this size, exact brute-force (flat) search is almost certainly fast enough and gives perfect recall for free; IVF-PQ's tuning overhead and quantization error aren't earning their cost yet — add it later if the corpus actually grows
- B. Nothing — you should always use the most scalable index available so you never have to migrate later
- C. IVF-PQ is strictly worse than HNSW at every scale, so HNSW should replace it instead
- D. Product quantization only reduces latency, not memory, so it's irrelevant to the future-proofing argument anyway

<details><summary>EAnswer</summary>

**Correct: A.** At 20K vectors, a linear scan over every vector is typically a few milliseconds — there's no recall to trade away because it's exact, and you skip the real cost of PQ: accepting some accuracy loss from compression and taking on `nlist`/`nprobe` tuning for a problem you don't have yet. If the corpus grows into the millions, that's the point to revisit — see [choosing a vector database](/learn/rag/choosing-a-vector-database) for how that decision actually shifts with scale. **B** ignores that premature complexity has a real, ongoing cost — more moving parts, more failure modes, more tuning surface — paid starting today, for a benefit you may never need. **C** is false: IVF-PQ vs. HNSW isn't strictly ordered, it depends on your scale, memory budget, and recall requirements. **D** is backwards — PQ's whole point is compressing vectors into small codes to cut memory footprint; that's precisely the axis "future-proofing" is usually worried about.

</details>

## Question 6

Your corpus grows from 500K to 50M vectors. Recall on your existing HNSW index (same `M`, same `ef_search`) starts feeling worse, and memory usage has ballooned. What's the best explanation?

- A. Index choice at scale is a three-way tradeoff between speed, recall, and memory — HNSW's graph plus full-precision vectors barely fit (or don't fit affordably) in RAM anymore, pushing you toward compression (product/scalar quantization) or an IVF-based approach that trades some exactness for memory headroom
- B. HNSW recall intrinsically degrades as a dataset grows, regardless of memory — no parameter tuning or index change can help
- C. This is purely a latency problem; recall is unaffected by scale
- D. Switch to Euclidean distance instead of cosine, since Euclidean scales better to large datasets

<details><summary>Answer</summary>

**Correct: A.** The tradeoff people usually reason about is just speed vs. recall, but memory is the third axis that determines what's even feasible — HNSW stores full vectors plus graph links per node, and that gets expensive fast at 50M scale. The realistic path is compressing vectors or moving to an index built for that footprint, accepting a bit less recall in exchange for fitting in memory at all. **B** overstates it — recall itself doesn't have to degrade with scale if you keep enough RAM and `ef_search` high enough; what actually breaks is the *budget* for doing that, which is the real constraint people hit. **C** is wrong — if the team responds to the memory problem by cutting `M` or `ef_search` to save space, that directly tanks recall; the two aren't independent at scale. **D** — distance metric choice doesn't address a memory or scale problem at all; that's a different axis entirely (see Question 3).

</details>

If more than one of these gave you pause, it's worth working through a concrete index-selection exercise rather than just reading definitions — try the [retrieval worked example](/learn/rag/retrieval-worked-example) or skim [retrieval common mistakes](/learn/rag/retrieval-common-mistakes) for the failure patterns these questions are drawn from.

**Related:** [Similarity Search and ANN Indexes](/learn/rag/similarity-search-and-ann-indexes) · [Cosine Similarity](/learn/maths-foundations/cosine-similarity-angular-distance-embedding-retrieval) · [Dot Product Explained](/learn/maths-foundations/dot-product-explained) · [Norms and Distances](/learn/maths-foundations/norms-and-distances) · [Choosing a Vector Database](/learn/rag/choosing-a-vector-database) · [Retrieval Common Mistakes](/learn/rag/retrieval-common-mistakes)
