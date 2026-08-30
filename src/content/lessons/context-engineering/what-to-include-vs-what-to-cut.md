---
title: "The Include-or-Cut Decision"
track: "context-engineering"
status: live
summary: "Every candidate token has to earn its place in the window — a value-per-token heuristic for deciding what stays."
duration: "7 min read"
---

You retrieved ten chunks for a question that needs maybe two of them. The tempting move is to hand the model all ten and let it sort things out. The better move is to treat every chunk as a candidate that has to justify its token cost before it gets in.

## What it is

The include-or-cut decision is the step, before you ever assemble a prompt, where you decide which candidate content actually enters the context window. It sits downstream of retrieval (which finds candidates) and upstream of ordering (which arranges what's left) — see [Relevance Filtering: Deciding What Doesn't Make the Cut](/learn/context-engineering/relevance-filtering) for the fuller treatment of the filtering step itself. This lesson is about the decision rule you apply at that step: given a candidate, in or out?

The naive version of this decision is a fixed top-k: always keep the top 5, or top 10, regardless of how good chunk 5 actually is. The better version scores each candidate's *value per token* and cuts anything that doesn't clear a bar, independent of how many slots you happened to leave open.

## The mental model

Think of context as a budget you're spending, not a container you're filling. Every token you admit has an opportunity cost: it's a token the model has to read, weight, and potentially get distracted by, and it's a token that isn't available for something else if you're near a limit (see [Token Budgeting Strategies](/learn/context-engineering/token-budgeting-strategies) for the budget side of this same tradeoff). So instead of asking "is this chunk relevant enough to include," ask:

```text
value_per_token = relevance_score / token_cost
```

Rank candidates by that ratio, not by raw relevance alone. A chunk that's 90% relevant and 400 tokens long can lose to one that's 75% relevant and 60 tokens long, because the second one delivers more signal per token spent. Then apply a floor — a minimum relevance score below which a chunk doesn't get in no matter how cheap it is, because a short irrelevant chunk still dilutes attention (see [Signal-to-Noise in the Window](/learn/context-engineering/signal-to-noise-in-context) for why cheap noise is still noise).

## Why it works this way

Two separate costs are at play, and value-per-token collapses them into one comparable number. The first is the budget cost — tokens you pay for and that push against your context limit. The second is the attention cost — every additional passage in the window is something the model has to hold weight for, and low-value passages compete with high-value ones for the model's limited attention, especially once you factor in positional effects like [lost-in-the-middle](/learn/context-engineering/lost-in-the-middle). A heuristic that only looked at budget cost would happily admit ten mediocre chunks that fit; a heuristic that only looked at relevance would admit a barely-better chunk that costs five times as many tokens. Value-per-token forces both costs onto the same scale.

## A concrete example (shown)

Say a user asks "what's your refund window for damaged items?" and retrieval returns ten chunks, each with a similarity score (0–1) and a token count:

| Chunk | Content gist | Similarity | Tokens | Value/token (×1000) |
|---|---|---|---|---|
| 1 | Refund policy: damaged items, 30-day window | 0.91 | 80 | 11.4 |
| 2 | Refund policy: general returns, 14-day window | 0.74 | 90 | 8.2 |
| 3 | Shipping damage claim process | 0.68 | 220 | 3.1 |
| 4 | FAQ: "can I get a refund" (near-duplicate of #1) | 0.88 | 340 | 2.6 |
| 5 | Warranty terms for electronics | 0.52 | 150 | 3.5 |
| 6 | Store credit policy | 0.49 | 110 | 4.5 |
| 7 | International shipping rates | 0.31 | 200 | 1.6 |
| 8 | Company return address | 0.28 | 40 | 7.0 |
| 9 | Loyalty program terms | 0.22 | 180 | 1.2 |
| 10 | Careers page snippet (retrieval noise) | 0.11 | 130 | 0.8 |

Ranked by similarity alone, a naive top-3 keeps chunks 1, 4, and 2 — and chunk 4 is a bloated near-duplicate of chunk 1 that adds 340 tokens for almost no new information (this is exactly the redundancy problem covered in [Relevance Filtering in Depth](/learn/context-engineering/relevance-filtering-in-depth)). Ranked by value-per-token, chunk 4 drops out and chunk 8 — short, on-topic, cheap — earns a spot instead. The survivors: chunk 1 (the direct answer), chunk 2 (the general policy it overrides), and chunk 8 (where to send the item). That's 210 tokens total instead of the 510 tokens a similarity-only top-3 would have spent, and none of it is a redundant restatement.

Illustrate the payoff with simple arithmetic: if the model's answer quality tracks how much of its attention lands on genuinely relevant tokens, then packing 510 tokens with one near-duplicate chunk means roughly a third of that budget is dead weight, while the 210-token cut version is close to 100% signal. That's the entire case for cutting — it's not really about token savings, it's that every token you don't cut is competing for the same attention as the ones you kept.

## Where it shows up

This decision runs everywhere retrieval feeds a prompt: RAG pipelines choosing which chunks to concatenate, agents deciding which tool outputs to keep across turns, and multi-source assembly where profile data, retrieved docs, and conversation history all compete for the same window. Anywhere you have more candidate content than you're willing to spend tokens on, this is the gate that decides what passes through.

## Watch out for

- **Treating similarity score as the whole story.** A high-similarity chunk that's redundant with one you already kept adds tokens without adding information. Score for marginal value, not just raw relevance.
- **A relevance floor that's too generous.** If your cutoff lets in anything "somewhat related," you've just renamed top-k filtering — the floor needs to reject content a human reviewer would call irrelevant to *this* query, not merely on-topic in general.
- **Optimizing for recall at inclusion time.** It feels safer to keep a marginal chunk "just in case," but a marginal chunk costs attention immediately and only helps in the rare case it turns out to matter — that trade is usually a loser.

## Where next

Once you can decide what's in and what's out, the next question is *where* the survivors go — see [Ordering Context for Attention](/learn/context-engineering/ordering-context-for-attention) for placing your highest-value survivors where the model actually looks. If you want the filtering step itself in more depth — thresholds, redundancy detection, task-conditioning — go to [Relevance Filtering in Depth](/learn/context-engineering/relevance-filtering-in-depth) next.

**Related:** [Relevance Filtering: Deciding What Doesn't Make the Cut](/learn/context-engineering/relevance-filtering), [Signal-to-Noise in the Window](/learn/context-engineering/signal-to-noise-in-context), [Token Budgeting Strategies](/learn/context-engineering/token-budgeting-strategies), [Relevance Filtering in Depth](/learn/context-engineering/relevance-filtering-in-depth)
