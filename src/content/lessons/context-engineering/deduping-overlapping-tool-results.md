---
title: "Deduping Overlapping Tool Results"
track: "context-engineering"
status: live
summary: "Build a normalize-hash-similarity dedup pass and wire it into an agent loop so overlapping tool results stop double-billing the window."
duration: "9 min read"
---

Reading about deduplication and having a dedup pass actually running in your agent loop are different things. This builds the second one: a small, reusable module that sits between "a tool just returned something" and "that something enters context," and the wiring that puts it there on every tool call.

## What we're building

A `ToolResultDeduper` that an agent loop calls once per tool result, before appending anything to the message list. It does three things in order: normalize the result into a comparable form, check it against everything seen so far in this session (exact hash first, then near-duplicate similarity for free text, then key-based dedup for structured rows), and return either the original result or a short pointer back to where the model already saw it. The design goal from [Tool Output Is Context Too](/learn/context-engineering/tool-output-is-context-too) carries through here directly: trimming and deduping both have to happen at the boundary, not after the fact.

## Setup

Assume a standard agent loop: a list of messages, a loop that calls the model, executes whatever tool it asks for, and appends the tool result back in before calling the model again. No external dependencies beyond the standard library — `hashlib`, `json`, `re`, and `difflib`.

```python
import hashlib
import json
import re
from difflib import SequenceMatcher
```

## Build it

### Step 1: Normalize before comparing anything

```python
def normalize_text(s: str) -> str:
    return re.sub(r"\s+", " ", s.strip().lower())

def normalize_payload(raw) -> str:
    if isinstance(raw, (dict, list)):
        return json.dumps(raw, sort_keys=True, separators=(",", ":"))
    return normalize_text(str(raw))
```

> **Why this step?** Cosmetic differences — whitespace, casing, JSON key order — are artifacts of how a tool happened to serialize its response, not information. Skipping normalization means two calls that returned identical data get hashed as different content, and the dedup pass silently does nothing.

### Step 2: A registry that remembers what's already in context

```python
class ToolResultDeduper:
    def __init__(self, near_dup_threshold: float = 0.9):
        self.hashes: dict[str, str] = {}       # content hash -> turn label
        self.texts: list[tuple[str, str]] = []  # (normalized text, turn label) for near-dup checks
        self.row_keys: set = set()              # for structured, key-bearing results
        self.near_dup_threshold = near_dup_threshold

    def _hash(self, normalized: str) -> str:
        return hashlib.sha256(normalized.encode("utf-8")).hexdigest()
```

> **Why this step?** The registry has to persist across the whole agent session, not just within one tool call — duplication is a cross-call problem by definition. A fresh registry per call would never catch anything.

### Step 3: Row-level dedup for structured, paginated results

```python
    def dedupe_rows(self, rows: list[dict], key_field: str) -> list[dict]:
        unique = []
        for row in rows:
            key = row.get(key_field)
            if key is None or key in self.row_keys:
                continue
            self.row_keys.add(key)
            unique.append(row)
        return unique
```

> **Why this step?** When results carry a stable identifier — a row id, a file path, a ticket number — comparing identifiers is exact and free. There's no reason to fall back on fuzzy text similarity when an exact key is available; save that for content that has no natural key.

### Step 4: Exact and near-duplicate handling for free text

```python
    def process_text(self, raw, tool_name: str, turn_label: str):
        normalized = normalize_payload(raw)
        h = self._hash(normalized)

        if h in self.hashes:
            return f"[duplicate of {tool_name} result from {self.hashes[h]} — omitted, no new content]"

        for prior_text, prior_label in self.texts:
            if SequenceMatcher(None, normalized, prior_text).ratio() >= self.near_dup_threshold:
                return (f"[near-duplicate of {tool_name} result from {prior_label} "
                        f"— overlap above {self.near_dup_threshold:.0%}, omitted]")

        self.hashes[h] = turn_label
        self.texts.append((normalized, turn_label))
        return raw
```

> **Why this step?** Exact-hash catches the cheap, unambiguous case for free. The similarity check only runs on what's left, and only ever against other results *from the same tool* — comparing a code search result against an unrelated web fetch would produce meaningless overlap scores.

### Step 5: Wire it into the agent loop

```python
def handle_tool_result(deduper: ToolResultDeduper, tool_name: str, raw_result, turn_label: str, key_field: str | None = None):
    if key_field and isinstance(raw_result, list):
        return deduper.dedupe_rows(raw_result, key_field)
    return deduper.process_text(raw_result, tool_name, turn_label)

# Inside the agent loop, right after executing a tool call:
deduper = ToolResultDeduper()  # created once per session, not per call

result = execute_tool(tool_call)
deduped = handle_tool_result(deduper, tool_call.name, result, turn_label=f"turn-{turn_index}",
                              key_field="id" if tool_call.name == "list_records" else None)
messages.append({"role": "user", "content": [{"type": "tool_result", "content": deduped}]})
```

## Run it

Three paginated calls to the same `list_records` tool, with a cursor bug that causes overlap:

```python
page1 = [{"id": i, "name": f"user-{i}"} for i in range(1, 51)]     # ids 1-50
page2 = [{"id": i, "name": f"user-{i}"} for i in range(26, 76)]    # ids 26-75, overlap
page3 = [{"id": i, "name": f"user-{i}"} for i in range(51, 101)]   # ids 51-100

deduper = ToolResultDeduper()
final = []
for i, page in enumerate([page1, page2, page3], start=1):
    final.extend(handle_tool_result(deduper, "list_records", page, f"turn-{i}", key_field="id"))

print(len(final))  # 100 - every unique id present exactly once
```

Naive concatenation would have injected 150 rows for 100 unique records — 50 rows of pure repeat. At roughly 12 tokens per compact row, that's about 600 tokens — the 50 duplicate rows — out of the 1,800-token total that bought no new information: a 33% reduction in tokens spent on this tool's output, with zero coverage lost, since every one of the 100 unique ids still made it into `final`.

The same registry, run against a free-text case — a file read at lines 1-100, then re-read minutes later at lines 1-100 unchanged — collapses the second read to a one-line pointer instead of paying for another 100 lines of identical content, exactly as [Tool Output Deduplication](/learn/context-engineering/tool-output-deduplication-deep) describes for the exact-match case.

## Harden it

- **Scope near-duplicate checks to same tool, same rough context.** Comparing every new result against the *entire* session's history is where the O(n²) cost of `SequenceMatcher` starts to bite on long-running agents. Keep `self.texts` bucketed by tool name so a search result is only ever compared against other search results, not against unrelated file reads.
- **Cap registry growth.** A very long agent run accumulates hashes and texts indefinitely. Evict entries once the turns that produced them have fallen out of the active context window (or been summarized away — see [summarization for compaction](/learn/context-engineering/summarization-for-compaction)), since there's no point remembering content the model can no longer see anyway.
- **Never collapse across tools or across genuinely different queries.** Two different searches that happen to surface overlapping results are not the same information request — see [Merging Context From Many Sources](/learn/context-engineering/merging-multi-source-context) for that distinct case, where overlap has to be reconciled, not discarded.
- **Log what gets dropped.** A dedup pass that silently omits content is invisible when it's wrong. Keep a debug trail of what was collapsed and why — it's the difference between "the agent seems to be forgetting things" being solvable and being a mystery. This pairs with [context observability and token accounting](/learn/context-engineering/context-observability-and-token-accounting).

## Extend it

Swap the `SequenceMatcher` step for embedding cosine similarity when near-duplicates are genuinely paraphrased rather than literally overlapping text — worth the extra API call only once literal-overlap checking starts missing real duplicates. And once results start arriving from more than one tool describing the same underlying entity, this dedup pass becomes the input to a merge step, not a replacement for one — see [Merging Context From Many Sources](/learn/context-engineering/merging-multi-source-context) for what happens next.

**Related:** [Tool Output Deduplication](/learn/context-engineering/tool-output-deduplication-deep) · [Tool Output Is Context Too](/learn/context-engineering/tool-output-is-context-too) · [Token Budgeting Strategies](/learn/context-engineering/token-budgeting-strategies) · [Context Observability and Token Accounting](/learn/context-engineering/context-observability-and-token-accounting) · [Relevance Filtering](/learn/context-engineering/relevance-filtering)
