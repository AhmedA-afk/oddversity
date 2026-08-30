---
title: "Design data contracts before model calls"
track: "python-data-apis"
status: live
summary: "A data contract states what a field means, which values are allowed, when it is available, and what happens when it is absent or invalid."
duration: "3 min read"
---

## The short answer

A data contract states what a field means, which values are allowed, when it is available, and what happens when it is absent or invalid. Validate at boundaries before data reaches a model and after a model returns. A schema catches shape errors; it cannot prove that the meaning is correct.

## Contract fields

For each field record type, allowed range, null meaning, source, timestamp,
privacy classification, and owner. For model outputs add confidence semantics,
unknown behavior, and whether a downstream action is allowed.

## Four examples

### Example A: nullable identifier

`invoice_id` may be missing in a first email. Represent it as `null` and route to
clarification; do not use an empty string that looks like a real ID.

### Example B: numeric range

An amount must be a decimal with currency, not a floating-point string with an
implicit locale. Reject negative values if the business rule forbids them.

### Boundary case: stale event

An event can be valid but too old for a decision. Validate freshness separately
from shape and record the reason for rejection.

### Counterexample: schema-only confidence

`{"category":"refund","confidence":0.99}` may be valid JSON while the category
is unsupported or the confidence has no calibrated meaning. Add semantic checks
and tests.

## An illustrative story

A data pipeline passed a date as a string in three formats. The model learned
format artifacts instead of behavior. Standardizing the contract exposed the
problem before another model was trained.

## Two ways to see it

### Data-engineering view

Contracts make producers and consumers able to change independently.

### Model-risk view

Validation makes hidden assumptions observable, but a valid field can still be
biased, leaked, stale, or collected without proper consent.

## Hands-on

Write a contract for a support-ticket classifier. Include input fields, null
behavior, allowed labels, timestamp rules, privacy tags, and output actions. Feed
it four fixtures: valid, missing, wrong type, and stale. Record the expected error.

## Checkpoint

- [ ] Every field has a meaning and owner.
- [ ] Missing, malformed, and stale values differ.
- [ ] Output validation checks both schema and allowed action.

## What this does not solve

Contracts cannot detect a label that encodes a harmful policy or a feature that
leaks information from the future. Those need domain and ML review.

## Continue, go deeper, apply it

- Continue: Problem framing and baselines
- Go deeper: Features, leakage, and missingness
- Apply it: turn the contract into executable fixtures and a data-quality report.
