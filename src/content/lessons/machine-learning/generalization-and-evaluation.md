---
title: "Generalization: why a good test score can still be wrong"
track: "machine-learning"
status: live
summary: "Generalization is performance on new examples from the world you care about."
duration: "3 min read"
---

## The short answer

Generalization is performance on new examples from the world you care about. A train score measures memorization and a test score measures only the test distribution. Reliable evaluation depends on the split, the sampling process, the metric, and the decision threshold. Use validation to choose, hold out a final test, and inspect slices that could be hidden by an average.

## Three ways to be fooled

1. **Overfitting:** the model learns quirks of the training examples.
2. **Leakage:** information from the future or target enters the features.
3. **Shift:** production inputs differ from the evaluation set.

## Worked example

A fraud classifier scores 99% accuracy because 99% of transactions are legitimate. Its recall on fraud is poor. A threshold change may improve recall but increase review volume. The right metric depends on the action and cost, not the most flattering number.

## A small story

The launch dashboard showed a stable average, while a new region silently lost recall. The model was “healthy” only because the high-volume regions dominated the metric. Slice monitoring made the failure visible.

## More examples and variations

- **Random split:** appropriate only when future cases resemble shuffled historical cases.
- **Time split:** tests whether the model transfers forward through changing behavior.
- **Group split:** keeps related users or documents from appearing in both train and test.
- **Counterexample:** cross-validation cannot repair leakage that occurs before the split.

## Two ways to see it

### Statistician view

The split approximates the population and the estimate has uncertainty.

### Operator view

The evaluation is a release decision: ship, constrain, investigate, or roll back.

## Hands-on

Evaluate one classifier with a random split and a time split. Report accuracy, precision, recall, calibration, and two meaningful slices. Write the release decision each report would support.

## Checkpoint

- [ ] Train, validation, and test have distinct jobs.
- [ ] The metric reflects the cost of the decision.
- [ ] At least one slice changes the conclusion or proves it is stable.

## What this does not solve

Offline evaluation cannot reveal every future distribution shift, causal effect, or human response. Monitor after release and define rollback conditions.

## Continue, go deeper, apply it

- Continue: Deep learning representations
- Go deeper: Prompt evaluation
- Apply it: Responsible fairness and provenance

## Estimate a future quantity, not a leaderboard number

Let R(f) be a model's expected loss on the future population that matters. A test score is an estimate, not R(f) itself:

~~~text
test loss = (loss on held-out examples) / (number of held-out examples)
~~~

It is informative only when held-out examples represent the deployment decision. Shuffling insurance claims from 2024 is not a simulation of a 2025 launch if pricing, acquisition channels, or review policy changed. Similarly, splitting rows rather than customers lets the model recognize a customer it has effectively already seen.

Use a split that mirrors the strongest dependency in the data:

| Dependency | Evaluation design | Typical error if ignored |
|---|---|---|
| Time | train on past, test on later period | future leakage and optimistic drift estimate |
| Person/account/document | group split | near-duplicate memorization |
| Site/region/device | leave-site-out or group split | hidden domain dependence |
| Intervention policy | logged-policy analysis plus experiment | selective-label bias |

## Worked calculation: accuracy can conceal an unusable detector

On 10,000 transactions, 100 are fraudulent. A model flags 80 transactions; 40 are fraud. Its confusion matrix is:

~~~text
true positives = 40    false positives = 40
false negatives = 60   true negatives = 9,860
~~~

Accuracy is (40 + 9,860)/10,000 = 99%, precision is 40/80 = 50%, and recall is 40/100 = 40%. Which is preferable depends on capacity. If an investigator can review only 50 cases, choose the threshold that maximizes true positives among the top 50, then report precision and recall **at 50 reviews**. A generic threshold-free score cannot substitute for that operational curve.

Now add uncertainty. If 40 of 80 alerts are correct, a rough standard error for precision is sqrt(0.5(1-0.5)/80) ≈ 0.056. Small evaluation sets can make two candidates indistinguishable even when their displayed precision differs by several points. Bootstrap the evaluation rows or repeat across time windows before declaring a winner.

## Selection, validation, and the one final test

Every comparison spends information. If you inspect a test result and retune feature engineering, the test is now validation data. A practical discipline is:

1. Freeze the split and metric definition.
2. Use cross-validation or a validation period for model and threshold choices.
3. Write down the final candidate before opening the untouched test.
4. Evaluate once, with confidence intervals and slices.
5. Treat production monitoring as a new evaluation phase, not a retroactive excuse.

Nested cross-validation is useful when data are limited: the outer folds estimate final performance, while each inner fold tunes choices. It is slower, but it avoids reporting the luckiest hyperparameter search.

## Debugging clinic: a suspiciously perfect model

Your model's random-split F1 is 0.96; a chronological split yields 0.61. Investigate in this order: sort all feature timestamps, measure overlap of entity IDs across splits, look for post-outcome status fields, and reproduce the pipeline with train-only preprocessing. Then run a time-shift test: move every feature timestamp back one day. A collapse after the shift is evidence that the model relied on last-minute or leaked information.

Do not average the two scores. The time split answers the deployment question more directly.

## Assessment: write an evaluation protocol

For a hospital no-show predictor, specify the unit, cutoff time, train/validation/test periods, group boundaries, primary metric, capacity-constrained threshold metric, and three mandatory slices. Explain why random cross-validation could be misleading. Finally, give one way a high recall could cause harm even if the model is statistically valid. Your protocol should make it impossible for another engineer to accidentally evaluate a different problem.
