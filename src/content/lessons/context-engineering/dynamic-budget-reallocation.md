---
title: "Reallocating the Budget on the Fly"
track: "context-engineering"
status: live
summary: "Shift tokens from history to retrieval on fact-heavy turns, and back for chit-chat, using a cheap classifier ahead of the real call."
duration: "8 min read"
---

*Optional depth — the static split from [Setting Per-Segment Budgets](/learn/context-engineering/setting-per-segment-budgets) is the right default. Read this once you have evidence, not a hunch, that it's costing you quality on a specific class of queries.*

A static budget treats every turn the same. Some turns don't need much retrieval and would happily trade that room for more history; others need the opposite. This lesson builds the policy that tells them apart and moves tokens accordingly — precisely, and with the tradeoffs stated up front.

## The mechanism

Aria's default split, for an ordinary conversational turn: system 700, tools 1,000, reply headroom 2,000 (fixed), retrieval 3,800, history 4,500. That's the base case from [Setting Per-Segment Budgets](/learn/context-engineering/setting-per-segment-budgets), and it stays untouched for most turns.

A cheap classifier runs *before* the main call, on just the user's message, to decide whether this turn is fact-heavy:

```python
FACT_HEAVY_SIGNALS = ("policy", "refund", "eligib", "exception", "clause", "rule")

def is_fact_heavy(user_message: str) -> bool:
    # Illustrative and deliberately simple. In production, back this with
    # a small fast model call or a labeled few-shot classifier — a raw
    # keyword list is too brittle for anything past a demo.
    text = user_message.lower()
    return any(kw in text for kw in FACT_HEAVY_SIGNALS)
```

If it's fact-heavy, the policy shifts 1,500 tokens from history to retrieval; if not, the base split holds:

```python
BASE = {"system": 700, "tools": 1000, "reply": 2000, "retrieval": 3800, "history": 4500}
FACT_HEAVY_SHIFT = 1500

def resolve_budget(user_message: str) -> dict:
    budget = dict(BASE)
    if is_fact_heavy(user_message):
        budget["retrieval"] += FACT_HEAVY_SHIFT
        budget["history"]  -= FACT_HEAVY_SHIFT
    return budget
```

Notice what doesn't move: `system`, `tools`, and `reply` stay fixed regardless of classification. Reply headroom in particular is protected on purpose — the whole point of reserving it first, as covered in [Budget as a Zero-Sum Pie](/learn/context-engineering/the-budget-allocation-mental-model), is that no reallocation policy should be able to raid it, fact-heavy turn or not.

## Where the quality gain actually comes from

Say a user asks: "What's the refund policy for orders placed before a price change?" Retrieval ranks seven relevant chunks by relevance, sized 820, 780, 760, 740, 720, 700, and 680 tokens — 5,200 tokens for the full set, with the specific exception clause that answers the question sitting in chunk six.

Under the base 3,800-token retrieval cap, chunks fit cumulatively until the cap is hit: 820, 1,600, 2,360, 3,100 — four chunks, 3,100 tokens. The fifth chunk would push the running total to 3,820, over the cap, so it and everything after it — including chunk six, the one with the exception clause — gets cut. Aria answers from general policy and misses the exception.

Under the reallocated 5,300-token cap, the running total reaches 3,820 after five chunks, 4,520 after six, 5,200 after all seven — every chunk fits, with 100 tokens to spare. Chunk six is in the context, and Aria's answer includes the exception. That's the entire mechanism: reallocation didn't make the model smarter, it made room for the one chunk that mattered for this specific question.

## Where the 1,500 tokens actually come from

History was sitting at 4,200 tokens when this turn arrived — under its old 4,500 cap, but now over the new 3,000 cap by 1,200 tokens. Something has to give, and the wrong answer is a blunt truncation that drops the oldest 1,200 tokens of history regardless of what's in them. The right answer is routing that overage through [Summarization for Compaction](/learn/context-engineering/summarization-for-compaction) — compress the oldest turns into a summary that preserves the facts worth keeping, rather than cutting blind. Skipping this step is exactly how you end up with the failure in [Compaction That Drops Key Facts](/learn/context-engineering/compaction-that-drops-key-facts): a reallocation policy that frees tokens by discarding whatever happened to be oldest, including something the user will ask about again next turn.

## Stating the tradeoffs precisely

**The classifier has to be cheap relative to what it saves.** If the reallocation buys you a better answer on a fact-heavy turn but the classifier itself adds meaningful latency or cost, you've partially undone the win. A single small-model call or a lightweight heuristic ahead of the main request is the right order of magnitude; running a second full-size model call to decide how to budget the first one usually isn't.

**Misclassification costs more than a static split does.** [Fixed, Proportional, and Priority Budgets](/learn/context-engineering/budgeting-strategies-compared) covers this directly: a static split is uniformly mediocre, which is at least predictable, while a wrong classification confidently shrinks the segment this turn actually needed. Measure the classifier's error rate before trusting it in production, and prefer a conservative default (shift less, or don't shift on low classifier confidence) over an aggressive one.

**Reallocation can disrupt prompt caching.** If retrieval and history swap relative sizes turn to turn, the byte layout of everything after the stable prefix changes shape more than it would under a fixed split, which can reduce how much of the prompt qualifies for a cache hit — see [Cache-Aware Context Design](/learn/context-engineering/cache-aware-context-design) and [Ordering for Cache Hits](/learn/context-engineering/ordering-for-cache-hits). Keep the truly static segments — system prompt, tool definitions — in the same position and size regardless of classification, so at minimum that prefix keeps caching normally even while retrieval and history trade tokens behind it.

**Related:** [Setting Per-Segment Budgets](/learn/context-engineering/setting-per-segment-budgets), [Fixed, Proportional, and Priority Budgets](/learn/context-engineering/budgeting-strategies-compared), [Budget as a Zero-Sum Pie](/learn/context-engineering/the-budget-allocation-mental-model), [Cache-Aware Context Design](/learn/context-engineering/cache-aware-context-design)
