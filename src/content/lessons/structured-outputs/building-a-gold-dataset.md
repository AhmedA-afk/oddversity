---
title: "Curating a Gold Dataset"
track: "structured-outputs"
status: live
summary: "Field accuracy and exact-match are only as good as the labeled set behind them — here's how to build one that doesn't lie to you."
duration: "7 min read"
---

[Building an Eval Harness](/learn/structured-outputs/building-an-extraction-eval-harness) needs gold labels to compute field accuracy and exact-match at all. Where those labels come from, and how carefully you protect them, decides whether the harness reports the truth or a number that looks reassuring for reasons that have nothing to do with quality.

## What it is

A gold dataset is a fixed set of `(input, correct output)` pairs, labeled by a human (or a carefully audited process) and never shown to the model as a prompt example. It's the fixed ruler [Metrics for Structured-Output Quality](/learn/structured-outputs/evaluating-structured-output-quality-metrics) needs — without it, you can measure valid-rate and schema-conformance, but field accuracy and exact-match have nothing to compare against.

## The mental model

Treat it like a held-out exam, not a study guide. A study guide's examples are meant to be seen by the person being tested — that's how they learn the pattern. An exam's answer key is meant to never be seen beforehand — that's how you find out whether the pattern was actually learned, versus memorized from having seen this exact question before. The moment a gold example's input (or something close enough to it) appears in your extraction prompt as a few-shot example, you've turned an exam into an open-book test and your accuracy number stops meaning what it used to mean.

## Why it works this way

Sampling representative and edge-case documents matters because a gold set skewed toward easy, clean inputs will report a field accuracy that's real but not the number you'll see in production, where messy inputs are exactly where extraction breaks. Build the set in two deliberate passes: first, a random sample of real (or realistically messy) documents that reflects the actual distribution your pipeline sees — different vendors, different formats, different lengths; second, a hand-picked set of edge cases you already know are hard — a document with a missing field, a currency in an unusual format, a discriminated-union type your schema hasn't seen much of (see [Discriminated Unions in Schemas](/learn/structured-outputs/discriminated-unions-in-schemas)). Report these two subsets' scores separately, not blended — a pipeline that's 98% on the random sample and 60% on edge cases is a very different pipeline from one that's 90% on both, even if the blended average comes out similar.

Labeling disagreements are where a gold set's quality is actually decided, not an afterthought to clean up later. When two labelers disagree on what the "correct" `category` for an ambiguous ticket is, that disagreement is signal about the schema, not noise to average away — it usually means either the field's [description needs tightening](/learn/structured-outputs/field-descriptions-as-prompts) so a human and a model would agree on it consistently, or the schema itself needs an `other` value or a way to express genuine ambiguity (see [Representing Uncertainty in Schemas](/learn/structured-outputs/representing-uncertainty-in-schemas)). Resolve disagreements with a documented adjudication step — a third labeler, or a rule written down and applied consistently — never by picking whichever label a majority happened to lean toward on that one item without writing down why.

## A concrete example (shown)

A five-item slice showing the two-pass structure in miniature:

```python
gold_set = [
    # -- random sample: reflects real traffic --
    {"id": "r1", "source": "random", "document": "...", "expected": {...}},
    {"id": "r2", "source": "random", "document": "...", "expected": {...}},
    {"id": "r3", "source": "random", "document": "...", "expected": {...}},
    # -- edge cases: known-hard, hand-picked --
    {"id": "e1", "source": "edge", "document": "ticket with no clear category",
     "expected": {"category": "other", "priority": "low", "escalation_note": None}},
    {"id": "e2", "source": "edge", "document": "ticket in a currency the schema hasn't seen",
     "expected": {...}},
]
```

Tagging `source` on every record lets `summarize()` from [Building an Eval Harness](/learn/structured-outputs/building-an-extraction-eval-harness) group results by subset with one `groupby`, instead of discovering the blended average hid a real gap only after someone asks why production looks worse than the dashboard.

## Where it shows up

This is the step teams skip under deadline pressure, because writing a real extraction prompt feels like progress and building held-out labels feels like overhead — until the first time a stakeholder asks "how accurate is this, really" and the honest answer requires labels nobody made. It's the same discipline [Evaluating RAG Quality](/learn/rag/evaluating-rag-quality) leans on for retrieval — a system that "looks right" on inspection and a system that's *measured* right are different claims, and only one of them survives a model or prompt change.

## Watch out for

- **Leakage into the prompt.** Never use a gold-set document (or a close paraphrase of one) as a few-shot example, a prompt-tuning test case, or a debugging example pasted into a system prompt. If it must be used for prompt development, retire it from the gold set — a document the model has effectively seen can't measure generalization anymore. See [Evaluation and Portability Mistakes](/learn/structured-outputs/eval-and-provider-mistakes) for what this looks like when it goes unnoticed.
- **Sizing to "whatever we had lying around."** A gold set too small to move a percentage point when one record flips (10 items, say) will look noisy on every model or prompt change, real or not. Size it so a handful of genuine improvements or regressions show up above the noise of your own labeling consistency — that's a property you can check by having two labelers score a subset and measuring their agreement rate.
- **Never refreshing it.** A gold set frozen at launch stops reflecting reality the moment your document distribution shifts — a new vendor format, a new locale, a schema version bump. Revisit it on a real cadence (tied to your [schema version bumps](/learn/structured-outputs/schema-versioning-and-migration) is a reasonable trigger), adding new edge cases as they're discovered in production rather than only at creation time.

## Where next

[Building an Eval Harness](/learn/structured-outputs/building-an-extraction-eval-harness) is what actually consumes this dataset, and [A Field-Level Scorecard](/learn/structured-outputs/field-level-scorecard-example) shows what acting on its output looks like.

**Related:** [Metrics for Structured-Output Quality](/learn/structured-outputs/evaluating-structured-output-quality-metrics), [Building an Eval Harness](/learn/structured-outputs/building-an-extraction-eval-harness), [Evaluating RAG Quality](/learn/rag/evaluating-rag-quality), [Evaluation and Portability Mistakes](/learn/structured-outputs/eval-and-provider-mistakes)
