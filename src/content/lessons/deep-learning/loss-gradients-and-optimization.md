---
title: "Understand learning through loss, gradients, and updates"
track: "deep-learning"
status: live
summary: "Training repeatedly measures error with a loss function, computes how each parameter contributed to that error, and updates parameters in a direction."
duration: "3 min read"
---

## The short answer

Training repeatedly measures error with a loss function, computes how each parameter contributed to that error, and updates parameters in a direction expected to reduce it. The loss is a teaching signal, not a complete definition of quality. A model can optimize the wrong loss very effectively.

## The loop

```text
batch -> forward pass -> loss -> gradients -> parameter update -> next batch
```

Learning rate, batch composition, initialization, regularization, and data scale
shape the path. Inspect curves and examples; do not infer learning from one final
number.

## Four examples

### Example A: regression

Squared error heavily penalizes a large miss. It can be useful when large errors
are especially costly, but one outlier can dominate the update.

### Example B: classification

Cross-entropy rewards probability mass on the correct class. A confident wrong
prediction receives a large penalty, which encourages better ranking during
training.

### Boundary case: learning rate too high

Loss oscillates or grows. Lowering the step size may help, but exploding values
can also indicate bad scaling, invalid data, or an unstable implementation.

### Counterexample: lower training loss means done

A model can keep reducing training loss while validation loss rises. Optimization
success and generalization success are different observations.

## An illustrative story

A team tuned the optimizer for days and gained nothing in production. A simple
plot showed that the labels had been shifted by one row. The gradient was doing
exactly what the data asked; the data was wrong.

## Two ways to see it

### Mathematical view

Gradients approximate local sensitivity: how much a small parameter change would
alter the loss.

### Debugging view

Training curves are evidence about data, capacity, optimization, and leakage—not
just about the optimizer.

## Hands-on

Fit a tiny network on a toy dataset. Log training and validation loss, change the
learning rate, and intentionally shuffle labels. Explain each curve before
changing the model.

## Checkpoint

- [ ] You can name the loss and what it rewards.
- [ ] Training and validation behavior are compared.
- [ ] At least one data and one optimization failure are tested.

## What this does not solve

Optimization cannot add information missing from the dataset or make the loss
capture human values it was never designed to represent.

## Formal extension: logits, loss, and gradient scale

For logits $z$ and one-hot target $y$, cross-entropy is
$L=-\sum_i y_i\log(\mathrm{softmax}(z)_i)$. Its exceptionally useful derivative is
$\partial L/\partial z_i=p_i-y_i$, where $p=\mathrm{softmax}(z)$. A correct class
with $p_i=0.90$ receives gradient $-0.10$; a confidently wrong class with
$p_i=0.99$ receives about $+0.99$. That explains why cross-entropy supplies a strong
corrective signal without differentiating through an argmax.

**Worked calculation.** For logits $(2,0,-1)$, subtract 2 before exponentiating:
$p\approx(0.844,0.114,0.042)$. If class two is correct, the logit gradient is
$(0.844,-0.886,0.042)$. Apply a learning rate only after checking whether the
framework averages over batch items, tokens, or both; a silent reduction mismatch
changes the effective update magnitude.

**Debug lab.** Implement stable log-sum-exp, finite-difference check one weight, and
compare analytic against numeric gradients over step sizes $10^{-1}$ to $10^{-7}$.
Then intentionally use probabilities as inputs to a logits loss and document the
failure curve. Grade the report on gradient agreement, shape annotations, and a
diagnosis that distinguishes overflow, saturation, bad targets, and an excessive
learning rate.

## Continue, go deeper, apply it

- Continue: Attention and transformers
- Go deeper: Neural networks and representations
- Apply it: create a training-debug notebook with four labeled failure curves.
