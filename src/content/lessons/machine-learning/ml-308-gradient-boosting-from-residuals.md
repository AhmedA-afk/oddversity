---
title: "Gradient boosting from residuals"
track: "machine-learning"
order: 308
status: live
summary: "Gradient boosting builds an additive model by repeatedly fitting weak learners to the current loss gradient, often residual-like errors."
duration: "14 min read"
updated: "2026-08-30"
---

## The short answer

Gradient boosting adds small trees one after another. Each new tree is trained to improve the current model under a chosen loss—ordinary residuals for squared-error regression, and a pseudo-residual or negative gradient for other objectives. Shrinkage and early stopping prevent the sequence from correcting noise forever.

## Why this matters

Boosted trees are a leading choice for many structured-data problems because they capture interactions, missingness patterns, and nonlinearities efficiently. Their power makes validation discipline and objective design especially important.

## How it works

Start with a constant prediction. At iteration \(m\), compute the negative gradient of loss with respect to the current prediction, fit a shallow tree to that signal, then add \(\eta\) times the tree output. For squared loss, this is fitting residuals. For logistic loss, it is not raw class-label residuals. Tree depth controls interaction order; learning rate and number of rounds form a joint regularization choice.

## Worked examples and variations

1. **Delivery time:** each shallow tree corrects remaining underestimates associated with traffic, weather, and route interactions.
2. **Binary default risk:** optimize logistic loss, then calibrate and choose an operational threshold separately.
3. **Quantile demand forecast:** use pinball loss to estimate an upper service-level quantile instead of only the mean.
4. **Boundary case:** a single shallow tree may outperform a long boost sequence when data are tiny or the relationship is simple.
5. **Counterexample:** fitting raw residuals for a classification objective ignores the loss geometry and can produce invalid probabilities.

## Two ways to see it

**Function-space view:** each learner takes a small step down the loss surface.

**Error-correction view:** the model repeatedly focuses capacity on what previous trees still miss.

## Hands-on

Implement ten boosting rounds for squared-error data: fit a depth-2 tree to residuals, apply a learning rate, and graph loss after each round. Deliberately use learning rate 1 with deep trees, inspect validation overfit, then reset with shallow trees, shrinkage, and early stopping.

## Checkpoint

- [ ] You distinguish residuals from general negative gradients.
- [ ] Loss, target transformation, and evaluation metric align.
- [ ] Iteration count is validation-controlled.

## What this does not solve

Boosting cannot extrapolate reliably, infer policy impact, or make a skewed label process representative.

## Continue, go deeper, apply it

Continue to library design tradeoffs and tuning a boosted model safely.
