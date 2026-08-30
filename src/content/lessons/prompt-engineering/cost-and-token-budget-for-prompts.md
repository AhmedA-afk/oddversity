---
title: "Cost and Token Budgets for Prompts"
track: "prompt-engineering"
status: live
summary: "The token arithmetic behind few-shot, chain-of-thought, self-consistency, and pipelines, and how to budget across a pipeline."
duration: "9 min read"
---

Every technique in this course that improves quality does it by spending tokens somewhere — this is the arithmetic for knowing exactly where, and whether it's worth it.

*This is the deferred-rigor lesson on cost — read it once you're choosing between techniques for a real pipeline, not while you're still learning what each one does.*

## Why token cost is worth analyzing rigorously

Input and output tokens are typically priced and behave differently, and output generation is usually the more expensive per-token operation — see [Tokens, Context, and Cost](/learn/ai-foundations/tokens-context-cost) for the base mechanics. Every technique taught in this course spends tokens as either an input multiplier, an output multiplier, or a call multiplier. Knowing which one tells you exactly how its cost scales as you turn the technique up.

## Costing each technique

### Few-shot: an input multiplier, paid every call

A base prompt of 200 tokens of instructions, plus 5 examples at roughly 150 tokens each: 200 + (5 × 150) = 950 input tokens, versus 200 for zero-shot — roughly 4.75x the input tokens, on every single call, forever. That's different from a one-time engineering cost: the examples don't get cheaper after the first use. See [Few-Shot Prompting](/learn/prompt-engineering/few-shot-prompting) — fewer, better-chosen examples buy most of the accuracy gain at a fraction of the ongoing cost.

### Chain-of-thought: an output multiplier

If a direct answer is 30 tokens, and reasoning through the problem first adds roughly 200 tokens of visible working before the final answer, that call now generates around 230 output tokens instead of 30 — close to an 8x output-token cost for that response, even though the deliverable is still the 30-token answer. See [Chain-of-Thought Prompting](/learn/prompt-engineering/chain-of-thought-prompting). The reasoning tokens are billed whether or not the task actually needed them, which is why asking for step-by-step reasoning on every prompt regardless of difficulty is a real cost problem, not just a stylistic one.

### Self-consistency: a call multiplier on top of the output multiplier

Self-consistency runs the same chain-of-thought prompt N times and votes. If one CoT call costs roughly 230 output tokens as above, 10 samples cost roughly 2,300 output tokens plus 10x the input tokens too, since the whole prompt is resent each time. Running the samples in parallel keeps wall-clock latency close to one call, but it does not reduce the token bill — cost is still roughly N times one run, not cheaper because of parallelism. See [Self-Consistency: Voting Across Multiple Reasoning Paths](/learn/prompt-engineering/self-consistency-sampling) — this is exactly why it's reserved for tasks where a wrong answer is expensive, not applied by default.

### Pipelines and decomposition: a sum of narrower stages, not automatically cheaper

Splitting one large prompt into a classify-then-extract-then-summarize pipeline doesn't automatically cost less — it's now N separate calls, each with its own instruction overhead. What it can save is input tokens per stage, if each stage only needs a narrow slice of context instead of the whole document plus every instruction for every job at once. See [Task Decomposition](/learn/prompt-engineering/task-decomposition) — the saving is real only when each stage's context is genuinely smaller than the monolith's, not just when the prompts look cleaner on the page.

## Trimming a bloated prompt without losing quality

- Audit the system prompt for rules that never actually change behavior on your eval set — a rule nothing in your test cases exercises is pure overhead.
- Cut few-shot examples that don't teach a genuinely new case — two examples differing only in surface wording teach the same thing twice.
- Replace prose instructions with a compact schema wherever the constraint is structural (fields, types, enums) rather than a matter of judgment — seven sentences describing a JSON shape usually compress into the shape itself. See [Structured Output](/learn/prompt-engineering/structured-output).
- If your API supports prompt caching for a large, repeated static block (a long system prompt, a reference document resent every turn), that repeated cost drops on a cache hit — check your provider's specifics rather than assuming a fixed number, since this varies by provider and changes over time.

## Budgeting across a pipeline

An illustrative three-stage ticket-processing pipeline — token counts are illustrative units, not pricing:

| Stage | Input tokens | Output tokens | Technique |
|---|---|---|---|
| Classify | 300 (ticket + short instructions) | 10 (one label) | zero-shot |
| Extract | 400 (ticket + schema) | 80 (JSON) | structured output, no CoT |
| Summarize | 500 (ticket + prior-stage context) | 60 (one paragraph) | zero-shot |
| **Total** | **1,200** | **150** | — |

Now compare adding self-consistency (5 samples) only at the classify stage, because a wrong classification derails everything downstream while a slightly-off summary doesn't: the classify stage becomes 5 × (300 + 10) = 1,550 tokens instead of 310, while extract and summarize are untouched. That's a targeted spend — the expensive technique goes where a wrong answer is costliest to fix downstream, not applied uniformly across every stage. It's the same instinct as not defaulting to chain-of-thought everywhere: spend the budget where the accuracy actually buys something, and treat every defense layer added for [robustness or injection resistance](/learn/prompt-engineering/defending-with-delimiters-and-roles) the same way — as a real line item, not a free addition.

**Related:** [Tokens, Context, and Cost](/learn/ai-foundations/tokens-context-cost) · [Few-Shot Prompting](/learn/prompt-engineering/few-shot-prompting) · [Chain-of-Thought Prompting](/learn/prompt-engineering/chain-of-thought-prompting) · [Self-Consistency: Voting Across Multiple Reasoning Paths](/learn/prompt-engineering/self-consistency-sampling) · [Task Decomposition](/learn/prompt-engineering/task-decomposition) · [Structured Output](/learn/prompt-engineering/structured-output) · [Defense in Depth: Delimiters, Roles, and Trust Boundaries](/learn/prompt-engineering/defending-with-delimiters-and-roles)
