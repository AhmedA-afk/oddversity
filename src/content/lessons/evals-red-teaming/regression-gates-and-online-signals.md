---
title: "Turn evaluation into release gates and live signals"
track: "evals-red-teaming"
status: live
summary: "An evaluation becomes operational when a change can fail a release gate and when live signals can reveal failures the offline set missed."
duration: "3 min read"
---

## The short answer

An evaluation becomes operational when a change can fail a release gate and when live signals can reveal failures the offline set missed. Gate on risk-weighted behavior, not one average score; monitor quality, cost, latency, safety signals, and escalation after release.

## Offline to online

Before release: run fixed cases, compare slices, inspect regressions, and record
exceptions. After release: sample outputs safely, watch user corrections and
fallbacks, detect drift, and connect incidents back to new fixtures.

## Four examples

### Example A: prompt change

Block release if unsupported high-impact claims increase, even if average style
score improves. The gate reflects the real risk.

### Example B: retrieval change

Require no regression in evidence recall on protected questions and compare stale
source selection separately from answer fluency.

### Boundary case: small sample

A score change on five cases is weak evidence. Mark the result low confidence and
route to review rather than declaring victory or failure.

### Counterexample: user thumbs-up only

Positive feedback may be sparse, biased toward easy cases, or influenced by UI.
Combine it with corrections, escalation, sampled review, and technical traces.

## An illustrative story

A release passed every offline test but generated a spike in manual escalations.
The live traffic contained a new document format absent from the dataset. The
incident became a fixture and the gate was split by document type.

## Two ways to see it

### CI view

A gate is a decision rule that prevents known regressions from shipping.

### Operations view

Online signals discover unknown unknowns and must lead to an owner, a rollback, or
an explicit decision to accept the behavior.

## Hands-on

Create a release report with fixed cases, slice deltas, cost/latency fields, and a
manual-review threshold. Simulate a regression, block the release, then add the
failure to the dataset and document the exception path.

## Checkpoint

- [ ] Gates are tied to risk and slices.
- [ ] Online signals have sampling, privacy, and ownership rules.
- [ ] Incidents create new tests or a documented decision.

## What this does not solve

Gates cannot predict every new failure. They reduce repeatable regressions and
shorten the path from surprise to learning.

## Continue, go deeper, apply it

- Continue: Governance artifacts
- Go deeper: Datasets, rubrics, and judges
- Apply it: wire one risk-weighted regression gate into a local test command.
