---
title: "Use statistical tests to compare ML systems carefully"
track: "machine-learning"
status: live
summary: "Statistical testing asks whether an observed difference is compatible with variation under a stated comparison, not whether a model is “true.” Use."
duration: "3 min read"
---

## The short answer

Statistical testing asks whether an observed difference is compatible with variation under a stated comparison, not whether a model is “true.” Use paired cases, confidence intervals, bootstrap or permutation reasoning, effect size, and practical thresholds. Multiple experiments, dependent data, and a tiny effect can make a formal p-value misleading.

## The comparison protocol

Choose the metric, unit of pairing, null or baseline, sampling plan, effect size
that matters, and stopping rule before looking at results. Preserve predictions so
the same cases can be compared directly.

## Four examples

### Example A: paired accuracy

Compare two classifiers on the same test cases and count wins, ties, and losses.
Pairing removes some noise that independent samples would add.

### Example B: bootstrap interval

Resample cases to estimate variation in a metric. Treat the interval as uncertainty
under the resampling assumptions, not a universal guarantee.

### Boundary case: repeated tuning

Trying many metrics or slices raises the chance of finding a flattering result.
Record the search and confirm on a locked holdout.

### Counterexample: significance equals usefulness

A tiny improvement can be statistically detectable at large sample size and still
not justify extra latency, cost, or operational risk.

## An illustrative story

A model won a significance test by a small margin. The gain disappeared after a
latency budget was applied, and the team chose the older model. The test answered
“is a difference detectable?”; the release decision needed “is it worth it?”

## Two ways to see it

### Statistical view

Separate sampling variation, effect size, uncertainty, and the null comparison.

### Product view

Translate the measured difference into a decision threshold, cost, and user impact.

## Hands-on

Generate paired predictions for two models. Compute accuracy difference, bootstrap
an interval, and a paired permutation comparison. Add a cost and latency threshold,
then decide whether the change should ship.

## Checkpoint

- [ ] Comparison unit, baseline, and stopping rule are predeclared.
- [ ] Effect size and uncertainty appear together.
- [ ] Statistical and practical significance are separated.

## What this does not solve

Testing cannot repair a biased sample, an invalid metric, or a deployment population
that differs from the evaluation set.

## Continue, go deeper, apply it

- Continue: ML Foundations capstone
- Go deeper: Cross-validation and experimental design
- Apply it: add a paired comparison and uncertainty interval to a model report.
## Formal extension

A statistical test compares an observed statistic with a stated null reference distribution. It is not a usefulness certificate. Pair every test with effect size, uncertainty, practical decision threshold, and a correction or precommitment for repeated comparisons.

## Worked calculation or protocol

Take a prediction policy with ten reviewed cases and three confirmed positives. Precision at ten is three tenths; it must be reported with the event definition, decision cost, time window, and population. Change the review budget to five and recompute the action table before calling either policy better. This simple calculation illustrates why an aggregate model score is not an operational decision.

## Debugging and assessment studio

Write the relevant objective, data timeline, or decision rule for one project in this course. Deliberately introduce one invalid assumption: a future feature, a random split across repeated entities, a threshold selected on the test set, or a claim stronger than the evidence. Show the inflated or ambiguous conclusion, reset the pipeline, and submit the corrected result with a limitation statement.

## Advanced checkpoint

- [ ] I can state the mathematical or decision object this method estimates.
- [ ] I can identify the exact observation and evaluation boundary.
- [ ] I can explain one failure mode that a high aggregate score would hide.
- [ ] I have a fallback, escalation, or no-ship condition.
