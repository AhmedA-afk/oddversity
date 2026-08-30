---
title: "Decision theory and cost-sensitive machine learning"
track: "machine-learning"
order: 111
status: live
summary: "Turn predicted probabilities into actions by making the costs, benefits, capacity, and uncertainty of each action explicit."
duration: "28 min read"
updated: "2026-08-30"
---

## The short answer

Prediction is not a decision. Choose an action by comparing expected utility, constraints, and uncertainty. For a calibrated binary risk `p`, act when the expected benefit of acting exceeds the expected harm; a threshold is a policy parameter, not a property of the classifier.

## Why this matters

Two teams can use the same risk score responsibly at different thresholds because their review capacity and consequences differ. Optimizing accuracy silently assumes equal error costs and an unconstrained action budget—assumptions that are usually false.

## How it works

For actions `a` and outcomes `y`, choose the action with largest expected utility:

```text
EU(a | x) = sum_y P(y | x) * U(a, y)
```

With “act” versus “do not act,” a simple threshold follows from the utility table. Estimate it with stakeholders, examine a range rather than claiming precision, and validate calibration near the decision boundary. Add constraints such as a fixed daily review queue or a maximum false-positive burden.

## Worked examples and variations

1. Fraud review: send the highest expected-loss transactions to a finite analyst queue.
2. Preventive maintenance: intervene when downtime avoided outweighs inspection cost and disruption.
3. Lead outreach: contact when expected incremental value exceeds contact cost, not simply when conversion probability exceeds 0.5.
4. Boundary case: if actions have equal utility for all outcomes, no predictive model changes the decision.
5. Counterexample: setting a threshold at 0.5 because a score is called a probability ignores asymmetric harm and capacity.

## Two ways to see it

Decision theory converts beliefs into choices using a utility table. Operations research sees the same problem as ranking limited resources under constraints. The first clarifies values; the second schedules scarce action.

## Hands-on

Write a 2-by-2 utility table with a domain partner and compute expected utility for three hypothetical probabilities. Intentionally use an uncalibrated score as a probability. Reset by plotting calibration on held-out data, or treat the score only as a ranking and choose a capacity cutoff.

## Checkpoint

- What action follows each score range?
- Who bears false-positive and false-negative costs?
- What capacity or fairness constraints limit the policy?

## What this does not solve

Utilities can be contested, unequal across people, and difficult to quantify. Formalizing them exposes the debate; it does not settle it.

## Continue, go deeper, apply it

Use this action policy inside a model-selection workflow and revisit it during subgroup evaluation and post-launch monitoring.
