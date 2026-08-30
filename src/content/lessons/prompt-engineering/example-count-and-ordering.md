---
title: "How Many Shots, and In What Order"
track: "prompt-engineering"
status: live
summary: "Zero, one, three, and eight shots compared for diminishing returns and rising cost, plus how reordering the same examples flips ambiguous cases."
duration: "7 min read"
---

Shot count gets treated like a dial you can just turn up when something feels off. It behaves more like a curve with a knee in it — useful gains early, then flat, then paying tokens for nothing — and a separate variable, order, that can matter as much as count and gets tuned far less often.

Every comparison below uses the same task: three-way sentiment classification on product reviews (`positive` / `negative` / `neutral`), tested against the same deliberately mixed-signal review from [Zero-Shot vs Few-Shot](/learn/prompt-engineering/zero-shot-vs-few-shot) — "Shipping took forever but the product itself is great."

## Zero-shot

**How it works.** Just the instruction: "Classify the sentiment of this review as positive, negative, or neutral." No demonstrations at all.

**When it wins.** The categories are self-explanatory and the model's prior on "sentiment classification" is already strong — see [Zero-Shot: When You Don't Need Examples](/learn/prompt-engineering/zero-shot-when-its-enough). Cheapest possible option, and the right default to try first.

**Failure mode.** On the mixed-signal review, there's nothing in the prompt showing how to weigh "shipping bad" against "product great" — the model has to invent its own tie-breaking rule, and that rule can shift between runs since nothing anchors it.

**Relative cost.** Effectively zero added tokens beyond the instruction itself.

## One-shot

**How it works.** A single example pins down the exact output format — useful when you need the model to answer with exactly `positive`, lowercase, no extra words, and nothing in the instruction guarantees that on its own.

**When it wins.** You have a format problem, not a content-ambiguity problem — you know the model understands sentiment fine, you just need it to stop adding a sentence of explanation before the label.

**Failure mode.** A single example can only anchor one class. If your one example happens to be a `positive` case, that's now the only demonstrated label — the mixed-signal review still gets no guidance on how to resolve, and one-shot on a single label modestly risks nudging the model toward that label more broadly, the smallest-scale version of the effect covered in [Label Bias, Recency Bias, and Majority Labels](/learn/prompt-engineering/label-bias-and-majority-label).

**Relative cost.** Roughly one example's worth of tokens — small, but not zero, on every call.

## Three-shot

**How it works.** One example per class, ideally with at least one placed on a genuine ambiguity rather than three easy cases — see [Choosing Which Examples to Show](/learn/prompt-engineering/few-shot-example-selection).

**When it wins.** This is the sweet spot for most classification and extraction tasks: every class gets an anchor, and if one of the three is chosen to resemble your actual hard cases, the boundary gets covered too. For the mixed-signal review, a third example like "The design is beautiful but it drains my battery fast." → `neutral` gives the model a demonstrated answer for exactly this shape of input.

**Failure mode.** If all three examples are easy and none resembles the ambiguous case, three shots buys you class coverage but not boundary coverage — the mixed review is still a coin flip, just now among three options instead of two.

**Relative cost.** Moderate — noticeably more than one-shot, still small against most context budgets.

## Eight-shot

**How it works.** Multiple examples per class, including several variations of ambiguous or edge-case inputs.

**When it wins.** Rare in practice — genuinely subtle style-matching tasks, or classification into six or more fine-grained categories where each one needs at least its own anchor plus a boundary case against its nearest neighbor.

**Failure mode.** Diminishing returns set in hard once every class and every known ambiguity already has one anchor. Examples five through eight mostly re-teach a pattern already established by one through four; occasionally a later example introduces its own [format leakage](/learn/prompt-engineering/few-shot-format-leakage) or nudges the label distribution, actively hurting accuracy rather than just failing to help it.

**Relative cost.** Highest, and it's recurring, not one-time. If one example runs roughly 40 tokens, eight shots add roughly 320 tokens to *every single request* — at even a modest 100,000 requests a day that's 32 million extra tokens daily, purely on demonstration, before you've paid for a single real input. See [Tokens, Context, and Cost](/learn/ai-foundations/tokens-context-cost) for how that shows up on a bill. This is an illustrative estimate to show the arithmetic, not a benchmark — the ratio holds regardless of the exact token count per example.

## Ordering matters as much as count

Take the exact three-shot set from above — one anchor per class, including the mixed-signal boundary example — and change nothing but the order the examples appear in:

```text
# Ordering 1: neutral example last
"Waste of money, broke in a week." -> negative
"Does exactly what it says." -> positive
"The design is beautiful but it drains my battery fast." -> neutral
```

```text
# Ordering 2: positive example last
"The design is beautiful but it drains my battery fast." -> neutral
"Waste of money, broke in a week." -> negative
"Does exactly what it says." -> positive
```

Same three examples, same three labels, same instructions — only the order changed. On the genuinely ambiguous test review ("Shipping took forever but the product itself is great."), models have a documented tendency toward recency bias: whichever label appeared last in the prompt gets a disproportionate pull on inputs the model is otherwise unsure about. Ordering 1 tends to bias the ambiguous case toward `neutral`; Ordering 2 tends to bias it toward `positive` — the same input, the same three demonstrated facts, a different answer purely from where they sit in the prompt. [Label Bias, Recency Bias, and Majority Labels](/learn/prompt-engineering/label-bias-and-majority-label) covers the mechanism behind this in depth.

The practical guidance: shuffle example order across calls (or at minimum across your eval runs) rather than fixing one order and shipping it. That way any ordering artifact shows up as noise you can average out in testing, instead of a silent, undetected bias baked permanently into one direction. And don't let order correlate with anything meaningful — always putting the "hard" case last, or always putting one particular class last, turns a random artifact into a systematic one.

## Decision table

| Approach | Tokens/call (illustrative) | Covers the boundary? | Best for | Main risk |
|---|---|---|---|---|
| Zero-shot | ~0 | No | Common, well-named tasks | Drifts on house-specific conventions |
| One-shot | ~40 | No — one class only | Pinning output format only | Nudges toward the one label shown |
| Three-shot | ~120 | Yes, if one is chosen deliberately | Most classification/extraction tasks | Useless if all three are easy cases |
| Eight-shot | ~320 | Thoroughly, if well-curated | Many fine-grained classes, subtle style | Diminishing returns, highest recurring cost |

## How to choose

Start at [zero-shot](/learn/prompt-engineering/zero-shot-when-its-enough) and move up only in response to an observed failure. Add shots until every class you expect has an anchor and every known ambiguity has at least one example placed on it, then stop — three is enough for most tasks, and past that you're usually paying tokens for redundant coverage rather than new coverage. Measure with a real held-out set before deciding you need more — see [Prompt Evaluation Basics](/learn/prompt-engineering/prompt-evaluation-basics) — and whatever count you land on, shuffle the order across your eval runs so you're not shipping a fixed order that happens to favor one label by accident.

**Related:** [Zero-Shot vs Few-Shot](/learn/prompt-engineering/zero-shot-vs-few-shot) · [Choosing Which Examples to Show](/learn/prompt-engineering/few-shot-example-selection) · [Label Bias, Recency Bias, and Majority Labels](/learn/prompt-engineering/label-bias-and-majority-label) · [Tokens, Context, and Cost](/learn/ai-foundations/tokens-context-cost) · [Prompt Evaluation Basics](/learn/prompt-engineering/prompt-evaluation-basics)
