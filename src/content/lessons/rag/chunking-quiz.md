---
title: "Chunking: Check Yourself"
track: "rag"
status: live
summary: "Six scenario-based questions testing whether chunk-size, overlap, structural-splitting, and embedding-window tradeoffs actually stuck."
duration: "7 min read"
---

Six scenarios, not six definitions — if you've already worked through [chunking strategies](/learn/rag/chunking-strategies-for-documents), this is where you find out whether the tradeoffs actually stuck. Read each stem like a bug report: something specific went wrong, and you need the mechanism, not the vocabulary.

## 1. Smaller chunks, better recall, worse precision — why?

You're running a support-docs RAG bot. You cut chunk size from ~1,000 tokens to ~200 tokens, keeping top-k fixed at 5. On your eval set (see [evaluating RAG quality](/learn/rag/evaluating-rag-quality) if "recall" and "precision" feel fuzzy here), recall goes up but precision drops. What's the most likely explanation?

- **A.** Your original 1,000-token chunks were being silently truncated before embedding, and shrinking them just avoided that bug.
- **B.** You should also increase overlap between the new 200-token chunks — that's what's dragging precision down.
- **C.** With five retrieval slots now covering five narrower slices of content instead of one broad slice, you catch more distinct relevant facts (recall up) — but narrow chunks are also easier to superficially match on a shared word or phrase without being genuinely relevant, so some slots go to loosely-related chunks (precision down).
- **D.** Precision dropping means your eval set's relevance labels are wrong, since smaller chunks are strictly better than larger ones.

<details><summary>Answer</summary>

**Correct: C.** Fixed top-k with smaller chunks means more, narrower slots — you cover more distinct topics (recall climbs) but each slot is now easier to fill with something that merely shares vocabulary rather than genuinely answering the query (precision falls). **A** 1,000 tokens is comfortably inside nearly every modern embedding model's max input, so truncation is an unlikely culprit — and if it were happening, it would suppress recall on those chunks, not swing precision on the new smaller ones. **B** overlap protects boundary-spanning facts from being cut in half; it doesn't touch the recall/precision tradeoff that comes from chunk size itself, and adding more overlap to already-small chunks would mostly add near-duplicates. **D** dismisses a real, well-documented tradeoff as a labeling bug — smaller chunks are not strictly better, they trade precision for recall.

</details>

## 2. Should dropping overlap fix mediocre retrieval?

Your chunks are 500 tokens with 250-token (50%) overlap. Retrieval quality is mediocre, and a teammate wants to drop overlap to zero to "clean up" the index. Which statement about overlap is accurate?

- **A.** Overlap's job is narrow: keep a fact, sentence, or table row that lands on a chunk boundary intact in at least one chunk. It doesn't correct a chunk size that's wrong for the content in the first place.
- **B.** Overlap roughly doubles a fact's chance of being retrieved, since it now lives in two chunks instead of one.
- **C.** If retrieval is mediocre, more overlap — not less — is generally the right first thing to try, regardless of chunk size.
- **D.** Overlap is free aside from a bit of extra storage; it doesn't affect what actually gets retrieved.

<details><summary>Answer</summary>

**Correct: A.** Overlap exists to stop boundary-spanning content from being cut in half and lost — that's it. If mediocre quality here is actually a chunk-size problem (500 tokens wrong for this content), overlap won't touch it. **B** the two copies don't multiply your hit rate — they compete for the same result slots against every other chunk in the index, so it's not a literal doubling of retrieval odds. **C** overlap isn't a general-purpose retrieval-quality lever; reach for it specifically when you suspect boundary-splitting, not as a default fix for anything that feels off. **D** at 50%, you're also filling top-k with near-duplicate chunks, which can crowd out genuinely different relevant content — that's a retrieval-quality cost, not just a storage one.

</details>

## 3. A fixed-size splitter cuts a table in half

A fixed-size, 500-character splitter cuts a technical doc mid-table, putting the header row in one chunk and the data rows in the next. Cosine similarity between queries and these chunks looks normal. Why does answer quality suffer anyway?

- **A.** This means embeddings are fundamentally the wrong tool for tabular content — switch to keyword search for any doc containing tables.
- **B.** Structure-aware splitting works mainly because it produces smaller chunks than fixed-size splitting does.
- **C.** Once you split by logical structure, you no longer need any overlap between chunks.
- **D.** Fixed-size splitting only counts characters, not meaning — it has no way to know a data row is unusable without its header. The chunks embed fine because they contain real, on-topic words, but they're incoherent as standalone units for an LLM to reason over.

<details><summary>Answer</summary>

**Correct: D.** Similarity scores measure lexical/semantic overlap with the query, not whether a chunk is a complete, interpretable unit — a headerless data row can score well and still be useless. **A** overcorrects: the fix is splitting on structure so the whole table stays together, not abandoning embeddings entirely. **B** it's not about size — a structure-aware split can produce a chunk *larger* than the fixed-size cut it replaces (a whole table); what matters is that the boundary respects meaning, not length. **C** sections can still run long and need further splitting internally, and the seam between two structurally-clean sections can still separate related context — see [chunking strategies](/learn/rag/chunking-strategies-for-documents) on combining the two.

</details>

## 4. 1,500 tokens fits the context window — so why is content going missing?

You size chunks at ~1,500 tokens because that's comfortably inside your generator LLM's 128K context window. Weeks later you notice some retrieved chunks are missing content you know exists near their end — content that should have made an answer possible. The embedding step ([how that vector gets built](/learn/rag/embeddings-and-semantic-similarity)) is the suspect. What's the mistake?

- **A.** 1,500 tokens is too large for any RAG pipeline; the fix is a universal 512-token cap regardless of model.
- **B.** You sized chunks against the generator's context window, not the embedding model's max input length — those are separate limits, and plenty of embedding models cap out well below 1,500 tokens, silently truncating anything past that before it's ever embedded.
- **C.** Truncation only affects retrieval speed, not what gets found, since the vector still captures the chunk's general topic.
- **D.** This is really a chunk-overlap problem — more overlap between chunks would stop the truncation.

<details><summary>Answer</summary>

**Correct: B.** The generator's context window and the embedding model's max input are unrelated numbers set by different models — sizing chunks against one doesn't protect you from the other, and the mix-up is common because both get loosely called "the context limit." **A** there's no universal safe size; the right ceiling is whatever your specific embedding model actually accepts, and some accept far more than 512 tokens. **C** truncation crops the input before it's ever embedded, so anything past the cutoff contributes *nothing* to the vector — a query about a fact near the truncated end simply can't match on it. **D** overlap governs what's shared between adjacent chunks; it has no effect on the maximum length a single chunk is allowed to be before embedding.

</details>

## 5. Why would anyone choose 2,000-token chunks over 200?

For a set of legal contracts full of clauses that reference definitions elsewhere in the same section, an engineer picks large chunks (~2,000 tokens per section) over small ones (~200 tokens per clause) — accepting that fewer distinct topics now fit in top-k. What's the best justification?

- **A.** A 200-token clause chunk might score well against a query but be uninterpretable alone if it references a definition three paragraphs earlier. Larger chunks trade some recall (fewer distinct topics per top-k) for chunks that are actually usable once retrieved.
- **B.** Larger chunks always improve recall and precision together, since more tokens means the embedding captures more information.
- **C.** Chunk size barely matters for legal text because contracts are repetitive; overlap is the only real lever here.
- **D.** Large chunks are the right call mainly because they stay safely under the embedding model's max input length.

<details><summary>Answer</summary>

**Correct: A.** The goal isn't maximizing recall in isolation — it's retrieving chunks the LLM can actually use, and self-contained meaning here requires the whole clause-plus-definitions unit, not just the clause. **B** more tokens can dilute a vector rather than enrich it — a chunk spanning five clauses represents none of them sharply, which can hurt recall for a query about one specific clause. **C** repetitive boilerplate doesn't change the underlying tradeoff of how much self-contained meaning fits per chunk. **D** conflates two different constraints — window limits (see the truncation question above) are about what a model *accepts*; this decision is about what's *interpretable*, and a chunk can sit well inside the window while still being the wrong size for the content. If you want narrow retrieval and full context together, that's the specific problem [parent document retrieval](/learn/rag/parent-document-retrieval) solves.

</details>

## 6. One section, 4,000 words, no subheadings — now what?

You switch from fixed-size chunking to splitting strictly on markdown `##` headers. Quality improves across most docs — until one doc with a single 4,000-word `## Implementation Details` section (no subheadings) gets *worse* retrieval than before. Why?

- **A.** Markdown headers turned out to be an unreliable delimiter, so structural splitting should be abandoned in favor of fixed-size chunks everywhere.
- **B.** The embedding model needs to be fine-tuned on this doc's vocabulary before structural splitting will work.
- **C.** Since headers already provide clean boundaries, overlap between header-based sections should be removed too.
- **D.** Structure alone doesn't guarantee a sensible chunk size — a section with no internal headers becomes one giant chunk, and packing that much mixed detail into one embedding dilutes it until it stops matching any specific query well.

<details><summary>Answer</summary>

**Correct: D.** The fix is hybrid, not either/or: split by structure first, then further split any section that's still oversized by length. **A** overcorrects — structural splitting is working for every other doc in the set; the fix is a size fallback for the exception, not scrapping the whole approach. **B** this isn't a vocabulary problem; the model understands the words fine, the chunk is just too large and unfocused to embed as one coherent unit. **C** unrelated to the oversized-section problem — removing overlap elsewhere doesn't shrink a section that's too big; size and overlap are separate axes, as question 2 covers.

</details>

If more than one of these caught you out, memorizing these six answers won't help next time — the fix is noticing which axis is actually in play (size, overlap, structure, or the embedding model's own limits) when your retrieval quality looks off. For patterns you'll hit again, see [chunking mistakes people actually make](/learn/rag/chunking-common-mistakes) and a full [worked example](/learn/rag/chunking-worked-example) that walks a sizing decision end to end.

**Related:** [Chunking Strategies for Documents](/learn/rag/chunking-strategies-for-documents) · [Chunking: Worked Example](/learn/rag/chunking-worked-example) · [Chunking: Common Mistakes](/learn/rag/chunking-common-mistakes) · [Embeddings and Semantic Similarity](/learn/rag/embeddings-and-semantic-similarity) · [Parent Document Retrieval](/learn/rag/parent-document-retrieval) · [Evaluating RAG Quality](/learn/rag/evaluating-rag-quality)
