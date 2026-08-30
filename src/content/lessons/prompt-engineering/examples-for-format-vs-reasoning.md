---
title: "Examples for Format vs Examples for Reasoning"
track: "prompt-engineering"
status: live
summary: "Format-only shots teach the output shape; reasoning-showing shots teach the procedure. Using the wrong one produces confident wrong numbers."
duration: "7 min read"
---

A JSON object can be perfectly valid, perfectly shaped, and still contain a wrong number — and nothing about looking at it tells you which one you've got. That gap is exactly where format-only examples quietly fail on tasks that secretly need reasoning.

## The setup

You're building a reorder tool for a retail ops system. Given a short description of stock, sales rate, safety-stock target, and lead time, it should output a strict schema: `{"reorder_qty": <int>, "reason": <string>}`. The underlying rule, never stated explicitly to the model beyond what the examples show: `reorder_qty = avg_daily_sales × (lead_time_days + safety_stock_days) − current_stock`, floored at zero.

## Step by step

### Step 1 — Format-only shots

Two examples, each showing a finished, correct JSON object with no visible arithmetic:

```text
Input: "We have 40 units on the shelf, sell about 5 a day, want 3 days of
safety stock and lead time is 4 days."
Output: {"reorder_qty": 0, "reason": "Current stock covers demand through lead time and safety buffer."}

Input: "We have 10 units on the shelf, sell about 8 a day, want 2 days of
safety stock and lead time is 5 days."
Output: {"reorder_qty": 46, "reason": "Projected demand during lead time plus safety stock exceeds current stock by 46 units."}
```

> **Why this step?** These shots teach the *shape* — two keys, an integer, a one-sentence reason — perfectly. But nothing here shows the arithmetic that turned "8 a day, 5 days lead time, 2 days safety stock, 10 on the shelf" into 46. The model has to reproduce that computation itself, silently, using its own general math ability, with the examples offering no guidance on *how*.

### Step 2 — Run format-only shots on a harder input

```text
Input: "We have 15 units on the shelf plus 20 more arriving tomorrow, we
sell about 6 a day, want 4 days of safety stock and lead time is 3 days."
```

The correct calculation combines both stock figures first: total available = 15 + 20 = 35; demand during coverage window = 6 × (3 + 4) = 42; reorder = 42 − 35 = **7**. Neither format-only example ever showed a case with stock arriving from two sources, so there's nothing in the demonstrated pattern telling the model to add them before subtracting. A plausible failure: the model treats "15 units on the shelf" as the only current stock, ignoring the 20 in transit, and returns `{"reorder_qty": 27, "reason": "Projected demand exceeds current stock by 27 units."}` — a clean, valid, confident-sounding object with the wrong number inside it.

> **Why this step?** This is the actual failure mode of format-only shots on a task that secretly requires reasoning: the output always *looks* right, which makes a wrong number more dangerous than an obviously malformed one, because nothing about a valid schema signals that it needs a second look.

### Step 3 — Reasoning-showing shots

Rewrite the same two examples so the arithmetic is part of what's demonstrated, ending in the same JSON:

```text
Input: "We have 40 units on the shelf, sell about 5 a day, want 3 days of
safety stock and lead time is 4 days."
Reasoning: Demand during coverage window = 5 x (4 + 3) = 35. Current stock = 40.
35 - 40 = -5, which is negative, so no reorder is needed.
Output: {"reorder_qty": 0, "reason": "Current stock covers demand through lead time and safety buffer."}

Input: "We have 10 units on the shelf, sell about 8 a day, want 2 days of
safety stock and lead time is 5 days."
Reasoning: Demand during coverage window = 8 x (5 + 2) = 56. Current stock = 10.
56 - 10 = 46.
Output: {"reorder_qty": 46, "reason": "Projected demand during lead time plus safety stock exceeds current stock by 46 units."}
```

> **Why this step?** Now the examples demonstrate a *procedure* — compute total demand over the coverage window, compute total available stock, subtract, floor at zero — not just an input/output shape. Completing this pattern means applying the same steps to the new numbers, not guessing at a shape that happens to look similar. This is the same lever [chain-of-thought prompting](/learn/prompt-engineering/chain-of-thought-prompting) pulls; here it's demonstrated through worked examples rather than a bare "think step by step" instruction.

### Step 4 — Run reasoning-showing shots on the same harder input

The demonstrated procedure includes "compute total available stock" as its own explicit step, which prompts the model to notice there are two stock figures to combine: total available = 15 + 20 = 35; demand = 6 × (3 + 4) = 42; reorder = 42 − 35 = **7**. Output: `{"reorder_qty": 7, "reason": "Projected demand during lead time plus safety stock exceeds available stock (including incoming shipment) by 7 units."}` — correct, because the shown procedure had an explicit slot for "total available stock" that made the arriving shipment something to account for, not something to overlook.

This isn't a guarantee against every future case. If a new input needs a genuinely different procedure — say, stock split across two warehouses — reasoning-showing examples can't invent a new step out of nowhere; the model may still try to force the new input into the procedure it's already seen.

## Where it breaks (+fix)

Reasoning-showing examples generalize only as far as the procedure they demonstrate. A case with a twist the shown steps never modeled — partial returns, stock in transit *and* on backorder, a different unit of measure — can still get force-fit into the wrong procedure, just with fabricated-looking intermediate steps instead of a wrong-looking final number. The fix at that point isn't another hand-written example for every conceivable variant; it's naming the general class of complication in the instruction alongside the worked examples, or moving to a genuine "show your work" instruction rather than trying to enumerate every procedure by demonstration — see [Zero-Shot CoT vs Few-Shot CoT](/learn/prompt-engineering/zero-shot-cot-vs-few-shot-cot) for that tradeoff.

The reverse mistake is just as real: format-only shots aren't wrong in general, they're wrong specifically when the transformation secretly requires computation. For a task that's genuinely just reshaping — renaming fields, reformatting a date, mapping one enum to another — format-only shots are cheaper and entirely sufficient, and adding reasoning steps to a lookup task just burns tokens narrating a decision that was never in question.

## Takeaways

- Use format-only shots for structural transformations with no real reasoning step — reshaping, renaming, fixed-schema extraction from text that already states the answer.
- Use reasoning-showing shots whenever getting the right *answer* — not just the right shape — depends on carrying out a procedure. The schema is the easy part; the arithmetic or logic is where format-only shots quietly fail.
- A clean, schema-valid output is not evidence the value inside it is correct — that's exactly what format-only shots produce on a reasoning task, and it's more dangerous than an obviously broken output because nothing flags it for a second look.
- The two aren't mutually exclusive in production: many real pipelines use reasoning-showing shots to get the number right, then a separate formatting pass to strip the visible reasoning down to a clean schema for downstream consumption — see [Structured Output](/learn/prompt-engineering/structured-output).

**Related:** [Chain-of-Thought Prompting](/learn/prompt-engineering/chain-of-thought-prompting) · [Structured Output](/learn/prompt-engineering/structured-output) · [In-Context Learning: Teaching by Example at Inference Time](/learn/prompt-engineering/in-context-learning-for-prompters) · [Zero-Shot CoT vs Few-Shot CoT](/learn/prompt-engineering/zero-shot-cot-vs-few-shot-cot)
