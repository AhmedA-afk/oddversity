---
title: "Extraction Pipeline Cheatsheet"
track: "structured-outputs"
status: live
summary: "The build order for standing up an extraction pipeline, with a default to start from at each step."
duration: "5 min read"
---

Seven decisions, in the order you actually have to make them, each with a default to start from and measure against.

## The build order

1. **Choose the schema** — model the fields the document actually presents.
2. **Choose the mechanism** — structured-output mode vs. a forced tool call.
3. **Chunk, if the document is long** — with overlap sized to your longest entity.
4. **Write merge rules** — for whatever the chunking step is going to duplicate.
5. **Ground each field** — attach a page, span, or source-text pointer.
6. **Validate** — shape first, then cross-field/domain checks.
7. **Route low-confidence output** — to a review queue, not to production.

## 1. Choose the schema — start here, then measure

Default: match the document's own structure, not your downstream database's. Every field nullable unless the document guarantees it's always present. See [Extraction Is Schema-Filling](/learn/structured-outputs/extraction-as-a-structured-output-problem).

```
# Start here: mirror the source
{merchant, date, items: [{description, qty, unit_price, line_total}], subtotal, tax, total}
# Not: {total_owed}  — collapses fields you need for cross-checks
```

## 2. Choose the mechanism

| Mechanism | Use when |
|---|---|
| Structured-output / JSON-mode | It's available for your provider and model — default choice, strongest conformance guarantees. |
| Forced tool call | Your codebase already has tool-calling plumbing, or you need tool choice to act as a router between several possible schemas. |

Start with structured-output mode; reach for [Tool Calling as an Extraction Mechanism](/learn/structured-outputs/tool-and-function-schemas-for-extraction) only when it doesn't cover what you need.

## 3. Chunk if long — start here, then measure

Default overlap: the length of your longest expected entity (clause, requirement, table row group), not a round token count. See [Strategies for Long Documents](/learn/structured-outputs/long-document-extraction-strategies).

```python
# Start here
OVERLAP = longest_expected_entity_length * 1.2   # 20% margin
# Then measure: widen only if boundary-split entities still show up in review
```

## 4. Merge rules — quick table

| Field shape | Merge rule |
|---|---|
| Scalar (date, total) | First non-null value; flag if two chunks disagree. |
| Array with a natural key (ID, `type`+page) | Join on the key; keep the more complete entry. |
| Array of free text, no key | Fuzzy-similarity dedup (`difflib` ratio ≥ ~0.85 to start); keep the longer match. |
| Table rows | Join on row-identifying fields (date + description); overlap one row across page seams. |

Full implementation: [Chunk, Extract, Merge](/learn/structured-outputs/chunk-and-merge-extraction).

## 5. Ground each field

Default: a `page` (or chunk index) on every extracted record; add `source_text` or a bounding region only where the input modality actually supports it and the stakes justify the extra field. See [Grounding Extractions in the Source](/learn/structured-outputs/grounding-and-citations-in-extraction).

```json
{"value": 47.20, "page": 1, "source_text": "TOTAL   47.20"}
```

## 6. Validate — two layers, not one

```
Layer 1 (shape):     does it parse against the schema?
Layer 2 (semantic):  do the fields agree with each other?
                      (sums reconcile, running balances hold,
                       dates fall in range, page numbers exist)
```

Layer 1 alone is not enough — see [Extraction Mistakes](/learn/structured-outputs/extraction-mistakes): "treating schema-valid as correct" is the mistake underneath most of the others.

## 7. Route low-confidence output — start here, then measure

Default tiering, cheapest to build first:

```python
def tier(warnings, had_repair):
    if warnings: return "low"       # any failed cross-field check → review
    if had_repair: return "medium"  # needed auto-repair → spot-check sample
    return "high"                   # clean shape, clean cross-checks → auto-accept
```

Start by routing every "low" tier to review and sampling "medium." Tune the threshold only after you can estimate the cost of a false accept versus the cost of a review for your pipeline — see the threshold sweep in [Confidence and Review Routing](/learn/structured-outputs/extraction-confidence-and-review-routing).

## At a glance

```
schema -> mechanism -> [chunk -> merge]* -> ground -> validate(shape, then semantic) -> route
                        ^ only if the document doesn't fit in one call
```

**Related:** [Extraction Is Schema-Filling](/learn/structured-outputs/extraction-as-a-structured-output-problem), [Strategies for Long Documents](/learn/structured-outputs/long-document-extraction-strategies), [Tool Calling as an Extraction Mechanism](/learn/structured-outputs/tool-and-function-schemas-for-extraction), [Grounding Extractions in the Source](/learn/structured-outputs/grounding-and-citations-in-extraction), [Confidence and Review Routing](/learn/structured-outputs/extraction-confidence-and-review-routing), [Extraction Mistakes](/learn/structured-outputs/extraction-mistakes)
