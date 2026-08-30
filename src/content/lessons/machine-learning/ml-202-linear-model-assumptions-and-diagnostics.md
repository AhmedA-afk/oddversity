---
title: "Linear-model assumptions and diagnostics"
track: "machine-learning"
order: 202
status: live
summary: "Use residual evidence to decide whether a linear model is adequate and whether its inferences are defensible."
duration: "24 min read"
updated: "2026-08-30"
---

## The short answer

Diagnostics test the *model-data match*, not whether linear regression is fashionable. Inspect residual patterns, leverage, influence, dependence, and validation performance before interpreting a coefficient or a p-value.

## Why this matters

An attractive training $R^2$ can coexist with biased forecasts, misleading confidence intervals, or one customer determining the apparent relationship. Diagnostics turn “the model ran” into evidence about when to trust it.

## How it works

For conditional-mean inference, examine linearity in the chosen features, independent observations or an explicit dependence model, approximately stable residual variance, and correctly specified uncertainty. Normal residuals are mainly relevant to small-sample exact intervals, not to prediction quality itself. Plot residuals against fitted values and important features; use held-out residuals when possible. Leverage identifies unusual feature rows; influence asks whether deleting a row materially changes the fit. Diagnose on the same temporal/group split your deployment will face.

## Worked examples and variations

1. A U-shaped residual-versus-fitted plot suggests a missing nonlinear term or transformation.
2. A widening funnel for high-value orders indicates heteroscedasticity; weighted or robust uncertainty may help.
3. Repeated measurements per patient violate independence even if every residual plot looks random.
4. A high-leverage startup with an ordinary residual can still swing a salary trend substantially.
5. A dramatic training outlier that never appears in future validation may be a data-entry error, not a population fact.

## Two ways to see it

Residuals are the portion of the outcome the model failed to explain; systematic structure means the feature map left signal behind. Influence is a counterfactual: refit after removing one observation and measure how much the conclusion changes.

## Hands-on

Create residual-vs-fitted, Q-Q, and leverage plots for a regression dataset. Add a synthetic high-leverage row, refit, and compare the slope and a business decision threshold. Then reset by removing the synthetic row, and write one action for every remaining pattern rather than merely labelling it.

## Checkpoint

Which diagnostic signals a variance problem, and which signals a functional-form problem? Why does random train/test splitting fail for repeated customers?

## What this does not solve

Plots cannot prove exchangeability, repair biased labels, or choose a loss function aligned with business cost. A clean plot is not proof of causation.

## Continue, go deeper, apply it

Pair this lesson with robust regression and temporal validation. Put diagnostic plots and slice metrics into every regression model review.
