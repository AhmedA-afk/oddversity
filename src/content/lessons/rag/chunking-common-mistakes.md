---
title: "Chunking: Common Mistakes"
track: "rag"
status: live
summary: "Five chunking mistakes that quietly wreck retrieval quality — silent truncation, fake context via overlap, mid-table splits, one-size-fits-all corpora, and forgetting retrieval ret."
duration: "7 min read"
---

Most chunking pipelines "work" in the sense that they run without errors and return *something*. Whether what they return is useful is a different question, and the gap between those two things is where most RAG quality problems actually live. These are mistakes people ship to production, not hypothetical gotchas — each one has a mechanism you can point to and a fix you can apply this week.

If you haven't already, read [Chunking Strategies for Documents](/learn/rag/chunking-strategies-for-documents) first — this page assumes you know what fixed-size, recursive, and semantic chunking are and focuses on where each goes wrong in practice.

## The mistake: chunk larger than the embedding model's context window

People pick a chunk size — 1500 characters, 800 tokens, whatever a blog post recommended — without checking it against the actual limit of the embedding model they're using. Worse, they measure size in characters or words while the model counts in tokens, so a chunk that "looks like 500 words" can silently be 900+ tokens once code, punctuation-heavy text, or non-English content inflates the token count.

**Why it's wrong.** Embedding models don't error when you feed them too much text — most APIs and libraries just truncate to the max input length and embed whatever's left. See [Embeddings and Semantic Similarity](/learn/rag/embeddings-and-semantic-similarity) for what that vector actually represents. If your model caps at, say, 512 tokens and your chunk is 900, the back half of that chunk was never seen by the model at all. It exists in your text store, gets shown to the LLM at generation time, but contributed nothing to the vector that determined whether this chunk got retrieved in the first place.

**Symptom.** You have a document that clearly discusses topic X — it's right there in the stored text — but a query about X never surfaces that chunk. You check the embedding and realize topic X lives in token 600 of a 900-token chunk that got truncated at 512. Nothing in your logs flags this; the pipeline runs clean end to end.

**Fix.** Tokenize with the exact tokenizer your embedding model uses (not `len(text.split())`, not character count) and set your chunk size comfortably under the model's real limit, leaving headroom for special tokens. Add an assertion in your ingestion pipeline that hard-fails (or at minimum logs loudly) if any chunk's token count exceeds the limit before it's sent to the embedding call — don't let the API's silent truncation be your only line of defense. If your content genuinely needs longer chunks, choose an embedding model with a context window that comfortably covers them rather than fighting the mismatch downstream.

## The mistake: treating overlap as a substitute for real context

Someone sets `chunk_overlap` to 10–20% of `chunk_size` and considers the "context gets cut off at boundaries" problem solved, since the text near a boundary now appears in two chunks instead of one.

**Why it's wrong.** Overlap only helps when the missing context sits within that narrow window on either side of the cut. It does nothing when the referent is further away — a chunk that reads "It costs $49/month and includes 3 seats" has no idea what "it" is once separated from the heading two paragraphs up, and a 50-token overlap doesn't reach back that far. Overlap also doesn't restore *document identity*: a chunk can be geometrically self-contained and still be semantically orphaned, because nothing in the text says which product, section, or policy it belongs to. Meanwhile you're paying to embed and store the same text twice for a benefit that only applies to boundary-adjacent context.

**Symptom.** Retrieved chunks are full of ungrounded pronouns and fragments — "it," "this feature," "the table above" — that mean nothing without the section they came from. The LLM either guesses at what they refer to (and is sometimes wrong in a way that sounds confident) or hedges vaguely. Cranking overlap up further doesn't fix this because the problem was never distance, it was missing identity.

**Fix.** Give each chunk context that travels with it regardless of physical adjacency: prepend the section heading, document title, or a short breadcrumb ("Pricing > Enterprise tier") to the chunk text before embedding. For a more thorough version of this, look at [contextual retrieval](/learn/rag/contextual-retrieval), where an LLM generates a short situating summary for each chunk relative to the full document before it's embedded — that solves the identity problem overlap was never designed to solve. If the real issue is that answers need surrounding sections at generation time (not just at retrieval time), [parent document retrieval](/learn/rag/parent-document-retrieval) — matching on small chunks but passing the larger parent section to the LLM — is often a better lever than tuning overlap at all.

## The mistake: splitting tables, code, or lists mid-structure

A generic recursive character or token splitter doesn't know what a markdown table, a fenced code block, or a numbered list is — it just counts toward a target size and cuts wherever that count is reached. So a 12-row table gets split after row 7, with no header row in the second chunk; a function gets split mid-body; a "5 reasons to do X" list gets split between reason 3 and reason 4.

**Why it's wrong.** These structures encode meaning through position, not just content. A table row's numbers are meaningless without the header row that names the columns. A half-function is syntactically broken and, if you're doing anything code-related downstream, misleading rather than just incomplete. A list item like "the fourth reason" or "as noted above" depends on siblings that are now in a different chunk with a different embedding, retrieved (if at all) independently and without the relationship intact.

**Symptom.** When you inspect your chunks directly, you'll see orphaned table rows with no column headers, code chunks that open mid-function, or list fragments that reference items that aren't there. When one of these gets retrieved, the LLM either can't answer a structured question correctly (wrong column, wrong item) or fabricates plausible-looking headers/context to paper over the gap.

**Fix.** Use a structure-aware splitter that treats a table, fenced code block, or list as an atomic unit it won't cut inside — even if that means the chunk runs over your nominal target size. Set a hard maximum instead of a soft target for these cases: better one oversized-but-intact table chunk than two broken ones. For code specifically, split along function/class boundaries (AST-aware, not character-count-aware) rather than mid-body. For long tables that must split, repeat the header row into every resulting chunk, or better, convert rows into self-describing records (`"Plan: Enterprise, Price: $49/mo, Seats: 3"`) so each row survives independently.

## The mistake: one chunk size for a mixed corpus

A pipeline settles on a single configuration — say 500 tokens, 50 overlap — and applies it to everything: API docs, marketing copy, legal text, FAQs, changelogs, code comments, all through the same splitter with the same numbers because configuring per-source is more work.

**Why it's wrong.** Different content carries meaning at different granularities. A FAQ entry is already a complete unit at 2–3 sentences — forcing it into a 500-token window pulls in unrelated neighboring questions and dilutes the embedding. A legal clause often only makes sense with adjacent clauses and wants a larger, structurally-bounded chunk. Dense reference tables need the row/record treatment from the previous section, not prose-style splitting. A single setting is a compromise that's mediocre for all of these at once rather than good for any of them — [Chunking Strategies Compared](/learn/rag/chunking-strategies-compared) walks through why different strategies suit different content shapes.

**Symptom.** Your retrieval quality varies sharply by content type when you look at it broken down — strong on prose sections, weak on tables or FAQs — and when you retune chunk size to fix the weak category, you visibly regress the category that was working. Aggregate metrics can mask this entirely, which is exactly the problem.

**Fix.** Chunk per content type or per source collection, not globally. Detect or tag document type at ingestion and route each type to a strategy suited to it — record-based for FAQs and tables, structure-aware for code, larger semantic chunks for narrative or legal text. Treat chunk size as a per-source config value, not a pipeline-wide constant. When you evaluate, look at [per-type slices of your eval set](/learn/rag/evaluating-rag-quality), not just one aggregate score — that's the only way this failure mode becomes visible before it becomes a support ticket.

## The mistake: forgetting that retrieval returns the chunk, not the document

Teams design the rest of the pipeline — prompts, top_k, expectations about what the model "knows" — as if once a document is indexed, the LLM has effectively read the whole thing. In reality, the retriever hands back whichever isolated 200–800 token fragments scored highest, nothing more.

**Why it's wrong.** If a correct answer requires synthesizing three sections of a document and those sections landed in three separate chunks, your retriever has to happen to surface all three within `top_k` for the LLM to have a shot at a complete answer — and nothing about vector similarity guarantees that the chunks that jointly answer a question all individually score high on it. A chunk can also be retrieved with zero signal about which document or section it came from unless you explicitly attached that metadata.

**Symptom.** The model gives confidently incomplete or wrong answers to questions the source material genuinely does answer in full — just not within the chunk(s) that got retrieved. This shows up worst on broad or "summarize this document" style questions, which need multiple chunks assembled coherently, versus narrow factual questions, which need only one — and teams often only test the easy case.

**Fix.** Design for this rather than hoping a bigger `top_k` papers over it. Attach document and section metadata to every chunk so you can group and reason about provenance at retrieval time. For queries that plausibly need multi-section synthesis, over-fetch and use [reranking](/learn/rag/reranking-retrieved-results) or [parent document retrieval](/learn/rag/parent-document-retrieval) to assemble a coherent context rather than trusting raw top-k similarity. Build synthesis-style questions into your eval set alongside single-fact lookups — a pipeline that scores well only on narrow factual queries hasn't been tested against the failure mode that actually reaches users.

## Pre-flight checklist

- Measure chunk size with the embedding model's real tokenizer, not character or word count, and confirm it against the model's documented max input.
- Add a hard check that rejects (or loudly logs) any chunk exceeding that limit before the embedding call — don't rely on silent API truncation as your safety net.
- Don't let overlap stand in for context: prepend a heading, title, or short situating summary to each chunk so it carries its own identity.
- Never let a generic splitter cut inside a table, code block, or list — treat those as atomic units with their own (higher) size ceiling, and repeat headers when a table must split.
- Chunk per content type, not globally — one config for prose, FAQs, tables, and code is a compromise against all of them.
- Attach document/section metadata to every chunk so retrieval and generation aren't blind to where a chunk came from.
- Re-check all of the above whenever you swap embedding models — context limits and tokenization are model-specific and don't carry over.
- Test with questions that require assembling multiple chunks, not only single-fact lookups — that's where "retrieval returns the chunk, not the doc" actually bites.

**Related:** [Chunking Strategies for Documents](/learn/rag/chunking-strategies-for-documents) · [Chunking Strategies Compared](/learn/rag/chunking-strategies-compared) · [Contextual Retrieval](/learn/rag/contextual-retrieval) · [Parent Document Retrieval](/learn/rag/parent-document-retrieval) · [Embeddings and Semantic Similarity](/learn/rag/embeddings-and-semantic-similarity) · [Evaluating RAG Quality](/learn/rag/evaluating-rag-quality)
