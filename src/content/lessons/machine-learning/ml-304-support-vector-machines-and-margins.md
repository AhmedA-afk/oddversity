---
title: "Support vector machines and margins"
track: "machine-learning"
order: 304
status: live
summary: "SVMs choose a separating boundary with a large margin while trading margin violations against complexity through the parameter C."
duration: "14 min read"
updated: "2026-08-30"
---

## The short answer

A support vector machine seeks a decision boundary that separates classes with the widest possible margin. Soft-margin SVMs allow violations because real data overlap. Only points on or inside the margin—the support vectors—directly determine the fitted boundary.

## Why this matters

Margins formalize robust separation: a boundary that leaves room around observations is often less sensitive to small perturbations. SVMs remain a useful benchmark where classes are clear, features are carefully prepared, and calibrated probabilities are not the primary output.

## How it works

For labels \(y_i\in\{-1,1\}\), the soft-margin objective balances \(\frac12\|w\|^2\) with hinge loss \(\max(0,1-y_i(w^Tx_i+b))\). Large \(C\) penalizes violations strongly and can chase outliers; small \(C\) tolerates violations for a wider, simpler margin. Kernels replace inner products for nonlinear SVMs.

## Worked examples and variations

1. **Fraud triage:** use class weights and a threshold policy because the default sign boundary ignores unequal review cost.
2. **Defect images with fixed features:** a linear SVM can be competitive when the features already separate defect classes.
3. **Overlapping species:** soft margins are essential; hard separation would let one mislabeled specimen distort the line.
4. **Boundary case:** duplicate points exactly on the boundary can be support vectors without indicating model failure.
5. **Counterexample:** interpreting raw SVM scores as probabilities can badly overstate risk; calibrate on held-out data if probabilities are needed.

## Two ways to see it

**Optimization view:** minimize a regularized convex surrogate for classification error.

**Robustness view:** maximize the buffer that small input movements can cross only with difficulty.

## Hands-on

Fit linear and RBF SVMs on an imbalanced classification task. Compare unweighted and weighted objectives, inspect support vectors, and calibrate scores with a held-out calibration set. Deliberately add ten mislabeled outliers, test several \(C\) values, then reset and document which setting was most brittle.

## Checkpoint

- [ ] You can distinguish margin width from observed classification accuracy.
- [ ] You have a probability-calibration plan when decisions need risk scores.
- [ ] You test sensitivity to outliers and class weights.

## What this does not solve

An SVM cannot infer cost, causality, or a safe action threshold from labels alone.

## Continue, go deeper, apply it

Compare margin regularization with logistic regression and then move to tree-based partitioning.
