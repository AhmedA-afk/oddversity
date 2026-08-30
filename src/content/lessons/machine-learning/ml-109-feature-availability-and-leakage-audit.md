---
title: "Feature availability and leakage audit"
track: "machine-learning"
order: 109
status: live
summary: "Prove that each feature could exist, in its final form, when the real decision is made."
duration: "25 min read"
updated: "2026-08-30"
---

## The short answer

Leakage occurs when a model receives information unavailable at prediction time or information created by the target, future policy, or evaluation procedure. Audit every feature with lineage, event time, publication time, computation window, owner, and deployment path—not just a correlation score.

## Why this matters

Leakage produces the most seductive failures: high offline accuracy, clean-looking explanations, and collapse in production. It often arrives through aggregates, labels encoded in workflows, train/test preprocessing, or columns whose names sound innocuous.

## How it works

For each feature, record:

```text
source | raw event time | available-to-model time | aggregation cutoff | target relation | online source
```

Require `available_to_model_time <= t0`. Reconstruct a sample feature vector using only historical snapshots. Run ablations: remove suspicious feature families and compare performance. A dramatic drop is a prompt to investigate, not proof of leakage.

## Worked examples and variations

1. “Days since case closed” is downstream of a case-resolution target and cannot predict it at opening.
2. A customer’s lifetime spend computed today leaks future purchases into historical training rows.
3. A discharge summary may predict readmission well but is unavailable at admission.
4. Boundary case: a scheduled appointment visible before `t0` is valid even if it occurs later; distinguish schedule creation from event completion.
5. Counterexample: a feature correlated with the target is not automatically leakage—prior purchase count can be valid for a future purchase forecast.

## Two ways to see it

Temporal logic asks whether a fact was known at `t0`. Systems thinking asks whether the serving system can produce the same fact with the same latency and semantics. Both must be true.

## Hands-on

Make a feature ledger for a baseline. Intentionally compute a rolling aggregate without a cutoff and score it. Reset with a point-in-time join using `event_time < t0`; save the query as a test fixture. Ask a teammate to audit one feature blind from its name alone.

## Checkpoint

- Is this feature available before the decision, not merely before the label is stored?
- Are aggregate windows cut off at each row’s `t0`?
- Can online scoring recreate it without a future database snapshot?

## What this does not solve

Passing an availability audit does not make a feature stable, fair, privacy-preserving, or causally appropriate. It establishes lawful timing only.

## Continue, go deeper, apply it

With a lawful feature set, establish baselines that show whether a model improves on rules, persistence, and informed human judgment.
