---
title: "Monitoring in Production"
track: "structured-outputs"
status: live
summary: "A CI gate catches known regressions against a fixed gold set — these four live signals catch the drift a gold set can't see coming."
duration: "7 min read"
---

[Regression-Testing Structured Output in CI](/learn/structured-outputs/regression-testing-schemas-and-prompts) catches a regression against a fixed gold set, before merge. It can't catch what the gold set never anticipated — a new document format showing up in real traffic, a vendor changing their invoice layout, a slow drift no single deploy caused. That's what production monitoring is for.

## What it is

Four signals, each answering a question a pre-merge gate structurally cannot:

- **Invalid-rate** — the live-traffic equivalent of valid-rate: what fraction of real requests fail to parse or fail schema validation, computed continuously, not on a fixed gold set.
- **Repair frequency** — how often [validation and auto-repair](/learn/structured-outputs/validation-and-auto-repair) has to fire at all, separate from whether the repair eventually succeeds.
- **Field-value drift** — how the *distribution* of values for a given field is shifting over time, independent of whether any single value is "wrong."
- **Reject/review rate** — how often output is routed to a human or a fallback path rather than accepted automatically, the live counterpart of a pipeline's confidence-based routing logic.

## The mental model

A CI gate is a fixed exam given before a change ships. Production monitoring is an ongoing check on the *world the pipeline actually operates in*, which keeps moving after the exam is over. A gate can tell you a change didn't make things worse against known cases. Only live monitoring can tell you the ground itself shifted — a new invoice template, a new customer segment, a locale you didn't have gold examples for — in ways no fixed gold set could have anticipated, because it didn't exist yet when the gold set was built.

## Why it works this way

Each signal catches a different kind of shift, and reading only one leaves you blind to the others:

**Invalid-rate spiking** with no code or model change usually means the input distribution moved — a new document source, a new upstream format — and the schema or prompt that worked on the old distribution doesn't cover the new one. It's the leading indicator, because a document that can't even parse is the clearest possible failure.

**Repair frequency rising while invalid-rate stays flat** is a subtler warning: the model is drifting toward the edge of what the schema expects, but the repair loop is quietly catching it — for now. A repair rate creeping upward is a leading indicator that invalid-rate will follow if nothing changes, because repair is absorbing a cost that used to be zero. Treat a rising repair rate as an early warning, not as evidence the system is working exactly as designed.

**Field-value drift** is the one dashboards forget to build, because nothing about it looks like an error — every individual record can be schema-valid and even correct, while the *aggregate* shifts in a way worth noticing: a `category` field that's classified 5% of tickets as `billing` for months suddenly climbing to 30% is either a real shift in what customers are writing in, or the model quietly reinterpreting an ambiguous case differently than it used to. Track the distribution of categorical and enum fields over time, not just per-record correctness.

**Reject/review rate** closes the loop on cost: a system that routes more to human review is safer but not free, and a rate that's climbing without a corresponding rise in caught errors usually means the confidence threshold itself needs recalibrating, not that the underlying extraction got worse.

## A concrete example (shown)

A weekly rollup that would surface all four signals in one place, logged per pipeline run rather than computed only on demand:

```python
def log_production_metrics(records: list[dict]) -> dict:
    n = len(records)
    return {
        "invalid_rate": sum(not r["valid"] for r in records) / n,
        "repair_rate": sum(r["repaired"] for r in records) / n,
        "category_distribution": {
            cat: sum(r["category"] == cat for r in records) / n
            for cat in {"billing", "bug", "feature_request", "other"}
        },
        "review_routed_rate": sum(r["routed_to_review"] for r in records) / n,
    }
```

Comparing this week's `category_distribution` against last month's baseline — even a simple percentage-point delta per category, no statistics library required — is enough to flag the billing-share jump before anyone downstream notices tickets are being mis-triaged in aggregate.

## Where it shows up

This is the loop that closes back to schema and prompt work, not a dashboard that exists on its own: a field-value drift alert on `category` sends you back to [A Field-Level Scorecard](/learn/structured-outputs/field-level-scorecard-example)'s method — pull the actual drifted records, find the pattern, fix the description or the enum. A repair-frequency climb on a specific field is a direct signal to revisit that field's schema design, the same instinct behind [Structured Output Failure Modes](/learn/structured-outputs/structured-output-failure-modes). A sustained invalid-rate spike after a provider-side model update is exactly the moment to re-run the eval harness manually and check whether [the regression gate](/learn/structured-outputs/regression-testing-schemas-and-prompts) would have caught it — if it wouldn't have, that's a gap in the gold set to fix, not just in monitoring.

## Watch out for

- **Alerting on raw counts instead of rates.** Traffic volume moves independently of quality; a rising number of repairs during a traffic spike can just be more total requests, not a worse rate. Always monitor as a fraction of traffic.
- **No baseline to compare drift against.** "The category distribution changed" is meaningless without last week's or last month's distribution to diff against — store the rollup, don't just compute it fresh each time and eyeball it.
- **Treating every review-routed record as a solved problem.** A high reject/review rate hides how good the *automatic* path actually is — report field accuracy on the auto-accepted subset separately, because that's the subset actually running unsupervised.

## Where next

[Evaluation and Portability Mistakes](/learn/structured-outputs/eval-and-provider-mistakes) catalogs what goes wrong when this loop — eval, gate, monitor, fix — isn't actually closed, and the module's capstone is where all of it has to run together in one service.

**Related:** [Regression-Testing Structured Output in CI](/learn/structured-outputs/regression-testing-schemas-and-prompts), [Validation and Auto-Repair](/learn/structured-outputs/validation-and-auto-repair), [Structured Output Failure Modes](/learn/structured-outputs/structured-output-failure-modes), [Building an Eval Harness](/learn/structured-outputs/building-an-extraction-eval-harness)
