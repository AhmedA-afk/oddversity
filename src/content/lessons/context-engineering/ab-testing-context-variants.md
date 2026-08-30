---
title: "A/B Testing Context Variants"
track: "context-engineering"
status: live
summary: "Comparing two context builds on the same fixed eval, paired per item, tells you which one to actually ship."
duration: "8 min read"
---

An ablation tells you whether one segment helps. An A/B comparison answers a different, more common question: given two entire ways of building the context, which one do you actually ship?

## The setup

A coding assistant answers developer questions against a mid-size codebase. The eval set is 40 real questions, each paired with a known-correct file. Two context variants get compared on the exact same 40 items:

- **Variant A ("wide"):** top-20 chunks by raw embedding similarity, concatenated in retrieval order.
- **Variant B ("curated"):** top-5 chunks, reranked, with the single most relevant chunk repeated at both the start and end of the block.

## Step by step

### Step 1 — build Variant A

```python
def build_context_wide(query, index):
    hits = index.search(query, k=20)          # raw similarity order
    return "\n\n".join(f"[{h.id}] {h.text}" for h in hits)
```

Token count for a representative query: roughly 18,400 tokens.

> **Why this step?** "Just retrieve more, it can't hurt" is the default most teams ship first. Establishing it as the baseline is the point — everything else has to actually beat it, not just look more curated.

### Step 2 — build Variant B

```python
def build_context_curated(query, index):
    hits = index.search(query, k=20)
    reranked = rerank(query, hits)[:5]          # cross-encoder rerank, top 5
    best = reranked[0]
    body = "\n\n".join(f"[{h.id}] {h.text}" for h in reranked)
    return f"[{best.id}] {best.text}\n\n{body}\n\n[{best.id}] {best.text}"
```

Token count for the same query: roughly 5,100 tokens. The top hit is deliberately duplicated at both edges, trading a small token cost for [primacy and recency](/learn/context-engineering/context-ordering-and-recency-effects) coverage of the single most likely answer.

> **Why this step?** Reranking before truncating — not after — is what lets you cut from 20 candidates to 5 without just keeping whatever happened to embed closest, which is a weaker signal than an actual relevance-scored pass. See [Filtering vs. Reranking](/learn/context-engineering/filtering-vs-reranking).

### Step 3 — run both variants over the same 40 items

| item | A correct? | B correct? |
|---|---|---|
| q01 | yes | yes |
| q02 | yes | no |
| q03 | no | yes |
| ... | ... | ... |
| q40 | no | yes |

Aggregate: A scores 30/40 (75%), B scores 32/40 (80%). The paired breakdown: both correct on 27 items, A-only-correct on 3, B-only-correct on 5, both wrong on 5.

> **Why this step?** The paired table is what tells you this isn't just "B is generically better." Three questions that A got right, B missed. Looking only at the 75% → 80% headline hides that B isn't a strict improvement — it's a different tradeoff that happens to net positive here.

### Step 4 — factor in cost

A costs roughly 18.4k tokens per query; B costs roughly 5.1k — about 3.6x cheaper. B wins on both accuracy and cost, which makes this close to a strict win rather than a tradeoff you'd need to weigh carefully. If the numbers were reversed — B cheaper but scoring 70% against A's 75% — you'd need an explicit rule for how much accuracy you're willing to trade for cost before picking a winner. Here, you don't need that rule; B clears both bars.

### Step 5 — check whether the gap is real

The 5-point gap (32 vs. 30 of 40) comes from a net of two flips (5 minus 3) on a 40-item set — worth flagging as marginal rather than declaring outright victory. See [Testing Whether Context Actually Helps](/learn/context-engineering/testing-whether-context-helps) for the statistical treatment of exactly this situation. The actual due diligence before shipping B everywhere: re-run on a larger set, or check that the 3 items A won aren't clustered in one query type B systematically struggles with.

## Where it breaks (+fix)

If the eval set is small or skewed — say, mostly short single-file lookups — a variant that trims aggressively can look great on that set while quietly failing on multi-file, cross-referencing questions the eval never included. Fix: stratify the eval set by query type (single-file lookup vs. cross-file reasoning) before trusting an aggregate win/loss, and check the per-stratum breakdown rather than only the overall 32-vs-30.

## Takeaways

- Compare variants on the exact same fixed set, paired per item — never as two separately-sampled averages.
- A cheaper variant that's *at least as accurate* — not merely cheaper — is the one to ship. "Cheaper and slightly worse" needs an explicit tradeoff decision, not a default yes.
- A small net win on a small eval set is a hypothesis, not a result. Check whether it survives a larger set or a stratified read before rolling it out everywhere.

**Related:** [Testing Whether More Context Actually Helps](/learn/context-engineering/context-window-testing-and-eval), [Testing Whether Context Actually Helps](/learn/context-engineering/testing-whether-context-helps), [Filtering vs. Reranking](/learn/context-engineering/filtering-vs-reranking), [Context Ordering and Recency Effects](/learn/context-engineering/context-ordering-and-recency-effects), [An Eval Harness for Context Choices](/learn/context-engineering/eval-harness-for-context)
