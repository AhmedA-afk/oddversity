---
title: "Turn classifier scores into calibrated decisions"
track: "machine-learning"
status: live
summary: "A classifier score ranks or estimates cases; a threshold turns it into an action."
duration: "3 min read"
---

## The short answer

A classifier score ranks or estimates cases; a threshold turns it into an action. Calibration asks whether predicted probabilities match observed frequencies. Choose metrics and thresholds from the decision’s costs and capacity, then inspect slices. Accuracy alone cannot tell you whether a system is usable.

## Four examples

### Example A: imbalanced alerts

When positive events are rare, a model can achieve high accuracy by predicting
negative every time. Precision, recall, and a review-capacity curve reveal more.

### Example B: threshold for triage

Lowering a threshold catches more possible cases but increases review volume.
Choose the point the team can actually process, and record the tradeoff.

### Boundary case: calibration drift

A model that predicted “0.8” correctly eight times out of ten last quarter may no
longer mean that after the population changes. Recheck calibration over time.

### Counterexample: optimize the aggregate

A single threshold can look strong overall while producing very different error
rates or calibration for important slices. Slice reports are part of the metric.

## An illustrative story

A dashboard celebrated a rising F1 score while the review queue doubled. The
threshold had been changed without an operational capacity check. The fix was a
joint metric: recall at the maximum queue the team could safely handle.

## Two ways to see it

### Modeling view

Compare score distributions, calibration, and error types.

### Decision view

Choose action bands: automatic, review, and abstain—then monitor each band.

## Hands-on

Train or simulate a binary classifier. Plot a confusion matrix at three
thresholds, calculate slice results, and create a calibration table. Write which
threshold you would deploy and why.

## Checkpoint

- [ ] The score’s meaning is documented.
- [ ] Threshold choice includes costs and capacity.
- [ ] Aggregate and slice metrics are shown together.

## What this does not solve

Calibration does not make a biased label fair, and a good threshold cannot rescue
a feature pipeline that leaks the future.

## Continue, go deeper, apply it

- Continue: Generalization and evaluation
- Go deeper: Privacy, fairness, and accessibility
- Apply it: write a threshold decision record with an owner and review date.

## A threshold encodes a tradeoff

Suppose a score is calibrated: P(y=1 | score=p) = p. Let a true positive avoid loss B, a false positive cost C, and no action have value zero. Acting is favorable when pB - (1-p)C > 0, so:

~~~text
act when p > C / (B + C)
~~~

If a missed fraud case costs $500 and a review costs $25, the idealized threshold is 25/525 ≈ 0.048. Capacity, label delay, customer harm, and calibration error may require a higher operational cutoff, but this calculation makes the policy assumptions visible. A default 0.5 threshold silently assumes equal costs.

## Calibration is empirical

Reliability is tested by grouping predictions into bins and comparing mean prediction with observed event frequency. Brier score averages (p-y)², combining calibration and sharpness. A model can have strong ranking (high ROC AUC) and poor calibration; any monotonic transformation of scores preserves ranking but changes probability meaning.

Platt scaling fits a logistic calibration curve; isotonic regression learns a monotonic flexible curve. Both require calibration data distinct from the data used to fit the base model. With small calibration sets, flexible methods can overfit. Show bin counts: a perfect-looking high-score bin based on five cases is weak evidence.

## Capacity-aware evaluation

In a review queue, sorting by score may matter more than a fixed threshold. Plot precision@k, recall@k, and expected value@k for k equal to realistic daily capacity. Recalculate when staffing changes. If 200 cases can be reviewed today but only 50 tomorrow, the policy should be parameterized by capacity rather than hard-coded around one threshold.

## Debugging clinic: calibrated globally, wrong locally

Make reliability tables for the full population and for each supported region, source channel, and time period. A score of 0.7 may yield 70% positive overall but 45% in one new channel. Check whether the problem is sample size, distribution shift, a policy change, or a population that should have its own model or abstention path. Never “fix” a subgroup by tuning its threshold alone without understanding the outcome definition and fairness implications.

## Assessment: decision record

Given a calibrated risk score, a $15 review cost, a $120 avoidable loss, and capacity for 300 daily reviews, derive the unconstrained threshold and then explain how you would choose the capacity-constrained cutoff. List the data required for a calibration report and distinguish a threshold change from a recalibration change. Include one guardrail metric that could halt automation.

## When scores become policies

Thresholds often change who receives scarce attention. Version the threshold separately from the model, record its owner and review date, and log score, action, capacity state, and eventual outcome. This makes a later incident diagnosable: a fall in recall could arise from score drift, a changed threshold, an overloaded queue, or a label-policy change. If the system has an abstain band, evaluate it explicitly: cases between two thresholds may go to human review, and the quality and delay of that review are part of the end-to-end metric. A model is not calibrated “once”; calibration is a monitored claim about a population and period.
