---
title: "Prompting Is Not Programming: Living With Nondeterminism"
track: "prompt-engineering"
status: live
summary: "The same prompt can produce different outputs on different runs, and nothing errors out to tell you it happened."
duration: "6 min read"
---

Call a function twice with the same argument and, bugs aside, you get the same result twice. Run a prompt twice with the same input and you might not — and nothing will tell you that's what just happened.

## What it is

A prompt is not a program in the sense you're used to. A program is a fixed mapping from input to output: given the same bytes in, a deterministic function returns the same bytes out, every time, and a type system or compiler catches a large class of mistakes before the program ever runs. A prompt is an instruction to a model that samples its output from a probability distribution (see [why prompts steer next-token prediction](/learn/prompt-engineering/why-prompts-steer-next-token-prediction) for where that distribution comes from). Unless you pin the sampling settings down, the same prompt and the same input can legitimately produce different text on different calls — and a malformed or ambiguous prompt doesn't throw an exception, it just produces a plausible-looking answer that happens to be wrong.

## The mental model

Think of a regular function as a single point: one input maps to one output, always. Think of a prompt as a small cloud of possible outputs sitting over that input, where the sampling settings control how tight or spread out the cloud is. Most of the cloud might be outputs you'd be happy with. Some of it isn't. Running the prompt once is a single draw from that cloud — it tells you almost nothing about the cloud's shape.

## Why it works this way

Generation involves sampling a token from a probability distribution at every step, not always taking the single highest-probability token (see [sampling: temperature and top-p](/learn/llm-foundations/sampling-temperature-top-p) for the mechanism). That sampling is what gives models useful variety for open-ended tasks — and it's also exactly what breaks the "same input, same output" guarantee you'd get from ordinary code. There is no compiler step for a prompt either: nothing checks your instructions for contradictions, checks your label set against your examples, or flags that you forgot to specify an output format. The only way any of that surfaces is in the output itself, and only if you're looking for it.

## A concrete example (shown)

Take ticket #6 from [the ticket-classifier walkthrough](/learn/prompt-engineering/pe-whole-game-ticket-classifier): "The invoice PDF from last month won't open, it just downloads blank." Run an early version of the classifier prompt against it three times, at whatever sampling settings the API defaults to:

```text
Run 1: {"label": "technical"}
Run 2: {"label": "billing"}
Run 3: {"label": "technical"}
```

Nothing crashed. Nothing logged a warning. Each of these three outputs is individually well-formed JSON with a valid label — a downstream system consuming any one of them in isolation would have no way to know it disagreed with the other two. If you'd only run this once, whichever answer you got would look like "the" answer. That's the trap: a single run doesn't just risk being wrong, it actively hides the fact that there was ever a range of possible outputs to worry about.

## Where it shows up

Every task where you need the same input to reliably produce the same category, the same structure, or the same decision — classification, extraction, routing, scoring — inherits this problem by default. The direct fix is lowering temperature and top-p so the sampling cloud shrinks toward a single point, covered next in [Temperature for Prompt Engineers](/learn/prompt-engineering/temperature-and-determinism-for-prompters). But temperature only shrinks the cloud; it doesn't replace testing. You still need to know what's in the cloud before you trust it, which is what [prompt evaluation](/learn/prompt-engineering/prompt-evaluation-basics) and [regression tests for prompts](/learn/prompt-engineering/regression-tests-for-prompts) are for.

## Watch out for

- **Treating one successful run as proof.** A single output tells you one point sampled from the cloud, not the cloud's shape. "It worked when I tried it" is not the same claim as "it works."
- **Not fixing sampling settings before comparing prompt versions.** If you change both the prompt and the temperature between two test runs, you can't tell which change caused the difference in output.
- **Expecting errors to look like errors.** A wrong classification, a hallucinated field, or an ignored constraint all come back as confident, well-formatted text. Nothing distinguishes "correct" from "wrong but fluent" except checking the content yourself.

## Where next

[Temperature for Prompt Engineers](/learn/prompt-engineering/temperature-and-determinism-for-prompters) covers the actual dial for shrinking that sampling cloud, and [Diagnosing Why a Prompt Failed](/learn/prompt-engineering/reading-a-model-failure) covers what to do once you've caught an output the cloud produced that you didn't want.

**Related:** [Why Prompting Works](/learn/prompt-engineering/why-prompts-steer-next-token-prediction) · [Reliability Beats Cleverness](/learn/prompt-engineering/reliability-over-clever-tricks) · [Prompt Evaluation Basics](/learn/prompt-engineering/prompt-evaluation-basics) · [sampling: temperature and top-p](/learn/llm-foundations/sampling-temperature-top-p)
