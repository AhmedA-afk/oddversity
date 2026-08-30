---
title: "Extracting Clauses from a 40-Page Contract"
track: "structured-outputs"
status: live
summary: "A liability clause splits across a chunk boundary, and the merge step reunites it instead of filing two half-clauses."
duration: "8 min read"
---

Forty pages is well past what you want in one extraction call, so the contract gets chunked — and one clause lands right on a chunk boundary, extracted whole from one chunk and truncated from its neighbor.

## The setup

The document is a 40-page services agreement. The target schema is `clauses[]` of `{type, text, page}`. Pages are chunked into ~10-page windows with a 2-page overlap:

```
Chunk 1: pages  1–10
Chunk 2: pages  9–19
Chunk 3: pages 18–28
Chunk 4: pages 27–37
Chunk 5: pages 36–40
```

The clause in question, "Limitation of Liability," starts near the bottom of page 18 and ends on page 19 — squarely inside the overlap between chunk 2 (pages 9–19) and chunk 3 (pages 18–28).

## Step by step

### 1. Chunk with overlap sized to the longest expected clause

```python
PAGE_OVERLAP = 2  # chosen because the longest clause type in this
                   # contract family (indemnification) runs ~1.5 pages
```

> **Why this step?** Overlap has to be sized to content, not to a round number of pages — see [Strategies for Long Documents](/learn/structured-outputs/long-document-extraction-strategies). Two pages covers this contract's longest clause with margin; a shorter overlap would only move the failure to a different clause.

### 2. Extract per chunk into `clauses[]`

Each chunk gets the same request: read these pages, return every clause you can identify with its type, full text, and page number, leaving out anything you can't see completely.

### 3. Look at what each chunk actually returned

Chunk 2 (pages 9–19) — the clause is cut off because the chunk ends at page 19, mid-sentence:

```json
{"type": "limitation_of_liability", "page": 18,
 "text": "Neither party shall be liable for any indirect, incidental, special, or consequential damages arising out of or related to this Agreement, whether in contract, tort, or otherwise, except in cases of"}
```

Chunk 3 (pages 18–28) — the clause is fully inside this chunk's window, so it comes back complete:

```json
{"type": "limitation_of_liability", "page": 18,
 "text": "Neither party shall be liable for any indirect, incidental, special, or consequential damages arising out of or related to this Agreement, whether in contract, tort, or otherwise, except in cases of gross negligence or willful misconduct. Each party's total liability under this Agreement shall not exceed the fees paid in the twelve (12) months preceding the claim."}
```

> **Why this step?** Notice both entries agree on `type` and `page` — that's expected, since both chunks are looking at the same clause start. The only difference is completeness, which is exactly the signal the merge step needs.

### 4. Merge — recognize the prefix, keep the complete version

```python
def is_truncated_prefix(short: str, long: str, min_overlap: int = 40) -> bool:
    # a fragment is a truncation of the full clause if the full clause
    # starts with the fragment's text (allowing for the fragment ending
    # mid-sentence, so compare a leading window rather than exact prefix)
    window = short[:min_overlap]
    return window in long and len(long) > len(short)

def merge_clauses(clauses: list[dict]) -> list[dict]:
    merged: list[dict] = []
    for c in clauses:
        dup_idx = next(
            (i for i, m in enumerate(merged)
             if m["type"] == c["type"] and m["page"] == c["page"]),
            None,
        )
        if dup_idx is None:
            merged.append(c)
        elif is_truncated_prefix(merged[dup_idx]["text"], c["text"]):
            merged[dup_idx] = c  # replace fragment with the complete version
        elif is_truncated_prefix(c["text"], merged[dup_idx]["text"]):
            pass  # already have the complete version
    return merged
```

> **Why this step?** This is a narrower, more targeted version of the similarity-based merge in [Chunk, Extract, Merge](/learn/structured-outputs/chunk-and-merge-extraction). Contract clauses have a strong structural signal — `type` and starting `page` should match exactly for two extractions of the same clause — so the merge can key on that instead of a fuzzy similarity score, and only needs to decide *which* of two matches is the complete one.

### 5. The merged result

```json
{"type": "limitation_of_liability", "page": 18,
 "text": "Neither party shall be liable for any indirect, incidental, special, or consequential damages arising out of or related to this Agreement, whether in contract, tort, or otherwise, except in cases of gross negligence or willful misconduct. Each party's total liability under this Agreement shall not exceed the fees paid in the twelve (12) months preceding the claim."}
```

One entry, complete, instead of two fragments competing for a slot in `clauses[]`.

## Where it breaks (+fix)

This works because the overlap (2 pages) was wider than the clause (about 1.5 pages). A clause longer than your overlap — a 3-page arbitration and dispute-resolution clause, say, in a contract where you sized overlap for the *average* clause rather than the *longest* — will be truncated in every chunk it appears in, and there's no complete version anywhere to merge toward. The fix isn't unlimited overlap, which just multiplies cost and duplicate load; it's a windowed pass for this specific hazard, where the model is asked "does this clause appear complete, or does it look cut off at the chunk boundary?" and an incomplete clause carries an explicit `continues: true` flag forward so the next chunk's extraction can be asked to supply the remainder — the windowed-passes pattern from [Strategies for Long Documents](/learn/structured-outputs/long-document-extraction-strategies).

## Takeaways

- Size chunk overlap to your longest expected entity, not an average or a round token count — the boundary hazard doesn't care about your average case.
- When entities have a natural key (clause `type` + starting `page`), merge on that key instead of a fuzzy similarity score — it's more precise and cheaper to reason about.
- Overlap has a ceiling. Past it, reach for a windowed pass with explicit "this is incomplete" state instead of just widening the window further.

**Related:** [Chunk, Extract, Merge](/learn/structured-outputs/chunk-and-merge-extraction), [Strategies for Long Documents](/learn/structured-outputs/long-document-extraction-strategies), [Grounding Extractions in the Source](/learn/structured-outputs/grounding-and-citations-in-extraction), [Extraction Mistakes](/learn/structured-outputs/extraction-mistakes)
