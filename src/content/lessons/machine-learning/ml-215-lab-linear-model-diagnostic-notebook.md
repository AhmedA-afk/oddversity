---
title: "Lab: linear-model diagnostic notebook"
track: "machine-learning"
order: 215
status: live
summary: "Build a reproducible diagnostic notebook that turns a regression result into an evidence-backed model decision."
duration: "45 min lab"
updated: "2026-08-30"
---

## The short answer

This lab produces a regression baseline, diagnostics, a deliberate failure, and a documented remediation. The deliverable is not a leaderboard score; it is a notebook another person can rerun and audit.

## Why this matters

Most linear-model failures are visible before production when data contracts, splits, residuals, and influential rows are examined together. A repeatable notebook makes that examination a team habit.

## How it works

Choose a dataset with a numeric target and a realistic split. Build one preprocessing-plus-model pipeline. Save row counts, feature availability time, split rationale, metrics, residual plots, influence summary, and error slices. State a decision rule before seeing final test results. Keep raw data immutable and seed any randomness.

## Worked examples and variations

1. Rent prediction can use a time split if listings arrive over time.
2. Repeated clinics require a group split by patient, not random rows.
3. Log-transforming a strictly positive target can improve residual shape but changes how back-transformation is handled.
4. A model with lower RMSE but worse high-rent underprediction may lose if that slice drives the decision.
5. A residual plot with a single high-leverage point is a trigger for investigation, not automatic deletion.

## Two ways to see it

The notebook is a scientific record of falsifiable checks. It is also an operational artifact: it identifies the exact transformations and monitoring signals a deployment must reproduce.

## Hands-on

Complete these cells in order:

```text
1. Define target, unit, prediction time, and excluded future fields.
2. Create the deployment-realistic split before fitting any transformer.
3. Fit OLS and one regularized challenger in pipelines.
4. Report MAE/RMSE, residual plots, leverage/influence, and three error slices.
5. Add one synthetic duplicate feature or high-leverage row as the intentional failure.
6. Explain the failure, remove only the synthetic artifact, rerun from a clean kernel, and compare artifacts.
```

## Checkpoint

Can another learner reproduce your split and feature set from the notebook? Which observed pattern changed your modelling decision, rather than merely your narrative?

## What this does not solve

This notebook does not validate a production data pipeline, authorize automated decisions, or prove that one model will survive a changed market.

## Continue, go deeper, apply it

Submit the notebook with a one-page model card. Apply the same template to the demand case study next.
