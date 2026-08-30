---
title: "Tool Output Deduplication"
track: "context-engineering"
status: live
summary: "The mechanics of catching exact and near-duplicate tool results before they double-pay for the same information."
duration: "8 min read"
---

[Tool Output Deduplication](/learn/context-engineering/tool-output-deduplication) covers why duplicates are expensive and sketches the fix. This is the deferred rigor underneath it: how exact-match and near-duplicate detection actually work, where each one fails, and what they cost to run. Treat it as optional depth — read the overview first if you haven't.

## Two different problems wearing one name

"Deduplication" gets used for two mechanically different tasks, and conflating them is the most common reason a dedup pass either misses obvious repeats or wrongly collapses distinct content:

- **Exact duplication**: the same content, byte for byte (or near enough after trivial normalization), returned more than once. A file read twice with no change in between. A search re-run with identical arguments.
- **Near duplication**: content that overlaps substantially but isn't identical — a file re-read with a wider line range, a paginated list where the cursor skipped backward, a search whose results shift slightly because the underlying index changed between calls.

Exact duplication is solvable with hashing and zero false positives. Near duplication requires a similarity judgment, which means choosing a threshold, which means accepting some false positives and false negatives. Knowing which case you're in changes which tool you reach for.

## Exact-duplicate detection: normalize, then hash

Byte-for-byte comparison sounds like it should need no cleverness, but raw tool output rarely repeats byte-for-byte even when it's semantically identical. A JSON object serialized twice can differ in key order; a text blob can differ in trailing whitespace or a re-fetched "generated at" field that has nothing to do with the content itself. Hash the raw bytes and near-identical results will get treated as new every time.

The fix is to normalize before hashing:

```python
import hashlib
import json
import re

def normalize_text(s: str) -> str:
    return re.sub(r"\s+", " ", s.strip().lower())

def normalize_json(obj) -> str:
    # Canonical form: sorted keys, fixed separators - two calls that return
    # the same data in a different key order now hash identically.
    return json.dumps(obj, sort_keys=True, separators=(",", ":"))

def content_hash(normalized: str) -> str:
    return hashlib.sha256(normalized.encode("utf-8")).hexdigest()
```

What normalization should and shouldn't touch is a judgment call specific to the tool: stripping whitespace and casing is almost always safe for prose; sorting JSON keys is safe for data where key order carries no meaning; but you should *not* normalize away a field that's part of the actual content (don't strip a timestamp that the user asked about). The rule of thumb: normalize formatting differences that are artifacts of serialization, never differences that are part of what was asked.

## Near-duplicate detection: pick a similarity measure that matches the shape

Once content isn't byte-identical, "is this the same information again?" becomes a spectrum, not a boolean. Three approaches, in order of cost:

1. **Row/key-level identity** — for structured, tabular results (rows from an API, records from a database), don't compare blobs of text at all. Compare a stable identifier per row. This turns a fuzzy similarity problem into an exact-match problem at a finer grain, and it's the right tool whenever the data has an ID.
2. **Sequence similarity** — for free text where no natural key exists (a re-read file, a paraphrased search snippet), something like Python's `difflib.SequenceMatcher` or a Jaccard similarity over shingled n-grams gives a cheap overlap ratio without needing embeddings.
3. **Embedding similarity** — for content where wording varies but meaning doesn't (two search results phrasing the same fact differently), cosine similarity over embeddings catches overlap that sequence-matching would miss, at the cost of an embedding call per candidate.

Reach for (1) whenever the data is structured — it's exact, cheap, and has no threshold to tune. Reach for (2) before (3): it's free, and for the common case (the same source re-read at a different offset) it's plenty accurate. Save (3) for cases where near-duplicate content is genuinely paraphrased rather than literally overlapping text.

## Worked case: three paginated calls, one set of unique rows

An agent lists customer records through a paginated API. The pagination cursor has an off-by-one bug, so consecutive pages overlap instead of partitioning cleanly:

```
Call 1 -> page=1 -> returns ids 1-50
Call 2 -> page=2 -> returns ids 26-75   (should have started at 51)
Call 3 -> page=3 -> returns ids 51-100
```

Concatenated naively, that's 150 rows injected into context for what is actually 100 unique customers — a 50% overhead, and if each row averages 40 tokens, that's 2,000 wasted tokens on data the model has already seen twice. Because the rows carry a stable `id` field, this is case (1) above — no similarity computation needed, just a set:

```python
def dedupe_by_key(rows: list[dict], key_field: str, seen: set) -> list[dict]:
    unique = []
    for row in rows:
        key = row[key_field]
        if key in seen:
            continue
        seen.add(key)
        unique.append(row)
    return unique

seen_ids = set()
final_rows = []
for page in (call_1, call_2, call_3):
    final_rows.extend(dedupe_by_key(page, "id", seen_ids))

# len(final_rows) == 100, not 150 - full coverage, no repeats
```

The result injected into context is exactly the 100 unique rows the calls actually discovered — every id that appeared is still present, and nothing appears twice. Coverage is preserved; only the redundancy is gone. This is the same principle [Deduping Overlapping Tool Results](/learn/context-engineering/deduping-overlapping-tool-results) builds into a reusable pass wired into an agent loop, with normalization and free-text near-dup checks added around this row-level core.

## What this costs, and where it stops paying off

Exact-hash dedup is O(1) per check against a hash set — it scales to however many results an agent loop can realistically accumulate, with no meaningful cost. Row-key dedup is the same. Sequence-similarity near-dup checking is where cost starts to matter: naively comparing every new result against every previously seen result is O(n²) in the number of results held in the registry. For an agent session with a few dozen tool calls this is invisible; for one with hundreds of calls (a long-running research or crawling agent) it becomes worth bucketing candidates first — by tool name, by source, by a cheap prefix hash — so similarity is only computed within a plausible bucket rather than against the entire history.

## The tradeoff that matters

Aggressive near-duplicate collapsing can hide a genuine change: a file re-read because it was edited since the last read is *not* a duplicate, even though most of its content overlaps with what's already in context, and treating it as one silently feeds the model stale information. The safe default is asymmetric: dedupe on exact hashes with no hesitation — that's never wrong — and treat same-source, same-query near-duplicates as a *replace* (keep the freshest version, drop the reference to the old one) rather than a silent discard. Never apply near-duplicate collapsing across different tools or different queries; overlap there is often coincidental, not redundant, and that's exactly the situation [Merging Context From Many Sources](/learn/context-engineering/merging-multi-source-context) is built to handle instead.

**Related:** [Tool Output Deduplication](/learn/context-engineering/tool-output-deduplication) · [Tool Output Is Context Too](/learn/context-engineering/tool-output-is-context-too) · [Deduping Overlapping Tool Results](/learn/context-engineering/deduping-overlapping-tool-results) · [Context Rot](/learn/context-engineering/context-rot) · [Relevance Filtering](/learn/context-engineering/relevance-filtering)
