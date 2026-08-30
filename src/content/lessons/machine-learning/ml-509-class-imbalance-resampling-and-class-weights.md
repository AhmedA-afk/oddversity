---
title: "Class imbalance, resampling, and class weights"
track: "machine-learning"
order: 509
status: live
summary: "Choose metrics, thresholds, data collection, and weighting around the cost of mistakes instead of treating a rare class as a generic technical nuisance."
duration: "15 min read"
updated: "2026-08-30"
---

## The short answer

When an outcome is rare, accuracy can be high while the system misses the cases that matter. Define the decision cost and capacity first, then choose prevalence-aware metrics, thresholding, class weights, resampling, or targeted labeling. Apply resampling only to training data inside each fold; preserve the natural prevalence in evaluation unless deployment deliberately changes it.

## Why this matters

Fraud, safety incidents, disease, and urgent support requests are often rare. A model that predicts the common class everywhere may look impressive on a dashboard and fail at its purpose. Overcorrecting can also flood limited reviewers with false alarms.

## How it works

Use precision-recall curves, recall at a review budget, expected cost, calibration, and confusion matrices at the intended threshold. Class weighting changes the learning objective so minority errors count more. Oversampling duplicates or synthesizes training examples; undersampling removes common examples. Both can help optimization, but neither changes the truth of how common an event is at evaluation time.

Tune the threshold after fitting the model, using a validation set and a documented capacity or cost rule. Track prevalence drift because precision is sensitive to it. Audit labels: a class that looks rare may be underobserved or delayed.

## Worked examples and variations

### Example 1: fraud review queue

Rank transactions and choose the threshold that fills 500 daily reviews. Report precision and recall at 500, not only ROC AUC, because review capacity is the decision constraint.

### Example 2: cancer screening aid

Weight false negatives more heavily only after clinicians define the workflow and confirmatory testing. A classifier's threshold is not a clinical policy by itself.

### Example 3: toxic-content reports

Oversample rare confirmed violations inside training folds, then evaluate on a natural production-like sample. Review precision separately for actions with different consequences.

### Example 4: anomaly labels arrive late

Treat recent unlabeled events cautiously. Calling them negatives can create apparent imbalance and silently teach the model that emerging fraud is normal.

### Boundary case: no positive examples in a fold

Metrics may be undefined. Redesign folds or acquire labels; do not replace the metric with a flattering default without recording the limitation.

### Counterexample: oversampling before the split

Duplicating rare examples before splitting can place copies in train and validation, leaking the answer. Resample only after each training partition is defined.

## Two ways to see it

The learning view changes how errors influence parameter fitting. The decision view chooses how scarce attention, false alarms, and missed cases should be traded, which no resampling recipe can decide alone.

## Hands-on

Train a baseline and a class-weighted classifier on an imbalanced dataset. Plot precision-recall curves and select thresholds for two review capacities. Deliberately oversample before splitting and observe the optimistic result, then reset to fold-local oversampling. Record prevalence, unit cost assumptions, and calibration checks.

## Checkpoint

- [ ] The primary metric reflects event prevalence and decision capacity.
- [ ] Resampling occurs inside training folds only.
- [ ] Thresholds are selected with an explicit cost or workload rule.

## What this does not solve

Weights and resampling cannot compensate for missing labels, unclear harm, or a workflow that cannot safely handle false positives and false negatives.

## Continue, go deeper, apply it

Continue with distribution shift and drift. Go deeper with calibrated risk and decision curves. Apply this by publishing operating points instead of a single global accuracy number.
