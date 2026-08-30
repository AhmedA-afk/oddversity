---
title: "Build retrieval from corpus to ranked context"
track: "rag"
status: live
summary: "Retrieval-augmented generation (RAG) first turns documents into searchable units, retrieves candidates for a question, and gives selected context."
duration: "3 min read"
---

## The short answer

Retrieval-augmented generation (RAG) first turns documents into searchable units, retrieves candidates for a question, and gives selected context to a generator. Quality depends on the entire pipeline: parsing, chunk boundaries, metadata, search, ranking, freshness, and answer verification—not only on the embedding model.

## The pipeline

```text
source -> parse -> clean -> chunk -> index -> retrieve -> rerank/select -> answer
```

Store document identity, section, timestamp, permissions, and source location
alongside every chunk. Retrieval without provenance is hard to trust.

## Four examples

### Example A: policy section

Chunk by heading and preserve the heading in metadata. A question about refunds
should retrieve the refund rule with its exceptions.

### Example B: code documentation

Keep a function signature with its parameter descriptions. Splitting those apart
can retrieve a name without the behavior it needs.

### Boundary case: table

A row split from its column headers loses meaning. Represent the header, row, and
source location together or use a table-aware representation.

### Counterexample: fixed-size everything

Equal character windows are easy to implement but can cut lists, definitions, and
procedures at arbitrary points. Compare a structure-aware strategy.

## An illustrative story

A knowledge assistant had good retrieval scores on isolated sentences but weak
answers. Review showed that the best chunks had lost section titles and document
dates. The fix was metadata and chunk boundaries, not a bigger generator.

## Two ways to see it

### Retrieval view

Measure whether the needed evidence appears in the candidate set and in a useful
rank.

### Answer view

Measure whether the final answer uses only supported evidence and handles missing
evidence honestly.

## Hands-on

Create a ten-document corpus with headings, a table, a duplicate, and one stale
version. Implement two chunking strategies, retrieve the top candidates for five
questions, and inspect both hits and misses.

## Checkpoint

- [ ] Chunks retain source identity and permissions.
- [ ] Chunking is compared on structured and unstructured content.
- [ ] Retrieval misses and stale hits are visible.

## What this does not solve

Retrieval cannot make a missing or contradictory source authoritative. It can only
surface what the corpus and index represent.

## Continue, go deeper, apply it

- Continue: Grounding, citations, and context budgets
- Go deeper: Embeddings and representations
- Apply it: publish a retrieval report with five questions and the supporting chunks.
