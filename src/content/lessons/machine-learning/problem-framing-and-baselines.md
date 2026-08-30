---
title: "Machine learning starts with a problem and a baseline"
track: "machine-learning"
status: live
summary: "Machine learning is useful when examples can teach a system a mapping or structure that would be expensive to encode by hand."
duration: "3 min read"
---

## The short answer

Machine learning is useful when examples can teach a system a mapping or structure that would be expensive to encode by hand. Before choosing an algorithm, define the prediction, the decision it supports, the data available at decision time, and the cost of errors. Build a simple baseline first. If a rule or majority class is competitive, the problem may need better framing rather than a larger model.

## From product request to learning problem

“Predict churn” is incomplete. Frame it as: predict whether an account will cancel in the next 30 days using information available today, so a support team can prioritize outreach. Define the label window, the observation window, the intervention, and what false positives and false negatives cost.

## Worked example

Baseline: predict the most common class. Better baseline: a rule using last-login recency. Candidate model: logistic regression. If the candidate wins only on a random split but loses on a time split, it learned the past too specifically.

## A small story

An impressive model was retired after the team noticed that the “best feature” was created after the customer had already cancelled. The model was not learning the future; the dataset was leaking it.

## More examples and variations

- **Majority baseline:** useful for a rare-event classifier and a warning against accuracy worship.
- **Rule baseline:** recency may be strong enough to expose whether a model adds value.
- **Time split:** a random split can look good while a future-period split reveals drift.
- **Counterexample:** a strong offline score is not a business result if no intervention changes.

## Two ways to see it

### Modeling view

Choose a function that maps inputs to predictions.

### Decision view

Choose whether the prediction changes an action that is worth the operational cost and risk.

## Hands-on

Write a problem brief, build a majority-class and one-rule baseline, and list every feature with the time it becomes available. Mark any feature created after the decision point as leakage.

## Checkpoint

- [ ] The label and decision window are explicit.
- [ ] A baseline exists and is reproducible.
- [ ] Feature availability is checked against the real workflow.

## What this does not solve

A good offline prediction may not improve outcomes. Interventions change behavior, labels can be noisy, and the decision may be unfair or unwanted.

## Continue, go deeper, apply it

- Continue: Generalization and evaluation
- Go deeper: Neural networks and representations
- Apply it: write a model card for the baseline before training a larger model.

## A framing worksheet that can survive implementation

Before opening a notebook, write one sentence for each of these fields: **unit** (one account, one order, one patient encounter), **decision time**, **prediction horizon**, **label definition**, **action**, **owner**, and **cost of abstaining**. This prevents a deceptively common mismatch: a row represents an account-month, but the label represents whether the account ever churned. The model then appears to predict a 30-day event while silently training on a lifetime outcome.

For a retention example, suppose each outreach costs $4. A saved account is worth $80 contribution margin, outreach succeeds for 10% of genuinely at-risk accounts, and an unnecessary message costs $1 in annoyance. Contacting 1,000 people at a threshold produces 150 true at-risk accounts and 850 not-at-risk accounts. Expected value is:

~~~text
benefit = 150 × 0.10 × $80 = $1,200
cost    = 1,000 × $4 + 850 × $1 = $4,850
net     = -$3,650
~~~

Even a classifier with a respectable AUC is not useful at that operating point. The next baseline is therefore not “train a bigger model”; it is “only contact the 100 highest-risk accounts” and compare the observed conversion rate with a random sample. Framing connects a statistical task to a decision that can win or lose money.

### Four baseline families

1. **No-action baseline.** Measure the outcome with no intervention. It catches projects where doing nothing is already better than a noisy automated decision.
2. **Historical-policy baseline.** Replay the current triage rule, including its capacity constraints. It is the fair comparison for a replacement system.
3. **Constant baseline.** Predict the training mean for regression or the majority class for classification. It checks that the metric and split are wired correctly.
4. **Simple-feature baseline.** Use one transparent, time-valid signal such as recency, prior spend, or a short linear model. It reveals the marginal value of additional complexity.

If a complex system cannot beat all relevant baselines with uncertainty accounted for, stop. This is not failure; it is a result that saves engineering time.

## Worked example: labels, windows, and a silent failure

Imagine data extracted on 1 July. You want to predict churn in the next 30 days. For an account scored on 1 June, the observation window might be 3 March–31 May and the label window 1–30 June. An account that cancelled on 15 May must not appear as a negative simply because it is inactive on 1 June; it should be excluded or handled by a clearly defined survival-style target. An account created on 29 May has only two days of observable history, so either impose a minimum history rule or add an explicit tenure feature.

The following pseudocode makes the temporal contract reviewable:

~~~python
score_at = row["score_timestamp"]
features = events[(events.time < score_at) &
                  (events.time >= score_at - days(90))]
label = cancelled_between(account, score_at, score_at + days(30))
assert features.time.max() < score_at
~~~

Do not let a convenient aggregate table hide this logic. Each aggregate needs a definition of its ending timestamp.

## Debugging clinic: the baseline that is “too bad”

You train a churn model and get 0.52 AUC, below the recency rule’s 0.69. Resist changing algorithms. First test these hypotheses:

- the label has the wrong polarity or horizon;
- rows have several timestamps but the join uses the extraction date;
- the train split includes accounts that later reappear in validation;
- the baseline uses a feature whose production definition differs from the dataset.

Print ten rows where the rule and model disagree. For each, show the score timestamp, raw events, derived feature values, label date, and proposed action. A small row-level audit often finds a bug faster than a hyperparameter sweep.

## Assessment: defend a proposed ML project

For a hypothetical “predict late delivery” project, submit a one-page decision specification and answer:

1. What information is legally and operationally available at the moment a dispatch decision is made?
2. What exactly is the target, and which cases cannot yet have a label?
3. Give a constant, rule, and historical-policy baseline.
4. Calculate an expected-value threshold from stated costs; identify one quantity that must be estimated experimentally.
5. Name two outcomes that would make you cancel the project despite a higher offline metric.

A strong answer makes the decision and timing testable, not merely names an algorithm.
