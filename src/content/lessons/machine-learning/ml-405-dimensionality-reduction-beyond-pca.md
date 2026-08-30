---
title: "Reduce dimension beyond PCA"
track: "machine-learning"
order: 405
status: live
summary: "Choose linear, nonlinear, supervised, or sparse representations according to the task and preserve a validation path."
duration: "16 min read"
updated: "2026-08-30"
---

## The short answer

Dimensionality reduction maps many features to fewer coordinates. PCA preserves maximum linear variance; alternatives such as random projections, NMF, ICA, and supervised reducers preserve different structure. Select by the downstream task, not a pretty two-dimensional plot.

## Why this matters

High dimension weakens distance measures, increases variance, and obscures inspection. But reducing before a split or fitting on all records leaks information and can erase rare but important signals.

## How it works

PCA rotates centred data into orthogonal variance directions. Random projections approximately preserve pairwise distances cheaply. NMF constrains components and loadings nonnegative, often yielding parts-like factors. ICA seeks statistically independent sources. Supervised methods use labels and must be fitted inside each training fold.

## Worked examples and variations (4–6, include boundary and counterexample)

1. **Text counts:** truncated SVD makes a linear classifier tractable on sparse matrices.
2. **Spectra:** NMF can separate additive material signatures into interpretable factors.
3. **Signal mixtures:** ICA can recover independent source-like components under strong assumptions.
4. **Boundary:** if ten features are already meaningful and stable, reducing them may only harm reviewability.
5. **Counterexample:** retaining 95% variance can discard a low-variance feature that predicts the target.

## Two ways to see it

Reduction is compression: discard directions under an objective. It is also representation design: retain what a later human or model must distinguish.

## Hands-on

On a train/test classification dataset, compare raw features, PCA, random projection, and NMF when valid. Fit every transform on training folds only. Deliberately fit PCA before the split and note inflated validation. Reset the pipeline, compare test metrics and component explanations, then choose a method with a stated task reason.

## Checkpoint

- [ ] The preservation objective matches the use case.
- [ ] Transforms live inside cross-validation pipelines.
- [ ] Reduced features were checked for lost subgroup signal.

## What this does not solve

Reduction cannot create information, guarantee interpretability, or make biased labels fair.

## Continue, go deeper, apply it

Use nonlinear embeddings primarily for exploration, then study their visualization traps. Apply task-driven reduction before distance-based models.

