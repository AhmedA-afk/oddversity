---
title: "Cross-entropy from expected negative log-likelihood"
track: "maths-foundations"
status: live
summary: "Cross-entropy is the expected negative log probability assigned by a predicted distribution Q to outcomes drawn from a target distribution P."
duration: "4 min read"
---

## The short answer

Cross-entropy is the expected negative log probability assigned by a predicted distribution Q to outcomes drawn from a target distribution P: `H(P,Q)=−sum P(x) log Q(x)`. For one observed class it is negative log of that class’s predicted probability. It is a proper probabilistic loss: confident wrong predictions are punished sharply, unlike plain accuracy.

## Why this matters

Cross-entropy is the standard bridge between probabilistic modelling and classification training. It rewards calibrated probability mass on the observed class and remains informative when two systems make the same hard-label decisions.

**Small incident (illustrative):** two classifiers had identical accuracy, but one assigned .51 to every correct class and the other assigned .99 except for a few catastrophic errors. Cross-entropy made the confidence trade-off visible.

## How it works

For binary y∈{0,1} and predicted p, `CE(y,p)=−[y log p+(1−y)log(1−p)]`. For a one-hot multiclass target y and probability vector q, `CE=−sum yₖ log qₖ=−log q_true`. Averaging over observations gives empirical negative log-likelihood under an iid categorical model.

### Assumptions and derivation

The equality to negative log-likelihood follows because the likelihood is a product of the probability assigned to each observed label; taking negative logs turns the product into a sum, and averaging divides by n. Cross-entropy equals entropy plus KL divergence, so it is minimised at the true distribution in expectation. Finite data, misspecification, label noise, and shifts remain.

## AI use

Use cross-entropy for probabilistic classification and next-token objectives when log probability is the decision-relevant signal. Check label encoding, class weights, reduction (`mean` versus `sum`), ignored labels, and numerical stability. Do not compare losses from incompatible tokenisations, denominators, or label spaces.

## Worked examples and variations

### Example A — smallest happy path

**Input:** y=1, p=.8. **Mechanism:** loss=−log(.8)≈.223 nats. **Output:** a small penalty for assigning high probability to the observed class. **Inspect:** p must be in (0,1). **Next decision:** average this contribution with a clearly stated denominator.

### Example B — meaningful variation

**Input:** y=1, p=.99 versus p=.6. **Mechanism:** losses are about .010 and .511 nats. **Output:** the more confident correct prediction scores better. **Inspect:** compare with calibration and error costs. **Next decision:** use log loss when confidence quality matters.

### Example C — boundary case

**Input:** y=1, p=0. **Mechanism:** −log(0)=infinity. **Output:** an infinite loss in exact arithmetic. **Inspect:** clipping to a small epsilon makes computation finite but changes the stated loss. **Next decision:** fix support/smoothing and record any numerical floor.

### Example D — tempting counterexample

**Input:** two models are 90% accurate; one is cautious and one is overconfident on its 10% errors. **Mechanism:** each gets the same hard labels, but log loss weights confidence. **Output:** the overconfident model can be much worse. **Inspect:** list per-example probabilities, not only the argmax. **Next decision:** select the metric before seeing the result.

## Computation and interpretation

```python
import numpy as np

y = np.array([1, 1, 0, 0])
p = np.array([.8, .99, .2, .01])
loss = -np.mean(y * np.log(p) + (1 - y) * np.log1p(-p))
print(loss)
```

Lower average loss means the model assigned more probability to observed labels under this scoring rule. It does not identify why: calibration, discrimination, label noise, and class prevalence all contribute.

## Two ways to see it

### Builder view

Cross-entropy is a per-example diagnostic that can be decomposed by class, slice, token, or time. Keep the unreduced values when debugging.

### Systems view

The loss encodes a strong operational preference: being confidently wrong is costly. If the product cost is asymmetric or abstention is available, add that decision layer instead of assuming cross-entropy is the whole business objective.

## Hands-on

Compute binary log loss for four labels and predictions, preserving each row’s contribution. **Failure fixture:** pass p=0 for a positive label and silently clip it before reporting. **Test:** the lab must flag the support violation and report whether clipping was used; the unclipped mathematical loss is infinite. **Reset:** replace the zero with a documented smoothed probability and rerun both raw and smoothed reports.

## Checkpoint

- [ ] Derive binary cross-entropy from negative log-likelihood.
- [ ] Calculate the loss for y=1, p=.8.
- [ ] Explain why confident wrong predictions are penalised more than cautious wrong ones.
- [ ] Name two reduction or encoding choices that can invalidate loss comparisons.

## What this does not solve

Cross-entropy does not guarantee calibration, fairness, causal validity, or useful decisions under shift. A lower loss on one distribution may not mean better performance on the deployment population. Numerical clipping changes the reported objective.

## Continue, go deeper, apply it

- Continue: KL divergence and distribution mismatch
- Go deeper: Likelihood, cross-entropy, and classification objectives
- Apply it: Logistic regression
