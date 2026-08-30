---
title: "Temperature for Prompt Engineers: When to Turn It Down"
track: "prompt-engineering"
status: live
summary: "Temperature controls how much randomness gets injected into next-token choice, and most production tasks want less of it."
duration: "6 min read"
---

Turning temperature down is often the single cheapest reliability improvement available to you, and it costs nothing but a parameter change.

## What it is

Temperature and top-p control how the model samples from the next-token probability distribution it computes — they don't change what that distribution contains, only how much randomness gets injected when picking a token from it (see [sampling: temperature and top-p](/learn/llm-foundations/sampling-temperature-top-p) for the mechanism, and [why prompts steer next-token prediction](/learn/prompt-engineering/why-prompts-steer-next-token-prediction) for where the distribution itself comes from). Low temperature pushes sampling toward the highest-probability tokens almost every time; high temperature makes lower-probability tokens more likely to get picked, which produces more varied — and less repeatable — output. As a practitioner, the question to ask per task is simple: does this task have one right shape of answer, or many acceptable ones? Extraction and classification have one right shape. Brainstorming and creative drafting have many.

## The mental model

Think of temperature as a knob on how much the model is "allowed" to gamble on a less-likely token instead of the safest one. At temperature 0, it almost always takes the safest bet at every step, which is what makes output reproducible. As temperature rises, it takes more chances, and small early differences compound — one different word early in the output changes the context for every token after it, so the outputs don't just vary a little at high temperature, they can diverge substantially by the end.

## A concrete example (shown)

Take a data-extraction prompt: pull the order number, amount, and date from a customer message into JSON.

```text
Prompt:
Extract order_number, amount, and date from the message below as JSON.
Message: "Order #48213 for $129.00 shipped on March 3rd never arrived."

At temperature 0, three runs:
Run 1: {"order_number": "48213", "amount": "129.00", "date": "March 3"}
Run 2: {"order_number": "48213", "amount": "129.00", "date": "March 3"}
Run 3: {"order_number": "48213", "amount": "129.00", "date": "March 3"}

At temperature 1, three runs:
Run 1: {"order_number": "48213", "amount": "$129.00", "date": "March 3rd"}
Run 2: {"order_number": "#48213", "amount": "129.00", "date": "2024-03-03"}
Run 3: {"order_number": "48213", "amount": "129.00", "date": "March 3"}
```

Nothing about the message changed between runs. At temperature 0, the three outputs are identical — the exact same fields, formatted the same way, every time. At temperature 1, the values are all still correct in substance, but the formatting drifts: a dollar sign appears and disappears, the order number picks up a `#`, the date format changes shape entirely. For a human reading one output, this looks fine. For a downstream parser expecting a stable schema, run 2's date format alone can break the pipeline. This is exactly the kind of variance [prompting is not deterministic programming](/learn/prompt-engineering/prompting-is-not-deterministic-programming) warns about, and here you can see the direct cause and the direct fix in one place.

## Why it works this way

Temperature only touches the sampling step — it doesn't make the model "know" the order number better or worse, and it doesn't add or remove information from the prompt. It purely governs how far the model is willing to stray from its own highest-confidence token at each step. That's also why lowering temperature is such a cheap fix: it's a one-line parameter change, not a rewrite, and it directly targets the exact mechanism causing the variance you're seeing — see [probability basics for AI](/learn/maths-foundations/probability-basics-for-ai) if you want the underlying math of what "sampling from a distribution" actually means.

## Where it shows up

Set temperature low — often 0 to 0.2 — for classification, extraction, routing, structured output, and anything feeding a downstream parser or a decision pipeline, including the ticket classifier from [the whole-game walkthrough](/learn/prompt-engineering/pe-whole-game-ticket-classifier). Set it higher — often 0.7 and up — for brainstorming, varied creative drafts, or anything where you explicitly want several different acceptable outputs rather than one converged answer. It also matters for evaluation: if you're comparing two prompt versions, fix temperature identically across both runs, or you can't tell whether a difference in output came from your prompt change or from sampling noise — see [prompt evaluation basics](/learn/prompt-engineering/prompt-evaluation-basics).

## Watch out for

- **Assuming temperature 0 means bit-for-bit identical forever.** It gets you much closer to reproducible, but infrastructure-level factors (batching, floating-point nondeterminism, provider-side changes) can still occasionally produce small variation even at temperature 0 — treat it as "very likely stable," not an absolute guarantee.
- **Mistaking consistency for correctness.** Low temperature makes a wrong answer consistently wrong, not right — it fixes variance, not hallucination or missing knowledge. That's still [what prompting cannot fix](/learn/prompt-engineering/what-prompting-cannot-fix) territory if the underlying issue is a fact the model doesn't have.
- **Changing temperature and top-p independently without checking both.** They interact — a low temperature with a very permissive top-p can still admit more variety than you expect, and vice versa.

## Where next

[Prompting Is Not Programming](/learn/prompt-engineering/prompting-is-not-deterministic-programming) covers the broader nondeterminism problem this lesson gives you one direct lever against, and [Before/After: Turning 'Summarize This' Into a Specification](/learn/prompt-engineering/before-after-vague-summary-prompt) shows the same run-it-three-times comparison applied to a formatting problem rather than a temperature one.

**Related:** [Why Prompting Works](/learn/prompt-engineering/why-prompts-steer-next-token-prediction) · [sampling: temperature and top-p](/learn/llm-foundations/sampling-temperature-top-p) · [Prompt Evaluation Basics](/learn/prompt-engineering/prompt-evaluation-basics) · [probability basics for AI](/learn/maths-foundations/probability-basics-for-ai)
