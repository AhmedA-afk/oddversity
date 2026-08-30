---
title: "Fixed, Proportional, and Priority Budgets"
track: "context-engineering"
status: live
summary: "Four ways to allocate a token budget, run through the same overflow, compared by what each one drops and what it costs to build."
duration: "8 min read"
---

Every allocation strategy looks identical when nothing overflows. The differences only show up under pressure — so that's how we'll compare them: run the same overflow through all four and see what each one sacrifices.

## The scenario

Aria's 12,000-token budget: system 700, tools 1,000, reply headroom 2,000 (fixed), retrieval 3,800, history 4,500 (from [What a Token Budget Actually Is](/learn/context-engineering/what-a-token-budget-is)). A fact-heavy question comes in: the retrieval pipeline returns chunks totaling 6,000 tokens (up from a typical 3,000–3,500), and the ongoing conversation has history sitting at 4,200 tokens. Requested total: 700 + 1,000 + 6,000 + 4,200 + 2,000 = 13,900 — 1,900 tokens over the 12,000 cap. Four strategies, four different answers to "what gives."

## Greedy (unbudgeted) allocation

Segments are assembled in whatever order the code happens to build them — typically system, tools, history, retrieval, user message — with no caps checked along the way. Whatever's left after all of that is what the reply gets.

**How it works:** there's no allocation step at all; it's just concatenation, and the "budget" is only the provider's hard context limit, discovered by hitting it.

**When it wins:** never, as a deliberate choice — it's the default you get by not building a budget, not a strategy anyone picks on purpose. It "wins" only in the sense that it requires zero engineering effort up front.

**Failure mode:** in this scenario, system, tools, history, and retrieval get assembled in full (11,900 tokens), leaving only 12,000 − 11,900 = 100 tokens for the reply — nowhere near enough for a substantive answer, so the request is effectively over budget before generation even starts. Depending on the provider, this either errors outright or silently reduces the effective reply space to whatever's left, producing a truncated answer on exactly the turn that needed the most room to be thorough.

**Relative cost:** lowest to build, highest to operate — every overflow becomes an incident instead of a handled case.

## Fixed caps

Every segment gets a hard token ceiling, set once, independent of the others and independent of what a given query needs — this is the strategy built in [Setting Per-Segment Budgets](/learn/context-engineering/setting-per-segment-budgets).

**How it works:** retrieval is capped at 3,800 regardless of what came back; if the retrieved set is 6,000 tokens, [relevance filtering](/learn/context-engineering/relevance-filtering) trims it down to the highest-ranked 3,800 tokens' worth before assembly.

**When it wins:** when segment sizes are genuinely predictable and a query-by-query judgment call would just add complexity for no benefit — most agents with steady, similar-shaped queries.

**Failure mode:** it drops the excess retrieval — roughly 2,200 tokens of chunks, ranked lowest — even though *this specific query* is exactly the case where more retrieval would have helped most. Fixed caps are blind to the fact that this turn's question is unusually fact-dependent; they treat every turn identically.

**Relative cost:** low to build, low to operate, but the one strategy least able to adapt to a query that doesn't match the average case the caps were tuned against.

## Proportional-to-window

Caps are expressed as a percentage of the total budget rather than a raw number — retrieval at 31.67%, history at 37.5% — so they scale automatically when the total budget changes (a bigger context-window model, say).

**How it works:** identical arithmetic to fixed caps at a *fixed* window size — at Aria's current 12,000-token budget, 31.67% of retrieval still resolves to 3,800, so this scenario plays out exactly like the fixed-cap case: the excess 2,200 tokens of retrieval get trimmed the same way.

**When it wins:** the payoff isn't in this scenario, it's in what happens when the window changes size. Swap Aria to a 32,000-token working budget and proportional caps scale automatically — retrieval becomes ~10,133 tokens, history ~12,000 — without anyone re-tuning a config file. Fixed caps would leave that extra room sitting unused unless someone manually raised the numbers.

**Failure mode:** it inherits fixed caps' blindness to per-query needs, and adds a new one — on a much larger window, a proportional cap can hand retrieval far more tokens than a given task actually needs, tempting you into [context stuffing](/learn/context-engineering/retrieval-vs-context-stuffing) and the diminishing or negative returns covered in [The Cost, Latency, and Quality Curve](/learn/context-engineering/cost-latency-quality-tradeoff-curve).

**Relative cost:** low to build (one extra parameterization over fixed caps), low to operate, but requires someone to actually revisit the percentages when the task profile changes, not just when the window does.

## Priority-based allocation

Segments are ranked by how much this specific turn needs them, and higher-priority segments claim tokens first — a fact-heavy question ranks retrieval above history; a conversational follow-up ranks the reverse.

**How it works:** a cheap classifier tags the turn (fact-heavy vs. conversational), and the allocator reassigns tokens accordingly — for this overflow, it recognizes the question needs the full retrieval set and instead shrinks history's cap, summarizing or dropping older turns to free the needed 1,900 tokens rather than truncating retrieval at all. This is the mechanism built out in [Reallocating the Budget on the Fly](/learn/context-engineering/dynamic-budget-reallocation).

**When it wins:** when query types are genuinely bimodal — some turns need deep retrieval and can spare history, others need conversational continuity and barely touch retrieval — and getting the wrong segment trimmed measurably hurts answer quality.

**Failure mode:** it depends on the classifier being right. Misclassify a fact-heavy question as conversational and it shrinks the wrong segment — trimming retrieval that was actually needed, which is a worse outcome than the fixed-cap case because it looks like a deliberate, confident decision rather than an obvious blind spot.

**Relative cost:** highest to build (classifier plus reallocation policy plus the testing burden of a system with more moving parts) and highest to operate — every misclassification is a silent quality bug, not a loud error.

## Decision table

| Strategy | Adapts to query? | Adapts to window size? | Predictability | Engineering cost | Best for |
|---|---|---|---|---|---|
| Greedy (no budget) | No | No | Very low | None | Never — the absence of a strategy |
| Fixed caps | No | No | High | Low | Stable, uniform query patterns |
| Proportional | No | Yes | High | Low | Multiple models / changing window sizes |
| Priority-based | Yes | Partial | Medium | High | Genuinely bimodal query types |

## How to choose

Start with fixed or proportional caps — proportional if you expect to change models or window sizes, fixed if you won't. That combination (fixed floors for system and tools, proportional for retrieval and history) is the default in the [Token Budget Cheatsheet](/learn/context-engineering/token-budget-cheatsheet) for a reason: it's predictable, cheap, and correct for the common case. Reach for priority-based reallocation only once you have evidence — from the ledger in [A Per-Turn Token Ledger](/learn/context-engineering/token-accounting-per-turn-ledger) or the dashboard in [Building a Context Observability View](/learn/context-engineering/building-a-context-observability-dashboard) — that a static split is measurably losing quality on a recognizable class of queries. Building the classifier and reallocation policy before you have that evidence is solving a problem you haven't confirmed you have.

**Related:** [Setting Per-Segment Budgets](/learn/context-engineering/setting-per-segment-budgets), [Reallocating the Budget on the Fly](/learn/context-engineering/dynamic-budget-reallocation), [Token Budgeting Strategies](/learn/context-engineering/token-budgeting-strategies), [Token Budget Cheatsheet](/learn/context-engineering/token-budget-cheatsheet)
