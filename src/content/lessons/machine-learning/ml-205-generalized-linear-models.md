---
title: "Generalized linear models"
track: "machine-learning"
order: 205
status: live
summary: "Model probabilities, counts, and positive skewed outcomes with a distribution and link that match the target."
duration: "25 min read"
updated: "2026-08-30"
---

## The short answer

A generalized linear model (GLM) keeps a linear predictor $\eta=X\beta$ but maps it to an appropriate mean using a link function. Logistic, Poisson, and Gamma-style models are not different rituals: they pair an outcome distribution with a link.

## Why this matters

Using OLS for probabilities can predict below zero or above one. Using it for sparse counts can imply negative events and misstate uncertainty. GLMs encode target constraints in the model.

## How it works

Choose a response family, a mean-variance relationship, and a link. Logistic regression uses Bernoulli likelihood and logit link; Poisson uses count likelihood and log link. Parameters are estimated by maximum likelihood, often with iteratively reweighted least squares. Check residual patterns, overdispersion, separation, and predictive calibration—not merely coefficient signs.

## Worked examples and variations

1. Purchase/no-purchase calls for a Bernoulli model and probability output.
2. Daily support tickets can use Poisson counts with an exposure offset for hours open.
3. Positive claim costs may need a Gamma-like model rather than a Gaussian response.
4. A count variance far exceeding its mean is a counterexample to a simple Poisson variance assumption.
5. Perfectly separated labels can send logistic coefficients toward infinity.

## Two ways to see it

GLMs transform a linear score into the target's legal range. Likelihood sees the same step as finding parameters that make observed outcomes most plausible under a declared stochastic process.

## Hands-on

Fit Gaussian, logistic, and Poisson models to appropriately typed targets; compare their output ranges. Intentionally fit OLS to a binary label and find impossible predictions. Reset with logistic regression and evaluate calibration, not just accuracy. State the chosen family and why its variance pattern is plausible.

## Checkpoint

What are the three pieces you choose in a GLM? Why can a log link be useful for a nonnegative mean?

## What this does not solve

A correct range does not guarantee a correct feature set, independent observations, or a valid causal conclusion.

## Continue, go deeper, apply it

Proceed to logistic likelihood, count models, and robust alternatives. Use GLMs when the target's support should shape the model.
