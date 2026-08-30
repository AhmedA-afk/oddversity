---
title: "Respect time in features, labels, and validation"
track: "machine-learning"
status: live
summary: "Time-dependent ML must respect what was known when a prediction was made. Features, labels, splits, backfills, and updates all have timestamps."
duration: "3 min read"
---

## The short answer

Time-dependent ML must respect what was known when a prediction was made. Features, labels, splits, backfills, and updates all have timestamps. A random split can leak future patterns into training; a temporal evaluation is often harder, less flattering, and more honest about deployment.

## The temporal contract

Define observation time, prediction time, label horizon, data delay, retraining
cadence, and forecast horizon. Features must be computable from data available by
prediction time, including late-arriving and corrected records.

## Four examples

### Example A: demand forecast

Predict next week’s orders from history available today. Include calendar features
known in advance, but not the realized next week’s promotion response.

### Example B: equipment failure

Use sensor windows before a failure. A random row split can put adjacent windows
from one machine in both sets and overstate generalization.

### Boundary case: backfilled data

A data warehouse may later repair a missing value. Mark when it became available,
not only the event’s original timestamp.

### Counterexample: future aggregate

“Average resolution time for this customer” computed over the entire history
contains post-prediction information. Use a rolling, as-of calculation.

## An illustrative story

A forecast model looked strong in a shuffled validation set and failed during a
seasonal change. A walk-forward evaluation revealed the model had seen future
season patterns through a global normalization step.

## Two ways to see it

### Forecasting view

The task is conditional prediction under a time-indexed information set.

### Data-platform view

Availability timestamps and backfill policy are part of the feature contract.

## Hands-on

Create a timestamped dataset with delayed labels and rolling features. Compare a
random split, a blocked split, and walk-forward evaluation. Add a leaked future
aggregate intentionally and document how the score changes.

## Checkpoint

- [ ] Observation, prediction, and label times are distinct.
- [ ] Features are computed as-of the decision point.
- [ ] Evaluation resembles the future deployment cadence.

## What this does not solve

Temporal validation cannot predict an unseen regime change or guarantee that the
future will resemble the selected historical windows.

## Continue, go deeper, apply it

- Continue: Drift and monitoring
- Go deeper: Causal questions versus predictive models
- Apply it: publish an as-of feature table and walk-forward report.
## Formal extension

At time t a forecast may only consume information available by t. A three-period average used at time ten averages periods seven through nine; including period ten is leakage. Backtests must move the origin forward and compare equal horizons.

## Worked calculation or protocol

Take a prediction policy with ten reviewed cases and three confirmed positives. Precision at ten is three tenths; it must be reported with the event definition, decision cost, time window, and population. Change the review budget to five and recompute the action table before calling either policy better. This simple calculation illustrates why an aggregate model score is not an operational decision.

## Debugging and assessment studio

Write the relevant objective, data timeline, or decision rule for one project in this course. Deliberately introduce one invalid assumption: a future feature, a random split across repeated entities, a threshold selected on the test set, or a claim stronger than the evidence. Show the inflated or ambiguous conclusion, reset the pipeline, and submit the corrected result with a limitation statement.

## Advanced checkpoint

- [ ] I can state the mathematical or decision object this method estimates.
- [ ] I can identify the exact observation and evaluation boundary.
- [ ] I can explain one failure mode that a high aggregate score would hide.
- [ ] I have a fallback, escalation, or no-ship condition.
