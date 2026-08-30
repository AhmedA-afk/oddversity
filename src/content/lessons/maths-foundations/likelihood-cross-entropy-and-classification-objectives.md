---
title: "Likelihood, cross-entropy, and classification objectives"
track: "maths-foundations"
status: live
summary: "Softmax turns class logits into a categorical probability vector, and average cross-entropy is the negative log-likelihood of the observed labels."
duration: "4 min read"
---

## The short answer

Softmax turns class logits into a categorical probability vector, and average cross-entropy is the negative log-likelihood of the observed labels under that model. This makes classification training a probabilistic objective, not merely a rule for selecting the largest score. Check label encoding, class order, reduction, weights, and numerical stability before interpreting a loss.

## Why this matters

The line `loss = cross_entropy(logits, labels)` hides several contracts: logits are unnormalised scores, labels identify classes, softmax defines probabilities, and the reduction determines what one reported number means. A mismatch can train a system that runs while optimising the wrong likelihood.

**Small incident (illustrative):** a three-class classifier’s labels were shifted by one index during evaluation. The code produced a finite loss and plausible accuracy, but every probability was compared with the wrong class.

## How it works

For logits z₁,…,z_K, `softmax(z)ₖ = exp(zₖ) / sum_j exp(zⱼ)`. With one-hot target y, categorical negative log-likelihood is `−sum_k yₖ log softmax(z)ₖ`, which reduces to `−log softmax(z)_true`. Over n examples, mean loss is the average of these contributions; sum loss scales with n.

### Assumptions and derivation

The categorical model assumes one target class per example and a stated class order. The likelihood of independent labels is the product of the probability assigned to each true class; log turns that product into a sum. Class weights, label smoothing, ignored labels, and reduction alter the objective and must be included in the interpretation.

## AI use

Use this bridge to inspect classifiers, token predictors, ranking heads, and distillation objectives. Prefer raw logits until a stable loss consumes them, preserve class metadata, and retain per-example loss for slice analysis. A low training loss does not prove calibration, fairness, or deployment usefulness.

## Worked examples and variations

### Example A — smallest happy path

**Input:** logits `[2, 1, 0]`, true class 0. **Mechanism:** softmax probability for class 0 is `e²/(e²+e+1)≈.665`. **Output:** loss `−log(.665)≈.408` nats. **Inspect:** class order and true index. **Next decision:** compare the loss with another model using the same class space and reduction.

### Example B — meaningful variation

**Input:** logits `[0, 0, 0]` for three classes. **Mechanism:** softmax gives `[1/3,1/3,1/3]`; every true class costs `log(3)≈1.099` nats. **Output:** maximum uncertainty for this support. **Inspect:** this is not a bad label; it is an uninformative prediction. **Next decision:** inspect the input or abstain policy.

### Example C — boundary case

**Input:** a true class receives probability 0. **Mechanism:** negative log likelihood is infinity. **Output:** a support failure. **Inspect:** determine whether zero arose from an impossible model, underflow, or a wrong class index. **Next decision:** fix the contract or document smoothing; do not silently turn it into a good score.

### Example D — tempting counterexample

**Input:** logits are passed through softmax, then a loss function applies softmax again. **Mechanism:** the second normalisation changes the intended values and can create gradient or API misuse. **Output:** finite but wrong training objective. **Inspect:** read whether the loss expects logits or probabilities. **Next decision:** supply the representation its contract specifies.

### Example E — reduction mistake

**Input:** run A on 10 examples and B on 100 examples; report summed losses. **Mechanism:** the larger batch accumulates more terms. **Output:** B looks worse even if its per-example loss is equal. **Inspect:** record sum, mean, and valid-count. **Next decision:** compare compatible reductions.

## Computation and interpretation

```python
import numpy as np

z = np.array([2., 1., 0.])
stable = z - z.max()
probs = np.exp(stable) / np.exp(stable).sum()
loss = -np.log(probs[0])
print(probs, loss)
```

Subtracting the maximum preserves softmax probabilities but prevents avoidable overflow. The loss is an average or sum only after the reduction and valid-label count are explicit.

## Two ways to see it

### Builder view

The classifier is a chain: logits → categorical distribution → true-label log probability → reduction. Test every arrow with a hand-computable fixture.

### Systems view

The objective decides what the training loop values. Class weights, ignored labels, and label smoothing can encode legitimate priorities, but they also make a headline loss less comparable across runs.

## Hands-on

Implement stable softmax and one-example cross-entropy for three logits. **Failure fixture:** change the true label from index 0 to index 3 or pass probabilities into a logits-only function. **Test:** reject out-of-range labels and assert the probability vector sums to one; compare the result with the hand calculation above. **Reset:** restore logits `[2,1,0]`, true index 0, and the original class order.

## Checkpoint

- [ ] Derive multiclass cross-entropy from categorical likelihood.
- [ ] Compute the loss for logits `[2,1,0]`, true class 0 to two decimals.
- [ ] Explain mean versus sum reduction.
- [ ] Name two label or API contracts that can silently change the objective.

## What this does not solve

Cross-entropy does not guarantee calibrated or fair probabilities, correct labels, or good decisions under shift. Stable softmax prevents overflow; it does not fix a wrong objective or class mapping.

## Continue, go deeper, apply it

- Continue: Naive Bayes and generative versus discriminative modelling
- Go deeper: Numerical stability: softmax and log-sum-exp
- Apply it: Logistic regression
