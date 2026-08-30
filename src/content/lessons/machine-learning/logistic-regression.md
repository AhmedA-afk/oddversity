---
title: "Understand logistic regression as a probability-shaped classifier"
track: "machine-learning"
status: live
summary: "Logistic regression applies a sigmoid to a linear score to model a probability-like value for binary classification."
duration: "3 min read"
---

## The short answer

Logistic regression applies a sigmoid to a linear score to model a probability-like value for binary classification. It is a useful baseline because its boundary and feature effects are relatively inspectable. The threshold, class weighting, calibration, and label policy still determine how that score becomes a decision.

## The mechanism

Compute `z = w · x + b`, then `p = 1 / (1 + exp(-z))`. Train with log loss so
confident wrong predictions are costly. For multiple classes, use a suitable
multiclass formulation and inspect whether labels are mutually exclusive.

## Four examples

### Example A: ticket escalation

Predict escalation probability, then choose automatic routing, review, or normal
queue using capacity and error cost—not a default threshold of 0.5.

### Example B: text features

Bag-of-words features can give a strong, inspectable baseline. A word may act as a
proxy for source or group, so inspect errors and feature provenance.

### Boundary case: rare positives

A model can predict almost all negatives and look accurate. Use precision/recall,
event rates, and a threshold sweep.

### Counterexample: sigmoid equals calibration

The sigmoid creates a number in `[0,1]`; it does not guarantee that 0.8 means
eight out of ten cases. Test calibration.

## An illustrative story

A reviewer trusted a “0.95 confidence” flag until a calibration plot showed that
high scores were overconfident for a new customer segment. The score remained
useful for ranking, but the action bands were changed.

## Two ways to see it

### Model view

The classifier learns a linear decision surface in feature space.

### Policy view

The score is evidence for a decision with a threshold, review queue, and appeal.

## Hands-on

Implement logistic regression for a two-feature fixture. Compare a 0.5 threshold,
an operating-capacity threshold, and a calibrated or review-band policy. Inspect
four false positives and four false negatives.

## Checkpoint

- [ ] Log loss, score, probability, and action are distinct.
- [ ] A rare-class case is evaluated beyond accuracy.
- [ ] The threshold and calibration assumption are documented.

## What this does not solve

Interpretability of a linear model does not make its data, labels, or policy fair;
it only makes some assumptions easier to inspect.

## Continue, go deeper, apply it

- Continue: Regularization and bias-variance
- Go deeper: Classifiers, thresholds, and calibration
- Apply it: write a threshold decision record for the classifier.

## The log-odds model

Logistic regression models the log odds as a linear function:

~~~text
log(p / (1-p)) = b + w₁x₁ + ... + w_dx_d
p = 1 / (1 + exp(-(b + w·x)))
~~~

An increase of one unit in feature x_j multiplies the odds by exp(w_j), holding the other included features fixed. If w_j = 0.7, the odds ratio is exp(0.7) ≈ 2.01. This is not “twice as likely” unless the baseline probability is small and the modeling assumptions are suitable. Probability changes depend on the starting point because the sigmoid is nonlinear.

For b = -2 and w = 1.1 with x = 3, the score is 1.3 and probability is roughly 0.786. With x = 0, probability is 0.119. The same coefficient adds 1.1 to log odds at both values but adds very different amounts to probability.

## Why log loss produces this model

For one positive label, loss is -log(p); for one negative, it is -log(1-p). A prediction of 0.99 on a negative case costs about 4.61, whereas 0.6 costs about 0.92. This strongly discourages confident wrong probabilities. The gradient with respect to the linear score is p-y, an elegant result: move the score upward when p is too low for a positive and downward when p is too high for a negative.

Class weighting changes the relative penalty of errors. It may improve recall on a rare class, but it also changes the apparent probability scale; recalibrate and select the decision threshold on held-out data.

## Multiclass and separability caveats

For mutually exclusive classes, softmax regression assigns probabilities across all classes that sum to one. For independent labels, use separate sigmoid outputs and validate whether labels truly can co-occur. If a feature perfectly separates classes in a small dataset, unregularized logistic coefficients can diverge. Regularization or a different design is needed; a huge coefficient is not evidence of a certain relationship.

## Debugging clinic: score versus action

Take 1,000 validation predictions and sweep thresholds from 0.05 to 0.95. At each threshold record confusion matrix, precision, recall, false-negative cost, and queue volume. Then check a reliability diagram. If the model ranks cases well but is overconfident, keep it as a ranker only after choosing calibrated action bands. Do not silently interpret its raw sigmoid output as a guarantee.

## Assessment: work in odds, then decisions

Given b = -1, w₁ = 0.5 and w₂ = -0.25 for x = [4, 2], calculate the score, odds, and probability approximately. Explain how the predicted probability changes when x₁ increases by one at a low versus high baseline. Then design a validation experiment that determines whether class weighting improved a review system rather than just changing its displayed recall.

Report both a calibration result and the review volume at the chosen threshold; neither an odds calculation nor a classification metric alone establishes that the deployed action is sound.
