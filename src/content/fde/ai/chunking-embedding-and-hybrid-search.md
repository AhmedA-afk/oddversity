---
title: Chunking, embeddings and hybrid search
phase: ai
module: retrieval-with-permissions
kind: lesson
summary: "Chunking decides what your retrieval system can possibly find. Hybrid search fixes the specific way pure vector similarity fails on enterprise documents: it is bad at exact strings, and exact strings are most of what enterprise users actually search for."
duration: 13 min
updated: "2026-09-02"
outcomes:
  - Choose a chunking strategy appropriate to a document's structure, not a fixed default.
  - Explain why vector search alone misses exact-match queries, and design a hybrid retriever that does not.
  - Add a reranking step and explain what it corrects that retrieval alone cannot.
artifact: A working chunker and hybrid retriever over a small sample document set, with at least one exact-match query proven to succeed only because of the keyword half of the search.
---

Two decisions determine most of a RAG system's quality before a single model call happens: how you cut documents into chunks, and how you search across them. Get both wrong and no amount of prompt engineering downstream will fix it, because the model can only work with what retrieval hands it.

## Chunking is a structure-preservation problem, not a size problem

The naive approach — split every document into fixed-size windows, say 500 tokens with some overlap — treats every document as an undifferentiated stream of text. Enterprise documents are not that. A policy document has headers that scope what follows. A financial report has tables where a row means nothing without its column headers. A contract has numbered clauses where clause 4.2 explicitly modifies clause 4.1. Fixed-size chunking cuts through all of that structure indifferently.

Better defaults, in order of how much structure they preserve:

- **Structure-aware chunking.** Split on the document's own boundaries — headers, sections, list items, table boundaries — so a chunk is a complete unit of meaning: one full clause, one full table with its headers repeated, one full policy section. This requires actually parsing the document format rather than treating it as a text blob, which is more work up front and pays for itself every time a query lands near a boundary.
- **Semantic chunking.** Where structure is weak or absent — a transcript, a long unstructured email thread — split where the topic actually shifts, using embedding similarity between adjacent sentences to find natural breakpoints, rather than a fixed token count that might land mid-thought.
- **Fixed-size with overlap**, as a fallback for genuinely unstructured text, or as a first pass before you have built anything better. The overlap (chunks sharing their last few sentences with the next chunk) reduces, but does not eliminate, the boundary-cutting problem.

For a table specifically: repeat the header row inside every chunk derived from that table. A chunk containing only data rows with no header is retrievable but useless, because neither the retriever nor the model downstream can tell what the numbers mean without the column labels sitting next to them.

```python
def chunk_by_structure(doc: ParsedDocument) -> list[Chunk]:
    chunks = []
    for section in doc.sections:
        if section.is_table:
            for row_group in section.rows_in_groups_of(20):
                chunks.append(Chunk(
                    text=f"{section.header_row}\n{row_group}",
                    metadata={"section": section.title, "type": "table"},
                ))
        else:
            chunks.append(Chunk(text=section.full_text, metadata={"section": section.title}))
    return chunks
```

## Why vector search alone misses what users actually type

An embedding model represents a chunk of text as a vector capturing its meaning, and retrieval ranks chunks by how close their vector is to the query's vector. This is genuinely good at conceptual matching — a query about "termination for cause" will find a chunk discussing "grounds for dismissal" even without shared words. It is genuinely bad at exact-string matching — a query containing a specific policy number, an account ID, a part number, or a person's name often fails to retrieve the one chunk containing that exact string, because embedding similarity was never optimised to weight rare, exact tokens heavily.

This matters because enterprise search queries are disproportionately exact-match: "what does policy HR-4471 say", not "tell me about disciplinary procedures in general". A retrieval system tuned only for semantic similarity will systematically underperform on precisely the queries a customer's staff actually type.

## Hybrid search: run both, combine the results

Hybrid search runs a keyword-based retriever — classically BM25, a well-established ranking algorithm built for exact and near-exact term matching — alongside the vector retriever, and combines their results.

```python
def hybrid_search(query: str, top_k: int = 10) -> list[Chunk]:
    vector_hits = vector_index.search(embed(query), top_k=top_k * 2)
    keyword_hits = bm25_index.search(query, top_k=top_k * 2)
    combined = reciprocal_rank_fusion(vector_hits, keyword_hits)
    return combined[:top_k]
```

Reciprocal rank fusion is a simple, well-tested way to combine two ranked lists without needing to calibrate their scores against each other directly — it weights a document by its rank position in each list rather than trying to compare a BM25 score to a cosine similarity, which are not on the same scale to begin with. The result is a retriever that catches both "policy HR-4471" (keyword) and "what happens if someone is dismissed for cause" (vector) reliably, where either retriever alone would miss one of the two.

## Reranking: a second pass that fixes what retrieval's speed sacrificed

Both vector and keyword retrieval are built for speed across a large index, which means they use relatively cheap similarity measures to narrow millions of chunks down to a shortlist quickly. A reranker takes that shortlist — the top twenty or so candidates from hybrid search — and scores each one against the query with a more expensive, more accurate model that can afford to look closely because it is only scoring twenty items, not the whole index. This routinely reorders the shortlist meaningfully: a chunk that ranked eighth on cheap similarity but is actually the best answer often moves to first once a more careful model looks at it directly.

Add reranking after hybrid search is working, not before — it is a precision improvement on top of a retriever that is already finding reasonable candidates, not a fix for a retriever that is not.

## The FDE angle

When a RAG demo fails on a specific query — "why didn't it find the policy about X" — the fastest diagnosis is not to re-prompt the model. It is to check, in order: did the chunk containing the answer exist at all after chunking (a structure problem), did retrieval surface it in the shortlist (a search problem), and did reranking or the model itself then ignore it (a generation problem, covered in the previous lesson on how models actually answer). Most field debugging sessions resolve at the first or second step, and being able to say "the chunk was never retrieved, here's why" in front of a customer's engineer is worth more than another round of prompt tuning.

## What you should be able to do now

Given a document set, you should be able to choose a chunking strategy from its structure rather than a default, explain out loud why pure vector search will miss a specific exact-match query, and add reranking to explain what it improves that retrieval alone left on the table.

Build the artifact now: a structure-aware chunker and a hybrid retriever over a small sample corpus, with one deliberately constructed exact-match query — a policy number, an ID — that you can show succeeds only because the keyword half of the hybrid search caught it.
