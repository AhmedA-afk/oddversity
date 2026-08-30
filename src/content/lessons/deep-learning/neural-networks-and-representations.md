---
title: "Deep learning: parameters learn representations"
track: "deep-learning"
status: live
summary: "A neural network learns parameters that transform inputs into useful representations for a task."
duration: "3 min read"
---

## The short answer

A neural network learns parameters that transform inputs into useful representations for a task. During training, a loss measures the error, gradients estimate how parameters contributed to it, and an optimizer updates them. Deep learning is not just “more layers”: the data, objective, architecture, optimization, and evaluation together determine what the representation captures.

## From pixels or tokens to a decision

Early layers can learn local or simple patterns; later layers combine them into task-relevant representations. An embedding is a vector representation whose distances may be useful for retrieval or classification, but similarity is only as meaningful as the training signal and the evaluation task.

## Worked example

Train a tiny classifier on two classes. A high training score with a low validation score suggests overfitting. Add data augmentation or regularization, then recheck both the metric and the errors. Do not call the representation “understanding” just because a nearest-neighbor visualization looks organized.

## A small story

An embedding demo grouped documents by author instead of topic. The representation was doing something real, but not what the product needed. The fix was a task-aware evaluation set and a decision about which similarity mattered.

## More examples and variations

- **Small network:** learns a simple boundary and makes the parameter/loss loop visible.
- **Embedding:** turns similar items into nearby vectors for retrieval or clustering.
- **Transfer:** a frozen representation can help a new task, but its errors still need inspection.
- **Counterexample:** a visually neat embedding plot does not prove that a downstream decision is fair.

## Two ways to see it

### Optimization view

Training is iterative numerical adjustment of parameters against a loss.

### Representation view

The network is learning a coordinate system in which some distinctions become easier for the next task.

## Hands-on

Fit a small network, plot training and validation loss, inspect a few nearest neighbors in the learned representation, and write an error analysis for cases that look close but should differ.

## Checkpoint

- [ ] You can name the input, target, loss, and update loop.
- [ ] You distinguish training fit from generalization.
- [ ] You test whether the representation serves the actual decision.

## What this does not solve

Neural networks do not automatically learn the right objective, causal structure, or safe behavior. Larger representations can still encode leakage and bias.

## Formal extension: a representation is an interface

Write a two-layer classifier as $z_1=XW_1+b_1$, $h=\phi(z_1)$, and
$\hat y=\mathrm{softmax}(hW_2+b_2)$. The hidden vector $h\in\mathbb R^m$ is not
an explanation by itself; it is an interface offered to the final linear decision
layer. If two inputs map to nearby $h$ values, the downstream layer will tend to
treat them similarly only relative to its weights and bias. Change the downstream
task and “good” geometry can change too.

**Worked calculation.** If $h=(2,-1)$ and the class-one logit is
$2h_1-h_2-1$, it equals $4$. For $h=(1,1)$, it equals $0$. The first coordinate is
not intrinsically meaningful: its effect comes from the task weight 2. Probe a
representation by training a simple, held-out linear probe, comparing a non-neural
baseline, and inspecting where each fails. A t-SNE picture is useful for hypothesis
generation, but it is not a quantitative validation.

**Practice.** Train an encoder on a source task, freeze it, and fit linear probes for
two target labels. Report the split, probe capacity, confidence interval across seeds,
and at least five errors where nearest neighbours look semantically plausible but lead
to the wrong decision. Full credit requires explaining whether the error is caused by
the representation, probe, label, or measurement protocol.

## Continue, go deeper, apply it

- Continue: Generalization and evaluation
- Go deeper: transformers, tokenization, and language-model training
- Apply it: compare a learned embedding search with a keyword baseline.
