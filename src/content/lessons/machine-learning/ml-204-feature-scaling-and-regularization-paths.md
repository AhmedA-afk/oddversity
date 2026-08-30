---
title: "Feature scaling and regularization paths"
track: "machine-learning"
order: 204
status: live
summary: "Make penalties comparable across features and read a regularization path without fooling yourself."
duration: "20 min read"
updated: "2026-08-30"
---

## The short answer

A coefficient penalty is measured in feature units. Scaling changes what “small coefficient” means, so standardize penalized numeric features and inspect how coefficients evolve across many penalty strengths rather than trusting one fitted model.

## Why this matters

Without scaling, a feature measured in thousands can receive a tiny coefficient and evade a penalty while a 0–1 feature is heavily shrunk. This produces arbitrary selection and weak reproducibility.

## How it works

Compute training-fold means and standard deviations, transform training and validation with those training statistics, and preserve the fitted transformer for serving. A path refits the model for a decreasing sequence of $\lambda$ values. Read it alongside validation loss: coefficients entering early indicate fit under the chosen representation, not causal importance. Treat one-hot variables deliberately; scaling sparse indicators may hurt interpretation.

## Worked examples and variations

1. Revenue in rupees and number of purchases need scaling before ridge comparison.
2. A binary fraud flag remains interpretable without centring if the modelling policy supports it.
3. Constant features have zero standard deviation and should be removed or safely handled.
4. Fitting a scaler on the full dataset leaks validation distribution information.
5. A path that changes wildly after one row is removed reveals instability, not a stable discovery.

## Two ways to see it

Scaling changes coordinate geometry: circles in standardized coefficient space represent comparable changes. Operationally, it is a fitted data transformation that must travel with the model artifact.

## Hands-on

Fit lasso with raw and standardized features, then compare selected variables. Deliberately fit the scaler on train plus validation and note the optimistic score. Reset with a pipeline and generate a coefficient-path plot from training folds only; document the chosen $\lambda$ rule before viewing test performance.

## Checkpoint

Why is a regularization path not a feature-importance ranking? Which data may be used to fit a scaler during cross-validation?

## What this does not solve

Scaling does not fix skew, outliers, semantic unit errors, or a feature that will be unavailable at inference time.

## Continue, go deeper, apply it

Use this discipline for distance-based models too. Next, extend linear predictions beyond Gaussian outcomes with GLMs.
