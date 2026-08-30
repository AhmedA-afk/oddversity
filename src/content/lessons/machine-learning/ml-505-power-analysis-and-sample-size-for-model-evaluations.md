---
title: "Power analysis and sample size for model evaluations"
track: "machine-learning"
order: 505
status: live
summary: "Plan evidence around the smallest effect that would change a decision, not around a convenient amount of data or a desired p-value."
duration: "15 min read"
updated: "2026-08-30"
---

## The short answer

Power analysis asks how likely an evaluation is to detect an effect of a chosen size under a stated protocol. Start with the smallest practically important improvement, the metric's variance, the decision unit, and acceptable false-positive and false-negative risks. For complex metrics, estimate power by simulation using plausible data rather than pretending a simple formula applies.

## Why this matters

Too little data yields unstable rankings and inconclusive results; excessive exposure can waste money or place users at unnecessary risk. More rows are not always more information: ten thousand clicks from a few users may carry far less independent evidence than a thousand distinct users.

## How it works

Choose a primary outcome, baseline rate or loss, minimum useful effect, significance level, desired power, allocation ratio, and analysis unit. For an A/B test, sample size depends strongly on outcome variance and the effect you need to detect. For offline comparisons, simulate plausible paired losses or resample historical units under candidate effect sizes. Account for attrition, delayed labels, clustering, and multiple comparisons before collecting data.

Power is conditional. It answers a question such as: if the true lift were 1 percentage point and the assumptions held, how often would this protocol produce a sufficiently strong result? It does not certify that the effect exists.

## Worked examples and variations

### Example 1: conversion experiment

Set a minimum useful conversion lift based on revenue and implementation cost. A tiny detectable lift is not automatically worth waiting months to estimate precisely.

### Example 2: rare-event classifier

For fraud recall, total examples matter less than positive examples. Plan label acquisition around the number and diversity of confirmed fraud cases.

### Example 3: clustered schools

If a policy is assigned by school, the number of schools, not pupils, largely determines independent evidence. Ignoring clustering exaggerates power.

### Example 4: model comparison simulation

Use historical per-user losses, add a plausible improvement to the candidate, repeatedly sample users, and estimate how often your chosen interval excludes the no-benefit threshold.

### Boundary case: the data already exist

You cannot retroactively create power. Report uncertainty, avoid a binary story, and design the next collection or experiment around the ambiguity that matters.

### Counterexample: powering for any detectable difference

Planning to detect an arbitrarily tiny difference produces a technically impressive but operationally meaningless study. The target effect must come from a decision, not a statistic.

## Two ways to see it

The statistical view balances false alarms against missed effects under a model. The product view asks how much evidence is required before changing a process that has cost, risk, and opportunity cost.

## Hands-on

Write a one-page evaluation design for a classifier or A/B test. Simulate 1,000 trials at three effect sizes and graph how often the protocol clears your decision rule. Deliberately treat correlated rows as independent, compare the overconfident result, then reset the simulation to resample the correct group unit. Save assumptions beside the code.

## Checkpoint

- [ ] The minimum useful effect comes from a real decision threshold.
- [ ] The sample-size calculation uses the correct independent unit.
- [ ] Attrition, rare outcomes, and multiple claims are included in the plan.

## What this does not solve

Power calculations cannot justify an unethical intervention, an invalid metric, or a biased sample. They describe planned sensitivity under assumptions, not the quality of the objective.

## Continue, go deeper, apply it

Continue with model comparison under correlated folds. Go deeper with simulation-based design analysis. Apply this by approving data collection only after its decision threshold and power assumptions are written down.
