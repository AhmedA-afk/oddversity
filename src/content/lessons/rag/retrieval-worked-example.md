---
title: "Vector Retrieval, Worked: Query to Top-k"
track: "rag"
status: live
summary: "Trace one real query through an HNSW index end to end — top-k output, a near-duplicate result, and actual recall/latency numbers as ef gets dialed down."
duration: "7 min read"
---

A user types "How do I rotate an expired API key?" into a support chatbot. Somewhere behind that, one 768-number vector gets compared against 120,000 others and comes back with a ranked list in under a millisecond. Let's build that exact index, run that exact query, and watch what the top-k list actually contains — including the result nobody asked for twice.

## The setup

You're building retrieval for an internal engineering-docs chatbot. The corpus: 120,000 chunked paragraphs pulled from a Confluence wiki, a handful of PDF exports, and a mirrored copy of the public API reference site. Each chunk is embedded into a 768-dimensional vector and L2-normalized, so cosine similarity reduces to a plain dot product — if that step is fuzzy, [cosine similarity](/learn/maths-foundations/cosine-similarity-angular-distance-embedding-retrieval) and [embeddings and semantic similarity](/learn/rag/embeddings-and-semantic-similarity) cover why. The query, from a support engineer: **"How do I rotate an expired API key?"**

We'll index with [hnswlib](https://github.com/nmslib/hnswlib), a small, fast HNSW implementation you can `pip install hnswlib` and run locally. This page assumes you already know *how* an HNSW graph narrows a search down to a candidate list — that mechanic is covered in [Similarity Search and ANN Indexes](/learn/rag/similarity-search-and-ann-indexes). Here we just run the numbers on one query and show you the actual output.

One honest caveat before the code: we can't call a live embedding model inside a lesson, so the corpus below is synthetic vectors standing in for real ones. But we build them to reproduce the exact shape of a real corpus — a handful of genuinely relevant chunks, one near-duplicate, one topical decoy, and a large sea of unrelated chunks that land almost orthogonal to the query (which is what unrelated text actually does at 768 dimensions). The numbers below are illustrative — the point is the *shape* of how recall and latency move as you turn `ef` down, not the exact digits, which depend on your data and hardware.

## Step by step

### 1. Embed the query and normalize it

```python
import numpy as np

DIM = 768
query = model.encode(["How do I rotate an expired API key?"])[0]
query = query / np.linalg.norm(query)
```

> **Why this step?** Normalizing isn't cosmetic. hnswlib's `cosine` space computes distance as `1 - dot(a, b)` on whatever vectors you hand it — if you skip normalization, a longer vector can out-rank a more relevant one purely on magnitude. Normalize once at embed time and cosine similarity becomes a dot product, which is both what the math wants and what the index computes fastest.

### 2. Build the index over the corpus

```python
import hnswlib

N = 120_000
index = hnswlib.Index(space="cosine", dim=DIM)
index.init_index(max_elements=N, ef_construction=200, M=16, random_seed=42)
index.add_items(corpus, np.arange(N))   # corpus: (120_000, 768) float32, normalized
```

> **Why this step?** `M` and `ef_construction` are *build-time* knobs — they shape how richly connected the graph is and cost you time once, up front. That's a different decision from the `ef` you'll set per search below. A cheaply built graph (low `M`) can't be rescued by cranking search-time `ef` later; the connections just aren't there. Keep that distinction in mind for the "Where it breaks" section.

### 3. Search: get the top-k

```python
index.set_ef(200)          # search-time candidate list size
labels, distances = index.knn_query(query, k=10)
for lbl, dist in zip(labels[0], distances[0]):
    print(lbl, round(1 - dist, 3))   # hnswlib returns distance = 1 - cosine sim
```

Here's what actually comes back, with what each chunk really is:

| id | similarity | source chunk |
|---|---|---|
| 100 | 0.860 | *API Reference v3 → Authentication → Key Rotation* |
| 101 | 0.835 | *API Reference v3, PDF export → Authentication → Key Rotation* |
| 5000 | 0.710 | *Service Accounts → Rotating Credentials* |
| 42000 | 0.680 | *Authentication → Revoking an API Key* |
| 73311 | 0.182 | *Billing → Invoice PDF Generation* |
| 11092 | 0.155 | *Onboarding → Laptop Setup* |
| 61787 | 0.150 | *(unrelated chunk)* |
| 98711 | 0.148 | *(unrelated chunk)* |
| 37819 | 0.140 | *(unrelated chunk)* |
| 42788 | 0.140 | *(unrelated chunk)* |

Notice the cliff after rank 4: similarity drops from 0.680 to 0.182. That gap is real and typical — at 768 dimensions, chunks that don't share the query's topic land close to orthogonal (similarity near 0), while chunks that do share it cluster well above that floor. That's also why brute-force-exact ranking and the HNSW result agree exactly on ranks 1–8 here and only swap two near-tied noise chunks at ranks 9–10 (0.1402 vs 0.1443/0.1411 on the exact scores) — even at a generous `ef=200`, an ANN index is still *approximate*, just very close.

### 4. Look at what you actually got

Ranks 1 and 2 are not two different answers — they're the same paragraph, once from the live wiki and once from its PDF mirror. Their similarity gap (0.860 vs 0.835) is a fraction of the gap down to the next genuinely different chunk (0.710). If you hand the top 10 straight to an LLM, you've spent 2 of your 10 context slots saying the same thing twice.

Rank 4 is worse in a different way: it shares vocabulary ("API key," "Authentication") but answers a different question — how to *revoke* a key, not rotate one. Cosine similarity can't tell "same topic" from "answers this question"; it only knows the vectors are close.

> **Why this step?** Both problems are structural, not bugs in this query. Mirrored docs, versioned pages, and repeated changelog boilerplate produce near-duplicates in almost every real corpus, and shared vocabulary produces topical decoys constantly. Neither is something the vector index is supposed to solve — that's the job of a downstream [reranker](/learn/rag/reranking-retrieved-results), which scores query-chunk pairs directly instead of by vector distance, or [metadata filtering](/learn/rag/metadata-filtering-in-retrieval) that dedupes by source before the list ever reaches an LLM.

## Where it breaks

Fast-forward four months. The corpus has grown to 500,000 chunks, and to keep the index memory-light it got rebuilt with a leaner graph (`M=8` instead of 16, `ef_construction=40` instead of 200). Someone also notices p99 latency creeping up and turns search-time `ef` down to compensate. Same kind of query, same kind of relevant chunks planted in the corpus — plus now a swarm of ~300 borderline chunks sitting close to the decoy's similarity band, which is realistic: a bigger corpus means more paragraphs that are *almost* about your topic.

```python
gt = set(brute_force_top10)   # exact cosine ranking via corpus @ query

for ef in [200, 100, 50, 30, 15, 10]:
    index.set_ef(ef)
    t0 = time.perf_counter()
    for _ in range(100):
        labels, _ = index.knn_query(query, k=10)
    latency_ms = (time.perf_counter() - t0) / 100 * 1000
    recall = len(set(labels[0]) & gt) / len(gt)
    print(ef, round(recall, 2), round(latency_ms, 4))
```

Illustrative run (numbers rounded; yours will differ):

| ef | recall@10 vs. exact | avg latency |
|---|---|---|
| 200 | 0.90 | 0.38 ms |
| 100 | 0.80 | 0.12 ms |
| 50 | 0.80 | 0.07 ms |
| 30 | 0.60 | 0.05 ms |
| 15 | 0.60 | 0.03 ms |
| 10 | 0.60 | 0.02 ms |

Roughly a 15–20x latency drop from `ef=200` to `ef=10`, paid for with recall falling from 0.90 to 0.60. But look at *which* results were lost: in every single row, ids 100, 101, and 5000 — the real answer, its near-duplicate, and the related-but-weaker match — were still retrieved. What dropped out, every time, was chunks from the borderline swarm: candidates sitting in a crowded near-tie band where the graph's beam search stops exploring before it fully sorts them out.

That's the trap. "Recall dropped from 0.9 to 0.6, no big deal" is true *on this query*, because the borderline chunks it lost happened to be redundant with each other. But that's a property of this corpus, not a guarantee. On a harder query — one where the actual answer is itself a borderline, ambiguous match rather than a clean 0.86 spike — the same `ef` cut can just as easily drop the one chunk you needed. You can't tell which case you're in from latency numbers alone.

**The fix:** measure recall@k against a brute-force baseline on a sample of your *real* queries before shipping a lower `ef` in production — not once at launch, but again after the corpus has meaningfully grown, since the same `ef` that gave 0.9 recall on 120k chunks isn't guaranteed to give 0.9 on 500k. If you're on an IVF-style index (e.g., FAISS `IndexIVFFlat`) instead of HNSW, `nprobe` — how many coarse clusters get searched — is the same knob wearing a different name; see [choosing a vector database](/learn/rag/choosing-a-vector-database) for how the index types compare. Either way, a cheap hedge is to retrieve a larger k than you actually show the LLM (say, 25 instead of 10) and dedupe or rerank down — that buys margin against exactly this kind of top-k instability without touching `ef` at all.

## Takeaways

- Top-k is a *similarity* ranking, not a *relevance* ranking — near-duplicates and same-vocabulary decoys will sit right next to the real answer, because cosine distance can't distinguish "same paragraph mirrored twice" or "same topic, wrong action" from a genuine match.
- `ef` (or `nprobe` on IVF-style indexes) is a per-query knob traded off at search time — separate from `M` and `ef_construction`, which fix the graph's ceiling once at build time and can't be recovered by raising `ef` later.
- Recall loss from lowering `ef` isn't spread evenly across your results — it concentrates in the crowded, borderline candidates first. That can look free on an easy query and still cost you the answer on a harder one.
- Don't tune `ef` (or pick an index config) on latency alone — measure recall@k against an exact baseline on your own queries, and re-check it as the corpus grows.

**Related:** [Similarity Search and ANN Indexes](/learn/rag/similarity-search-and-ann-indexes) · [Reranking Retrieved Results](/learn/rag/reranking-retrieved-results) · [Metadata Filtering in Retrieval](/learn/rag/metadata-filtering-in-retrieval) · [Choosing a Vector Database](/learn/rag/choosing-a-vector-database) · [Embeddings and Semantic Similarity](/learn/rag/embeddings-and-semantic-similarity) · [Cosine Similarity & Angular Distance](/learn/maths-foundations/cosine-similarity-angular-distance-embedding-retrieval)
