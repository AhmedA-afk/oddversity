---
title: "Ridge, lasso, and elastic net"
track: "machine-learning"
order: 203
status: live
summary: "Choose and tune coefficient penalties by understanding the bias, variance, and feature-selection trade-offs."
duration: "24 min read"
updated: "2026-08-30"
---

## The short answer

Regularization adds a cost for complex coefficient vectors. Ridge uses $\lambda\|\beta\|_2^2$, lasso uses $\lambda\|\beta\|_1$, and elastic net mixes both. The penalty deliberately accepts some bias to reduce variance and improve future performance.

## Why this matters

Real feature tables contain correlated columns, weak signals, and more candidate features than reliable examples. Unregularized OLS can fit noise with huge cancelling coefficients; regularization makes models more stable.

## How it works

Standardize numeric features before comparing a common penalty. Ridge shrinks correlated features together and usually retains all of them. Lasso can set coefficients exactly to zero, but often chooses one arbitrary member of a correlated group. Elastic net is useful when groups should be retained yet sparsity helps operations. Select $\lambda$ only inside a validation procedure; fit preprocessing inside each fold.

## Worked examples and variations

1. Ridge stabilizes a model with three nearly identical marketing-spend columns.
2. Lasso creates a compact first-pass text or sensor model from many sparse inputs.
3. With two identical predictors, lasso may keep either one; selection is not a scientific discovery.
4. With $\lambda=0$, all three reduce to OLS; with an overwhelming penalty, predictions approach the intercept-only baseline.
5. Elastic net can retain a correlated family of gene-expression proxies while reducing the rest.

## Two ways to see it

The penalty is a preference for smaller parameter vectors. In a Bayesian view, ridge resembles a zero-centred Gaussian prior and lasso a sharply peaked, heavy-tailed prior; neither makes the prior objectively true.

## Hands-on

Use nested cross-validation to compare OLS, ridge, lasso, and elastic net on a correlated-feature dataset. Intentionally scale features *after* fitting the penalty path and observe the changed selection. Reset by placing scaling and model in one pipeline, then chart validation error and coefficient paths.

## Checkpoint

Why is lasso feature selection unstable with correlated variables? Why must scaling happen inside every cross-validation fold?

## What this does not solve

Regularization cannot correct leakage, missing causal confounders, nonlinear targets, or a validation split that does not resemble deployment.

## Continue, go deeper, apply it

Continue with regularization paths and generalized linear models. Use ridge as a strong numeric baseline before expensive feature selection.
