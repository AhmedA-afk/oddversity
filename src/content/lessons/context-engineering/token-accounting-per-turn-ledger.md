---
title: "A Per-Turn Token Ledger"
track: "context-engineering"
status: live
summary: "A running ledger of tokens and cost per turn, reconciled against billed usage, is what catches a runaway loop before the invoice does."
duration: "7 min read"
---

Cost dashboards tell you what a session cost in total. A per-turn ledger tells you which turn it started costing more than it should — and why.

## The setup

Aria is mid-conversation with a user asking about a delayed order. At turn 4, a tool call fetches the order's full history document (about 2,200 tokens) so Aria can answer accurately. We'll keep a ledger of tokens in, tokens out, cached tokens, and cost for six turns, reconcile our own numbers against the provider's billed usage on the API response, and use the reconciliation to catch a bug that a total-cost dashboard alone would miss.

Illustrative pricing for the arithmetic below — swap in your provider's actual rate sheet: $3 per million uncached input tokens, $0.30 per million cached input tokens, $15 per million output tokens.

## Step by step

#### 1. Record what your own code assembled

Before the request goes out, you already know exactly what you sent — sum the segments the way [Measuring What Fills the Window](/learn/context-engineering/measuring-what-fills-the-window) does:

```python
local_tokens_in = count_tokens(system_prompt) + count_tokens(tool_defs) \
                 + count_tokens(retrieved) + count_tokens(history) + count_tokens(user_msg)
```

> **Why this step?** This is your independent measurement — the number you'd expect to be billed, computed without trusting the provider to tell you first.

#### 2. Compare it against what the provider says it billed

```python
def reconcile(local_in: int, response_usage: dict) -> dict:
    billed_in = response_usage["input_tokens"]
    return {
        "local_in": local_in,
        "billed_in": billed_in,
        "diff": billed_in - local_in,
        "cached": response_usage.get("cache_read_input_tokens", 0),
    }
```

> **Why this step?** A tokenizer run over your raw concatenated text won't exactly match what the API bills, because message formatting adds small per-message overhead — role wrappers and structural tokens your naive concatenation doesn't include (see [Message Roles and Structure](/learn/context-engineering/message-roles-and-structure)). That gap should be small and roughly stable; if it isn't, your local measurement is missing something bigger than formatting overhead.

#### 3. Compute cost from the billed split

```python
def turn_cost(billed_in: int, cached: int, tokens_out: int) -> float:
    uncached = billed_in - cached
    return (uncached * 3 + cached * 0.30) / 1_000_000 + (tokens_out * 15) / 1_000_000
```

#### 4. Build the ledger, turn by turn

| Turn | local\_in | billed\_in | diff | cached | tokens\_out | cost |
|---|---|---|---|---|---|---|
| 1 | 1,200 | 1,209 | 9 | 0 | 180 | $0.0063 |
| 2 | 1,450 | 1,461 | 11 | 900 | 210 | $0.0051 |
| 3 | 1,700 | 1,712 | 12 | 1,150 | 195 | $0.0050 |
| 4 | 4,100 | 4,113 | 13 | 1,150 | 260 | $0.0131 |
| 5 | 6,300 | 6,314 | 14 | 1,150 | 205 | $0.0189 |
| 6 | 8,500 | 8,515 | 15 | 1,150 | 190 | $0.0253 |

> **Why this step?** Laid out turn by turn instead of as a running total, two patterns become visible that a single "session cost: $0.074" figure would hide completely.

## What the ledger catches

The `diff` column is boring on purpose — it grows by roughly one or two tokens per turn as the message count grows, consistent with small per-message formatting overhead. That's the reconciliation working correctly: your local count and the provider's billed count agree closely, so you can trust both.

The `cached` column is the actual finding. It climbs from 0 to 1,150 as the system prompt and tool definitions become a stable, reusable prefix (see [Cache-Aware Context Design](/learn/context-engineering/cache-aware-context-design)) — and then it goes flat at 1,150 for turns 4, 5, and 6, even as `billed_in` keeps climbing steeply each turn. Nothing new is ever getting cached past turn 3. Meanwhile `tokens_out` — the actual length of Aria's answer — stays roughly flat around 190–260 tokens the whole time. Cost is climbing roughly 5x from turn 3 to turn 6 for an answer that isn't getting any longer or more thorough. That decoupling — cost rising while output value doesn't — is the signal a total-cost dashboard erases by only showing you the sum.

## Where it breaks (+fix)

The bug: turn 4's tool result — the 2,200-token order document — got appended to conversation history in full, and the code re-sends the *entire* history verbatim on every subsequent turn instead of referencing the document once. By turn 6, that document's text has effectively been resent three times, and because each turn's prompt now differs from the last turn's in more than just an appended suffix, nothing after the original stable prefix (system + tools) ever qualifies for a cache hit — which is exactly what the flat `cached: 1,150` is telling you, and why [Cache Invalidation Mistakes](/learn/context-engineering/cache-invalidation-mistakes) is worth reading once you spot this pattern.

The fix is the same move covered in [Tool Output Deduplication](/learn/context-engineering/tool-output-deduplication): store the fetched document once, reference it by an identifier the model can ask to re-expand if it actually needs to reread it, and don't let a tool result get silently duplicated into history on every turn that follows. See [Reference by Pointer, Not Value](/learn/context-engineering/reference-by-pointer-not-value) for the general pattern.

## Takeaways

- A ledger per turn catches drift a total can't — the same total cost can hide a healthy session or a runaway one.
- Reconciling local counts against billed usage isn't paranoia; a small, stable diff confirms your instrumentation is trustworthy, and a growing or erratic one tells you it isn't.
- A flat `cached` count next to a climbing `billed_in` count is a specific, actionable signal: something is being resent in full instead of referenced.
- Cost divorced from output length (`tokens_out` not growing while `billed_in` explodes) is worth alerting on by itself — see [Instrumenting Token Spend in Production](/learn/context-engineering/instrumenting-token-spend-in-production).

**Related:** [Context Observability: Instrumenting What's Actually in the Window](/learn/context-engineering/context-observability-and-token-accounting), [Cache-Aware Context Design](/learn/context-engineering/cache-aware-context-design), [Tool Output Deduplication](/learn/context-engineering/tool-output-deduplication), [Measuring What Fills the Window](/learn/context-engineering/measuring-what-fills-the-window)
