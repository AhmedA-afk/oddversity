---
title: "Probability calibration in practice"
track: "machine-learning"
order: 213
status: live
summary: "Check whether predicted probabilities mean what they say, then repair and monitor them without test-set leakage."
duration: "23 min read"
updated: "2026-08-30"
---

## The short answer

A classifier is calibrated when cases predicted near probability $p$ occur about $p$ of the time in the relevant population. Ranking quality and calibration are distinct: a model can order cases well while systematically overstating risk.

## Why this matters

Probabilities drive review queues, expected-loss calculations, and user communication. Calling a 20% event “80% likely” can cause expensive or unfair allocation even when AUC looks strong.

## How it works

Use reliability diagrams, calibration intercept/slope, log loss, and Brier score on held-out data. Fit calibration mappings such as logistic (Platt-style) scaling or isotonic regression on a calibration split—not on the final test set. Preserve prevalence and sampling design; models trained with class rebalancing may need post-fit calibration for the deployment population. Recheck after drift.

## Worked examples and variations

1. Among cases predicted 0.7, roughly 70% outcomes should occur over a suitably large comparable sample.
2. A model can have excellent AUC but output 0.99 for cases that occur 0.7 of the time.
3. Isotonic calibration can overfit a very small calibration set.
4. Calibration learned on last year's population can fail after an intervention changes base rates.
5. Binning too finely creates noisy apparent failures; binning too coarsely hides structure.

## Two ways to see it

Calibration aligns stated confidence with observed frequencies. Ranking only asks whether positives tend to score above negatives; it says nothing about whether 0.8 means eight in ten.

## Hands-on

Split data into train, calibration, and test by the deployment-relevant rule. Fit a classifier, draw reliability curves before and after calibration, and report Brier score. Intentionally calibrate on the test set; reset by discarding that result and using a held-out calibration set, then preserve final test data untouched.

## Checkpoint

Can a model have high AUC and bad calibration? Which split is permitted to fit a calibration mapping?

## What this does not solve

Calibration does not ensure fairness, causal validity, or usefulness at a particular operating threshold.

## Continue, go deeper, apply it

Connect calibrated probabilities to thresholding, abstention, and monitoring. Recalibrate only with a governed evaluation and release process.
