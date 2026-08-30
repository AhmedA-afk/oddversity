---
title: "In-Context Learning: Teaching by Example at Inference Time"
track: "prompt-engineering"
status: live
summary: "What actually happens when you drop examples into a prompt — no training, no weight updates, just pattern completion."
duration: "6 min read"
---

Every time you paste two examples into a prompt before asking the real question, you're leaning on a capability nobody explicitly programmed into the model: it infers a pattern from a few demonstrations and applies it to something new, in the same forward pass, with nothing saved afterward.

## What it is

In-context learning (ICL) is the mechanism that makes few-shot prompting work at all. You place input-output pairs in the prompt, then give the model a new input without an output, and it completes the pattern. There's no training step, no gradient update, no persistence — the moment the response finishes, the model has forgotten it ever saw your examples. Everything it "learned" lived entirely in the tokens you handed it for that one call.

This is worth separating clearly from actual fine-tuning or training, which change the model's weights permanently. ICL changes nothing about the model. It changes what's sitting in its context window, which changes what the next-token prediction conditions on. For the full mechanism — why a forward pass over examples behaves like it's doing a tiny, implicit optimization — see [In-Context Learning: Why Few-Shot Examples Work at All](/learn/llm-foundations/in-context-learning).

## The mental model

Don't picture the model "learning your task." Picture it recognizing a shape. The model has seen enormous amounts of pattern-continuation during pretraining — lists, Q&A pairs, tables, translated sentence pairs — and it has a strong prior on "given a few instances of X → Y, keep producing X → Y." Your examples aren't teaching new knowledge; they're pointing at a specific pattern-continuation behavior the model already has and giving it the exact shape to continue.

That's why format consistency across your examples matters as much as their correctness does — the model is finding the shared shape, and an inconsistent shape from example to example makes that shape genuinely harder to find, not just harder to describe.

## Why it works this way

ICL is tied to scale and to what the model actually saw during pretraining, not to some general "reasoning from a blank slate" ability. A task with a clear analog somewhere in the training distribution — classification, extraction, translation, reformatting — is exactly the kind of shape the model has practiced completing millions of times, just never with your specific labels or your specific format. Two or three demonstrations are usually enough to pin down which specific instance of that shape you want.

This also explains the limits: a genuinely novel task, with no shape anywhere in the pretraining distribution, won't be rescued by examples the way a human apprentice would be rescued by watching a demo. ICL is powerful pattern-matching against a vast prior — it's not learning a new skill from three data points the way a from-scratch model would need thousands.

## A concrete example (shown)

Say you need dates reformatted into a nonstandard, internal ticketing format: two-digit year, three-letter month, day, then a fiscal quarter tag — a format that exists nowhere as a standard and that no instruction alone describes unambiguously. Two examples are enough:

```text
Date: March 3, 2024
Formatted: 24-Mar-03 · Q1

Date: November 18, 2023
Formatted: 23-Nov-18 · Q4

Date: July 9, 2024
Formatted:
```

The model completes this as `24-Jul-09 · Q3`. Notice everything it had to infer without being told: two-digit year comes from the last two digits, month is a three-letter abbreviation with a capital first letter, day is zero-padded, and the quarter is computed from the month — none of that was explained, all of it was demonstrated. A written instruction covering all of this precisely ("truncate the year to two digits, abbreviate the month to three letters with title case, zero-pad the day, compute the calendar quarter...") would run several sentences and still risk a missed edge case. See [Why a Good Example Outperforms a Paragraph of Rules](/learn/prompt-engineering/why-examples-beat-instructions-sometimes) for why that gap between rules and examples isn't a coincidence.

## Where it shows up

Every few-shot prompt is an application of ICL, whether it's [classification, extraction, or style-matching](/learn/prompt-engineering/few-shot-prompting). It's also what makes worked reasoning demonstrations effective — showing two solved word problems before a new one leans on the exact same mechanism, just with a longer, multi-step pattern to continue. Structured-output examples (a JSON shape shown twice, then a new input) are ICL doing formatting work specifically. And it's the reason example order and count aren't cosmetic choices — see [How Many Shots, and In What Order](/learn/prompt-engineering/example-count-and-ordering) for how the pattern the model finds can shift depending on how you arrange the same examples.

## Watch out for

- **Novelty ICL can't rescue.** If the task has no analog anywhere in pretraining, examples won't manufacture a skill from nothing — you'll get confident-looking pattern completion that's actually wrong.
- **The pattern the model finds might not be the one you meant.** If every example happens to share an incidental trait — same length, same tone, same label — the model will happily complete *that* pattern instead of the one you intended. See [When Your Examples Teach the Wrong Thing](/learn/prompt-engineering/few-shot-format-leakage).
- **Every example is context, and context isn't free.** More demonstrations cost real tokens on every single call — see [Tokens, Context, and Cost](/learn/ai-foundations/tokens-context-cost) — so ICL is a tool to reach for deliberately, not a default to pile on.

## Where next

Start with [Zero-Shot: When You Don't Need Examples](/learn/prompt-engineering/zero-shot-when-its-enough) to decide whether you need ICL at all for a given task, then [Few-Shot Prompting](/learn/prompt-engineering/few-shot-prompting) for the basics of using it, and [Choosing Which Examples to Show](/learn/prompt-engineering/few-shot-example-selection) once you're ready to get deliberate about which demonstrations you pick.

**Related:** [In-Context Learning: Why Few-Shot Examples Work at All](/learn/llm-foundations/in-context-learning) · [Few-Shot Prompting](/learn/prompt-engineering/few-shot-prompting) · [Zero-Shot vs Few-Shot](/learn/prompt-engineering/zero-shot-vs-few-shot) · [Why a Good Example Outperforms a Paragraph of Rules](/learn/prompt-engineering/why-examples-beat-instructions-sometimes)
