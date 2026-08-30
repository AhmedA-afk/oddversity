---
title: "Extended Thinking and Reasoning-Effort Budgets"
track: "prompt-engineering"
status: live
summary: "Native reasoning modes versus hand-rolled chain-of-thought, and when to let a model deliberate instead of prompting steps."
duration: "7 min read"
---

[Extended thinking and reasoning effort](/learn/prompt-engineering/extended-thinking-and-reasoning-effort) covers what the budget controls do. The question this lesson answers is different: when do you reach for that native mechanism instead of writing your own step-by-step instructions into the prompt — and what happens if you do both.

## What it is

Native reasoning modes give certain models a separate deliberation phase, controlled by a budget or effort setting rather than by anything you write in the visible prompt — a token budget on Claude's thinking, a `low`/`medium`/`high` effort level on OpenAI's reasoning models. Hand-rolled chain-of-thought is the alternative covered throughout the rest of this module: asking any model, reasoning-capable or not, to produce visible intermediate steps as part of its regular output.

## The mental model

On a model with no native reasoning phase, hand-rolled CoT is the *only* way to get intermediate reasoning tokens — you must ask for them in the visible completion, and each one is a normal, billed output token, exactly as covered in [what chain-of-thought actually does](/learn/prompt-engineering/what-chain-of-thought-actually-does).

On a reasoning model, deliberation can already happen without any "think step by step" instruction in your prompt at all — the budget or effort setting controls how much of it happens, independent of your wording. Telling a reasoning model to "think step by step" *in addition to* setting a high thinking budget mostly duplicates an instruction the model is already primed to follow. It isn't harmful, but it isn't adding much either — similar to over-specifying a setting that's already the default.

## Why it works this way

The training difference is the substance here, not just the API surface. Reasoning models are typically trained specifically on the deliberation phase — to explore, backtrack, and revise before the visible answer starts — in a way that prompted narration on a non-reasoning model can only approximate through text it writes once and doesn't revisit. So on a reasoning model, raising the budget generally buys more of that trained, revisable deliberation. On a non-reasoning model, no such phase exists — writing the steps into the visible output is the entire mechanism you have.

## A concrete example (shown)

Take this problem: *"You invest $2,000 at 6% annual interest, compounded annually, for 3 years. The terms say: if you withdraw before year 3, you lose the third year's interest entirely and pay a flat $50 fee. You withdraw right at the 3-year mark. How much do you have?"*

The trap: withdrawing *at* year 3 is not withdrawing *before* year 3, so the penalty clause doesn't apply at all. Worked correctly: 2000 × 1.06³ = **$2,382.03**, no fee.

**Illustrative low-effort deliberation:** the model spots the words "penalty" and "fee," pattern-matches to "early withdrawal," and applies the clause anyway — computing something like two years of interest minus the fee (2000 × 1.06² − 50 ≈ $2,197.20) — without pausing to check whether "at year 3" actually satisfies the "before year 3" condition.

**Illustrative high-effort deliberation:** the trace explicitly checks the conditional — *"withdrawal is at year 3, which is not 'before year 3', so the penalty clause does not apply"* — before computing the full three years of compounding: 2000 × 1.06³ = $2,382.03.

The difference isn't that high effort "tries harder" in some vague sense — it's that more deliberation gave the model room to check a conditional clause against the specific facts before committing, the same mechanical benefit chain-of-thought provides, just happening in a phase you didn't have to prompt into existence.

## Where it shows up

Multi-constraint problems with an easy-to-skip edge case, debugging that requires tracing a subtle issue through several layers, long-horizon agentic planning where an early wrong tool call wastes many subsequent turns, and math or logic tasks with a conditional clause easy to apply automatically instead of checking.

## Watch out for

- **Redundant stacking.** Don't add "think step by step" on top of an already-high thinking budget expecting a multiplicative effect — you're mostly asking twice for the same thing.
- **Paying for nothing on easy tasks.** Cranking effort to maximum by default burns latency and cost on calls where the model already gets it right at low effort — the same failure as forcing CoT onto a trivial task, covered in [when chain-of-thought hurts](/learn/prompt-engineering/when-cot-hurts-accuracy) and in [extended thinking and reasoning effort](/learn/prompt-engineering/extended-thinking-and-reasoning-effort) directly.
- **It's not available everywhere.** A model without native reasoning has no budget knob at all — hand-rolled CoT is your only lever there, so don't assume the setting exists when you move between providers; see [prompt portability across models](/learn/prompt-engineering/prompt-portability-across-models-strategy).

## Where next

**Related:** [Extended Thinking and Reasoning Effort](/learn/prompt-engineering/extended-thinking-and-reasoning-effort), [Chain-of-Thought Prompting](/learn/prompt-engineering/chain-of-thought-prompting), [What Chain-of-Thought Actually Does](/learn/prompt-engineering/what-chain-of-thought-actually-does), [Which Reasoning Technique When](/learn/prompt-engineering/reasoning-technique-decision-guide)
