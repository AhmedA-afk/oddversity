---
title: "Logistic regression: likelihood and odds"
track: "machine-learning"
order: 206
status: live
summary: "Connect logistic scores, Bernoulli likelihood, odds ratios, and calibrated decision probabilities."
duration: "24 min read"
updated: "2026-08-30"
---

## The short answer

Logistic regression models $p(y=1|x)=\sigma(X\beta)$, where the sigmoid maps any score to a probability. Each coefficient changes *log-odds* holding the other modelled variables fixed; it is not automatically a change in probability or a causal effect.

## Why this matters

Classification systems often need probabilities for triage, ranking, and expected-value decisions. Confusing odds, probability, and thresholded labels is a common source of harmful product logic.

## How it works

For each row, Bernoulli likelihood rewards probability assigned to the observed class. Maximizing its log likelihood is equivalent to minimizing log loss. The logit $\log(p/(1-p))$ is linear in features. Exponentiating a coefficient gives a multiplicative odds change for a one-unit feature increase under the specified model. Interactions and nonlinear features alter this interpretation.

## Worked examples and variations

1. A predicted probability of 0.2 has odds 1:4, not “20 percent odds.”
2. An odds ratio of 2 doubles odds, but the probability change differs near 0.05 and 0.80.
3. A 0.5 threshold is arbitrary when false negatives cost more than false positives.
4. Complete separation—every approved loan has one feature pattern—makes unpenalized estimates unstable.
5. Class weighting can change the fitted decision emphasis; its probabilities need validation for the deployment population.

## Two ways to see it

The sigmoid is a smooth probability constraint. Information-theoretically, log loss punishes assigning extreme confidence to the wrong label far more than a simple accuracy count does.

## Hands-on

Train a logistic model, manually convert three probabilities to odds and back, and plot probability against one feature while holding others fixed. Intentionally report an odds ratio as a probability increase; correct it by calculating two concrete baseline-dependent probability changes. Reset by assessing calibration and utility at several thresholds.

## Checkpoint

Why is a coefficient not usually a fixed probability increase? What failure occurs under complete separation?

## What this does not solve

Logistic regression does not choose the operating threshold, prove fairness, or ensure probabilities remain calibrated after prevalence shifts.

## Continue, go deeper, apply it

Continue with multiclass models and calibration. Use the score for ranking only after checking that ranking quality serves the decision.
