---
title: "Automatic Prompt Optimization With DSPy"
track: "prompt-engineering"
status: live
summary: "The precise cost of a DSPy compile, why the split matters more than the search, and when the overhead is worth it."
duration: "9 min read"
---

*This is the deferred-depth lesson - read [Automatic Prompt Optimization with Tools Like DSPy](/learn/prompt-engineering/automatic-prompt-optimization) first for the core idea of prompts as searchable parameters. This lesson is the rigor underneath it: what a run actually costs, and the split discipline that decides whether its result means anything.*

A compiled prompt that beats your hand-written one on the set you measured it against isn't automatically better - it might just be better *at that set*. The difference between those two claims is the entire content of this lesson.

## Where the base pattern stops being enough

The base lesson's code snippet compiles a pipeline against a training set and reports the result. What it doesn't show is the number that made "beats the hand-written prompt" a real claim rather than an inflated one: a held-out split the search never touched. Walking one small run end to end is the only way to see why that split isn't optional.

## Walking one optimization run

Take the due-date extractor's `v3-revised` prompt - hand-written, gated at 5/5 golden and 18/20 full-set (from [Building a Prompt Eval Dataset](/learn/prompt-engineering/building-an-eval-dataset) and [A Change-Management Workflow for Prompts](/learn/prompt-engineering/change-management-workflow)) - as the baseline to beat. A DSPy-style compile needs three splits carved out of your eval set, not one:

- **Train** (bootstrap from) - run the current pipeline, keep traces that scored well as candidate few-shot demonstrations.
- **Validation** (select among candidates) - score every candidate instruction × few-shot combination here, keep whichever wins.
- **Held-out test** (report the final number) - touched exactly once, at the end, to state the number you'll actually trust.

With a 40-case pool: 20 for train, 10 for validation, 10 held out. The optimizer bootstraps a handful of few-shot sets from train, proposes several instruction phrasings (one of which turns out to explicitly name "check for a stated format before defaulting" - the exact fix a human found by hand in [A Change-Management Workflow for Prompts](/learn/prompt-engineering/change-management-workflow), arrived at independently by search), scores every instruction × few-shot combination on validation, and keeps the top scorer. That candidate is then run - once - against the 10 held-out cases:

```
Hand-written v3-revised, held-out set:  9/10  (90%)
DSPy-compiled candidate, held-out set:  10/10 (100%)
```

One case recovered - the compiled version happened to select a few-shot example demonstrating a no-clue ambiguous date positioned last, the exact fix [Before/After: Porting a Prompt to a New Model](/learn/prompt-engineering/porting-a-prompt-worked) found by hand through manual reordering. The search found the same lever a human eventually found, without a human needing to notice it first.

## The precise cost of a compile

That result isn't free, and the cost is countable, not vague. Scoring one instruction × few-shot combination costs one model call per validation case. With 8 candidate instructions and 4 bootstrapped few-shot sets, evaluated against a 10-case validation split:

```
8 instructions × 4 few-shot sets × 10 validation cases = 320 scoring calls
```

Add the calls spent generating the bootstrap traces in the first place (roughly one pass over the 20-case train split, ~20 calls) and this one compile runs on the order of **340 model calls** before it produces a single prompt you could ship - against zero additional calls for the hand-written version, which cost only the time someone spent reading the failing case. That ratio is the real tradeoff, not an abstraction: a compile is worth roughly 340 evaluation calls' worth of API spend and wall-clock time, for one extra case out of ten.

## When the split matters more than the search

If train, validation, and the reported number are the same set, the "beats the hand-written prompt" claim is inflated by construction - the search saw every case it's being credited with beating, which is exactly what a golden-set overfit looks like in [Regression Tests: Keeping a Golden Set Green](/learn/prompt-engineering/regression-tests-for-prompts), just produced by a search process instead of a person. A held-out split the optimizer never scores against during selection is what makes the final number mean "generalizes," not just "was optimized for."

This gets harder, not easier, with a small eval pool. Forty cases split three ways leaves ten held out - thin enough that one flipped case swings the reported rate by ten points, exactly what happened above. Below roughly twenty or thirty total labeled cases, none of the three splits is trustworthy on its own, and the honest move is to grow the eval set (see [Building a Prompt Eval Dataset](/learn/prompt-engineering/building-an-eval-dataset)) before compiling anything.

The same discipline compounds if the metric itself is an [LLM judge](/learn/prompt-engineering/rubric-and-llm-judge) rather than exact-match: now every score the optimizer selects on carries judge noise on top of sampling noise, and a search process is very good at finding candidates that exploit whatever bias the judge has, not just candidates that are actually better - the Goodhart failure named in the base lesson, sharpened by having hundreds of shots to find the exploit instead of one.

## When this is (and isn't) worth it

Worth the overhead when the metric is reliable and hard to game, the prompt is deployed widely enough that a few recovered points compound across real volume, and the eval pool is large enough to split three ways without any split becoming too thin to trust - meaning it's usually a late-stage investment in an already-stable, already-versioned prompt, not a first draft.

Not worth it with fewer than twenty or thirty labeled examples total, with a metric that's itself a noisy judge you haven't calibrated against humans yet (see [Rubric Scoring With an LLM Judge](/learn/prompt-engineering/rubric-and-llm-judge)), or while the task definition is still moving - optimizing hard against a target that's about to change is 340 calls spent compiling the wrong answer precisely. Every compiled prompt still needs the same treatment as a hand-written one once it exists: gated by the golden set, versioned like any other build artifact (see [Versioning Prompts Like Production Code](/learn/prompt-engineering/prompt-versioning-like-code)), and re-verified on a model swap the same as [Portability: Surviving a Model Swap](/learn/prompt-engineering/prompt-portability-across-models-strategy) requires - a search process finding it doesn't exempt it from the pipeline everything else in this module goes through.

**Related:** [Automatic Prompt Optimization with Tools Like DSPy](/learn/prompt-engineering/automatic-prompt-optimization), [Building a Prompt Eval Dataset](/learn/prompt-engineering/building-an-eval-dataset), [Regression Tests: Keeping a Golden Set Green](/learn/prompt-engineering/regression-tests-for-prompts), [Rubric Scoring With an LLM Judge](/learn/prompt-engineering/rubric-and-llm-judge), [Meta-Prompting: Using a Model to Write Prompts](/learn/prompt-engineering/meta-prompting-to-draft-prompts)
