---
title: "Which Reasoning Technique When: A Decision Guide"
track: "prompt-engineering"
status: live
summary: "Five reasoning techniques compared on cost and failure mode, with three worked scenarios routed to the right one."
duration: "8 min read"
---

Every technique in this module trades tokens for accuracy in a different way, on a different shape of task. This is the map: five techniques, what each one actually buys you, and three real scenarios routed through it.

## Zero-shot (direct answer)

**How it works:** a single instruction, no scratchpad, no examples of reasoning.

**When it wins:** the task is a lookup, classification, or formatting job with a small fixed answer space and no real multi-step composition — see [zero-shot: when it's enough](/learn/prompt-engineering/zero-shot-when-its-enough).

**Failure mode:** multi-step composition gets skipped or reordered steps, as shown concretely in [chain-of-thought on a multi-step problem](/learn/prompt-engineering/cot-on-a-word-problem).

**Relative cost:** lowest — one call, minimal output tokens.

## Chain-of-thought

**How it works:** prompt for explicit intermediate steps before the answer, via a trigger phrase or worked examples — see [zero-shot CoT vs few-shot CoT](/learn/prompt-engineering/zero-shot-cot-vs-few-shot-cot).

**When it wins:** the task decomposes into a handful of dependent sub-steps a competent human wouldn't skip — arithmetic, multi-hop lookup, ordered logic. See [what chain-of-thought actually does](/learn/prompt-engineering/what-chain-of-thought-actually-does).

**Failure mode:** a single wrong step early in the chain propagates uncorrected to the end — no backtracking exists within one linear trace.

**Relative cost:** moderate — reasoning tokens add up to a few hundred tokens, still one call.

## Self-consistency

**How it works:** sample the chain-of-thought prompt N times at nonzero temperature, take the majority final answer — see [self-consistency: sampling and voting](/learn/prompt-engineering/self-consistency-sampling-explained).

**When it wins:** the task has a short, checkable final answer, and errors across samples are roughly independent — it corrects occasional slips without needing to know which step went wrong.

**Failure mode:** cost scales linearly in N for shrinking accuracy returns, and if per-sample accuracy is already below half, voting can reinforce a popular wrong answer rather than fix it.

**Relative cost:** high — N full calls, though usually parallelizable, so latency stays near one call while token spend is N times.

## Tree-of-thought

**How it works:** branch into several candidate next steps, evaluate and prune, repeat — search rather than one linear chain. See [tree-of-thought: when the complexity pays off](/learn/prompt-engineering/tree-of-thought-when-worth-it).

**When it wins:** a discrete search over enumerable choices, where an early wrong move dead-ends the whole attempt and partial states can be reliably scored — planning puzzles, constrained scheduling.

**Failure mode:** heavy token and orchestration cost — a custom search loop, evaluator calls — wasted entirely on tasks without a real branching structure.

**Relative cost:** highest — roughly branching-factor × depth calls, plus evaluation calls at each level.

## Native extended thinking

**How it works:** let a reasoning model deliberate in a dedicated phase controlled by a budget or effort setting, instead of prompting steps into the visible output. See [extended thinking and reasoning-effort budgets](/learn/prompt-engineering/extended-thinking-budgets).

**When it wins:** you're already on a reasoning model and the task needs real deliberation — you get trained-in exploration and backtracking without writing or parsing a visible chain-of-thought trace yourself.

**Failure mode:** not available on non-reasoning models at all; cranking effort to maximum on a simple task burns latency and cost for no gain, the same failure as forcing chain-of-thought onto a trivial task.

**Relative cost:** variable and provider-controlled — you set a budget or effort level rather than counting your own prompt tokens, but it's billed like any other generated token.

## Decision table

| Technique | Multiple calls? | Recovers from a bad step? | Best task shape | Relative cost |
|---|---|---|---|---|
| Zero-shot | No | No | Lookup / simple classification | Lowest |
| Chain-of-thought | No | No | Linear multi-step composition | Low-moderate |
| Self-consistency | Yes (N) | Partially, via voting | Short checkable answer, independent slips | High |
| Tree-of-thought | Yes (branching × depth) | Yes, by pruning | Discrete search / planning | Highest |
| Native extended thinking | No (one longer call) | Yes, in-phase | Any hard task, on a reasoning model | Variable |

## How to choose

**Classification** (support-ticket urgency, sentiment, moderation label): a small fixed label set, decidable from the text without composition. Default to zero-shot; reach for self-consistency only when the case is genuinely ambiguous and stakes justify the extra calls — see [worked example: voting over samples on a hard classification](/learn/prompt-engineering/self-consistency-on-classification-worked).

**Math or logic word problem** (single path, verifiable numeric answer): real composition, short checkable answer. Default to chain-of-thought; upgrade to self-consistency when correctness is high-stakes and per-sample accuracy is already comfortably above half.

**Planning or puzzle** (multiple discrete choices, an early move can dead-end everything): reach for tree-of-thought if you can define a trustworthy partial-state evaluator. Without one, chain-of-thought plus self-consistency is a cheaper fallback — accept that it won't recover from a shared bad first move as well as branching would.

One meta-rule sits above all three: if you're on a reasoning model, try native extended thinking first for a hard task before hand-building any of the above — it's the cheapest way to buy more deliberation. Add prompted chain-of-thought, self-consistency, or tree-of-thought on top only if evaluation shows the native budget alone isn't enough.

**Related:** [What Chain-of-Thought Actually Does](/learn/prompt-engineering/what-chain-of-thought-actually-does), [Self-Consistency: Sampling and Voting](/learn/prompt-engineering/self-consistency-sampling-explained), [Tree-of-Thought: When the Complexity Pays Off](/learn/prompt-engineering/tree-of-thought-when-worth-it), [Extended Thinking and Reasoning-Effort Budgets](/learn/prompt-engineering/extended-thinking-budgets), [Cargo-Cult Reasoning](/learn/prompt-engineering/cargo-cult-reasoning)
