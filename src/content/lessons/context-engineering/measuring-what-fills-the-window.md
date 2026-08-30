---
title: "Measuring What Fills the Window"
track: "context-engineering"
status: live
summary: "Instrument every call to log tokens per segment, not just the total — that's how you catch what's quietly eating your budget."
duration: "7 min read"
---

A request that used 9,800 tokens tells you a cost. It doesn't tell you that 2,450 of those tokens were tool schemas nobody's called in three weeks. This lesson builds the instrumentation that turns "9,800 tokens" into a breakdown you can act on.

## What we're building

A measurement pass that runs on every call to Aria, before the request goes out: tokenize each segment separately, emit a structured log record, and aggregate a handful of those records into a report. This is the concrete mechanics behind [Context Observability: Instrumenting What's Actually in the Window](/learn/context-engineering/context-observability-and-token-accounting) — that lesson covers why the discipline matters; this one builds it.

## Setup

You already have each segment as a distinct piece before you concatenate them into a prompt, and you already have `count_tokens` from [Counting Tokens in Practice](/learn/context-engineering/counting-tokens-in-practice):

```python
import json, time, uuid

def count_tokens(text: str, model: str = "gpt-4o") -> int:
    import tiktoken
    return len(tiktoken.encoding_for_model(model).encode(text))
```

### Build it

#### 1. Measure each segment independently

```python
def measure_segments(segments: dict[str, str]) -> dict[str, int]:
    return {name: count_tokens(text) for name, text in segments.items()}
```

Nothing clever here — the discipline is calling this on *every* request, not just when something already looks wrong.

#### 2. Emit a structured record, not a log line

```python
def log_turn(trace_id: str, segments: dict[str, str]) -> dict:
    usage = measure_segments(segments)
    record = {
        "trace_id": trace_id,
        "ts": time.time(),
        "total_tokens": sum(usage.values()),
        "sections": usage,
    }
    print(json.dumps(record))  # replace with your logging/metrics sink
    return record
```

> **Why this step?** A free-text log line ("used 9800 tokens this turn") can't be queried later. A structured record with per-section fields can be aggregated across thousands of calls without re-parsing anything — the same reason [Context Observability](/learn/context-engineering/context-observability-and-token-accounting) insists on section-level JSON, not a single number.

#### 3. Call it from the request path, cheaply

```python
def handle_turn(trace_id, system_prompt, tool_defs, retrieved, history, user_msg):
    segments = {
        "system_prompt": system_prompt,
        "tool_definitions": tool_defs,
        "retrieved_context": retrieved,
        "conversation_history": history,
        "user_message": user_msg,
    }
    log_turn(trace_id, segments)
    # ... assemble and send the actual request ...
```

Tokenizing five short strings adds negligible latency next to the network round trip for the model call itself — this sits comfortably on the critical path, but keep it there and resist the urge to skip it "for now."

#### 4. Aggregate a sample of calls into a report

```python
def summarize(records: list[dict]) -> dict[str, float]:
    totals = {}
    grand_total = 0
    for r in records:
        grand_total += r["total_tokens"]
        for name, n in r["sections"].items():
            totals[name] = totals.get(name, 0) + n
    return {name: round(100 * n / grand_total, 1) for name, n in totals.items()}
```

## Run it

Five real calls to Aria, aggregated:

```
trace_8f21  total 9,800   {system: 700, tools: 2,450, retrieval: 3,300, history: 2,650, user: 700}
trace_8f22  total 9,650   {system: 700, tools: 2,450, retrieval: 3,100, history: 2,700, user: 700}
trace_8f23  total 10,100  {system: 700, tools: 2,450, retrieval: 3,600, history: 2,650, user: 700}
trace_8f24  total 9,900   {system: 700, tools: 2,450, retrieval: 3,350, history: 2,700, user: 700}
trace_8f25  total 9,750   {system: 700, tools: 2,450, retrieval: 3,200, history: 2,700, user: 700}

summarize() -> {
  system_prompt:        7.1%,
  tool_definitions:    24.9%,
  retrieved_context:   33.6%,
  conversation_history: 27.2%,
  user_message:         7.1%
}
```

That's the reveal: `tool_definitions` is a flat 2,450 tokens on every single call, roughly a quarter of the total, and it never varies with the conversation — because Aria always sends her full tool list regardless of which tools this turn could plausibly need. Nobody set out to spend a quarter of every request on tool schemas; it accumulated one added tool at a time, and it was invisible until it was measured.

## Harden it

- **Don't double-tokenize what your provider already counted.** Most SDKs return `input_tokens` / `output_tokens` on the response, and increasingly a cached-token count too. Reserve your own local tokenizer pass for the section-level breakdown the API response doesn't give you, and reconcile the two periodically rather than trusting either blindly — see [A Per-Turn Token Ledger](/learn/context-engineering/token-accounting-per-turn-ledger) for exactly that reconciliation.
- **Cached segments still need measuring.** A segment served from a prompt cache costs less, not zero, and still occupies window space — don't drop it from the breakdown just because it's cheaper this call. See [Cache-Aware Context Design](/learn/context-engineering/cache-aware-context-design).
- **Sample in high-volume production, log fully in development.** Tokenizing every segment on every call is cheap per-call but adds up in aggregate at scale; a 5–10% sample is usually enough to catch drift in the composition, with full logging reserved for debugging a specific incident.

## Extend it

A one-time report tells you tool definitions are 25% of spend today. It doesn't tell you if that's growing — for that, you need the same measurement running continuously across a whole conversation, which is [Building a Context Observability View](/learn/context-engineering/building-a-context-observability-dashboard). And once you're logging per-segment usage, the natural next step is checking each number against the caps from [Setting Per-Segment Budgets](/learn/context-engineering/setting-per-segment-budgets) and alerting when reality drifts from the plan — see [Instrumenting Token Spend in Production](/learn/context-engineering/instrumenting-token-spend-in-production). The concrete fix for the tool-schema finding itself is [Progressive Tool Disclosure](/learn/context-engineering/progressive-tool-disclosure) — send only the tools this turn plausibly needs.

**Related:** [Context Observability: Instrumenting What's Actually in the Window](/learn/context-engineering/context-observability-and-token-accounting), [Counting Tokens in Practice](/learn/context-engineering/counting-tokens-in-practice), [Progressive Tool Disclosure](/learn/context-engineering/progressive-tool-disclosure), [Setting Per-Segment Budgets](/learn/context-engineering/setting-per-segment-budgets)
