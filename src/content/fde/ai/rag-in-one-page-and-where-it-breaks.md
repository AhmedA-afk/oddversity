---
title: "RAG in one page, and where it breaks"
phase: ai
module: retrieval-with-permissions
kind: lesson
summary: "Retrieval-augmented generation is four steps and a well-known set of failure modes. Learn the shape once, then spend your attention on the ways it breaks in an actual enterprise document set, because that is where the engagement happens."
duration: 12 min
updated: "2026-09-02"
outcomes:
  - Describe the four steps of a RAG pipeline without reaching for a diagram.
  - Name at least five specific ways RAG fails on real enterprise documents, and which step each failure traces back to.
  - Decide, for a given document set, whether RAG is even the right first move before building anything.
artifact: A one-page failure-mode checklist you will run against every RAG build in this path and in the field.
sources:
  - https://www.zenml.io/llmops-database/forward-deployed-engineering-bringing-enterprise-llm-applications-to-production
  - https://www.tryexponent.com/blog/forward-deployed-engineer-interview-the-definitive-2026-guide-fde
---

RAG has become the default answer to "the customer wants the model to know about their documents", and it is often right. It is also over-prescribed, badly built more often than any other pattern in this path, and the thing most take-home interviews test precisely because it looks simple and is not. This lesson is the one page you need before you build it, and the failure catalogue you will keep referring back to after.

## The four steps

Strip away the tooling and RAG is: **chunk** your documents into pieces small enough to be individually retrievable, **embed** each chunk into a vector that captures its meaning, **retrieve** the chunks most relevant to a given query by comparing the query's embedding against the stored ones, and **generate** an answer by putting the retrieved chunks into the model's context alongside the question. That is the whole pattern. Everything else — reranking, hybrid search, permission filtering, query rewriting — is a refinement bolted onto one of those four steps because the naive version of that step breaks on real data.

The canonical enterprise case is Morgan Stanley's research-access deployment: retrieval over the firm's wealth-management research corpus so every advisor could ask a question in plain language and get back the relevant analyst reports. The technical pipeline took six to eight weeks. Reaching the accuracy bar a regulated financial-services use case actually requires took roughly four more months of pilots and evaluation rigour — a ratio worth remembering before you promise a RAG system's timeline based on how fast the four steps above are to code.

## Where each step breaks

**Chunking breaks structure.** A fixed-size chunker that splits every 500 tokens will happily cut a table in half, separate a clause from the exception that governs it two paragraphs later, or split a numbered list mid-item. The next lesson in this module covers chunking strategies in depth; the failure to hold in mind here is that naive chunking is often the single largest source of a RAG system's wrong answers, and it looks like a retrieval problem or a model problem until you actually read the chunk that got retrieved.

**Retrieval optimises for the wrong kind of similarity.** Vector search finds chunks that are semantically similar to the query, which is not the same as finding the chunk that actually answers it. A question containing an exact policy number, part number, or account ID often retrieves chunks that are topically related but miss the one chunk containing that exact string, because embedding similarity is weak at exact-match tasks. This is the core argument for hybrid search, covered next.

**The index goes stale.** A policy document gets updated and the index does not, silently, until someone notices the system citing a superseded clause. Enterprise documents change on someone else's schedule, not yours, and a RAG system with no re-indexing plan is correct on day one and wrong by an unknown date afterward.

**Permissions get checked in the wrong order, or not at all.** Retrieval that ranks across every document regardless of who is asking, then optionally filters afterward, is not just less accurate — it can leak the existence or content of a restricted document to someone who should never see it. This failure is common enough, and consequential enough, that it gets its own lesson later in this module.

**Retrieval succeeds and the model still gets it wrong.** Even with the right chunk in context, a model can misread a table, conflate two similar-looking clauses, or answer confidently from its own training knowledge instead of the retrieved text when the two conflict. This is why RAG needs the same eval discipline as everything else in this phase — a labelled set of real questions with the answers a domain expert would give, scored specifically on whether the system used the retrieved content correctly, not just whether retrieval ran.

**No citation, no trust.** In a regulated setting, an answer without a traceable source is worth less than a slower answer with one. An OpenAI take-home exercise used for candidate evaluation is explicitly built around semantic search over a product catalogue the model can query — and what separates a passing answer from a failing one in that exercise is not whether retrieval works, but whether the system can show its work.

## The question to ask before you build anything

Not every "make the model know about our documents" request is a RAG problem. If the corpus is small enough to fit entirely in a model's context window and does not change often, stuffing the whole thing into context on every call can be simpler and more accurate than building a retrieval pipeline at all — you eliminate the entire failure surface above at the cost of a larger context bill, a tradeoff worth stating plainly rather than defaulting to RAG because it is the familiar pattern. If the corpus is large, changes frequently, or needs per-user permission filtering, RAG earns its complexity. Ask which situation you are actually in before writing the first chunker.

## The FDE angle

When a stakeholder says "just point it at our SharePoint", the honest response walks through this page out loud: how big is the corpus, how often does it change, who is allowed to see what within it, and what would "wrong" cost if it happened. Those four questions determine whether you are looking at a six-week build or a project that needs the same eval-first discipline as the Morgan Stanley engagement, and saying so on day one is worth more than a fast demo that cannot survive its own regulatory review.

## What you should be able to do now

Given a description of a document corpus and a use case, you should be able to name which of the failure modes above are most likely to bite first, and decide out loud whether RAG is even the right first move.

Build the artifact now: a one-page checklist covering chunking, exact-match retrieval, staleness, permissions, model misreading, and citation — one line each, one question each — that you will run against every RAG system you build for the rest of this path, starting with the lab at the end of this module.
