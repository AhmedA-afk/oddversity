---
title: "Use regularization to control the bias-variance tradeoff"
track: "machine-learning"
status: live
summary: "Regularization adds a preference for simpler or smoother models so they do not memorize every training fluctuation."
duration: "3 min read"
---

## The short answer

Regularization adds a preference for simpler or smoother models so they do not memorize every training fluctuation. More regularization can reduce variance while increasing bias; less can fit richer patterns while becoming unstable. Choose it with held-out evaluation and a clear complexity reason, not because “simple is always better.”

## The mechanism

L2 regularization penalizes large weights; L1 encourages sparsity. Early stopping,
feature selection, tree depth, and neighborhood size are also complexity controls.
The penalty belongs inside the training objective and must be tuned without using
the final test set.

## Four examples

### Example A: many text features

L2 can stabilize correlated word features; L1 may produce a sparse vocabulary.
Compare predictive stability, not only the number of nonzero weights.

### Example B: polynomial regression

A high-degree polynomial can fit every training point and oscillate between them.
Regularization or a lower degree can improve generalization.

### Boundary case: underfitting

If both training and validation error are high, adding regularization may worsen
the issue. Improve representation or revisit the target first.

### Counterexample: tune on the test set

Trying ten penalties and reporting the best test score turns the test set into
training information. Use validation or nested evaluation.

## An illustrative story

A sparse model was celebrated because it used only twelve features. Later review
found that its selected features changed wildly across samples. Compactness was
not the same as stability.

## Two ways to see it

### Statistical view

Regularization trades flexibility for lower sensitivity to sample noise.

### Communication view

The complexity choice is a hypothesis about what variation should be ignored; it
must be recorded and challenged.

## Hands-on

Create a synthetic dataset with a small true signal and many distractors. Sweep
L1/L2 strengths, compare training/validation error, inspect coefficient stability,
and select a value using a predeclared rule.

## Checkpoint

- [ ] Training, validation, and test roles are separate.
- [ ] The chosen regularizer has a stated purpose.
- [ ] Underfit and overfit cases are distinguished.

## What this does not solve

Regularization cannot fix leakage, biased labels, or a target that does not match
the decision. It controls one kind of complexity.

## Continue, go deeper, apply it

- Continue: Decision trees and entropy
- Go deeper: Cross-validation and experimental design
- Apply it: add a regularization sweep and stability note to a model report.

## Complexity appears in the objective

Ridge regression minimizes RSS plus lambda times the sum of squared weights. Lasso replaces squared weights with absolute values:

~~~text
ridge: RSS + λ Σ wⱼ²
lasso: RSS + λ Σ |wⱼ|
~~~

Ridge has a smooth derivative and tends to share weight among correlated features. Lasso has corners at zero, which can set coefficients exactly to zero; when features are correlated it may choose one arbitrarily. Elastic net combines both. Standardize numeric features before comparing a common penalty because otherwise a feature's units change how much its coefficient is penalized.

## Bias and variance through repeated samples

Imagine repeatedly collecting training datasets from the same process. A very flexible model may fit each sample closely but give substantially different predictions at the same new point: high variance. A restricted model gives similar predictions across samples but may systematically miss curvature: high bias. Expected squared error can be decomposed conceptually into noise plus bias squared plus variance. The decomposition is a guide, not a license to diagnose every curve by slogan.

Use learning curves. If training and validation error are both high and close, the representation/model may be too limited. If training error is low but validation error much higher, variance or split mismatch is plausible. More data can reduce variance; more regularization can reduce sensitivity; neither fixes a mislabeled target.

## Worked regularization effect

With one standardized feature and an unregularized slope estimate 4, a ridge-like shrinkage factor can be imagined as 1/(1+lambda) in a simplified orthogonal setting. At lambda = 3, the slope becomes about 1. This may increase training error while lowering error on a noisy future sample. In real correlated designs, the exact result requires solving the regularized system, so use cross-validation rather than this toy formula to choose lambda.

## Debugging clinic: instability hidden by a good score

Resample your training set 30 times, fit the same regularization setting, and record selected features and coefficients. If validation score is stable but the top features change radically, avoid a strong feature-story claim. Compare ridge, lasso, and elastic net on the same folds. Verify that scaling and imputation are fit inside each fold; otherwise the sweep itself leaks information.

## Assessment: tune without contaminating a test set

Sketch a nested cross-validation procedure for choosing model degree and lambda. For each of four observations—high train/high validation error, low train/high validation error, low both, and rising validation error during training—state a plausible explanation and a next check. Explain why L1 sparsity does not automatically establish that selected features are the only relevant causes.

Add a stability table across folds: validation score, coefficient norm, selected-feature set, and worst slice. It stops a slightly better mean score from hiding a model whose behavior changes whenever the sample changes.

Also document the chosen penalty scale and preprocessing version.
