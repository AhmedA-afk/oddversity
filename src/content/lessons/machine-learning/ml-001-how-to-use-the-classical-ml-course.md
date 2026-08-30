---
title: "How to use the Classical ML course"
track: "machine-learning"
order: 1
status: live
summary: "A university-level route from a real decision to a monitored classical ML system: learn the mechanics, test assumptions, and defend the result."
duration: "12 min read"
updated: "2026-08-30"
---

## The short answer

This is not an algorithm catalogue. It is a complete workflow for making and defending a classical ML decision: frame the question, understand the data-generating process, build valid baselines, fit competing models, measure uncertainty, inspect failures, and design the human and operational boundary around the model.

## Why this matters

An advanced practitioner is not the person who can name the most estimators. They can say what a model predicts, when its input existed, how it was evaluated, what it should not decide, and what happens when the world changes. Those skills transfer across regression, classification, ranking, anomaly detection, forecasting, and recommendation.

## How it works

Work through every module with one running project. Keep a small evidence log containing the question, unit of analysis, prediction time, target, data snapshot, split rule, baseline, experiment identifier, results by slice, and decision taken.

```text
Decision → data and label → baseline → models → valid evaluation
         → error analysis → release boundary → monitoring and review
```

Use the short legacy lessons as orientation and the expanded lessons for derivation, cases, and practice. The labs are not optional extras: they force the transfer from an isolated concept to an end-to-end decision.

## Worked examples and variations

### Demand planning

Forecast next-week unit demand, compare seasonal and learned baselines, retain a prediction interval, and decide how much safety stock the interval justifies.

### Review-queue triage

Rank incoming cases, select a threshold from analyst capacity and error costs, and record override reasons so that the policy can be audited.

### Boundary case: a new regime

When a new product, policy, or acquisition changes the population, prefer a fallback or limited rollout to pretending that an old test score covers it.

### Counterexample: leaderboard-first modelling

A high score produced with a future feature or a random split across repeated customers is not a better model. It is invalid evidence.

## Two ways to see it

### Mathematical view

Each model estimates a conditional quantity under a loss, a sample, and assumptions. The course develops the geometry, probability, optimisation, and inference needed to check those assumptions.

### Product and operations view

The output is one component of a sociotechnical decision system. The owner needs an action rule, capacity plan, escalation route, model card, monitoring plan, and rollback condition.

## Hands-on

Choose a public, synthetic, or permissioned dataset with a clear decision context. Before training any model, write a one-page project brief. Deliberately add a future variable, demonstrate the inflated result, remove it, restart from the original snapshot, and retain both findings in your evidence log.

## Checkpoint

- [ ] I have a decision, not only a prediction target.
- [ ] I can state what information exists at prediction time.
- [ ] I have a baseline and an intentional failure test before I tune a model.

## What this does not solve

The course cannot replace subject-matter expertise, legal review, data access controls, or empirical validation in the environment where a decision will actually be made.

## Continue, go deeper, apply it

Continue with problem framing and data-generating processes. Go deeper by maintaining the evidence log throughout the course. Apply it by turning the final capstone into a model and system card that another practitioner can challenge.
