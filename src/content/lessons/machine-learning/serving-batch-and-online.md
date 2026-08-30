---
title: "Choose batch or online serving from the decision"
track: "machine-learning"
status: live
summary: "Batch inference computes predictions ahead of time; online inference computes them during a request."
duration: "3 min read"
---

## The short answer

Batch inference computes predictions ahead of time; online inference computes them during a request. Choose based on freshness, latency, volume, failure tolerance, cost, and whether a decision can wait. The serving path must reproduce preprocessing, enforce authorization, expose model versions, and degrade safely when dependencies fail.

## The serving decision

Ask how fresh the prediction must be, whether the input is available in advance,
what latency tail is acceptable, and what happens during an outage. Hybrid designs
can precompute candidates and apply a small online decision layer.

## Four examples

### Example A: daily churn list

Batch predictions are sufficient when a team reviews a list each morning. Store
the feature snapshot and model version with each score.

### Example B: checkout fraud

Online inference may be needed before authorization. Keep a timeout fallback and
do not fail open for a high-impact action without a policy decision.

### Boundary case: stale feature store

A fast model with yesterday’s account state may be worse than a slower baseline.
Make feature freshness visible and set an age threshold.

### Counterexample: serverless by default

A deployment shape does not guarantee tail latency, warm capacity, or cost
control. Measure the actual request path.

## An illustrative story

A team moved a nightly risk model online to improve freshness. The feature joins
made p99 latency unacceptable, so the service timed out and used a default score.
The better design precomputed stable features and reserved online work for the
small changing part.

## Two ways to see it

### Architecture view

Serving is the same model plus a data, runtime, and policy boundary.

### User-impact view

Freshness, waiting, fallback behavior, and false decisions are part of quality.

## Hands-on

Implement a batch scorer and a small online endpoint over the same pipeline. Inject
stale features, a timeout, and a version mismatch. Verify the response includes
model/version metadata and chooses the documented fallback.

## Checkpoint

- [ ] Batch versus online choice is tied to freshness and latency.
- [ ] Train/serve parity and version metadata are tested.
- [ ] Timeout and degraded behavior are explicit.

## What this does not solve

Serving architecture cannot fix a model that predicts the wrong target or a policy
that should not be automated.

## Continue, go deeper, apply it

- Continue: Neural network bridge
- Go deeper: Observability, cost, and latency
- Apply it: write a batch/online decision record and outage runbook.
## Formal extension

Serving is a data-contract problem before it is an endpoint choice. The online feature computation must reproduce the as-of rule used in training. Batch scoring, shadow mode, canaries, and rollback are experiments on operational risk.

## Worked calculation or protocol

Take a prediction policy with ten reviewed cases and three confirmed positives. Precision at ten is three tenths; it must be reported with the event definition, decision cost, time window, and population. Change the review budget to five and recompute the action table before calling either policy better. This simple calculation illustrates why an aggregate model score is not an operational decision.

## Debugging and assessment studio

Write the relevant objective, data timeline, or decision rule for one project in this course. Deliberately introduce one invalid assumption: a future feature, a random split across repeated entities, a threshold selected on the test set, or a claim stronger than the evidence. Show the inflated or ambiguous conclusion, reset the pipeline, and submit the corrected result with a limitation statement.

## Advanced checkpoint

- [ ] I can state the mathematical or decision object this method estimates.
- [ ] I can identify the exact observation and evaluation boundary.
- [ ] I can explain one failure mode that a high aggregate score would hide.
- [ ] I have a fallback, escalation, or no-ship condition.
