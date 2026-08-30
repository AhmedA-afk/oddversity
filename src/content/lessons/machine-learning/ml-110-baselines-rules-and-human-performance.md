---
title: "Baselines, rules, and human performance"
track: "machine-learning"
order: 110
status: live
summary: "Build honest reference systems that reveal whether machine learning adds value over simple, current practice."
duration: "23 min read"
updated: "2026-08-30"
---

## The short answer

Evaluate ML against the best available alternative: a constant or prevalence predictor, a simple statistical model, a transparent rule, the current operational process, and—where appropriate—human judgment under comparable information and time constraints. A complex model is justified by incremental decision value, not by being more sophisticated.

## Why this matters

Without a baseline, “82% accuracy” is uninterpretable. In a rare-event task it may lose to predicting “never.” In a workflow where a specialist already performs well, an ML system may be most valuable as triage, second review, or workload prioritization rather than replacement.

## How it works

Make baselines before extensive feature work. Match the same split, prediction horizon, feature availability, and decision threshold. Report uncertainty and operating points, not a single leaderboard number. When comparing people, distinguish unaided judgment, aided judgment, and performance on a selected subset.

```text
reference ladder:
prevalence -> simple rule -> regularized linear model -> current process -> proposed model
```

## Worked examples and variations

1. Demand forecasting: compare against last-week sales and seasonal average before a gradient-boosted model.
2. Churn: compare with “contact customers with recent complaints” before a score that requires many fragile features.
3. Image review: compare model sensitivity at the same review capacity, not raw accuracy against a clinician with more context.
4. Boundary case: if no human currently makes the decision, use a policy or simulation baseline and state its limitations.
5. Counterexample: comparing a model using post-decision notes with a human who only sees intake information is not a fair human-versus-model test.

## Two ways to see it

Baselines are controls in an experiment. They are also product alternatives: if a spreadsheet rule solves the decision safely, it may be the better system.

## Hands-on

Implement a prevalence baseline, one domain rule, and a regularized linear baseline. Intentionally tune the proposed model on a different split from the baselines. Reset so all candidates use identical folds and threshold-selection rules. Record where each fails, not only its average score.

## Checkpoint

- What is the current decision process, and what information does it use?
- Does each baseline obey the same `t0` and evaluation split?
- What added value would justify the new model’s maintenance cost?

## What this does not solve

Strong baselines do not choose the correct business objective or guarantee a safe rollout. They make the incremental claim testable.

## Continue, go deeper, apply it

Translate baseline performance into decisions with explicit benefits, harms, review capacity, and thresholds.
