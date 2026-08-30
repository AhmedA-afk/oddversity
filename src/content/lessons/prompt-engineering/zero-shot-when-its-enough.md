---
title: "Zero-Shot: When You Don't Need Examples"
track: "prompt-engineering"
status: live
summary: "A checklist for when a clear instruction beats examples, and why paying the token cost of few-shot before you need to is a real cost."
duration: "5 min read"
---

The instinct once you know few-shot exists is to reach for it constantly — more demonstration feels like more safety. Often it's just more tokens spent restating something the model already knew how to do from the instruction alone.

## What it is

Zero-shot means describing the task in plain instructions and letting the model produce output with no demonstrations at all. It's not a lesser version of few-shot you fall back to when you're lazy — for a large class of tasks, it's the right tool, full stop, because the model's pretraining already contains a dense, well-formed prior for exactly what you're asking.

## The mental model

Ask one question before writing a single example: **does the task's name alone summon the right behavior?** "Translate this to French." "Summarize this article." "What's the sentiment of this review?" Each of those phrases points at a hugely common, well-represented pattern in what the model has already seen — you're not teaching a new shape, you're just naming a familiar one and supplying the input. Compare that to "classify this ticket into our internal priority tiers P0 through P4," where "P2" carries none of your company's actual meaning until you show it.

## Why it works this way

This is the flip side of [in-context learning](/learn/prompt-engineering/in-context-learning-for-prompters): ICL earns its keep specifically when the model needs to see the shape of your task to know which of many plausible behaviors to produce. When there's only one obviously plausible behavior — because the task is common and the labels are self-explanatory — there's no ambiguity for an example to resolve, so the example spends tokens without changing anything. The clearer and more standard the task, the less an example adds beyond what the instruction already pinned down.

## A concrete example (shown)

```text
Classify the sentiment of this review as positive, negative, or neutral.

Review: "Shipping took forever but the product itself is great."
```

No examples, and there's nothing missing here that a demonstration would clarify — "positive," "negative," and "neutral" mean exactly what they sound like, and the model has classified sentiment this way an enormous number of times. Adding three worked examples to this exact prompt buys you very little; the categories were never the ambiguous part. Contrast that with the same review classified against a company's own five-tier internal scale (`delighted`, `satisfied`, `mixed`, `frustrated`, `churned`) — now the label names alone don't tell the model where the line between `mixed` and `frustrated` sits, and that's precisely the case few-shot exists for. See [Zero-Shot vs Few-Shot](/learn/prompt-engineering/zero-shot-vs-few-shot) for that full comparison.

## Where it shows up

Translation, summarization, general Q&A, explaining code, rewriting for tone, and classification into categories that are self-descriptive in their own names (spam/not-spam, positive/negative) are the classic zero-shot territory. So is most exploratory prompting — the first draft of almost any new prompt should be zero-shot, because it tells you, cheaply, exactly where the instruction alone falls short before you spend effort building examples around a gap that might not exist.

## Watch out for

- **Treating "common-sounding" as "unambiguous."** A task can sound ordinary while still hiding a house-specific convention — "extract the customer's name" is simple until your data has co-signers, business accounts, and "n/a" fields your instruction never addressed. If you find yourself adding sentence after sentence to the instruction to cover cases, that's the task telling you it wants an example instead. See [Why a Good Example Outperforms a Paragraph of Rules](/learn/prompt-engineering/why-examples-beat-instructions-sometimes).
- **Skipping verification because it "should" work.** Zero-shot still needs to be checked against real inputs — see [Prompt Evaluation Basics](/learn/prompt-engineering/prompt-evaluation-basics) — rather than assumed correct because the instruction reads clearly to you.
- **Adding examples preemptively, before observing a failure.** This is the most common overcorrection: a team assumes few-shot is strictly safer and pays the ongoing token cost of examples that never resolved an actual ambiguity. Add examples in response to a concrete, reproducible miss, not as insurance.

## A quick checklist: try zero-shot first when

- The task's name alone (translate, summarize, classify as spam) already implies the expected behavior to a person reading it cold.
- The output format is standard prose or an obvious, common schema — not a house-specific shape.
- Your categories or fields are self-explanatory without a house convention behind them.
- You haven't yet observed a concrete, reproducible failure that an example would fix.

If any of those don't hold, don't force zero-shot — move to [Few-Shot Prompting](/learn/prompt-engineering/few-shot-prompting) and, once you're choosing examples deliberately, [Choosing Which Examples to Show](/learn/prompt-engineering/few-shot-example-selection).

**Related:** [Zero-Shot vs Few-Shot](/learn/prompt-engineering/zero-shot-vs-few-shot) · [Few-Shot Prompting](/learn/prompt-engineering/few-shot-prompting) · [In-Context Learning: Teaching by Example at Inference Time](/learn/prompt-engineering/in-context-learning-for-prompters) · [Prompt Evaluation Basics](/learn/prompt-engineering/prompt-evaluation-basics)
