---
title: "Detecting Context Degradation"
track: "context-engineering"
status: live
summary: "Rising context size paired with flat or falling task success is a canary you can catch before users do."
duration: "9 min read"
---

Most teams find out their context has rotted when a user complains. By then it's already cost you the interaction. A cheap, always-on canary riding inside the agent loop can catch the drift while the session is still running.

## What we're building

A lightweight check that watches an agent's existing turn log for three things: context size growing while a task-success proxy is flat or falling, and a fact whose value contradicts an earlier stated value for the same key. This doesn't replace a full offline eval — see [An Eval Harness for Context Choices](/learn/context-engineering/eval-harness-for-context) for that — it's a tripwire meant to catch drift *during* a live session, before a human notices the output quietly got worse.

## Setup

Assume the agent loop already keeps a transcript: a list of turn dicts like `{"role": ..., "content": ...}`. We'll add a token counter, a success-proxy hook the caller supplies (a 0-1 score for how a turn went — did a tool call succeed, did a downstream check pass, whatever the caller already tracks), and a small fact-extraction pass for values worth watching.

## Build it

### Step 1 — track context growth per turn

```python
def approx_tokens(text: str) -> int:
    # ~4 chars/token is a rough heuristic for English text — good enough for a canary
    return max(1, len(text) // 4)

def running_context_size(turns: list[dict]) -> list[int]:
    sizes, total = [], 0
    for t in turns:
        total += approx_tokens(t["content"])
        sizes.append(total)
    return sizes
```

> **Why this step?** Rot correlates with *cumulative* context size, not the size of any single turn — you need the running total to see the trend the canary actually cares about. See [Context Rot Explained](/learn/context-engineering/context-rot-explained) for why the cumulative figure, not the per-turn one, is the one that predicts quality.

### Step 2 — track a task-success proxy

```python
def rolling_success(scores: list[float], window: int = 5) -> list[float]:
    out = []
    for i in range(len(scores)):
        lo = max(0, i - window + 1)
        chunk = scores[lo:i + 1]
        out.append(sum(chunk) / len(chunk))
    return out
```

The caller supplies a 0-1 score per turn — 1.0 if a tool call returned cleanly and its result was referenced correctly, 0.0 if the model had to retry or a downstream check failed. Averaging over a rolling window smooths one-off dips so the canary reacts to a trend, not to noise.

> **Why this step?** A single bad turn happens even in a healthy session. What marks rot is a *rolling* success rate trending down while size trends up — not one blip.

### Step 3 — catch contradicted facts

```python
import re

FACT_PATTERN = re.compile(r"\b([a-z_]+)\s*[:=]\s*([\w./$-]+)", re.IGNORECASE)

def extract_facts(text: str) -> dict[str, str]:
    return {k.lower(): v for k, v in FACT_PATTERN.findall(text)}

def find_contradictions(turns: list[dict]) -> list[tuple[str, str, str]]:
    seen, contradictions = {}, []
    for t in turns:
        for key, value in extract_facts(t["content"]).items():
            if key in seen and seen[key] != value:
                contradictions.append((key, seen[key], value))
            seen[key] = value
    return contradictions
```

> **Why this step?** A fact restated with a different value later in the same session (`invoice_total: 128.50` then `invoice_total: 142.00`) is a cheap, strong signal of poisoning or drift — see [Context Poisoning and Distraction](/learn/context-engineering/context-poisoning-and-distraction-deep) for why the second value doesn't get treated as an automatic correction; it usually gets treated as just as true as the first.

### Step 4 — combine into one canary

```python
def rot_canary(turns: list[dict], scores: list[float],
               size_growth_x: float = 2.5, success_drop: float = 0.25):
    sizes = running_context_size(turns)
    success = rolling_success(scores)
    warnings = []

    if len(sizes) > 4:
        growth = sizes[-1] / max(sizes[3], 1)
        drop = success[3] - success[-1]
        if growth >= size_growth_x and drop >= success_drop:
            warnings.append(
                f"context grew {growth:.1f}x since turn 4 while rolling "
                f"success dropped {drop:.2f} — likely rot, not just length"
            )

    for key, old, new in find_contradictions(turns):
        warnings.append(f"contradiction on '{key}': saw {old!r} then {new!r}")

    return warnings
```

## Run it

Simulate a session that has drifted — padding accumulates, success declines, and a key fact gets contradicted late:

```python
turns = [
    {"content": "invoice_total: 128.50, status: open"},
    {"content": "customer asked about shipping"},
    {"content": "retrieved 40 similar tickets for context"},
    {"content": "reviewing similar ticket #1, #2, #3..."},
    {"content": "still reviewing related tickets, nothing conclusive yet"},
    {"content": "more related ticket text, still searching"},
    {"content": "invoice_total: 142.00, closing this out"},
]
scores = [1.0, 0.9, 0.8, 0.6, 0.5, 0.4, 0.3]

print(rot_canary(turns, scores))
```

Illustrative output — the exact numbers depend on your real token counts:

```text
["context grew 1.9x since turn 4 while rolling success dropped 0.31 — likely rot, not just length",
 "contradiction on 'invoice_total': saw '128.50' then '142.00'"]
```

## Harden it

- **Require the size/success trigger to hold for two consecutive checks, not one.** A single noisy turn will otherwise false-positive.
- **Don't flag every contradiction as poisoning.** Some facts legitimately change — a status moving from `open` to `closed` is an update, not corruption. Only flag contradictions on keys explicitly marked "should be stable within a session" (order IDs, schema names, totals already confirmed), and treat the rest as expected. This is the same freshness distinction covered case by case in [Poisoning in the Wild](/learn/context-engineering/poisoning-real-world-scenarios).
- **Feed the canary's warnings into your existing observability, not a separate silent log.** See [Context Observability and Token Accounting](/learn/context-engineering/context-observability-and-token-accounting) and [Building a Context Observability Dashboard](/learn/context-engineering/building-a-context-observability-dashboard).

## Extend it

- On a warning, trigger a cheap intervention automatically: force a re-verification call on the contradicted fact, or trigger [compaction](/learn/context-engineering/summarization-for-compaction) to drop stale padding before continuing.
- Escalate warnings tied to sensitive keys — payment amounts, account IDs — to a human-in-the-loop pause, rather than auto-continuing regardless of what was flagged.
- Promote the canary from a live tripwire into an offline gate by replaying flagged sessions through the [eval harness](/learn/context-engineering/eval-harness-for-context) to confirm it wasn't a false alarm before you change anything based on it.

**Related:** [Context Rot Explained](/learn/context-engineering/context-rot-explained), [Context Poisoning and Distraction](/learn/context-engineering/context-poisoning-and-distraction-deep), [Context Observability and Token Accounting](/learn/context-engineering/context-observability-and-token-accounting), [Building a Context Observability Dashboard](/learn/context-engineering/building-a-context-observability-dashboard), [Poisoning in the Wild](/learn/context-engineering/poisoning-real-world-scenarios)
