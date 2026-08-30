---
title: "Lab: tree and boosting model shootout"
track: "machine-learning"
order: 314
status: live
summary: "Run a reproducible, decision-focused comparison of a linear baseline, tree, random forest, and boosted model without turning validation into a leaderboard."
duration: "45 min lab"
updated: "2026-08-30"
---

## The short answer

This lab builds a fair comparison, not a contest for the largest single metric. You will define a decision, freeze a split, compare model families with the same feature provenance, inspect calibration and error slices, and select a deployable candidate with documented tradeoffs.

## Why this matters

Real-world model choices include latency, complexity, stability, fairness, and debugging cost. A 0.002 validation gain that disappears under a new month of data is not an upgrade.

## How it works

Choose a tabular binary or regression dataset with a real decision context. Establish a simple baseline, then train a pruned tree, random forest, and boosted model. Use a pipeline, a predeclared split strategy, and a metric suite. Record all configurations and select only after comparing confidence intervals or repeated folds where practical.

## Worked examples and variations

1. **Churn:** evaluate log loss, calibration, recall at contact capacity, and group error rates.
2. **House prices:** evaluate MAE, tail errors, and whether predictions extrapolate beyond recent sale prices.
3. **Fraud review:** evaluate precision at the number of cases investigators can actually inspect.
4. **Boundary case:** if a shallow tree is close to boosting, prefer it when explanation and low-latency rules dominate.
5. **Counterexample:** selecting a winner by test score after repeated tuning invalidates the final comparison.

## Two ways to see it

**Scientific view:** models are competing hypotheses under a fixed experimental protocol.

**Product view:** the selected model must fit a workflow, a review process, and a monitoring plan.

## Hands-on

1. Write a one-paragraph decision contract and leakage checklist.
2. Freeze time/group-aware train, validation, and test partitions.
3. Train four models with the same feature pipeline where applicable.
4. Produce a table: metric, calibration, subgroup result, latency, artifact size, and failure mode.
5. Deliberate failure: tune against the test partition and save the inflated result.
6. Reset: recreate the run with validation-only selection, evaluate test exactly once, and publish a short champion rationale.

## Checkpoint

- [ ] A baseline and deployment constraint are included.
- [ ] The feature pipeline has no target or split leakage.
- [ ] The recommendation states what evidence could overturn it.

## What this does not solve

This experiment does not prove a model improves an intervention or remains valid after population shift.

## Continue, go deeper, apply it

Use the result as the starting point for the credit-risk and champion–challenger case studies.
