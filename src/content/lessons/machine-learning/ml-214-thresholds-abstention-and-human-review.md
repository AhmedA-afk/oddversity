---
title: "Thresholds, abstention, and human review"
track: "machine-learning"
order: 214
status: live
summary: "Turn scores into decisions using costs, capacity, uncertainty, and a designed human fallback."
duration: "25 min read"
updated: "2026-08-30"
---

## The short answer

A score is not a decision. Choose thresholds from the costs of false positives and false negatives, available review capacity, and whether the model can abstain. Human review is a workflow with measurable accuracy and delay, not a magic override.

## Why this matters

The same fraud probability can justify automatic blocking, manual review, or no action depending on harm, budget, and user rights. A default 0.5 threshold silently embeds an arbitrary policy.

## How it works

For calibrated probability $p$, compare expected action costs. A simple binary threshold follows from the relative error costs when costs are known. Add an abstention band around uncertainty or where errors are high-cost, then route those cases to a reviewed queue. Evaluate the complete system: model, queue capacity, reviewer agreement, turnaround time, appeals, and feedback-loop effects. Thresholds can vary only when policy, legality, and fairness review support the distinction.

## Worked examples and variations

1. Low-cost marketing offers may accept more false positives than account freezes.
2. A small review queue should prioritize expected prevented harm, not merely highest score.
3. An abstention region can send borderline medical-adjacent claims to qualified review rather than automate them.
4. If reviewers only see model-positive cases, labels for negatives are missing and feedback is biased.
5. A threshold chosen on balanced development data can be wrong after deployment prevalence changes.

## Two ways to see it

Thresholding is expected-utility optimization. Workflow design sees it as a queueing and governance problem: an accurate classifier is useless if reviewed cases wait past the decision deadline.

## Hands-on

Create a cost matrix and calculate expected cost across thresholds on a calibration set. Add a middle abstention band and simulate fixed reviewer capacity. Intentionally choose the best threshold on the final test set; reset by selecting on validation data and reporting one untouched-test system evaluation with queue metrics.

## Checkpoint

Why is 0.5 rarely a justified default? What must be measured about a human-in-the-loop system beyond model accuracy?

## What this does not solve

Threshold policy cannot compensate for invalid labels, prohibited uses, biased review, or a missing appeal process.

## Continue, go deeper, apply it

Apply this to every consequential classifier. Continue with the diagnostic lab before deploying a linear model.
