---
title: "Reranking: Common Mistakes"
track: "rag"
status: live
summary: "Six real failure modes that quietly wreck reranking in production, from starving it of candidates to double-paying an LLM for a job a cross-encoder does cheaper."
duration: "7 min read"
---

Reranking looks like a free precision upgrade — bolt a cross-encoder on top of retrieval and watch quality improve. In practice it's a stage with its own failure modes, and most of them are invisible until you go looking. If you haven't read [Reranking Retrieved Results](/learn/rag/reranking-retrieved-results) yet, start there for the mechanics — this page assumes you know how a reranker works and focuses on where teams actually get burned.

### Reranking too few candidates

People add a reranker but leave the first-stage retrieval `top_k` small — fetch 5 or 10 candidates from the vector store, then "rerank" that tiny set. Or they widen retrieval a bit but not enough for a large or noisy corpus, so the actually-relevant chunk sits at retrieval rank 60 while the reranker only ever sees the top 15.

**Why it's wrong:** a reranker is a re-*ordering* function, not a recall mechanism. It scores exactly the candidates handed to it and nothing else — it has no way to promote a document that retrieval never surfaced in the first place. Cross-encoders are expensive per pair (see the next mistake), so the instinct is to shrink the candidate set to control cost, but that just moves your recall ceiling upstream to retrieval and hides it behind a reranker that looks like it's doing more than it is.

**Symptom:** you can grep your corpus and find a document that clearly answers the query, but it never appears in the final top-k even with reranking on. Recall@k measured at the retrieval stage (before reranking) caps your end-to-end answer quality no matter how good the reranker is downstream. See [similarity search and ANN indexes](/learn/rag/similarity-search-and-ann-indexes) for what controls that ceiling.

**Fix:** retrieve wide, rerank narrow. Pull a generous candidate set from retrieval — the right number depends on corpus size and latency budget, but "wider than feels necessary" is the right instinct — then let the reranker cut it down to the 5-10 you actually pass to the LLM. Tune retrieval `k` against recall@k *before* you add a reranker, using the methodology in [evaluating RAG quality](/learn/rag/evaluating-rag-quality), so you know your ceiling instead of assuming the reranker will paper over it.

### Ignoring the added latency

Reranking gets added to the synchronous request path with no latency budget, no benchmarking at production candidate counts, and no plan for what happens under load.

**Why it's wrong:** a bi-encoder retrieval step is cheap at query time because document embeddings are precomputed — you're comparing one query vector against an index. A cross-encoder reranker runs the query and *each* candidate document jointly through a transformer forward pass, so cost scales roughly linearly with the number of candidates you rerank. Reranking 20 candidates and reranking 200 are not the same latency ballpark, and teams often benchmark the reranker in isolation on a handful of examples, not at the candidate count and concurrency they'll actually run in production.

**Symptom:** p95/p99 latency looks fine in dev and spikes in production, especially after someone bumps the candidate count for "better recall" without re-testing the rerank stage. The reranking step quietly becomes the dominant chunk of end-to-end pipeline latency, not the LLM call people were watching.

**Fix:** benchmark the reranker at your actual production candidate count and concurrency, not a toy example. Treat candidate count as a latency-vs-quality dial, not a free variable. Cheaper architectures (smaller cross-encoders, late-interaction models) trade some accuracy for real latency headroom — [reranking methods compared](/learn/rag/reranking-methods-compared) lays out that trade-off. Combining reranking with [hybrid search](/learn/rag/hybrid-search-lexical-and-vector) to pre-filter candidates before the expensive scoring pass also helps — fewer, better candidates going into the reranker means less to score.

### Domain mismatch between reranker and corpus

A team grabs a popular off-the-shelf reranker — trained mostly on general web or QA-benchmark-style query-passage pairs — and applies it unmodified to a specialized corpus: legal contracts, medical literature, internal source code, financial filings.

**Why it's wrong:** a cross-encoder's notion of "relevant" is learned from its training distribution, both linguistically and structurally. A model trained on short conversational Q&A pairs doesn't automatically know that in a contract, "shall" and "may" are load-bearing words, or that in a codebase, a function signature match matters more than surrounding prose similarity. It will still produce scores — cross-encoders always produce *a* score — they just won't track what actually matters in your domain.

**Symptom:** spot-checking reveals the reranker demoting clearly correct, jargon-dense passages while promoting superficially similar but substantively wrong ones. The model may look great on its original benchmark and mediocre on your real query traffic, which is the whole trap — nobody re-validates it against domain data because the benchmark numbers look fine.

**Fix:** before trusting any reranker, validate it against a small labeled sample from *your* domain — real queries, real "this document is/isn't relevant" judgments — using the same rigor described in [evaluating RAG quality](/learn/rag/evaluating-rag-quality). Try more than one reranker candidate. If nothing beats your baseline, a well-tuned [hybrid lexical + vector](/learn/rag/hybrid-search-lexical-and-vector) score without a reranker can outperform a mismatched cross-encoder.

### No score cutoff, so junk still passes

The pipeline always takes the reranker's top-k, full stop — whether the top score is a confident 0.9 or a limp 0.05 relative to the rest of the set.

**Why it's wrong:** a rerank score is a *relative* ordering over whatever candidates it was given, not an absolute verdict on "good enough to answer with." If the corpus genuinely has no good match for a query — an out-of-scope question, a typo, something outside your data's coverage — the reranker still confidently ranks *something* first, because ranking is all it knows how to do. That top result then flows into the LLM's context looking exactly like a legitimate hit.

**Symptom:** the system never says "I don't know." For out-of-scope or unanswerable queries it produces a plausible-sounding answer stitched from a marginally-related top chunk, because nothing in the pipeline distinguishes "best of a good set" from "best of a bad set." This is a direct contributor to ungrounded, confidently-wrong answers — see [grounding answers with citations](/learn/rag/grounding-answers-with-citations) for the other half of this problem.

**Fix:** set an absolute score threshold, calibrated on a held-out set of queries you've labeled as "should have an answer" versus "no good match exists" — not just a relative top-k cutoff. When nothing clears the threshold, fail closed: return "insufficient context," trigger query rewriting, or widen the search, rather than forwarding the best-available-but-still-bad chunk. Log your score distributions over time so drift shows up before users notice it.

### Double-paying with an LLM reranker

A large general-purpose LLM gets used as the reranker — sending it the query plus every candidate's full text, per request, priced per token — when a dedicated cross-encoder would do the ranking job for a fraction of the cost and latency. The more expensive version of this mistake: running an LLM reranking pass *and* a cross-encoder pass in the same pipeline, effectively paying twice for one ranking decision with no ablation showing the second pass earns its keep.

**Why it's wrong:** LLM-based reranking (prompting a model to score or order candidates) means paying per-token, per-request, for potentially large chunk text, and that cost compounds with both candidate count and query volume. A purpose-built cross-encoder is a small model doing one job cheaply; an LLM reranker is a large general-purpose model doing that same job at API pricing. Stacking both without evidence the LLM pass improves ordering beyond what the cross-encoder already achieves is pure cost with no corresponding benefit.

**Symptom:** your cost breakdown shows reranking, not generation, as the dominant line item — token spend scales with candidate count and query volume in a way nobody budgeted for, and margins that looked fine in a demo evaporate at real traffic.

**Fix:** reserve LLM-based reranking for cases where relevance genuinely requires reasoning an embedding-scale model can't do — complex multi-part intent, cross-document synthesis — and where query volume is low enough that per-token cost stays sane. For anything high-QPS, use a dedicated cross-encoder or rerank API sized for that cost profile; [reranking methods compared](/learn/rag/reranking-methods-compared) covers the accuracy-cost trade-offs across architectures. Measure cost per query at each pipeline stage individually, and never stack a second reranking pass on top of a working one without an ablation proving the marginal accuracy gain is worth the marginal spend.

### Silent truncation from context-window mismatch

Full chunks (sometimes whole documents) get fed to the reranker without checking its maximum sequence length, on the assumption that "it's a transformer, it'll handle it."

**Why it's wrong:** cross-encoder rerankers have a fixed max token length, same as embedding models, and most implementations truncate silently rather than erroring. If your chunking strategy produces long chunks — see [chunking strategies for documents](/learn/rag/chunking-strategies-for-documents) — the sentence that actually answers the query can sit past the truncation boundary and simply never get scored at all. The reranker isn't wrong about the truncated text; it's right about text it never saw.

**Symptom:** longer chunks systematically underperform shorter ones in reranking, independent of actual relevance, and the effect gets worse whenever chunk size increases. Answer-bearing content near the end of a chunk goes missing from rerank results in a way that looks random until you check token counts against the model's limit.

**Fix:** check your reranker's documented max sequence length and keep chunk sizes compatible with it, or pre-truncate/split with the important content positioned early. Run a probe test: place a known-relevant sentence at different positions within a chunk and confirm the reranker still surfaces it near the boundary. Log truncation events if your reranking library exposes them — most silently drop the information you'd need to notice this.

## Pre-flight checklist

- **Retrieval width, not just rerank quality** — confirm recall@k at the retrieval stage before blaming or crediting the reranker for anything.
- **Latency at production scale** — benchmark rerank time at your real candidate count and concurrency, not a 5-example smoke test.
- **Domain validation, not benchmark trust** — spot-check the reranker against labeled examples from your own corpus before deploying it.
- **An absolute score cutoff exists** — and it was calibrated against "no good answer exists" queries, not just picked as a relative top-k.
- **Cost per pipeline stage is measured separately** — so an LLM reranker's spend doesn't hide inside a bundled "inference cost" line.
- **No redundant reranking passes** — every stage in the pipeline can point to an ablation showing it earns its cost.
- **Chunk size fits the reranker's context window** — with a probe test confirming late-chunk content still gets scored.

**Related:** [Reranking Retrieved Results](/learn/rag/reranking-retrieved-results) · [Reranking: Methods Compared](/learn/rag/reranking-methods-compared) · [Similarity Search and ANN Indexes](/learn/rag/similarity-search-and-ann-indexes) · [Evaluating RAG Quality](/learn/rag/evaluating-rag-quality) · [Hybrid Search: Lexical and Vector](/learn/rag/hybrid-search-lexical-and-vector) · [Chunking Strategies for Documents](/learn/rag/chunking-strategies-for-documents)
