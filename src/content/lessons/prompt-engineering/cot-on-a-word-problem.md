---
title: "Worked Example: Chain-of-Thought on a Multi-Step Problem"
track: "prompt-engineering"
status: live
summary: "A bakery word problem solved correctly with step-by-step reasoning, and wrongly when the prompt asks for just the number."
duration: "7 min read"
---

One problem, two prompts. The only difference between them is whether the model is allowed to write intermediate steps — and that difference decides whether the answer is right.

## The setup

The problem: *"A bakery starts the day with 144 muffins. In the morning, it sells 3/8 of them. Then the bakery bakes 36 more muffins. In the afternoon, it sells half of the muffins it now has. How many muffins does the bakery have at closing?"*

Worked by hand: morning sales are 3/8 × 144 = 54, leaving 90. Baking adds 36, giving 126. Afternoon sales are half of 126 = 63, leaving **63** muffins at closing. That's the ground truth we'll check both prompts against.

## Step by step

**Prompt A — reasoning allowed:**

```text
Solve this step by step, showing each calculation, then give the final
answer on its own line.

A bakery starts the day with 144 muffins. In the morning, it sells 3/8
of them. Then the bakery bakes 36 more muffins. In the afternoon, it
sells half of the muffins it now has. How many muffins does the bakery
have at closing?
```

Model output:

```text
Morning sales: 3/8 * 144 = 54. Remaining: 144 - 54 = 90.
Baking: 90 + 36 = 126.
Afternoon sales: half of 126 = 63. Remaining: 126 - 63 = 63.
FINAL_ANSWER: 63
```

> **Why this step?** Each line commits an intermediate value — 90, then 126 — as an actual written token before the next operation uses it. The "half of 126" calculation only works because 126 exists in the context as a concrete number, not something the model had to keep track of unwritten. This is the mechanism from [what chain-of-thought actually does](/learn/prompt-engineering/what-chain-of-thought-actually-does) applied to a real multi-step problem.

**Prompt B — answer only:**

```text
A bakery starts the day with 144 muffins. In the morning, it sells 3/8
of them. Then the bakery bakes 36 more muffins. In the afternoon, it
sells half of the muffins it now has. How many muffins does the bakery
have at closing? Answer with just the number.
```

Illustrative model output: **45**.

> **Why this step?** A plausible route to this wrong number: the model correctly computes the morning remainder (90), but with no token forcing it to apply the baking step before halving, it applies "half of what remains" straight to 90 — giving 45 — and skips the 36 muffins entirely. Nothing in a single short completion forces the operations to happen in the stated order; the model has to hold all three operations and their order in one forward pass, with no written checkpoint to catch a dropped step.

## Where it breaks (+fix)

Chain-of-thought fixes the *skipped-step* failure, but it doesn't make the prompt immune to a different kind of mistake: **referent ambiguity**. The phrase "half of the muffins it now has" is doing real work — it means half of 126 (after baking), not half of 90 (before baking). A model that's tracking too loosely could write a technically step-by-step trace that still misreads *which* running total "it now has" refers to, and confidently halve 90 instead of 126, landing on 45 even with visible reasoning.

The fix isn't more reasoning — it's removing the ambiguity the reasoning has to resolve. Two options:

1. **Rewrite the prompt to name quantities explicitly** instead of using pronouns across steps: *"...then sells half of the muffins remaining after the baking step."* This is the same move as [why ordering and whitespace matter](/learn/prompt-engineering/why-ordering-and-whitespace-matter) applied to logical referents instead of layout.
2. **Sample it more than once and vote.** If the ambiguity is subtle enough that you can't fully engineer it away, [self-consistency sampling](/learn/prompt-engineering/self-consistency-sampling-explained) catches the cases where one trace's misreading is an outlier against several correctly-ordered ones.

## Takeaways

- Chain-of-thought converts one hard leap (144 → 63 in one jump) into three easy ones (144→90→126→63), and the worked trace shows exactly which written value each later step depends on.
- It is not error-proof — ambiguous referents across steps can still produce a wrong answer even with visible reasoning, so "the model showed its work" isn't the same as "the work is right."
- Getting a clean, parseable number out of the trace still needs a convention — the `FINAL_ANSWER:` line here isn't incidental; see [extracting the final answer after reasoning](/learn/prompt-engineering/extracting-final-answer-from-reasoning) for how to pull it out reliably, including when the model forgets to include it.

**Related:** [What Chain-of-Thought Actually Does](/learn/prompt-engineering/what-chain-of-thought-actually-does), [Reasoning as a Scratchpad for a Token Predictor](/learn/prompt-engineering/reasoning-as-scratchpad-intuition), [Self-Consistency: Sampling and Voting](/learn/prompt-engineering/self-consistency-sampling-explained), [Reliably Extracting the Final Answer After Reasoning](/learn/prompt-engineering/extracting-final-answer-from-reasoning)
