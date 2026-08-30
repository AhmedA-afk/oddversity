---
title: "Chunk, Extract, Merge"
track: "structured-outputs"
status: live
summary: "A runnable chunk-overlap-extract-merge pipeline, including the dedup step that collapses two overlapping partial extractions into one."
duration: "9 min read"
---

This builds the machinery [Strategies for Long Documents](/learn/structured-outputs/long-document-extraction-strategies) describes in the abstract: split a document with overlap, extract into a partial schema per chunk, then merge the partials — including the dedup step that keeps overlap from turning into duplicate output.

## What we're building

A pipeline that takes a long text document and a `requirements[]` schema — each requirement is just `{text, source_chunk}` — and produces one deduplicated list, even though the document gets cut into overlapping chunks that will independently extract the same requirement more than once near a boundary.

## Setup

Everything here runs with the standard library plus `pydantic` for the schema — no API key needed to follow along, since the extraction step is stubbed with a deterministic function. A note in step 2 shows where a real model call goes.

```bash
pip install pydantic
```

```python
from difflib import SequenceMatcher
from pydantic import BaseModel

class Requirement(BaseModel):
    text: str
    source_chunk: int
```

## Build it

### 1. Split the document with overlap

```python
def chunk_text(text: str, size: int = 800, overlap: int = 150) -> list[str]:
    if overlap >= size:
        raise ValueError("overlap must be smaller than chunk size")
    chunks = []
    start = 0
    while start < len(text):
        end = start + size
        chunks.append(text[start:end])
        if end >= len(text):
            break
        start = end - overlap
    return chunks
```

> **Why this step?** `overlap` has to be smaller than `size` or the loop never advances. Sizing `overlap` is a judgment call tied to your content, not a constant — see the boundary-sizing guidance in [Strategies for Long Documents](/learn/structured-outputs/long-document-extraction-strategies): it needs to be at least as wide as the longest single requirement you expect, or a requirement can still fall entirely in the gap between two chunks' overlap.

### 2. Extract per chunk into the same partial schema

```python
def extract_chunk(chunk: str, chunk_id: int) -> list[Requirement]:
    """
    Stand-in for a model call. In production this sends `chunk` to the
    model with a schema like list[Requirement] and reads back the
    parsed result — see Forcing a Tool Call to Extract for the real
    request shape. Every field in the per-chunk schema should be
    optional / default-empty: a chunk with nothing relevant should
    return [], not a forced guess.
    """
    return _stub_extract(chunk, chunk_id)
```

> **Why this step?** Keep the per-chunk schema forgiving. A chunk that happens to fall entirely inside one requirement's surrounding prose has nothing to extract, and a schema that demands at least one item per chunk will pressure the model into inventing one — see [Extraction Mistakes](/learn/structured-outputs/extraction-mistakes) on hallucinating values for absent fields.

### 3. Merge with deduplication

```python
def _similar(a: str, b: str, threshold: float = 0.85) -> bool:
    return SequenceMatcher(None, a, b).ratio() >= threshold

def merge_requirements(per_chunk: list[list[Requirement]]) -> list[Requirement]:
    merged: list[Requirement] = []
    for chunk_items in per_chunk:
        for item in chunk_items:
            match_idx = next(
                (i for i, existing in enumerate(merged)
                 if _similar(existing.text, item.text)),
                None,
            )
            if match_idx is None:
                merged.append(item)
            elif len(item.text) > len(merged[match_idx].text):
                # keep whichever extraction is more complete
                merged[match_idx] = item
    return merged
```

> **Why this step?** This is the actual conflict-resolution rule: when two extractions are near-duplicates (similarity above threshold), keep the longer one, on the assumption that a truncated boundary extraction is shorter than the complete version. It's a heuristic, not a proof — see Harden it below for where it needs backup.

### 4. Validate the merged result

```python
from pydantic import TypeAdapter
RequirementList = TypeAdapter(list[Requirement])

def run_pipeline(document: str) -> list[Requirement]:
    chunks = chunk_text(document)
    per_chunk = [extract_chunk(c, i) for i, c in enumerate(chunks)]
    merged = merge_requirements(per_chunk)
    return RequirementList.validate_python([r.model_dump() for r in merged])
```

## Run it

With a demo `_stub_extract` that simulates chunk 0 seeing a requirement whole and chunk 1 seeing the same requirement again because it falls in the overlap window:

```python
def _stub_extract(chunk, chunk_id):
    if chunk_id == 0:
        return [Requirement(text="The system must log all failed login attempts.", source_chunk=0)]
    if chunk_id == 1:
        return [Requirement(text="The system must log all failed login attempts.", source_chunk=1)]
    return []

result = run_pipeline("..." * 50)  # any text long enough to produce 2+ chunks
print(result)
# [Requirement(text='The system must log all failed login attempts.', source_chunk=0)]
```

Two chunks both extracted the requirement — it was fully inside the overlap window both times — and `merge_requirements` collapsed them to one entry instead of reporting a duplicate.

## Harden it

The length-based tiebreak in step 3 is a reasonable default, not a guarantee. Two independent readings of the *same* sentence should usually come back identical or near-identical, so "keep the longer one" typically also means "keep the more complete one" — but a model that paraphrases instead of transcribing can produce two different-length extractions of two genuinely *different* requirements that happen to score above your similarity threshold. Lower the threshold cautiously, log every merge decision with both original texts attached, and route anything the merge step had to arbitrate — not just anything that failed validation — to spot-checking. See [Confidence and Review Routing](/learn/structured-outputs/extraction-confidence-and-review-routing) for turning "the merge step was uncertain" into an actual review queue, and [Schema Design for Reliability](/learn/structured-outputs/schema-design-for-reliability) for keeping the per-chunk schema itself forgiving enough that this stays a rare case.

## Extend it

This exact machinery — chunk with overlap, extract per chunk, merge with a similarity-based dedup — is what [Extracting Clauses from a 40-Page Contract](/learn/structured-outputs/contract-clause-extraction-example) runs on a real document, with `page` added to the schema so the merge step can also use page adjacency as a signal. For row-shaped data (a table instead of a list of free-text items), see [Extracting Tables Reliably](/learn/structured-outputs/multi-field-tables-from-documents) — the merge logic changes shape because rows have a natural join key that free text doesn't.

**Related:** [Strategies for Long Documents](/learn/structured-outputs/long-document-extraction-strategies), [Extracting Clauses from a 40-Page Contract](/learn/structured-outputs/contract-clause-extraction-example), [Extraction Mistakes](/learn/structured-outputs/extraction-mistakes), [Schema Design for Reliability](/learn/structured-outputs/schema-design-for-reliability), [Confidence and Review Routing](/learn/structured-outputs/extraction-confidence-and-review-routing)
