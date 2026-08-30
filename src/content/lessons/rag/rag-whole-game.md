---
title: "RAG, End to End: The Whole Game"
track: "rag"
status: live
summary: "The entire RAG pipeline on one page — ingest to evaluation — with the failure modes at each stage and a reading path through every module."
duration: "7 min read"
---

RAG isn't one technique, it's a relay race: ten-ish small systems, each with its own failure modes, handing a baton of "relevant text" to the next until an LLM turns it into an answer. Drop the baton anywhere in that chain and the final answer is wrong, no matter how good the model is.

If you haven't already, read [What Is RAG and When to Use It](/learn/rag/what-is-rag-and-when-to-use-it) first — it covers the why and the when. This page assumes you're past that and want the how: the full mechanical pipeline, laid out end to end, so you know where every piece lives before you start building one.

## The pipeline at a glance

- **Ingest & parse** — pull the raw material (PDFs, wikis, tickets, transcripts) and turn it into clean, structured text before anything else touches it. Get this wrong and every downstream stage inherits the mess. The practical details of doing this inside a real build live in [Building a RAG Pipeline End to End](/learn/rag/building-a-rag-pipeline-end-to-end).
- **Chunk** — split that text into pieces small enough to embed and retrieve precisely, large enough to still make sense on their own. See [Chunking Strategies for Documents](/learn/rag/chunking-strategies-for-documents).
- **Embed** — turn each chunk into a vector that places semantically similar text nearby in space. See [Embeddings and Semantic Similarity](/learn/rag/embeddings-and-semantic-similarity).
- **Index** — store those vectors in a structure built for fast approximate nearest-neighbor lookup, in a database that can hold and update them at your scale. See [Similarity Search and ANN Indexes](/learn/rag/similarity-search-and-ann-indexes) and [Choosing a Vector Database](/learn/rag/choosing-a-vector-database).
- **Retrieve** — turn the user's question into one or more queries and pull the chunks most likely to answer it. See [Query Rewriting and Expansion](/learn/rag/query-rewriting-and-expansion) and [Metadata Filtering in Retrieval](/learn/rag/metadata-filtering-in-retrieval).
- **(Hybrid)** — combine that vector search with old-fashioned keyword search, because semantic similarity alone routinely misses exact terms — IDs, error codes, product names — it was never built to catch. See [Hybrid Search: Lexical and Vector](/learn/rag/hybrid-search-lexical-and-vector).
- **Rerank** — take the wider candidate set retrieval pulled back and reorder it with a slower, more accurate model before anything reaches the LLM. See [Reranking Retrieved Results](/learn/rag/reranking-retrieved-results).
- **Ground** — attach the retrieved chunks to the prompt in a way that makes the model cite what it used, so an answer is traceable instead of just asserted. See [Grounding Answers with Citations](/learn/rag/grounding-answers-with-citations).
- **Generate** — the LLM call itself. Almost everything upstream exists purely to put the right handful of chunks in front of the model instead of the wrong handful — see [Building a RAG Pipeline End to End](/learn/rag/building-a-rag-pipeline-end-to-end) for how the whole assembly comes together.
- **Evaluate** — measure whether the system actually retrieves the right things and answers correctly, on an ongoing basis, not once at launch. See [Evaluating RAG Quality](/learn/rag/evaluating-rag-quality).

Notice that "hybrid" is parenthetical: it's not a separate stage bolted after retrieve so much as a decision about *how* retrieve works. Plenty of production systems skip it and do fine; plenty more add it the day someone searches for an order number and gets nothing back.

## What breaks at each stage

Most RAG debugging is figuring out which stage in this chain actually failed — the symptom ("the bot gave a wrong answer") shows up at generation, but the cause is almost never there.

| Stage | Typical failure | Where to learn the fix |
|---|---|---|
| Ingest & parse | Tables, headers, and code blocks flatten into unreadable soup; a PDF's reading order gets scrambled | [Building a RAG Pipeline End to End](/learn/rag/building-a-rag-pipeline-end-to-end) |
| Chunk | A chunk boundary lands mid-thought, separating a fact from the sentence that gives it meaning | [Chunking Strategies for Documents](/learn/rag/chunking-strategies-for-documents), [Chunking Common Mistakes](/learn/rag/chunking-common-mistakes) |
| Embed | The embedding model doesn't fit the domain (a general-purpose model on dense legal or code text), so "nearby in vector space" stops meaning "relevant" | [Embeddings and Semantic Similarity](/learn/rag/embeddings-and-semantic-similarity) |
| Index | An ANN index tuned for speed loses recall silently — you don't find out until real queries start missing | [Similarity Search and ANN Indexes](/learn/rag/similarity-search-and-ann-indexes), [Vector DB Common Mistakes](/learn/rag/vector-db-common-mistakes) |
| Retrieve | The query is three words and the chunks are three paragraphs — cosine similarity has nothing good to lock onto | [Query Rewriting and Expansion](/learn/rag/query-rewriting-and-expansion) |
| Hybrid | Running pure vector search on a query that's really a keyword lookup (a SKU, an exact name) | [Hybrid Search: Lexical and Vector](/learn/rag/hybrid-search-lexical-and-vector) |
| Rerank | Skipping it because it "looks redundant," then finding the right chunk was sitting at position 7 | [Reranking Retrieved Results](/learn/rag/reranking-retrieved-results) |
| Ground | The model paraphrases past what its sources say, or cites a chunk that doesn't actually support the claim | [Grounding Answers with Citations](/learn/rag/grounding-answers-with-citations) |
| Generate | Stuffing in chunks "just in case," burying the answer in noise while inflating cost and latency for nothing | [Building a RAG Pipeline End to End](/learn/rag/building-a-rag-pipeline-end-to-end) |
| Evaluate | Eyeballing a handful of outputs by hand, so regressions ship silently when you change a chunk size or swap a model | [Evaluating RAG Quality](/learn/rag/evaluating-rag-quality), [RAG Eval Common Mistakes](/learn/rag/rag-eval-common-mistakes) |

## How the pieces fit

The whole pipeline is a running negotiation between recall, latency, and cost, and every stage pulls that negotiation in a different direction. Take indexing: brute-force cosine similarity over, say, 5 million vectors means 5 million comparisons per query — fine on a laptop demo, a non-starter at real traffic. An ANN index like the ones covered in [Similarity Search and ANN Indexes](/learn/rag/similarity-search-and-ann-indexes) fixes that by searching approximately instead of exhaustively, which is exactly the trade the name admits: you might drop from near-perfect recall to, say, roughly 90%, in exchange for latency that's a small fraction of the brute-force number. That's usually a great trade. It's a bad one if the 10% you're missing is disproportionately the chunk that actually answers the question — which is precisely the failure mode that makes people reach for hybrid search and reranking. (The vector geometry underneath all of this — why "nearby" means anything at all — is covered in [The Geometry of Embeddings](/learn/maths-foundations/the-geometry-of-embeddings) and [Cosine Similarity and Angular Distance](/learn/maths-foundations/cosine-similarity-angular-distance-embedding-retrieval) if you want the math, not just the intuition.)

Hybrid search and reranking both spend latency and compute to buy back the precision that a cheap top-k vector search leaves on the table, and they do it at different points in the funnel. Hybrid widens what gets considered in the first place, so lexical matches a pure vector search would never surface get a chance. Reranking narrows what survives, using a model that reads query and chunk together instead of comparing precomputed vectors — cross-encoders are markedly slower than the bi-encoder embeddings used for the first pass, but also markedly more accurate at judging "is this chunk actually relevant to this question." The common pattern is cheap-and-wide, then expensive-and-narrow: pull back 50 candidates fast, rerank down to the 5 that actually go in the prompt. Do the expensive step first and you've paid cross-encoder prices on results you were going to throw away anyway.

Chunk size sits underneath all of it, because it's the one decision that shapes how every later stage behaves. Smaller chunks retrieve more precisely — less irrelevant text riding along with the fact you wanted — but you need more of them to cover the same ground, which means more tokens into generation, more items for a reranker to score, and more rows in your index. Larger chunks are cheaper per unit and give the LLM more surrounding context for free, but they dilute the embedding (a chunk about three topics doesn't sit close to a query about any one of them) and drag irrelevant text into the prompt along with the relevant part. There's no chunk size that wins on every axis, which is exactly why [Chunking Strategies for Documents](/learn/rag/chunking-strategies-for-documents) is framed as trade-offs rather than a formula — and why none of these decisions should be made by eyeballing a few outputs. You need [Evaluating RAG Quality](/learn/rag/evaluating-rag-quality) running continuously, because a change that helps retrieval can quietly hurt generation, and you won't see that without measuring both.

One honest caveat that belongs on this page: sometimes the right move at any stage is not to build the pipeline at all. If your corpus is small enough to fit in a long context window, or your questions need computation rather than lookup, RAG adds failure modes for no real benefit — see [When RAG Is the Wrong Tool](/learn/rag/when-rag-is-the-wrong-tool) before you commit to building any of this.

## Where to start

If you're building your first pipeline, read in roughly this order:

1. [What Is RAG and When to Use It](/learn/rag/what-is-rag-and-when-to-use-it) — the why, if you skipped it.
2. [Chunking Strategies for Documents](/learn/rag/chunking-strategies-for-documents), then [Chunking Worked Example](/learn/rag/chunking-worked-example) to see the decisions made on real text.
3. [Embeddings and Semantic Similarity](/learn/rag/embeddings-and-semantic-similarity) — what a vector search is actually doing.
4. [Similarity Search and ANN Indexes](/learn/rag/similarity-search-and-ann-indexes) and [Choosing a Vector Database](/learn/rag/choosing-a-vector-database) — where the vectors live and how they're found.
5. [Hybrid Search: Lexical and Vector](/learn/rag/hybrid-search-lexical-and-vector) and [Reranking Retrieved Results](/learn/rag/reranking-retrieved-results) — the two levers for fixing bad recall and bad precision.
6. [Grounding Answers with Citations](/learn/rag/grounding-answers-with-citations) — making the final answer trustworthy, not just plausible.
7. [Evaluating RAG Quality](/learn/rag/evaluating-rag-quality) — so you know if any of the above actually worked.
8. [Building a RAG Pipeline End to End](/learn/rag/building-a-rag-pipeline-end-to-end) to see it all wired together, then [RAG Capstone: Support Bot](/learn/rag/rag-capstone-support-bot) to build one yourself.

Once that's solid, the next layer isn't a new pipeline — it's making pieces of this one smarter: [Query Rewriting and Expansion](/learn/rag/query-rewriting-and-expansion) and [Metadata Filtering in Retrieval](/learn/rag/metadata-filtering-in-retrieval) improve what gets searched for; [Parent Document Retrieval](/learn/rag/parent-document-retrieval), [Multi-Vector Retrieval](/learn/rag/multi-vector-retrieval), and [Contextual Retrieval](/learn/rag/contextual-retrieval) rethink what a "chunk" even is; and [Agentic RAG](/learn/rag/agentic-rag) and [Corrective/Self-RAG](/learn/rag/corrective-self-rag) let the system decide to retrieve again, or differently, when the first pass wasn't good enough.

**Related:** [What Is RAG and When to Use It](/learn/rag/what-is-rag-and-when-to-use-it) · [Building a RAG Pipeline End to End](/learn/rag/building-a-rag-pipeline-end-to-end) · [Evaluating RAG Quality](/learn/rag/evaluating-rag-quality) · [When RAG Is the Wrong Tool](/learn/rag/when-rag-is-the-wrong-tool) · [RAG Capstone: Support Bot](/learn/rag/rag-capstone-support-bot)
