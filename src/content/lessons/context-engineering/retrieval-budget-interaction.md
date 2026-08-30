---
title: "How Retrieval and Budget Interact"
track: "context-engineering"
status: live
summary: "Fixed top-k retrieval and a token budget collide more often than either alone suggests — traced with a dynamic-fill-to-budget fix."
duration: "7 min read"
---

"Retrieve the top 10 chunks" is a sentence that ignores a question it can't avoid forever: what happens when those 10 chunks don't fit in what you can actually afford to send?

## The setup

A legal-research assistant retrieves case-law excerpts to answer a question, with a hard **1,200-token budget** for retrieved context. A query comes in: *"What's the standard for summary judgment in this jurisdiction?"* Retrieval returns 10 candidate excerpts, already ranked by relevance score, with these token costs:

```text
rank  relevance  tokens
1     0.93       180
2     0.90       310
3     0.88       95
4     0.85       260
5     0.81       340
6     0.77       150
7     0.71       220
8     0.65       180
9     0.58       130
10    0.52       200
```

Total tokens across all 10: 2,065 — almost double the 1,200-token budget.

## Step by step

### Fixed k=10: take the top 10, no matter the cost

```python
def fixed_k(ranked: list[dict], k: int) -> list[dict]:
    return ranked[:k]

selected = fixed_k(candidates, k=10)
total_tokens = sum(c["tokens"] for c in selected)  # 2,065
```

Fixed-k doesn't know about the budget at all — it hands back all 10 regardless of what they cost, and something downstream has to deal with the overage: either truncate mid-chunk (breaking sentences, sometimes losing the actual answer if it was in the cut-off half), or reject the batch and retry with a smaller k chosen by guesswork.

> **Why this fails here:** truncating at 1,200 tokens straight through the ranked list cuts partway into chunk 6 (150 tokens, cumulative 1,335) — right after including chunks 1 through 5 in full (1,285 tokens) but with only 85 tokens of chunk 6's 150 surviving. Chunks 7 through 10, including chunk 9's relatively cheap 130-token excerpt at rank 9, never make it in at all, cut not because they were low-value but because of where they sat in an unbroken list.

### Dynamic-fill-to-budget: walk the ranked list, skip what doesn't fit, keep checking

```python
def fill_to_budget(ranked: list[dict], budget: int) -> list[dict]:
    kept, spent = [], 0
    for chunk in ranked:  # highest relevance first
        if spent + chunk["tokens"] > budget:
            continue  # doesn't fit — skip it, but keep scanning past it
        kept.append(chunk)
        spent += chunk["tokens"]
    return kept

selected = fill_to_budget(candidates, budget=1200)
```

Trace it against the same 10 candidates:

```text
rank  relevance  tokens  running total  kept?
1     0.93       180     180            yes
2     0.90       310     490            yes
3     0.88       95      585            yes
4     0.85       260     845            yes
5     0.81       340     1185           yes
6     0.77       150     [1335 > 1200]  no — skip, keep scanning
7     0.71       220     [1405 > 1200]  no — skip, keep scanning
8     0.65       180     [1365 > 1200]  no — skip, keep scanning
9     0.58       130     1315           no — [1315 > 1200] skip
10    0.52       200     [1385 > 1200]  no
```

> **Why this step matters:** ranks 1 through 5 fit whole — no truncated sentences, no half-chunks. Nothing below rank 5 fits without exceeding budget, so the walk correctly stops taking new chunks, but it *keeps checking* rather than stopping outright, which is what would let a cheap, lower-ranked chunk slip in if one existed. In this trace none does, so the final selection is exactly chunks 1–5, whole and intact, at 1,185 of the 1,200-token budget.

## Comparing what each approach actually delivers

```text
                    tokens used   chunks whole   answer coverage
fixed k=10          2,065         10 of 10       best, if you can afford to send it all
fixed k=10, truncated at 1,200     1,200         5 whole + 1 broken   chunk 6 half-included, 7–10 dropped blind
dynamic fill-to-budget             1,185         5 of 5, all whole    same top content, no broken chunk
```

Fixed-k truncated at the budget and dynamic fill-to-budget land at almost the same token cost here — but fixed-k gets there by accident, slicing wherever the running total happens to cross the line, while fill-to-budget gets there by design, always stopping on a whole-chunk boundary. The practical difference: chunk 6 half-included is worse than chunk 6 excluded outright — a broken excerpt can read as a complete answer while missing its conclusion, which is a harder failure to catch than a chunk that's cleanly absent.

## Where it breaks (+ fix)

**Break: a big, top-ranked chunk crowds out several cheaper, still-relevant ones.** If rank 1 were a 900-token chunk instead of 180, fill-to-budget would seat it first and leave only 300 tokens for everything else — potentially excluding four or five smaller, genuinely useful excerpts in favor of one large one that scored only slightly higher.

**Fix:** weight the fill decision by relevance *per token*, not relevance alone, once chunk sizes vary widely — a small chunk at 0.85 relevance and 95 tokens is often worth more per token spent than a giant chunk at 0.93 relevance and 900 tokens. This is a direct value-density judgment, not just a rank-order walk.

**Break: the budget is tight enough that dynamic fill still can't seat the single most relevant chunk.** If rank 1 alone cost 1,400 tokens against a 1,200-token budget, no fill strategy seats it — the answer's most important source is simply too big for the slot it has.

**Fix:** this is a signal to summarize that one oversized chunk down to size before filling, rather than silently excluding it — a shortened version of the best source usually beats a full version of the fifth-best one.

## Takeaways

- Fixed-k retrieval and a token budget are two independent numbers that were never coordinated — treating k as fixed is really a bet that k chunks will always fit, and that bet fails the moment chunk sizes vary.
- Dynamic fill-to-budget doesn't retrieve more or less than fixed-k — it decides *which* of the already-ranked candidates earn a whole, unbroken place in the budget, which is a materially different and usually better outcome than truncating wherever the running total happens to land.
- Neither strategy fixes a chunk that's simply too big for the budget on its own — that's a summarization problem, not a selection problem, and conflating the two is how "increase k" gets tried when "shrink the chunk" was the actual fix needed.

**Related:** [A Retrieve-Then-Filter Pipeline](/learn/context-engineering/retrieving-then-filtering-pipeline) · [Setting Per-Segment Budgets](/learn/context-engineering/setting-per-segment-budgets) · [Filtering vs Reranking](/learn/context-engineering/filtering-vs-reranking) · [What a Token Budget Is](/learn/context-engineering/what-a-token-budget-is) · [Over-Retrieval and Over-Stuffing](/learn/context-engineering/over-retrieval-and-stuffing-mistakes)
