---
title: "Token Budget Cheatsheet"
track: "context-engineering"
status: live
summary: "Default allocations, the reserve-headroom-first rule, strategy tradeoffs, and the instrumentation to log — one page."
duration: "5 min read"
---

The reference version of this module: defaults to start from, the one ordering rule that matters most, and what to log so you find out when reality stops matching the plan.

## The one rule

**Reserve reply headroom first**, as a fixed off-the-top allocation, before sizing any other segment. Every other mistake in this module is recoverable; skipping this one produces answers that cut off exactly when they needed to be longest. See [Budget as a Zero-Sum Pie](/learn/context-engineering/the-budget-allocation-mental-model).

## Starter budget — start here, then measure

For a typical single-model RAG agent, as a percentage of your working token budget `W`:

| Segment | Start here | Notes |
|---|---|---|
| Reply headroom | 10–20% of `W`, fixed | Reserved first, off the top. Raise it for tasks needing long-form answers. |
| System prompt | 5–8% of `W`, fixed floor (min ~300 tokens) | Re-measure after every edit — it drifts upward silently. |
| Tool definitions | Measure, don't guess | Often 15–25% once past a handful of tools. Cut with [Progressive Tool Disclosure](/learn/context-engineering/progressive-tool-disclosure) before raising the cap. |
| Retrieved context | 25–40% of `W` | Cap first, then rank-and-trim to fit — never raise the cap to match whatever came back. |
| Conversation history | 25–40% of `W`, with a compaction trigger | Never let this be the only segment without a ceiling. |

These are starting points, not settled numbers — every one of them should be replaced with a measured value from your own traffic within the first week. See [What a Token Budget Actually Is](/learn/context-engineering/what-a-token-budget-is) for the full worked example this table is based on.

## Strategy quick-compare

| Strategy | Adapts to query? | Adapts to window size? | Engineering cost | Default for |
|---|---|---|---|---|
| Greedy (no budget) | No | No | None | Never — this is the absence of a strategy |
| Fixed caps | No | No | Low | Stable, uniform query patterns — **start here** |
| Proportional-to-window | No | Yes | Low | Multiple models / changing context sizes |
| Priority-based | Yes | Partial | High | Only with evidence of bimodal query types |

Full comparison, with the same overflow run through all four: [Fixed, Proportional, and Priority Budgets](/learn/context-engineering/budgeting-strategies-compared).

## Trigger points — start here, then tune

| Threshold | Fraction of segment cap | Action |
|---|---|---|
| Soft warn | ~70% | Log it. No behavior change yet. |
| Hard compact | ~85% | Fire compaction now — don't wait for the cap. |
| Hard reject | 100% | Reject or trim before the call goes out — never let the provider decide. |

Check every turn, not on a sampling schedule — a single oversized turn can jump straight past a threshold you'd otherwise have caught early. Full derivation: [Budgeting for a Conversation That Grows](/learn/context-engineering/budgeting-for-multi-turn-growth).

## The knee of the cost/latency/quality curve

Cost and latency rise close to linearly with tokens in; quality rises, then flattens, then can fall (see [The Cost, Latency, and Quality Curve](/learn/context-engineering/cost-latency-quality-tradeoff-curve) and [Context Rot](/learn/context-engineering/context-rot)). Operate at the knee — where the next increment of context stops paying for its own cost and latency — not at "as much as fits." The knee is task-specific; measure it with [A/B Testing Context Variants](/learn/context-engineering/ab-testing-context-variants) rather than assuming a fixed size.

## Minimal enforcement shape

```python
def enforce_budget(segments: dict[str, str], caps: dict[str, int]) -> dict[str, int]:
    usage = {name: count_tokens(text) for name, text in segments.items()}
    for name, used in usage.items():
        if caps.get(name) is not None and used > caps[name]:
            raise BudgetExceeded(name, used, caps[name])
    if sum(usage.values()) > sum(caps.values()):
        raise BudgetExceeded("total", sum(usage.values()), sum(caps.values()))
    return usage
```

Full version with trimming: [Setting Per-Segment Budgets](/learn/context-engineering/setting-per-segment-budgets).

## What to log, every turn

- Per-segment token count (system, tools, retrieval, history, user message) — not just the total.
- Cached vs. uncached token count, if your provider reports it.
- Tokens out, and cost computed from the actual billed split.
- Session and cohort identifiers, so spend can be sliced later, not just summed.
- A trace ID that joins this record to your normal request logs.

Full instrumentation build: [Measuring What Fills the Window](/learn/context-engineering/measuring-what-fills-the-window) and [Instrumenting Token Spend in Production](/learn/context-engineering/instrumenting-token-spend-in-production).

## Pre-flight budget checklist

- Reply headroom is a fixed, reserved-first line item — not whatever's left over.
- Every cap was set by measuring real traffic with the real tokenizer, not guessed from characters or a hunch.
- Tool definitions are measured and capped as their own segment.
- Retrieval and history each have a hard cap and a trim/compaction path — no segment is allowed to grow unbounded.
- Trigger points (soft warn, hard compact, hard reject) are checked every turn, not on a sampling schedule.
- Per-segment and total token counts are logged on every call, tagged with session and cohort.
- A per-session ceiling exists independent of the average budget.
- Caps and tokenizer assumptions are re-verified after any model or provider change.

**Related:** [What a Token Budget Actually Is](/learn/context-engineering/what-a-token-budget-is), [Budgeting Mistakes That Bite Later](/learn/context-engineering/budgeting-common-mistakes), [Token Budgeting Strategies](/learn/context-engineering/token-budgeting-strategies), [Context Observability: Instrumenting What's Actually in the Window](/learn/context-engineering/context-observability-and-token-accounting)
