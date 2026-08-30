---
title: "Metrics for Structured-Output Quality"
track: "structured-outputs"
status: live
summary: "Four metrics, in ascending order of what they actually catch — and why the first one is the least useful, not the most."
duration: "7 min read"
---

[Evaluating Structured Output](/learn/structured-outputs/evaluating-structured-output-quality) already split quality into validity, accuracy, and completeness. This lesson turns those into four concrete, computable metrics you can actually put a number on and a threshold against — the same four this whole module's harness, dataset, and CI-gate lessons are built around.

## What it is

In order of how much they tell you, and how cheap they are to compute:

- **Valid-rate** — of everything the model returned, what fraction parses as syntactically valid JSON at all. The cheapest check: a `try: json.loads(...) except`.
- **Schema-conformance rate** — of what's valid JSON, what fraction also matches your schema's types, required fields, and enum constraints. A [Pydantic or Zod](/learn/structured-outputs/pydantic-zod-schema-patterns) `.validate()` call, pass or fail.
- **Field-level accuracy** — for each field, of the records where the schema conforms, what fraction have the *correct value*, scored against a labeled gold answer. This needs a gold dataset; the first two don't.
- **Full-object exact-match** — of everything, what fraction have *every field* correct simultaneously. The strictest metric, and the only one that answers "can I trust this record with zero review."

## The mental model

Picture four nested rings, each one strictly inside the last. Valid-rate is the outermost ring — nearly everything modern constrained decoding produces lands inside it, which is exactly why it's the least informative: a 99% valid-rate is now closer to a baseline expectation than an achievement. Schema-conformance narrows the ring to records that also have the right shape. Field-level accuracy is inside that again — a schema-conformant record can still have any number of individually wrong field values. Full-object exact-match is the innermost ring: the only records that live there got every single field right, at once.

A pipeline reports numbers from outside in and only the innermost ring tells you what you can actually automate without review.

## Why it works this way

Each ring can only catch what the ring around it lets through. Valid-rate can't see schema violations, because "valid JSON" and "matches my schema" are different checks — `{"total": "one thousand"}` is perfectly valid JSON and fails your schema the moment it expects a number. Schema-conformance can't see wrong values, because a type checker has no concept of *correct* — `{"total": 100}` passes conformance identically whether the real total was 100 or 1,000. And field-level accuracy can't see the interaction between fields, because it's scored independently per field — a record that gets nine of ten fields right and one wrong looks almost identical to full-object exact-match's binary pass/fail as it does to a field-accuracy average, until you need to know whether *that specific record* is safe to auto-file without a human looking at it.

This is why a dashboard that reports one blended "success rate" is actively misleading: it's almost always reporting the outermost ring while implying it measured the innermost one.

## A concrete example (shown)

Ten extracted invoices, three fields each (`vendor`, `total`, `due_date`), scored against gold:

| # | Valid JSON? | Schema-conforms? | vendor ✓ | total ✓ | due_date ✓ | All 3 ✓? |
|---|---|---|---|---|---|---|
| 1-8 | yes | yes | yes | yes | yes | yes |
| 9 | yes | yes | yes | **no** (off by $10) | yes | **no** |
| 10 | yes | yes | yes | yes | **no** (wrong format) | **no** |

Rolling this up:

- Valid-rate: 10/10 = **100%**
- Schema-conformance: 10/10 = **100%**
- Field-level accuracy: `vendor` 10/10, `total` 9/10, `due_date` 9/10 → average **93.3%**
- Full-object exact-match: 8/10 = **80%**

A dashboard reporting only valid-rate says this pipeline is flawless. It's actually shipping two records a human would need to catch, and the field breakdown already tells you where to look first — `total` and `due_date` are both dragging, `vendor` isn't. This is the exact starting point [A Field-Level Scorecard](/learn/structured-outputs/field-level-scorecard-example) builds on with a real fix.

## Where it shows up

This ordering matters most at the moment someone asks "can we skip human review on this pipeline." The honest answer is a full-object exact-match number, measured on a representative gold set, not a valid-rate screenshot — and it's the number [Regression-Testing Structured Output in CI](/learn/structured-outputs/regression-testing-schemas-and-prompts) should actually gate on alongside field accuracy, not valid-rate alone.

## Watch out for

- **Reporting only the metric that's cheapest to compute.** Valid-rate needs no gold data; field accuracy and exact-match do. That cost difference is exactly why teams under-invest in the metrics that matter most — see [Curating a Gold Dataset](/learn/structured-outputs/building-a-gold-dataset) for what it actually takes to get the labels these need.
- **Using field-average accuracy as a stand-in for exact-match.** They answer different questions — "how good is this field generally" versus "can I trust this specific record" — and optimizing one doesn't automatically move the other if errors cluster on a subset of records rather than spreading evenly.
- **Forgetting these are per-provider, per-model-version numbers**, not one fixed property of your schema. A model swap can move field accuracy while leaving valid-rate untouched, which is exactly the blind spot [The Cross-Provider Landscape](/learn/structured-outputs/cross-provider-landscape) warns about.

## Where next

[Curating a Gold Dataset](/learn/structured-outputs/building-a-gold-dataset) covers where the labels for the inner two metrics come from, and [Building an Eval Harness](/learn/structured-outputs/building-an-extraction-eval-harness) wires all four into one runnable report.

**Related:** [Evaluating Structured Output](/learn/structured-outputs/evaluating-structured-output-quality), [Building an Eval Harness](/learn/structured-outputs/building-an-extraction-eval-harness), [Curating a Gold Dataset](/learn/structured-outputs/building-a-gold-dataset), [Structured Output Failure Modes](/learn/structured-outputs/structured-output-failure-modes)
