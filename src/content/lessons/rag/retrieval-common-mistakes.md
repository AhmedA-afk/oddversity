---
title: "Vector Retrieval: Common Mistakes"
track: "rag"
status: live
summary: "Five ways vector retrieval quietly fails in production — metric mismatches, skipped normalization, starved ANN search, filtered-query blind spots, and trusting recall you never mea."
duration: "7 min read"
---

Vector retrieval rarely fails loudly. It fails by returning *plausible-looking* results that are quietly wrong — no stack trace, no error, just a RAG answer that cites the wrong passage or a search that "works" in your demo and falls apart on real traffic. The five mistakes below are the ones that keep showing up in postmortems, not hypothetical gotchas.

## Using the wrong similarity metric for how the model was trained

### The mistake
You pick cosine similarity (or dot product, or L2) for your index because it's the default in whatever library's quickstart you copied, without checking what the embedding model was actually trained with.

**Why it's wrong.** An embedding model's training objective bakes in an implicit contract about how its vectors should be compared. Most modern embedding models are trained with a contrastive loss computed directly on cosine or dot product — and the choice matters. Cosine similarity divides out vector magnitude and only compares direction; dot product keeps magnitude in play. Some models are trained specifically so that magnitude carries signal (this shows up in a few retrieval-tuned models whose cards explicitly say "use dot product, not cosine"). If you compare vectors with a metric the model wasn't optimized against, you're not measuring the same notion of "similar" the model learned — you get a ranking that's correlated with the right answer but not equal to it.

**Symptom.** Nothing crashes. Retrieval "mostly works," especially on easy, short queries, but rankings feel subtly off in ways that don't reproduce your embedding provider's reported benchmark numbers, and you can't figure out why. Debugging the prompt or the reranker doesn't help because the problem is one layer down.

**Fix.** Before you build the index, check the model card, config, or docs for the specified similarity function — for many `sentence-transformers` models this is spelled out explicitly (`similarity_fn_name` in the model config, or a line in the card). For hosted APIs (OpenAI, Cohere, Voyage) the returned embeddings are effectively unit-length already, so cosine and dot product agree and this is close to moot. It stops being moot the moment you swap in an open-weight model without re-checking. When in doubt, run a small retrieval-quality check with both metrics on a labeled sample and see if the ranking actually differs before assuming it doesn't. The [cosine similarity primitive](/learn/maths-foundations/cosine-similarity-angular-distance-embedding-retrieval) and [dot product explained](/learn/maths-foundations/dot-product-explained) are worth re-reading side by side if you're not sure which one you're actually computing.

## Forgetting to normalize vectors when the index expects cosine

### The mistake
You want cosine similarity, but the library only exposes L2 distance or raw inner product (this is true of plenty of ANN libraries), so you use the inner-product index directly on unnormalized vectors and call it "cosine."

**Why it's wrong.** Cosine similarity is dot product divided by the product of the two vectors' norms. Skip the division — by skipping normalization — and inner product on raw vectors is dominated by magnitude, not direction. A long, generic, or slightly off-distribution chunk that happens to produce a larger-norm embedding will out-score a shorter, precisely relevant one regardless of semantic fit. Some libraries expose a "cosine" metric option that normalizes for you internally; others assume you've already normalized before insertion. That behavior isn't consistent across libraries or even across versions of the same library, so "I picked cosine in the config" isn't the same as "I confirmed my vectors are normalized."

**Symptom.** A handful of specific chunks keep appearing near the top of results across totally unrelated queries — a classic sign of a magnitude outlier winning on norm rather than meaning. Or: results were fine, then degraded after you started incrementally adding vectors from a different embedding batch (one normalized, one not).

**Fix.** Normalize at write time and re-verify at read time — a one-line sanity check (`norm(v) ≈ 1.0`) on a sample of stored vectors catches this in seconds. If your library's "cosine" mode claims to handle it internally, don't take that on faith the first time; check with the same sanity script. Keep normalization consistent across every ingestion path that writes to the same index, including backfills and incremental updates.

## Setting ef_search / nprobe too low and never measuring recall

### The mistake
You accept the ANN index's default search-time parameter (`ef_search` for HNSW, `nprobe` for IVF) or tune it purely for latency under load, without ever comparing its results against exact search.

**Why it's wrong.** These parameters control how much of the index the query actually explores before stopping — `ef_search` bounds the candidate list size during the HNSW graph walk, `nprobe` bounds how many IVF clusters get scanned. Set either too low and the search terminates before it finds the true nearest neighbors. This is exactly what "approximate" in ANN means, but the failure is silent: the query returns a full, confident-looking top-k, just not the *right* top-k. The [ANN indexes primer](/learn/rag/similarity-search-and-ann-indexes) covers how these structures work; this is the mistake of never checking what your specific setting costs you in recall.

**Symptom.** Retrieval looks fine on easy queries and gets quietly worse on harder or borderline ones — exactly the queries where you most need it to work. If you actually measure it (top-k from your ANN index vs. top-k from brute-force flat search on the same query set), you can watch recall@10 fall sharply — as an illustration, from something like ~0.95 at a generous `ef_search` down toward ~0.6 as you push the parameter toward its floor — with no warning in the API response either way.

**Fix.** Before deploying, benchmark recall@k against exact search on a representative sample — treat brute-force as your temporary oracle. Set `ef_search`/`nprobe` from that measurement, not from a latency target alone, and remember it isn't a one-time constant: it typically needs to scale up as corpus size or dimensionality grows, so re-check after a significant reindex, not just at launch.

## Forgetting that filtered search isn't free

### The mistake
You add a metadata filter (`tenant_id = X`, `category = "legal"`) to a vector query and assume it behaves like the unfiltered version, just narrower.

**Why it's wrong.** Naive filtering does one of two things, and both bite you. *Post-filtering* runs ANN search for top-k first, then discards results that don't match the filter in application code — but if the filter is selective, the unfiltered top-k might contain few or zero matches at all. Say only 2% of your corpus matches a given tenant filter and you post-filter a top-20 candidate set: on average that's 20 × 0.02 = 0.4 matches, meaning a plain "no results" response is common even when plenty of matching documents exist in the corpus. *Pre-filtering* — restricting the search to allowed IDs before running ANN — avoids that but can throw away the index's whole speed advantage for narrow filters, degrading toward a near-linear scan. This is the exact gap [metadata filtering in retrieval](/learn/rag/metadata-filtering-in-retrieval) covers in depth.

**Symptom.** Filtered queries return sparse or empty results for narrow filters while the identical query without the filter looks great — often surfacing as a "search is broken for this customer" ticket that turns out to be a filter-selectivity problem, not a data problem. Or: filtered latency spikes disproportionately as the filter narrows, the opposite of what people intuitively expect ("fewer candidates should mean faster").

**Fix.** Know which strategy your vector database actually implements — some do true filtered ANN that prunes during graph traversal rather than pure pre/post filtering, but even those usually need you to overfetch (raise `k` or `ef_search` by a multiplier tied to filter selectivity) before applying the filter. Load-test with realistic filter selectivity, not just the unfiltered case, and consider a separate index per value for a high-cardinality field that's filtered on every query (e.g., one index per tenant) rather than one shared index filtered at query time.

## Treating ANN recall as 100% when debugging a bad answer

### The mistake
When a RAG pipeline gives a wrong or incomplete answer, you go straight to the prompt or the reranker, on the assumption that retrieval definitely found the right chunk and the problem is downstream.

**Why it's wrong.** "Approximate" in approximate nearest neighbor is a real, quantified trade-off, not a rounding error — see the previous mistake. Retrieval recall compounds with every other imperfect step in the pipeline: how [chunking](/learn/rag/chunking-strategies-for-documents) split the source document, how many candidates you pull back, whether a reranker sees the right one to promote. If the right chunk was never in the ANN candidate set to begin with, no amount of prompt tuning or reranking fixes it, because there's nothing correct left to rerank.

**Symptom.** Answers are wrong in a pattern that resists prompt iteration — you fix the prompt, the same class of query keeps failing, and it's hard to tell if the model is "hallucinating" or accurately reporting that it wasn't given the right context.

**Fix.** Instrument retrieval as its own measured step, separate from generation: for a labeled query set, check whether the known-relevant document ID appears anywhere in the retrieved candidates at all, before checking whether the final answer used it correctly. This is the retrieval-recall half of what [evaluating RAG quality](/learn/rag/evaluating-rag-quality) is about. When an answer is wrong, check the retrieval log first — it's a five-minute check that saves hours of prompt archaeology.

## Pre-flight checklist

- Confirmed which similarity metric (cosine, dot product, L2) the embedding model's docs or card actually specify, not just what the library defaults to
- Verified vectors are normalized (norm ≈ 1.0) at insertion time, if the index is meant to compute cosine via inner product
- Re-verified normalization after any incremental ingestion path, backfill, or embedding-model swap
- Measured recall@k against exact/flat search on a representative query sample, not just eyeballed a few queries
- Set `ef_search`/`nprobe` from that recall measurement, and re-checked after any significant reindex or corpus growth
- Load-tested filtered queries at realistic filter selectivity, not only the unfiltered case
- Know whether your vector database does true filtered ANN or pre/post filtering, and overfetch accordingly when filters are selective
- Have a way to check "was the right chunk even retrieved" separately from "was the final answer right," before blaming the prompt or reranker

**Related:** [Cosine similarity, angular distance & embedding retrieval](/learn/maths-foundations/cosine-similarity-angular-distance-embedding-retrieval) · [Similarity search and ANN indexes](/learn/rag/similarity-search-and-ann-indexes) · [Metadata filtering in retrieval](/learn/rag/metadata-filtering-in-retrieval) · [Evaluating RAG quality](/learn/rag/evaluating-rag-quality) · [Retrieval cheatsheet](/learn/rag/retrieval-cheatsheet)
