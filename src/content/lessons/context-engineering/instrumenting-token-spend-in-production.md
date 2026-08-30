---
title: "Instrumenting Token Spend in Production"
track: "context-engineering"
status: live
summary: "Middleware that records per-request token and cost metrics, alerts on breaches, and finds which small slice of sessions burns most of the budget."
duration: "8 min read"
---

Average token spend per session can look perfectly healthy while a handful of sessions quietly account for almost half the bill. This lesson builds the middleware that catches both: breaches on individual requests, and the distribution problem averages hide.

## What we're building

Lightweight middleware that wraps every call to Aria, records token and cost metrics tagged with session and cohort, raises an alert the moment a segment or total breaches its configured budget, and rolls up into an aggregation that can answer "which sessions are actually expensive."

## Setup

This builds directly on the per-segment measurement from [Measuring What Fills the Window](/learn/context-engineering/measuring-what-fills-the-window) and the caps from [Setting Per-Segment Budgets](/learn/context-engineering/setting-per-segment-budgets) — the new piece here is turning both into something that runs continuously and flags problems on its own.

### Build it

#### 1. Extend the per-turn record with identity and cost

```python
def build_metric_event(trace_id, session_id, cohort, segments, tokens_out, cost):
    usage = measure_segments(segments)  # from Measuring What Fills the Window
    return {
        "trace_id": trace_id,
        "session_id": session_id,
        "cohort": cohort,          # e.g. "free" or "pro" plan tier
        "ts": time.time(),
        "sections": usage,
        "total_in": sum(usage.values()),
        "tokens_out": tokens_out,
        "cost": cost,
    }
```

> **Why this step?** Session and cohort tags are what let you later ask "which sessions" and "which kind of user," not just "how much in total." Without them, aggregation can only ever produce one number.

#### 2. Wrap the call, don't scatter logging through it

```python
def instrumented_call(llm_call, session_id, cohort, segments, **kwargs):
    result = llm_call(**kwargs)
    event = build_metric_event(
        trace_id=result.id,
        session_id=session_id,
        cohort=cohort,
        segments=segments,
        tokens_out=result.usage.output_tokens,
        cost=compute_cost(result.usage),
    )
    emit(event)
    check_budget_breach(event)
    return result
```

> **Why this step?** A middleware wrapper means every call path gets instrumented the same way automatically — nobody has to remember to add logging to a new endpoint that calls Aria.

#### 3. Alert on breaches, per segment and in total

```python
CAPS = {"system_prompt": 700, "tool_definitions": 1000,
        "retrieved_context": 3800, "conversation_history": 4500}
TOTAL_CAP = 12000

def check_budget_breach(event: dict):
    for name, cap in CAPS.items():
        used = event["sections"].get(name, 0)
        if used > cap:
            alert(f"segment breach: {name} used {used} > cap {cap}", event)
    if event["total_in"] > TOTAL_CAP:
        alert(f"total breach: {event['total_in']} > cap {TOTAL_CAP}", event)
```

> **Why this step?** This is [Setting Per-Segment Budgets](/learn/context-engineering/setting-per-segment-budgets)' `enforce_budget` turned into a monitor instead of a gate — it flags a breach for someone to see even on a path where you've deliberately chosen not to hard-reject the call.

#### 4. Aggregate by segment and by cohort

```python
def aggregate(events: list[dict]) -> dict:
    by_cohort = {}
    for e in events:
        c = by_cohort.setdefault(e["cohort"], {"total_tokens": 0, "total_cost": 0.0, "sessions": set()})
        c["total_tokens"] += e["total_in"]
        c["total_cost"]   += e["cost"]
        c["sessions"].add(e["session_id"])
    return by_cohort
```

#### 5. Find the sessions actually driving spend

```python
def session_totals(events: list[dict]) -> dict[str, int]:
    totals = {}
    for e in events:
        totals[e["session_id"]] = totals.get(e["session_id"], 0) + e["total_in"]
    return totals

def top_share(totals: dict[str, int], top_n: int) -> float:
    ranked = sorted(totals.values(), reverse=True)
    grand_total = sum(ranked)
    return sum(ranked[:top_n]) / grand_total
```

> **Why this step?** An average token count per session can sit at a perfectly normal-looking number while the *distribution* underneath it is badly skewed. Ranking sessions and looking at what share the top few command is a completely different, and more diagnostic, view than a mean.

## Run it

Twenty sessions from a day of Aria traffic: nineteen ordinary sessions averaging 700 tokens each (13,300 total), and one runaway session that never triggered compaction and kept accumulating tool output — 9,000 tokens. Grand total: 22,300 tokens.

```python
totals = {"s01": 700, "s02": 700, ..., "s19": 700, "s20": 9000}  # illustrative
top_share(totals, top_n=1)
# -> 9000 / 22300 = 0.4036
```

One session — 5% of the twenty — accounts for just over 40% of total token spend. The mean session size (1,115 tokens) looks unremarkable; it's the top-1 share that reveals the actual shape of the problem. That single session is exactly the kind of case [A Per-Turn Token Ledger](/learn/context-engineering/token-accounting-per-turn-ledger) is built to diagnose once you know which session to look at.

## Harden it

- **Don't log raw content in the metrics stream.** Segment token *counts* are safe to store and aggregate broadly; the segment *text* often isn't — keep raw content in your normal request logs with their own access controls, and keep the metrics store to counts, costs, and identifiers.
- **Sample at scale, but never sample the breach check.** Full per-segment logging on every request is fine up to real production volume, but if you do sample for cost reasons, sample the aggregation pipeline, not the breach alerting — you want to catch every overflow, not a random 5% of them.
- **Expect your cost table to go stale.** Provider pricing changes; a hardcoded `compute_cost` becomes quietly wrong the day it does. Pull rates from a config you can update without a code deploy.
- **Watch for clock skew on late-arriving events** in a distributed setup — aggregate by request time, not ingestion time, or a burst of delayed events can make a quiet hour look like a spike after the fact.

## Extend it

The breach alerts here are a starting point, not a diagnosis — pair them with the trend view in [Building a Context Observability View](/learn/context-engineering/building-a-context-observability-dashboard) to see whether a breach is a one-off or the start of a climb, and route any session flagged by `top_share` straight into a per-turn ledger to find out which turn it went wrong on. The specific failure patterns worth watching for in that investigation are cataloged in [Budgeting Mistakes That Bite Later](/learn/context-engineering/budgeting-common-mistakes).

**Related:** [Context Observability: Instrumenting What's Actually in the Window](/learn/context-engineering/context-observability-and-token-accounting), [A Per-Turn Token Ledger](/learn/context-engineering/token-accounting-per-turn-ledger), [Measuring What Fills the Window](/learn/context-engineering/measuring-what-fills-the-window), [Setting Per-Segment Budgets](/learn/context-engineering/setting-per-segment-budgets)
