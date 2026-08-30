---
title: "Inspect features, leakage, and missingness"
track: "machine-learning"
status: live
summary: "Features are measurements available to a model at decision time."
duration: "3 min read"
---

## The short answer

Features are measurements available to a model at decision time. Leakage occurs when a feature contains information that would not be available then, directly or indirectly. Missingness is not just a cleaning nuisance: absence can carry signal, reflect process failure, or differ across groups. Audit the data-generating timeline before tuning a model.

## Four examples

### Example A: safe recency

“Days since last login” is valid if calculated from events available before the
prediction timestamp. Store the timestamp used for the calculation.

### Example B: leaked resolution code

A support ticket’s final resolution is an excellent predictor of churn—but only
after the support process ends. Using it at ticket creation leaks the future.

### Boundary case: missing income

Missing income may mean “not asked,” “declined,” or “not applicable.” One null
bucket can hide three different processes.

### Counterexample: impute before splitting

Computing an imputation value from the full dataset lets test-set information
influence training. Fit preprocessing on the training split and apply it forward.

## An illustrative story

A model’s validation score collapsed after launch. Investigation found that the
offline table had been built after each case was resolved, while production made
predictions at intake. The best feature was a clock, not intelligence.

## Two ways to see it

### Statistical view

Ask whether the feature is a valid input under the data-generating process.

### Operations view

Ask whether the source is present, timely, permissioned, and stable in the live
workflow.

## Hands-on

For every feature in a small dataset, write source, timestamp, owner, missingness
meaning, and allowed transformations. Create one intentionally leaked feature,
measure its apparent gain, remove it, and compare a time-based split.

## Checkpoint

- [ ] Feature availability is tied to a decision timestamp.
- [ ] Missingness meanings are distinguished.
- [ ] Preprocessing is fit only on training data.

## What this does not solve

Leakage checks cannot tell you whether a permitted feature creates an unfair
decision or whether the label itself is a poor proxy.

## Continue, go deeper, apply it

- Continue: Generalization and evaluation
- Go deeper: Classifiers, thresholds, and calibration
- Apply it: publish a feature-availability table with your model experiment.

## Build a feature availability ledger

For every column, record source, event timestamp, ingestion delay, transformation, owner, and whether a value can change after the decision. The relevant question is not “is this column in the warehouse?” but “could a production service know this value at the exact scoring timestamp?” A ledger exposes three distinct leaks:

1. **Target leakage:** a feature directly encodes the outcome, such as claim paid.
2. **Temporal leakage:** an aggregate includes events after scoring, such as 30-day activity computed at month end.
3. **Cross-row leakage:** preprocessing lets evaluation rows influence training, such as fitting a target encoder or imputer on the whole table.

## Worked calculation: why missingness can be predictive

In a credit application dataset, income is observed for 720 of 1,000 applicants. Among observed incomes, 36 default; among missing incomes, 56 default:

~~~text
P(default | income observed) = 36 / 720 = 5%
P(default | income missing)  = 56 / 280 = 20%
~~~

An indicator for “income missing” may improve prediction. That does **not** prove missing income causes default. It could mean a channel fails to collect income, applicants decline to disclose it, or a policy asks only some groups. Preserve the indicator, impute a numeric value using train-only data, and investigate the process before allowing a high-stakes decision to rely on it.

Missing-data mechanisms matter. MCAR means missingness is unrelated to observed and unobserved values; MAR means it can be explained by observed variables; MNAR means it depends on an unobserved value itself. You rarely prove one from a dataset. Treat the assumed mechanism as a sensitivity question, not a fact.

## Safe preprocessing example

~~~python
train_median = train["income"].median()
train["income_filled"] = train["income"].fillna(train_median)
test["income_filled"] = test["income"].fillna(train_median)
train["income_missing"] = train["income"].isna().astype(int)
test["income_missing"] = test["income"].isna().astype(int)
~~~

The important property is that the median is estimated only from training rows. In production, use the saved training statistic or a retraining pipeline with a versioned cutoff, never a statistic recomputed from the request batch.

## Debugging clinic: identify the feature that knows tomorrow

Sort candidate feature importances, then ask an operator to explain the top ten in plain language and timestamps. A useful adversarial test is to replace each candidate with a version lagged by one day or one scoring cycle. If performance collapses for a feature whose meaning supposedly predates the decision, trace its SQL lineage. Common culprits are last status, post-resolution timestamps, and aggregates with an unbounded end date.

## Assessment: leakage review board

Given a proposed feature list for predicting ticket escalation—ticket text, assigned-team ID, final resolution, number of replies after assignment, customer tenure, and current queue length—classify each as safe, unsafe, or conditional. For every conditional feature, write the timestamp rule that would make it safe. Then propose an imputation policy for missing tenure and explain how you would test whether missingness differs by region or customer type.

An excellent submission also draws a row-level timeline for one ticket: intake, assignment, replies, resolution, score time, and label time. That diagram should make it obvious why a feature can be harmless in retrospective analysis yet invalid for a live prediction.
