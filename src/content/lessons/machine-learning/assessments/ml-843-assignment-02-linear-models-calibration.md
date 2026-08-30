---
title: "Assignment 2: derive, implement, and calibrate a linear decision model"
track: "machine-learning"
order: 843
status: live
summary: "Build linear and logistic models from first principles, then justify regularisation and decision thresholds."
duration: "12–16 hours"
updated: "2026-08-30"
---

## Goal

Using the Assignment 1 dataset or a supplied binary classification dataset, show that you understand the model beneath the library call. Your notebook must implement batch gradient descent for linear or logistic regression using NumPy only, then compare it to a pipeline implementation.

## Required work

Derive the objective and gradient in your own notation. Implement loss, gradient, prediction, and convergence diagnostics. Compare unregularised, L1, and L2 models using nested validation or a locked validation set. Plot learning curves, coefficient paths, calibration curve, ROC and precision–recall curves. Choose a threshold from an explicit cost matrix—not 0.5 by habit. Explain three individual predictions using coefficients and feature values.

## Submission artefacts

Provide `derivation.pdf`, an executable `assignment02.ipynb` plus exported `.py`, `requirements.lock`, figures, configuration, and `decision-memo.md`. The memo must name the chosen model, threshold, uncertainty, subgroup results, and a condition under which deployment is prohibited.

## Rubric (100 points)

| Criterion | Points |
| --- | ---: |
| Correct derivation and numerical implementation | 25 |
| Tests against finite-difference gradients and library output | 15 |
| Regularisation and validation discipline | 15 |
| Calibration, threshold, and expected-cost reasoning | 20 |
| Error, slice, and residual analysis | 15 |
| Reproducibility and clear decision memo | 10 |

## Self-check

- Verify the analytic gradient against finite differences on a tiny synthetic dataset.
- Confirm that multiplying feature scale changes raw coefficients but not the documented pipeline’s intended behaviour.
- Compare threshold choice under prevalence shift.
- Report a case where probability calibration improves while ranking does not.

## Common failure modes

Do not tune lambda on the test set. Do not interpret a logistic coefficient as a probability change. Do not use correlation alone to select features, or make causal language from predictive coefficients. Missing convergence evidence, unseeded splits, and plots with unlabeled axes are incomplete work.
