---
title: "Chain of Thought and Test-Time Compute"
track: "llm-foundations"
status: live
summary: "Intermediate reasoning tokens give a fixed-depth network scratch space it can condition on later — trading latency for a real shot at harder problems."
duration: "6 min read"
---

A transformer spends exactly the same amount of computation on every token it emits, no matter how hard the problem is. Chain of thought is the trick that gets around that fixed budget — not by making any single step smarter, but by taking more steps.

## What it is

Chain of thought (CoT) is the practice of having a model emit intermediate reasoning tokens — working through sub-steps, checking arithmetic, restating a constraint — before committing to a final answer, instead of jumping straight from question to answer. [Test-time compute](/learn/llm-foundations/reasoning-models-test-time-compute) is the broader idea this sits inside: spending more inference-time computation per query, as an alternative (or complement) to spending more compute once during training. CoT is the most common concrete mechanism for buying that extra compute.

## The mental model

A transformer's forward pass has a fixed number of layers, and a fixed number of attention/FFN operations happens per token position, regardless of how hard the *token* is to predict. If a problem genuinely requires more sequential computation than that fixed depth allows — say, tracking five interacting constraints, or carrying a multi-digit carry through several arithmetic steps — a single-token answer has nowhere to put the intermediate state. It has to be computed and discarded within one forward pass, with no scratch space.

Emitting reasoning tokens changes this by using the sequence dimension as a substitute for depth: each new token gets its own full forward pass, and — because of [causal masking](/learn/llm-foundations/causal-masking) — every later token can attend back over everything emitted so far, including the model's own prior reasoning. Writing down "carry the 1" as an actual token means every subsequent token can condition on that fact instead of needing to have derived and held it internally. [The autoregressive generation loop](/learn/llm-foundations/the-autoregressive-generation-loop) is what makes this available at all: the model's own output becomes part of its own input for the rest of the generation.

## Why it works this way

This is a genuine trade of sequence length for effective computation depth, not a trick of phrasing. A problem that needs `k` sequential sub-steps to solve reliably, and that can't be compressed into the model's fixed per-token compute budget, is a problem a single forward pass structurally cannot solve — no amount of "thinking harder" within one token position changes the number of layers available. Externalizing each sub-step as a token converts `k` sequential *internal* computation steps into `k` sequential *token-generation* steps, each with its own full pass through every layer. That's strictly more total computation spent on the problem, and it's spent precisely on the part of the problem (multi-step derivation) where a single pass runs out of room.

## A concrete example (shown)

Ask directly for the answer to a multi-step problem:

```
Q: A store has 3 shelves of 8 boxes each. Each box holds 6 items,
but 2 boxes on the last shelf are only half full. How many items total?
A: 132
```

That's wrong (the correct total is `3×8×6 − 2×3 = 144 − 6 = 138`) — a plausible-looking number produced in one step, with no visible arithmetic to check. Now the same problem with reasoning tokens:

```
Q: A store has 3 shelves of 8 boxes each. Each box holds 6 items,
but 2 boxes on the last shelf are only half full. How many items total?
A: Let's work through it.
   Total boxes if all were full: 3 shelves × 8 boxes = 24 boxes.
   Items if every box were full: 24 × 6 = 144 items.
   Two boxes are only half full, so each is missing 3 items: 2 × 3 = 6 items.
   Total: 144 − 6 = 138.
Answer: 138
```

Each line is a token-generation step conditioned on every line before it — the "24 boxes" fact is now sitting in context for the "144 items" step to use, instead of needing to be re-derived silently inside a single pass. Writing the intermediate quantities down is what makes the final subtraction a simple lookup instead of a multi-step computation squeezed into one token's worth of depth.

## Where it shows up

Plain prompted CoT ("think step by step" on an ordinary chat model) elicits reasoning-*shaped* text from a model that was never specifically trained to use it productively — see [chain-of-thought prompting](/learn/prompt-engineering/chain-of-thought-prompting) for that technique on its own. Purpose-built reasoning models take this further by training the model, via reinforcement learning, to actually benefit from longer chains rather than just imitating their surface form — covered in [how reasoning models are trained](/learn/llm-foundations/how-reasoning-models-are-trained). Both rest on the identical mechanism described above: more emitted tokens before the answer is more forward passes of computation available to the problem.

## Watch out for

- **CoT helps multi-step derivation, not retrieval or style.** A factual lookup or a rewrite doesn't get more correct from extra reasoning tokens — it just gets slower and more expensive, since there's no sequential sub-problem for the extra tokens to actually help with.
- **A stated reasoning trace isn't guaranteed to be the real basis for the answer.** Research on CoT faithfulness (Turpin et al., 2023) has found cases where a model's written-out reasoning doesn't match what actually determined its final answer — the trace can be a plausible post-hoc narration rather than a transcript of the real computation. Treat a chain of thought as a testable hypothesis about the model's reasoning, not a certified log of it.
- **Longer isn't automatically better.** Past the point where a problem's real sequential depth is covered, additional reasoning tokens mostly add latency and cost, and can occasionally introduce a wrong turn that a shorter, more disciplined trace would have avoided.

## Where next

[How reasoning models are trained](/learn/llm-foundations/how-reasoning-models-are-trained) covers what makes a model actually improve from long chains of thought — via training, not just via prompting.

**Related:** [Reasoning Models and Test-Time Compute](/learn/llm-foundations/reasoning-models-test-time-compute), [Chain-of-Thought Prompting](/learn/prompt-engineering/chain-of-thought-prompting), [Causal Masking](/learn/llm-foundations/causal-masking), [The Autoregressive Generation Loop](/learn/llm-foundations/the-autoregressive-generation-loop), [How Reasoning Models Are Trained](/learn/llm-foundations/how-reasoning-models-are-trained)
