---
title: "Stacking, blending, and ensemble design"
track: "machine-learning"
order: 311
status: live
summary: "Ensembles help when component errors differ; stacking requires out-of-fold predictions to avoid a meta-model trained on leaked base-model scores."
duration: "13 min read"
updated: "2026-08-30"
---

## The short answer

Ensembling combines models so their different mistakes cancel. Bagging averages similar unstable models; blending combines predictions on a held-out validation set; stacking trains a meta-model on out-of-fold base predictions. The central requirement is honest base predictions: the meta-model must never see a prediction made by a base model trained on that row.

## Why this matters

A modest ensemble can increase robustness across data regimes. A careless one can report spectacular validation performance by leaking training labels through base-model predictions, while becoming impossible to audit or operate.

## How it works

For stacking, split training data into folds. For each fold, train every base model on the other folds and predict the held-out fold. Concatenate these out-of-fold predictions, train a simple meta-model, then refit base models on all training data for inference. Diversity matters more than a long list of nearly identical models.

## Worked examples and variations

1. **Tabular risk:** combine a calibrated logistic model and boosted tree if their error slices differ.
2. **Demand forecast:** blend a seasonal baseline with a feature-driven model to retain plausible behavior on sparse regions.
3. **Image embeddings plus metadata:** stack a model over each feature family only when temporal splits keep observations isolated.
4. **Boundary case:** a weighted average selected on one validation set can be safer than a flexible meta-model with few examples.
5. **Counterexample:** train base models on all rows, stack their in-sample predictions, and the meta-model simply learns overfit confidence.

## Two ways to see it

**Error-correlation view:** averaging helps only when models fail differently.

**Data-flow view:** stacking is a multi-stage pipeline whose fold boundaries are part of correctness.

## Hands-on

Build logistic-regression, random-forest, and boosted-tree base models. Generate out-of-fold probabilities, fit a regularized logistic meta-model, and compare calibration and subgroup metrics. Deliberately stack in-sample predictions; reset to out-of-fold construction and archive the pipeline diagram.

## Checkpoint

- [ ] Every meta-model training score is out-of-fold.
- [ ] Components were chosen for complementary errors or constraints.
- [ ] Latency, failure handling, and calibration are measured after combination.

## What this does not solve

An ensemble cannot make an unobservable target predictable or substitute for a policy that defines acceptable mistakes.

## Continue, go deeper, apply it

Apply ensemble design to a champion–challenger workflow, not a leaderboard-only contest.
