---
title: "Combine models when their errors differ"
track: "machine-learning"
status: live
summary: "Ensembles combine several predictors to improve stability or focus on residual errors."
duration: "3 min read"
---

## The short answer

Ensembles combine several predictors to improve stability or focus on residual errors. Bagging reduces variance by averaging diverse learners; boosting builds a sequence that emphasizes mistakes. Ensembles can be powerful, but their complexity, calibration, latency, and feature shortcuts still require evaluation.

## The mechanism

Random forests train varied trees and aggregate them. Boosting adds weak learners
sequentially, fitting what the current model misses. Diversity matters: identical
models add compute without adding independent information.

## Four examples

### Example A: noisy tabular data

Randomized trees can stabilize a single deep tree. Compare out-of-bag or held-out
behavior with a transparent baseline.

### Example B: residual improvement

Boosting can turn repeated small errors into a better fit. Track validation loss
and complexity as rounds increase.

### Boundary case: correlated learners

Ten models making the same shortcut do not create ten independent votes. Inspect
error overlap and feature use.

### Counterexample: feature importance as explanation

An ensemble’s importance ranking can distribute credit strangely among correlated
features. Treat it as a diagnostic and use case-level error analysis.

## An illustrative story

A blended model won the benchmark but was too slow for the review queue. A simpler
model with a small ensemble fallback met the service goal and made failures easier
to investigate.

## Two ways to see it

### Statistical view

Ensembling trades compute for variance reduction or residual fitting.

### Systems view

Each learner adds memory, latency, versioning, and monitoring work.

## Hands-on

Train a shallow tree, a deep tree, a bagged ensemble, and a boosted ensemble on
the same split. Compare error overlap, calibration, latency proxy, and slice
behavior. Write the smallest model that meets the decision requirement.

## Checkpoint

- [ ] You can explain bagging versus boosting.
- [ ] Diversity and error overlap are measured.
- [ ] Operational complexity is part of model selection.

## What this does not solve

More models do not fix leakage, poor labels, unfair decisions, or a metric that
does not represent the product outcome.

## Continue, go deeper, apply it

- Continue: Cross-validation and experimental design
- Go deeper: Decision trees and entropy
- Apply it: publish an ensemble comparison with an error-overlap matrix.

## Why averaging can help

If several unbiased estimators have variance sigma squared and pairwise error correlation rho, averaging m of them has variance approximately:

~~~text
variance(mean) = sigma² [rho + (1-rho)/m]
~~~

When rho is zero, variance shrinks by m. When rho is one, averaging identical errors changes nothing. Random forests deliberately decorrelate trees through bootstrap samples and random feature subsets, then average their predictions or vote. Their success is not “many models”; it is many imperfect models with partially different errors.

Out-of-bag examples are rows excluded from a tree's bootstrap sample. Aggregating their predictions can offer a convenient internal validation estimate, but it does not replace a final time-aware or group-aware test when deployment has those dependencies.

## Boosting as stage-wise correction

Boosting adds weak learners sequentially. In gradient boosting, each new tree approximates the negative gradient of the current loss with respect to predictions. Under squared error, this is the residual; later trees focus where earlier ones underpredict or overpredict. Learning rate, tree depth, number of rounds, and subsampling jointly control capacity.

Imagine an initial model predicts every house at $300k. If a group of large houses has residual +$100k, the next shallow tree may add +$60k to that region; subsequent trees refine what remains. This flexibility can capture interactions but can also follow label noise and leakage with alarming efficiency.

## Ensemble choices beyond score

Bagging generally reduces variance and is robust with deep unstable base learners. Boosting can reduce bias and capture complex tabular patterns but needs careful early stopping and calibration checks. Stacking trains a meta-model from out-of-fold base predictions; if it trains the meta-model on in-sample predictions, it leaks base-model memorization. Blending should be justified by complementary errors, latency, maintenance, and incident response needs.

## Debugging clinic: diversity illusion

Evaluate three candidates on the same untouched validation cases. Make an error-overlap table: for every pair, count cases both get wrong, only one gets wrong, and both get right. If two models fail on the same fraud subtype, blending them may add little. Next measure prediction latency and calibration before and after averaging. A higher AUC is insufficient if a queue misses its decision deadline or probabilities become unusable.

## Assessment: ensemble design memo

Given five trees with individual error variance 0.04, calculate the average variance for m=5 when rho is 0, 0.5, and 1. Propose a random-forest and gradient-boosting experiment with a validation protocol, early-stopping rule, and three production constraints. Explain why feature importance from the winning ensemble is not a complete explanation for one customer decision.

## Reproducible ensemble comparison

Fix the split, seed, feature pipeline, cost metric, and latency environment before comparing candidates. Report a confidence interval or repeated-fold variation beside the average score. For boosting, save the best iteration selected on validation and ensure the final refit follows a prewritten rule; selecting rounds after reading a final test result contaminates the test. Keep a simpler baseline in the release report. An ensemble is valuable only when its incremental benefit survives these controls and its failure mode can still be investigated by the team that must own it.
