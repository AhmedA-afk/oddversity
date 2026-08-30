---
title: "A/B experiments, sequential testing, and multiple comparisons"
track: "maths-foundations"
status: live
summary: "An A/B experiment assigns comparable units to treatment and control, measures a predeclared outcome, and estimates the difference caused."
duration: "5 min read"
---

## The short answer

An A/B experiment assigns comparable units to treatment and control, measures a predeclared outcome, and estimates the difference caused by assignment under the design assumptions. Sequential peeking and many simultaneous comparisons increase false-positive risk unless the analysis accounts for them. Predeclare the primary metric, stopping rule, exposure unit, guardrails, and multiplicity plan before reading the winner.

## Why this matters

Randomisation can make a causal comparison credible, but it does not make every analysis after randomisation valid. Checking a dashboard every hour, trying many variants, or switching the primary metric after the result changes the probability of a false discovery.

**Small incident (illustrative):** a team stopped a variant on the first green dashboard day. The same stopping rule would have stopped many null experiments eventually, so the nominal fixed-horizon interval no longer matched the procedure.

## How it works

Let assignment A be randomised, outcome Y measured, and the primary estimand be `E[Y | A=1] − E[Y | A=0]`. Randomisation balances potential outcomes in expectation. A fixed-horizon analysis commits to a sample size or calendar window. Sequential designs use alpha-spending, confidence sequences, or another predeclared rule; repeated unadjusted peeks are not free.

### Assumptions and derivation

For m independent null tests each at level α, the chance of at least one false rejection is `1−(1−α)^m` under ideal independence; it can be larger or smaller under dependence, but it is not generally α. Bonferroni controls family-wise error by testing each at α/m, often conservatively. False-discovery-rate procedures answer a different error question.

## AI use

Use experiment governance for prompt/model versions, retrieval changes, ranking policies, and product variants. Randomise at the unit that receives the intervention, log exposure and exclusions, preserve a holdout when needed, and include latency, cost, safety, and subgroup guardrails—not only the headline quality metric.

## Worked examples and variations

### Example A — smallest happy path

**Input:** randomly assign users to A or B; A has 10/100 conversions and B 14/100. **Mechanism:** estimate the risk difference as 4 percentage points with a planned interval. **Output:** a comparison tied to user assignment. **Inspect:** check exposure, denominator, and assignment balance. **Next decision:** compare the interval with the practical threshold and guardrails.

### Example B — meaningful variation

**Input:** three model variants and five primary-looking metrics. **Mechanism:** 15 comparisons create a family of claims. **Output:** an unadjusted p<.05 can be a chance winner. **Inspect:** list the family, primary metric, and adjustment. **Next decision:** select one primary outcome, adjust the family, or label exploration honestly.

### Example C — boundary/safety case

**Input:** a new moderation model causes a severe safety incident in the treatment arm. **Mechanism:** a predeclared harm rule stops exposure early. **Output:** early stop is justified by safety, but the final efficacy estimate is not a fixed-horizon estimate. **Inspect:** separate safety stopping from success stopping. **Next decision:** contain, investigate, and document the sequential rule.

### Example D — tempting counterexample

**Input:** check conversion every day and stop when p<.05. **Mechanism:** the stopping time depends on random fluctuations. **Output:** false-positive probability exceeds the fixed-horizon nominal level. **Inspect:** simulate null experiments with the same peeking rule. **Next decision:** predeclare a fixed horizon or use sequential inference.

## Computation and interpretation

```python
import numpy as np

rng = np.random.default_rng(4)
false_wins = 0
for _ in range(10_000):
    # Null: both arms have the same conversion probability.
    a = rng.binomial(1, 0.10, 100)
    b = rng.binomial(1, 0.10, 100)
    # Illustrative peek: pretend to inspect this one fixed look.
    if (a.mean() - b.mean()) > 0.10:
        false_wins += 1
print(false_wins / 10_000)
```

This toy count is not a p-value and does not model all sequential looks. Extend it with repeated looks to see why the stopping rule must be part of the simulation and analysis.

## Two ways to see it

### Builder view

An experiment is executable governance: assignment, exposure, outcome, time horizon, stopping, and rollback are code and process, not only a chart.

### Systems view

The experiment changes the world while measuring it. Spillovers, novelty effects, logging failures, and adaptive traffic allocation can violate the simple A/B assumptions.

## Hands-on

Write an experiment plan for a retrieval change with primary metric, minimum practical lift, sample unit, guardrails, fixed horizon, and rollback trigger. **Failure fixture:** simulate 10,000 null experiments with daily peeking and stop at the first apparent lift. **Test:** compare the false-win rate with a single predeclared look and record the look count. **Reset:** restore the fixed horizon and use the original assignment seed.

## Checkpoint

- [ ] State the randomisation unit and primary estimand for an A/B test.
- [ ] Explain how peeking changes the reference procedure.
- [ ] Distinguish family-wise error from false-discovery rate.
- [ ] Include a safety/rollback rule that can stop a successful-looking variant.

## What this does not solve

Randomisation does not fix interference, noncompliance, bad measurement, or a biased target population. Multiplicity corrections do not rescue a meaningless metric. A statistically valid winner can still be a poor product decision.

## Continue, go deeper, apply it

- Continue: Calibration, scoring rules, and distribution shift
- Go deeper: Learning-rate schedules, warm-up, and gradient clipping
- Apply it: Cross-validation and experimental design
