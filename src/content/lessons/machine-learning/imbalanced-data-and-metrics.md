---
title: "Choose metrics for the errors you can afford"
track: "machine-learning"
status: live
summary: "Class imbalance makes aggregate metrics easy to misread because the majority class can dominate the score."
duration: "3 min read"
---

## The short answer

Class imbalance makes aggregate metrics easy to misread because the majority class can dominate the score. Choose metrics from the action: precision, recall, ranking quality, calibration, cost, and review capacity each answer a different question. Report the confusion matrix and relevant slices beside any summary number.

## The metric map

Precision asks how many predicted positives were useful; recall asks how many true
positives were found. A ranking metric evaluates ordering; a thresholded metric
evaluates an action. The right choice depends on whether misses, false alarms, or
review load are more costly.

## Four examples

### Example A: rare abuse detection

High recall may be useful for a review queue, but precision controls whether the
queue overwhelms reviewers. Report both at the operating threshold.

### Example B: search ranking

Top-k relevance may matter more than a global accuracy number. Evaluate the first
screen users actually see.

### Boundary case: no positive predictions

A classifier can have undefined or misleading precision when it predicts no
positives. Make the zero-division behavior explicit and inspect the threshold.

### Counterexample: ROC-AUC victory

A high ranking score can coexist with poor performance in the small operating
region that matters. Plot or calculate the relevant slice and threshold.

## An illustrative story

A fraud model was called “excellent” because its AUC rose. The operations team
could not use it because the chosen threshold created too many false alarms. The
metric was not wrong; it answered a different question.

## Two ways to see it

### Measurement view

Metrics summarize a confusion structure under a slice, threshold, and population.

### Decision view

The metric is useful only when it selects an action the organization can carry out.

## Hands-on

Create a rare-event fixture. Compare majority accuracy, precision/recall, PR-AUC,
ROC-AUC, and cost at three thresholds. Add a reviewer-capacity limit and choose a
release rule that can be defended.

## Checkpoint

- [ ] Accuracy is compared with the confusion matrix.
- [ ] Metrics are reported at the operating threshold.
- [ ] Review capacity and error cost are explicit.

## What this does not solve

Metric choice cannot make a harmful intervention acceptable or correct labels that
reflect unequal observation and access.

## Continue, go deeper, apply it

- Continue: Feature engineering and pipelines
- Go deeper: Fairness and subgroup evaluation
- Apply it: create a metric contract for one classifier.
## Formal extension

Imbalance makes default accuracy and a threshold of one-half misleading. Start from the confusion matrix at the intended review capacity, then report prevalence, precision, recall, calibration, and expected action cost by meaningful slice.

## Worked calculation or protocol

Take a prediction policy with ten reviewed cases and three confirmed positives. Precision at ten is three tenths; it must be reported with the event definition, decision cost, time window, and population. Change the review budget to five and recompute the action table before calling either policy better. This simple calculation illustrates why an aggregate model score is not an operational decision.

## Debugging and assessment studio

Write the relevant objective, data timeline, or decision rule for one project in this course. Deliberately introduce one invalid assumption: a future feature, a random split across repeated entities, a threshold selected on the test set, or a claim stronger than the evidence. Show the inflated or ambiguous conclusion, reset the pipeline, and submit the corrected result with a limitation statement.

## Advanced checkpoint

- [ ] I can state the mathematical or decision object this method estimates.
- [ ] I can identify the exact observation and evaluation boundary.
- [ ] I can explain one failure mode that a high aggregate score would hide.
- [ ] I have a fallback, escalation, or no-ship condition.
