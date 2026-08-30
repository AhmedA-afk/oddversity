---
title: "Zero-Shot CoT vs Few-Shot CoT"
track: "prompt-engineering"
status: live
summary: "Four ways to prompt reasoning on the same problem, and when a trigger phrase is enough versus when you need worked examples."
duration: "8 min read"
---

"Let's think step by step" and a block of worked examples both make a model reason — but they don't buy you the same thing, and they don't cost the same. Run both on one problem and the gap becomes concrete.

Task for all four variants: *"A jacket costs $80. It's on sale for 25% off, and there's an additional $10 store credit applied after the discount. What's the final price?"* Worked by hand: 80 × 0.75 = 60, then 60 − 10 = $50.

## Bare zero-shot (no trigger, no examples)

**How it works:** a plain instruction with nothing asking for reasoning and nothing showing an example. `"What's the final price? Answer with just the number."`

**When it wins:** the task is a lookup, a simple classification, or otherwise doesn't require combining more than one fact — see [zero-shot: when it's enough](/learn/prompt-engineering/zero-shot-when-its-enough).

**Failure mode:** multi-step composition gets skipped or reordered. Illustrative output here: **$70** — a plausible route is applying the flat $10 credit before the percentage instead of after (80 − 10 = 70, then discount forgotten), since nothing forces the order.

**Relative cost:** lowest — a handful of output tokens, one call.

## Zero-shot CoT (trigger phrase)

**How it works:** append a trigger like `"Let's think step by step."` with no worked examples. The phrase alone reliably induces a visible reasoning trace, as covered in [chain-of-thought prompting](/learn/prompt-engineering/chain-of-thought-prompting).

**When it wins:** the reasoning *shape* is common and general — "apply a percentage, then subtract a flat amount" is a pattern the model has almost certainly seen worked out many times, so being told to slow down is enough to reliably produce it correctly: `"25% of 80 is 20, so 80 - 20 = 60. Then subtract the $10 credit: 60 - 10 = 50."`

**Failure mode:** the phrase tells the model to write steps, not *which* steps or in *what order* — if the domain has a non-obvious convention (say, the store credit legally has to apply before any percentage discount, not after), the trigger alone doesn't encode that rule, so the model reasons fluently through the *wrong* order.

**Relative cost:** moderate — reasoning tokens added (roughly a few dozen to a hundred), but nothing repeated across calls.

## Few-shot CoT (worked demonstrations)

**How it works:** show one or two prior problems with their full reasoning traces and answers, in the exact format you want, before the target problem — see [few-shot prompting](/learn/prompt-engineering/few-shot-prompting).

**When it wins:** the task has a convention the model wouldn't guess on its own. If "apply store credit before the discount" is your actual business rule, a demonstration that shows that exact order pins it down in a way the generic trigger phrase cannot, because the model is now pattern-matching against your specific shown steps, not "generic careful reasoning."

**Failure mode:** narrow or repetitive examples can teach the surface pattern too rigidly — the model force-fits new problems into the shown shape even when it doesn't apply, a version of the issue covered in [few-shot format leakage](/learn/prompt-engineering/few-shot-format-leakage) and [label bias and majority label](/learn/prompt-engineering/label-bias-and-majority-label).

**Relative cost:** highest — each worked example adds tens to hundreds of tokens, on every single call, on top of the reasoning tokens the new problem still generates.

## Few-shot direct (examples, no visible reasoning)

**How it works:** show input→output pairs with no reasoning shown, just the final answer in the target format — see [zero-shot vs few-shot](/learn/prompt-engineering/zero-shot-vs-few-shot).

**When it wins:** the bottleneck is output *format* or label vocabulary, not computation — you need consistent structure more than you need help solving anything.

**Failure mode:** on this task it fails the same way bare zero-shot does. Examples fix format and style; with no reasoning demonstrated, there's still no scratchpad token forcing the order of operations, so composition errors persist.

**Relative cost:** low to moderate — short examples, but no reasoning tokens.

## Decision table

| Variant | Shows reasoning? | Uses examples? | Fixes ordering/convention? | Token cost |
|---|---|---|---|---|
| Bare zero-shot | No | No | No | Lowest |
| Zero-shot CoT | Yes | No | Only if convention is generic | Low-moderate |
| Few-shot CoT | Yes | Yes | Yes | Highest |
| Few-shot direct | No | Yes | No | Low-moderate |

## How to choose

Start by asking whether the task needs reasoning at all. If it doesn't — pure lookup or classification — skip both CoT variants and pick between the two direct options based on whether output format needs pinning down.

If it does need reasoning, default to the zero-shot trigger phrase first; it's the cheapest way to get a real scratchpad, and it's usually sufficient when the reasoning pattern is a common, generic shape. Reach for few-shot CoT specifically when a generic "think step by step" leaves real ambiguity about *which* steps or *what order* — a domain-specific convention, a scoring rubric, a rule about which quantity applies first. That's the one thing worked examples buy you that a trigger phrase can't: they show the model *your* steps, not just "some steps."

If correctness on a standard reasoning shape is high-stakes, it's usually cheaper to keep the trigger-phrase prompt and add [self-consistency sampling](/learn/prompt-engineering/self-consistency-sampling-explained) — voting across several zero-shot-CoT runs — than to upgrade to few-shot CoT, since the few-shot tokens are paid on every single call while sampling cost only shows up when you actually invoke it.

**Related:** [Chain-of-Thought Prompting](/learn/prompt-engineering/chain-of-thought-prompting), [Zero-Shot vs Few-Shot](/learn/prompt-engineering/zero-shot-vs-few-shot), [Few-Shot Prompting](/learn/prompt-engineering/few-shot-prompting), [What Chain-of-Thought Actually Does](/learn/prompt-engineering/what-chain-of-thought-actually-does), [Self-Consistency: Sampling and Voting](/learn/prompt-engineering/self-consistency-sampling-explained)
