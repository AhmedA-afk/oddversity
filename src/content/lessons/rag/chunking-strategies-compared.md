---
title: "Chunking Strategies Compared"
track: "rag"
status: live
summary: "A practitioner's comparison of fixed-size, recursive, sentence-window, semantic, and parent-document chunking, with a decision table and a choose-by-document-type procedure."
duration: "7 min read"
---

Every chunking strategy is really a bet about where the meaning boundaries in your documents sit, and how much you're willing to pay at ingestion time to find them. [Chunking Strategies for Documents](/learn/rag/chunking-strategies-for-documents) covers why chunking matters and the core knobs — size, overlap, boundary awareness. This page is the lineup: five named approaches, what each one is actually betting on, and the exact conditions under which that bet stops paying off.

## Fixed-size chunking

Split the raw text every N tokens (or characters), usually with some overlap — say 500 tokens with a 50-token overlap — and don't look at the content at all. It's the strategy with zero opinions about structure: a table, a code block, and a paragraph of prose all get cut on the same clock.

It wins when you need a fast baseline, when the corpus is huge enough that per-document parsing cost adds up, or when the source text genuinely has no exploitable structure to respect. Its failure mode is exactly what you'd expect: it slices mid-sentence, mid-function, and mid-table-row with no regard for what it's cutting — a chunk boundary landing between a table's header row and its data rows leaves you with a chunk that's just `47, 82, 13` and no idea which column is which. It's also the cheapest and fastest option by a wide margin — no parsing, no model calls, just a counter — which is exactly why it survives as the default in so many tutorials despite being the worst-informed choice for real documents.

## Recursive / structural chunking

Try to split on the document's largest natural boundary first — a `##` heading, then a paragraph break, then a sentence — falling back to smaller separators only where a section is too big to fit as one chunk. This respects whatever skeleton the author already gave you: headings, list items, code fences, table blocks.

It wins on markdown docs, code repositories, and well-formatted PDFs — anything with a real hierarchy to exploit. The failure mode is garbage-in-garbage-out: feed it an OCR'd scan or an unformatted chat export with no real structure, and it degenerates to something close to fixed-size chunking while costing more to build. It can also produce wildly uneven chunk sizes — one heading's section is 40 tokens, the next is 4,000 — which you then have to handle downstream. Cost-wise it's still cheap: parsing logic instead of a raw counter, but no embedding calls, so ingestion latency stays low.

## Sentence-window chunking

Index at the sentence level for precise matching, but retrieve a window of surrounding sentences — or the whole parent paragraph — around whatever sentence actually matched. The retrieval unit and the generation unit are deliberately decoupled: small for search precision, wider for coherence.

It wins on dense technical or legal text where the answer to a query really does live in one specific sentence, but that sentence alone reads as a fragment without its neighbors — think "what's the penalty clause" in a long contract. The failure mode is window mistuning: too narrow and you've lost the context that made the window worth having; too wide and you've reintroduced the fixed-size problem one level up. It also doubles your indexing bookkeeping, since you now need to track sentence position and neighbor pointers, not just chunk boundaries. Ingestion cost stays close to recursive chunking, but retrieval now needs an extra step to expand the window, which adds a small but real latency tax on every query compared to just returning the matched chunk directly.

## Semantic chunking

Embed individual sentences, walk through the document, and cut a new chunk whenever the similarity between consecutive sentences drops below a threshold — the mechanics of that similarity score are covered in [cosine similarity and angular distance](/learn/maths-foundations/cosine-similarity-angular-distance-embedding-retrieval), and what the vectors are actually capturing in [embeddings and semantic similarity](/learn/rag/embeddings-and-semantic-similarity). The result is variable-length chunks that track topic shifts instead of a fixed token count — say similarity runs around 0.85 within a topic and dips to 0.55 at a genuine shift, so you'd set your cut threshold somewhere in between and tune from there.

It wins on long-form prose with topic drift and no reliable headings to lean on — narrative documents, transcripts, long-form articles where recursive chunking has nothing structural to grab. The failure mode is cost and fragility: you're doing a full embedding pass over every sentence at ingestion time, before you even have chunks, and the similarity threshold is corpus-specific — it drifts every time you add a new document type and has to be re-tuned. It also has no concept of layout, so it will still slice a table or code block in half; semantic similarity operates on prose meaning, not on "this is a table." It's the most expensive of the five by a clear margin, purely because of that per-sentence embedding pass at ingestion.

## Parent-document chunking

Split into small child chunks so retrieval matching stays precise, but store and return the larger parent chunk — or whole section — each child belongs to. The full mechanics live on [parent-document retrieval](/learn/rag/parent-document-retrieval); the short version here is that it's less a chunking algorithm than a two-tier indexing pattern you layer on top of whichever splitter you're already using.

It wins whenever precision and context pull in opposite directions — you want a tight, specific child chunk to win the similarity search, but a chunk that small would be nearly unusable for the LLM to generate from on its own. The failure mode is plumbing: you now need a two-tier store (child index plus parent lookup) instead of one flat index, and if you set the parent size too generously you pay a real context-window cost on every hit. Cost sits in the middle of the pack — ingestion is close to whatever base splitter you paired it with, but you're storing more data and retrieval adds a lookup hop.

## Decision table

| Approach | Best when | Avoid when | Relative cost/latency |
|---|---|---|---|
| Fixed-size | Fast baseline, huge corpora, no time to parse structure | Tables, code, or precision-sensitive factual QA | Lowest — no parsing, no model calls |
| Recursive/structural | Markdown, code, well-formatted docs with real headings | Unstructured or OCR'd text, chat logs | Low — parsing only, no embedding pass |
| Sentence-window | Dense prose needing sentence-precise matches plus context | Docs with noisy sentence boundaries (code, tables) | Low ingestion, small retrieval-time overhead |
| Semantic | Long narrative prose with topic drift and no reliable headings | Tables, code, latency-sensitive ingestion, small corpora not worth tuning | Highest — full embedding pass plus threshold tuning |
| Parent-document | Need precise matching *and* full context; small chunks alone are unusable | Simple short docs where one chunk already is enough context | Moderate — extra storage plus a lookup hop |

## How to choose

Start with recursive/structural chunking as your default — it's cheap, and most real corpora (docs, code, formatted reports) have enough structure to reward it. From there, branch by document type:

**Clean prose with topic drift and no dependable headings** — long articles, transcripts, narrative reports — is where recursive chunking runs out of boundaries to use. Move to semantic chunking and budget for the embedding-at-ingestion cost; it's the one case where paying for that pass is worth it.

**Tables and code** are where you should resist the pull toward fixed-size, even though tables and code often look "irregular" enough to tempt you into just splitting by length. Keep it structural, but make the boundary explicit — split on row/record boundaries for tables, function or class boundaries for code — rather than letting a token counter decide. A working end-to-end pass at this is in the [chunking worked example](/learn/rag/chunking-worked-example).

**Chat logs and transcripts** need a different unit entirely: chunk by turn or exchange, not by paragraph or token count. A rolling token window across a conversation will happily cut a question away from its answer; treating each turn (or a short run of turns) as the atomic chunk keeps speaker and context intact.

Layer parent-document retrieval on top of any of the above the moment you notice retrieval is finding the *right* chunk but the LLM can't do much with it — that's the signal that your retrieval unit is smaller than your generation unit needs to be, not a sign you chose the wrong base chunker. And whichever combination you land on, don't trust intuition alone to tell you it's working — check it against [evaluating RAG quality](/learn/rag/evaluating-rag-quality) before you ship it.

**Related:** [Chunking Strategies for Documents](/learn/rag/chunking-strategies-for-documents) · [Parent-Document Retrieval](/learn/rag/parent-document-retrieval) · [Embeddings and Semantic Similarity](/learn/rag/embeddings-and-semantic-similarity) · [Cosine Similarity and Angular Distance](/learn/maths-foundations/cosine-similarity-angular-distance-embedding-retrieval) · [Chunking Worked Example](/learn/rag/chunking-worked-example) · [Evaluating RAG Quality](/learn/rag/evaluating-rag-quality)
