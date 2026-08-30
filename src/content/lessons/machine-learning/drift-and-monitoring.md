---
title: "Monitor data, predictions, outcomes, and decisions for drift"
track: "machine-learning"
status: live
summary: "Drift means the conditions around a model changed: inputs, relationships, labels, population, policy, or user behavior."
duration: "3 min read"
---

## The short answer

Drift means the conditions around a model changed: inputs, relationships, labels, population, policy, or user behavior. Monitor more than feature distributions. Connect data-quality signals, prediction shifts, delayed outcomes, slice metrics, and operational symptoms to a response such as investigate, recalibrate, retrain, restrict, or roll back.

## The monitoring layers

- **Input:** schema, missingness, ranges, freshness, and distribution.
- **Prediction:** score, class, abstention, and action rates.
- **Outcome:** delayed labels, corrections, and business or human impact.
- **System:** latency, errors, cost, queue, capacity, and tool failures.

## Four examples

### Example A: feature drift

A device firmware change shifts a sensor range. Schema may still pass, but the
model sees unfamiliar geometry. Alert and investigate before retraining.

### Example B: concept drift

Users change behavior after a policy update, so the old feature-target relationship
weakens even though input distributions look similar.

### Boundary case: missing labels

Outcome labels arrive weeks later. Use proxy signals cautiously and keep a delayed
evaluation queue instead of assuming no news means success.

### Counterexample: retrain automatically

Retraining on contaminated or biased recent data can make a failure permanent. Gate
new data and keep a previous release available.

## An illustrative story

A fraud model’s alert rate rose and an automatic retrain made it worse. An audit
found a new review policy had changed the labels. The fix was to version policy and
labels, not simply increase training frequency.

## Two ways to see it

### Statistical view

Compare distributions and conditional performance against a reference window.

### Reliability view

A drift alert is a decision point with an owner, threshold, runbook, and rollback.

## Hands-on

Simulate feature drift, label delay, and a policy change. Create alerts for schema,
prediction rate, slice error, and cost. For each alert write the next diagnostic,
owner, containment, and retraining rule.

## Checkpoint

- [ ] Input, prediction, outcome, and system monitoring are separated.
- [ ] Alerts have thresholds, owners, and runbooks.
- [ ] Retraining is gated by data and evaluation checks.

## What this does not solve

Drift detection cannot explain every cause or guarantee that a stable distribution
means a safe decision.

## Continue, go deeper, apply it

- Continue: ML systems and reproducibility
- Go deeper: Time series and temporal validation
- Apply it: publish a drift response runbook with a rollback condition.
## Formal extension

Monitor separate layers: input schema and distribution, score distribution, delayed outcome performance, decision volume, human overrides, and business or safety outcome. A shifted feature distribution is not automatically model failure; the response must be tied to a threshold and owner.

## Worked calculation or protocol

Take a prediction policy with ten reviewed cases and three confirmed positives. Precision at ten is three tenths; it must be reported with the event definition, decision cost, time window, and population. Change the review budget to five and recompute the action table before calling either policy better. This simple calculation illustrates why an aggregate model score is not an operational decision.

## Debugging and assessment studio

Write the relevant objective, data timeline, or decision rule for one project in this course. Deliberately introduce one invalid assumption: a future feature, a random split across repeated entities, a threshold selected on the test set, or a claim stronger than the evidence. Show the inflated or ambiguous conclusion, reset the pipeline, and submit the corrected result with a limitation statement.

## Advanced checkpoint

- [ ] I can state the mathematical or decision object this method estimates.
- [ ] I can identify the exact observation and evaluation boundary.
- [ ] I can explain one failure mode that a high aggregate score would hide.
- [ ] I have a fallback, escalation, or no-ship condition.
