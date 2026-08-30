---
title: "The curse of dimensionality in classical ML"
track: "machine-learning"
order: 302
status: live
summary: "As dimensions grow, data become sparse and distance-based intuitions, density estimates, and exhaustive search lose their reliability."
duration: "12 min read"
updated: "2026-08-30"
---

## The short answer

High-dimensional spaces grow so quickly that a finite dataset covers very little of them. Distances concentrate, local neighborhoods stop being local, and flexible models can find accidental patterns. The response is not simply “reduce dimensions”; it is to use representation, regularization, validation, and domain structure deliberately.

## Why this matters

Many tabular systems have thousands of sparse indicators, one-hot categories, interactions, or embeddings. Models may report good training metrics while having no support for their predictions. This affects kNN, clustering, anomaly detection, density estimation, and feature selection.

## How it works

In a unit hypercube, keeping the same sample density requires sample count to grow exponentially with dimension. With many irrelevant coordinates, the nearest and farthest points can have similar distances, weakening rank order. Feature selection, regularization, learned embeddings, pooling, and lower-complexity models impose assumptions that make estimation possible.

## Worked examples and variations

1. **Sparse bag-of-words:** cosine similarity on normalized sparse vectors can remain useful because presence patterns carry structure.
2. **Sensor panel:** remove duplicated or untrusted sensors, then test whether the held-out result improves rather than assuming more columns help.
3. **Gene-expression screening:** thousands of variables and few subjects require strict nested validation; feature selection outside the fold leaks labels.
4. **Boundary case:** adding a truly predictive rare feature can improve performance despite higher dimension; dimension itself is not the villain.
5. **Counterexample:** PCA can discard a low-variance direction that contains the target signal, so unsupervised compression is not automatically prediction-safe.

## Two ways to see it

**Sampling view:** the data budget is spread across too many possible configurations.

**Inductive-bias view:** regularization and feature engineering say which functions are plausible before data settle the question.

## Hands-on

Generate a binary dataset with 5 informative and 195 noise features. Compare logistic regression with regularization, kNN, and a tree as noise dimensions grow. Deliberately select the top features using all rows before cross-validation; observe the optimistic result. Reset by placing selection inside each fold and plot the gap.

## Checkpoint

- [ ] You can explain why nearest distances become less informative.
- [ ] Feature selection occurs inside validation folds.
- [ ] Compression is evaluated against the downstream objective.

## What this does not solve

Lower dimension cannot repair leakage, bad labels, shift, or a target that is not predictable from available inputs.

## Continue, go deeper, apply it

Apply this diagnosis before choosing a distance model, clustering method, or kernel.
