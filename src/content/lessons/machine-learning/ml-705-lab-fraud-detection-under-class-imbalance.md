---
title: "Lab: fraud detection under class imbalance"
track: "machine-learning"
order: 705
status: live
summary: "Build a review queue for rare events using precision, recall, costs, and delayed confirmation."
duration: "90 min lab"
updated: "2026-08-30"
---

## The short answer

Frame fraud as a ranked investigation queue. Use time-respecting labels, evaluate precision and recall at investigation capacity, estimate cost carefully, and separate suspicious events from confirmed fraud.

## Why this matters

With rare outcomes, a model can claim high accuracy by predicting “not fraud” for every transaction. Overaggressive blocks can also harm legitimate customers, so score quality must be connected to a review and appeal process.

## How it works

Build features available before authorization or review. Split by event time and prevent the same entity from leaking across validation where appropriate. Compare a rules baseline, class-weighted logistic regression, and a tree model. Plot PR curves and precision-recall at top-k queues. Use confirmed labels only after a realistic maturity delay. Treat class weights and resampling as training choices, never substitutes for capacity-based evaluation.

## Worked examples and variations (4 examples incl. boundary/counterexample)

1. A team can investigate the top 200 events per day; measure precision at 200.
2. Transaction amount may inform a review priority but should not become the sole definition of harm.
3. Delayed chargebacks require excluding recent, immature transactions from final labels.
4. Counterexample: random oversampling before the train/test split copies the same positive record into test data.

## Two ways to see it

Operations sees a finite queue with investigator hours. Statistics sees rare-event ranking with censored and delayed labels.

## Hands-on

Deliver a label-maturity policy, time split, rules baseline, two ML baselines, PR curve, top-k table, and a confusion-cost worksheet with explicitly stated assumptions. Intentionally fail by reporting accuracy or oversampling before splitting; capture the misleading result, then reset with resampling inside training folds only. Add an investigation disposition field so false positives and new fraud patterns can be reviewed.

## Checkpoint

You can explain why a threshold follows capacity and costs, and why “fraud” labels may be incomplete or delayed.

## What this does not solve

The lab does not authorize automatic declines, determine legal fraud, or eliminate adversarial adaptation.

## Continue, go deeper, apply it

Add drift alerts, analyst feedback quality checks, graph features with leakage review, and a controlled policy evaluation.
