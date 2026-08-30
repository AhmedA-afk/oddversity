---
title: "Lab: churn classification"
track: "machine-learning"
order: 703
status: live
summary: "Create an actionable churn workflow with a real intervention budget and temporal labels."
duration: "90 min lab"
updated: "2026-08-30"
---

## The short answer

Predict a clearly defined future cancellation event from behavior available before outreach, then choose a threshold from contact capacity and intervention value—not from accuracy alone.

## Why this matters

Churn models often become retrospective dashboards: they use cancellation signals or score every customer even though only a small team can act. A good workflow predicts early enough for a helpful, appropriate intervention.

## How it works

Define an observation window, a gap that prevents last-minute leakage, and a prediction horizon. Create customer-period rows, aggregate events only inside the observation window, and split by time and customer. Compare a regularized logistic regression with a tree ensemble. Evaluate PR-AUC, recall at the team’s weekly capacity, calibration, and incremental business value against a simple inactivity rule. Review errors with retention staff before designing outreach.

## Worked examples and variations (4 examples incl. boundary/counterexample)

1. A subscription ends within 30 days after a 60-day observation window.
2. Low usage can be a useful feature when usage is measured before the gap.
3. A score can allocate 500 calls weekly; inspect precision and recall at 500, not only at a default threshold.
4. Counterexample: “support ticket marked cancellation” appears after intent is revealed and is leakage for proactive outreach.

## Two ways to see it

The product view is queue prioritization under limited agent time. The ML view is temporal binary classification with an intervention policy layered on calibrated probabilities.

## Hands-on

Deliver a feature cutoff diagram, row-level dataset construction script, baseline inactivity rule, two models, calibration curve, and a capacity table for 100, 500, and 1,000 contacts. Intentionally fail by random-splitting customer periods or including a cancellation workflow field; record the metric change, remove the defect, and reset to an out-of-time test. Draft two outreach variants and state that model evaluation alone cannot prove either reduces churn.

## Checkpoint

You can distinguish a high-risk customer from a customer likely to benefit from contact, and can justify a threshold using capacity.

## What this does not solve

Prediction does not measure treatment effect, prevent all cancellations, or justify manipulative retention practices.

## Continue, go deeper, apply it

Run a randomized outreach experiment, then investigate uplift modeling only after the experiment and measurement system are trustworthy.
