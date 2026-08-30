---
title: "The Cost, Latency, and Quality Curve"
track: "context-engineering"
status: live
summary: "More context raises cost and latency roughly linearly, but quality rises, flattens, and can fall — find the knee, not the ceiling."
duration: "9 min read"
---

*Optional depth — if you just need the operating rule, it's in the [Token Budget Cheatsheet](/learn/context-engineering/token-budget-cheatsheet). This lesson derives why the rule works.*

Every extra token you add to a context window costs something predictable and buys something that stops being predictable. Cost and latency scale close to linearly with tokens in; quality does not, and the point where it stops is the actual target you're budgeting toward.

## The two curves that are easy to reason about

Cost is arithmetic. If your provider charges a rate per million input tokens, cost for a given call is close to `tokens_in * price_per_token`, plus whatever the output costs at its own (usually higher) rate. Using an illustrative rate of $3 per million input tokens and $15 per million output tokens — swap in your actual price sheet — a call with 8,000 input tokens and a 500-token reply costs roughly:

```
input:  8,000 / 1,000,000 * $3  = $0.024
output:   500 / 1,000,000 * $15 = $0.0075
total:  ≈ $0.0315
```

Scale input to 32,000 tokens and the input line scales with it — `32,000 / 1,000,000 * $3 = $0.096` — a little over 3x the cost for 4x the tokens, since the output cost doesn't change. Cost is boring in the sense that matters: it's easy to project, and it doesn't have surprises hiding in it.

Latency has a similar shape but two components. There's a per-request floor (network round trip, request setup) plus a component that scales with how many input tokens have to be processed before generation starts, which providers call prefill. As an illustrative shape — not a benchmark for any specific model — call it `latency ≈ 300ms + 4ms per 1,000 input tokens`:

```
2,000 tokens:    300 + 8   ≈ 308ms
8,000 tokens:    300 + 32  ≈ 332ms
32,000 tokens:   300 + 128 ≈ 428ms
100,000 tokens:  300 + 400 ≈ 700ms
```

Both curves are monotonic and roughly linear in the token count. Neither one is where the interesting decision lives.

## The curve that isn't linear

Quality — however you measure it, an eval score, a human rating, a task-completion rate — does not scale linearly with context length. It rises as you add genuinely relevant context, because the model has more of what it needs. Past some point, added tokens are marginal or irrelevant, and quality growth slows. Past a further point, on some tasks, quality can *fall*, because irrelevant or redundant tokens dilute the signal the model has to attend to — the mechanism covered in depth in [Context Rot](/learn/context-engineering/context-rot) and [Why More Tokens Hurt](/learn/context-engineering/why-more-tokens-hurt).

Here's an illustrative shape of that curve for a single RAG task — hypothetical numbers, constructed to show the shape, not a benchmark result for any real system. Cost here is input-token cost only, at the same $3/million rate as above, holding the reply length roughly constant across rows so the input side is what's driving the change:

| Context size | Cost (illustrative, input only) | Latency (illustrative) | Quality (illustrative eval score) |
|---|---|---|---|
| 2,000 tokens | $0.006 | ~308ms | 61 |
| 8,000 tokens | $0.024 | ~332ms | 78 |
| 32,000 tokens | $0.096 | ~428ms | 81 |
| 100,000 tokens | $0.30 | ~700ms | 74 |

Read the quality column, not the other two, and the shape is the whole lesson: a big jump from 2k to 8k (relevant material was missing and now it's there), a small jump from 8k to 32k (most of what mattered was already included; the rest is marginal), and a *drop* from 32k to 100k (added tokens are now mostly noise, and enough of it to measurably hurt). Cost and latency, meanwhile, kept climbing the whole time — 100k tokens costs 12.5x what 8k costs for a task that performs *worse* at 100k than at 32k.

## Finding the knee

The "knee" of the curve is the point where the quality gain from the next increment of context stops being worth its cost and latency — in this illustrative table, somewhere between 8k and 32k, closer to 8k given how little the extra 24k tokens bought. That's the point you should be operating at, not the largest context you can technically fit. Two things follow from taking the knee seriously as a design target rather than a curiosity:

**The knee is where you set your retrieval and history caps**, not at "as much as fits." If you're doing [retrieval vs. stuffing](/learn/context-engineering/retrieval-vs-context-stuffing), the temptation with a large-window model is to skip ranking and stuff in everything that might be relevant, on the theory that the window can hold it. The curve says that's a cost and latency tax for zero or negative quality return once you're past the knee — see [When Long Context Beats RAG](/learn/context-engineering/when-long-context-beats-rag) for the cases where stuffing *is* still the right call, which are narrower than they look.

**The knee moves per task**, so this table is not a number you memorize — it's a measurement you take. A task where the answer genuinely depends on synthesizing across a large document has its knee much further right than a task where one paragraph has the answer and the rest is noise. Measuring where your own knee sits is exactly the discipline in [Testing Whether Context Helps](/learn/context-engineering/testing-whether-context-helps) and [A/B Testing Context Variants](/learn/context-engineering/ab-testing-context-variants) — run your task at a few context sizes, plot quality, don't assume the shape.

## Stating the tradeoff precisely

It's tempting to compress this into "less context is better" or "more context is better," and both are wrong in the same way: the curve says the *right amount* is a function of the task, not a constant. The precise statement is: cost and latency are monotonic non-decreasing functions of input tokens, quality is not, and the optimal operating point is wherever the marginal quality gain per additional token crosses below what that token costs you in cash and time — a threshold you set based on your product's actual tolerance for both. A latency-sensitive interactive assistant should sit left of a batch analysis job's knee, even on the identical task, because the two have different costs for the same millisecond.

This is also why "just use the biggest context window available" is a weaker default than it sounds, independent of the context-rot risk — it's paying the linear cost and latency tax on every call for a quality return that, past the knee, is flat or negative. Bigger windows are useful for raising the *ceiling* on hard tasks that genuinely need it — see [Million-Token Window Strategies](/learn/context-engineering/million-token-window-strategies) — not as a default operating point for tasks that don't.

**Related:** [Context Rot](/learn/context-engineering/context-rot), [Why More Tokens Hurt](/learn/context-engineering/why-more-tokens-hurt), [Retrieval vs. Context Stuffing](/learn/context-engineering/retrieval-vs-context-stuffing), [Budget as a Zero-Sum Pie](/learn/context-engineering/the-budget-allocation-mental-model)
