---
title: "Calibration, proper scoring rules, and distribution shift"
track: "maths-foundations"
status: live
summary: "A probabilistic predictor is calibrated when, among cases assigned probability p, the event occurs at approximately rate p."
duration: "4 min read"
---

## The short answer

A probabilistic predictor is calibrated when, among cases assigned probability p, the event occurs at approximately rate p. Accuracy checks decisions at a threshold; proper scoring rules reward honest probability estimates across thresholds. Calibration can fail after distribution shift even when accuracy looks stable. Measure reliability by bins or a calibration curve, inspect subgroup and time slices, and recalibrate only on representative data.

## Why this matters

A reviewer, triage queue, or resource planner needs probabilities that mean what they say. Two classifiers can have the same accuracy while one is confidently wrong and the other expresses useful uncertainty.

**Small incident (illustrative):** a risk score remained accurate on a changed traffic mix because the majority class dominated, while its predicted probabilities became too high for the new subgroup. Accuracy concealed a decision-cost and trust problem.

## How it works

For predictions pᵢ and binary labels yᵢ, the Brier score is the mean squared probability error, `mean((pᵢ−yᵢ)²)`. Log loss is `−mean(yᵢ log pᵢ + (1−yᵢ) log(1−pᵢ))`. A reliability table groups predictions into bins and compares average p with observed event frequency. A proper scoring rule is optimised in expectation by reporting the true conditional probability, under its assumptions.

### Assumptions and derivation

Calibration is a population property: the binning, sample size, and target population matter. Shift changes `P(X,Y)` or its conditionals, so a calibration curve from yesterday may not apply today. A score is not a calibration proof; it aggregates discrimination, sharpness, and reliability differently.

## AI use

Use calibration for abstention, queue capacity, risk communication, threshold selection, and model comparison. Report accuracy or ranking metrics with Brier/log loss and reliability plots. Recalibration maps scores to probabilities; it does not create discrimination or repair label shift by itself.

## Worked examples and variations

### Example A — smallest happy path

**Input:** ten predictions all near .2, with two positive labels. **Mechanism:** observed rate=.2 and mean prediction≈.2. **Output:** a well-calibrated bin. **Inspect:** include the bin count and interval around the observed rate. **Next decision:** this evidence supports calibration in that slice, not every future slice.

### Example B — meaningful variation

**Input:** two models each get 8/10 labels correct; model A predicts [.51,.51,…] while model B predicts [.99,.99] on its correct cases and .01 on its wrong cases. **Mechanism:** accuracy matches but log loss heavily penalises confident errors. **Output:** B can have much worse probabilistic quality. **Inspect:** compute Brier and log loss. **Next decision:** choose a score matching whether confidence matters.

### Example C — boundary case

**Input:** a bin contains one prediction of .8 and one label 1. **Mechanism:** empirical rate=1, but the bin estimate is extremely noisy. **Output:** apparent perfect calibration with negligible evidence. **Inspect:** show counts and uncertainty. **Next decision:** merge bins or collect more observations.

### Example D — shift counterexample

**Input:** a model is calibrated on daytime traffic but nighttime cases have different base rates. **Mechanism:** predicted probabilities retain the old conditional mapping while event prevalence changes. **Output:** reliability curve drifts; accuracy may remain similar. **Inspect:** compare time and subgroup calibration. **Next decision:** recalibrate with representative labels or restrict use.

## Computation and interpretation

```python
import numpy as np

y = np.array([1, 1, 0, 0])
p = np.array([.9, .8, .2, .1])
brier = np.mean((p - y) ** 2)
log_loss = -np.mean(y * np.log(p) + (1 - y) * np.log1p(-p))
print(brier, log_loss)
```

Lower is better for both scores, but their penalties differ. Always state whether the score is computed on rows, users, sessions, or weighted slices.

## Two ways to see it

### Builder view

Calibration is a contract between a numeric output and an observed frequency. Store predictions before outcomes arrive so the evaluation cannot silently select only convenient cases.

### Systems view

Probabilities are consumed by thresholds, humans, and budgets. Shift, feedback loops, and selective labels can change the meaning of a score after deployment.

## Hands-on

Create a reliability table for 20 deterministic predictions in four bins and compute accuracy, Brier score, and log loss. **Failure fixture:** drop the two confident errors before scoring. **Test:** the full fixture must score worse than the filtered fixture and the report must show the changed denominator. **Reset:** restore all rows, preserve the original prediction order, and recompute each metric.

## Checkpoint

- [ ] Define calibration in terms of predicted probabilities and observed frequencies.
- [ ] Explain why accuracy cannot distinguish cautious and overconfident predictions.
- [ ] Calculate Brier score for two binary predictions.
- [ ] Name two signs that shift may have broken calibration.

## What this does not solve

Calibration does not guarantee discrimination, fairness, causal validity, or safe thresholding. Small bins are noisy; global calibration can hide subgroup miscalibration. Recalibration needs labels from the intended population and an explicit monitoring plan.

## Continue, go deeper, apply it

- Continue: Causal inference foundations
- Go deeper: KL divergence and distribution mismatch
- Apply it: Fairness and subgroup evaluation
