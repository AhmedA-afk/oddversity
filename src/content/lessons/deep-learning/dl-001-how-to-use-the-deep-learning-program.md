---
title: "How to use the Deep Learning programme"
track: "deep-learning"
order: 1
status: live
summary: "A practical map for moving from neural-network mechanics to rigorous experiments, modern architectures, and defensible systems."
duration: "20–30 min"
updated: "2026-08-30"
---

Deep learning is easy to demo and hard to evaluate. This programme is designed to
make you capable of both building a model and defending the decision to use it. The
goal is not to memorize architecture names. It is to connect an objective, a dataset,
an implementation, a measurement protocol, and a real-world decision.

## What you will be able to do

By the end, you should be able to derive and implement a forward and backward pass;
train a small model from scratch; explain why a larger model did or did not generalise;
select and adapt CNNs, sequence models, transformers, and generative models; profile
their resource use; and produce a reproducible report that names both benefits and
failure modes.

“The loss went down” is never sufficient evidence. A completed project identifies:

1. the decision and target population;
2. information that was truly available at prediction time;
3. a baseline the neural model must beat;
4. the split and metric that make that comparison credible;
5. the cost of each important error; and
6. how the model will be monitored after deployment.

## Recommended route

Start with the **core mechanics** if matrix multiplication, derivatives, or vector
shapes feel fragile. Work the calculations with pencil and a tiny NumPy example before
using an autodiff framework. Then choose the architecture module that matches your
data: vision for spatial arrays; sequence and transformer material for ordered,
textual, or multimodal inputs; and the practice module whenever a model begins to
work.

Do not treat the practice module as an appendix. Reproducible splits, data contracts,
profiling, and post-deployment monitoring are part of the modelling work. Likewise,
generative models are not a shortcut around evaluation: their output needs a task,
provenance, risk analysis, and acceptance criterion.

## A repeating learning cycle

For every substantial lesson, use this loop:

1. **Predict.** Before reading the solution, predict tensor shapes, a gradient sign,
   a learning-curve change, or the likely failure mode.
2. **Calculate.** Do one small numerical example by hand. For softmax, compute the
   shifted logits and verify the probabilities sum to one. For convolution, enumerate
   the output positions. For attention, check which axis normalises.
3. **Implement.** Write the smallest version that could falsify your understanding.
   A 20-example fixture catches shape and indexing mistakes faster than a large run.
4. **Perturb.** Change one assumption: corrupt labels, remove normalisation, alter
   sequence length, or introduce a leakage feature. Record the predicted and observed
   effect.
5. **Explain.** Write what evidence supports the claim and what it does not support.
   A visually plausible saliency map, for example, is a hypothesis—not a causal
   explanation.

## Read training curves as evidence

Consider three common observations. If both training and validation loss are high,
first verify targets, input scale, capacity, and optimizer stability before reaching
for a bigger model. If training loss falls while validation loss rises, compare a
simple baseline, inspect the split, add regularisation or data, and check whether the
validation set is representative. If a run is unstable across seeds, report that
variance; a single lucky seed is not a model-selection result.

For a binary classifier, record at least a threshold-free ranking metric, calibration,
and a thresholded decision table tied to a cost or capacity constraint. For a
generator, define a task-specific evaluation set and inspect failure categories,
rather than presenting attractive samples alone.

## Evidence standards for assignments

Every lab and capstone requires a README with a one-command run, a fixed seed policy,
data provenance, declared splits, environment versions, artifacts, and an error
analysis. Keep a *decision log*: what changed, why it changed, what was observed, and
whether it changed the next action. This prevents post-hoc stories and makes negative
results useful.

## Self-check before moving on

- Can you state the shape and role of each tensor in a training step?
- Can you derive at least one gradient rather than only call backpropagation?
- Can you tell optimization failure from data, objective, or evaluation failure?
- Can you name a non-neural baseline and the decision it supports?
- Can another person reproduce your result from your repository and report?

## First assignment

Choose a small supervised task and create a *before-training dossier*: target,
population, available-at-decision-time features, baseline, split plan, metric,
threshold policy, expected harms, and compute budget. Train nothing yet. Then have a
peer try to identify leakage or an undefined decision. Revise the dossier before
opening the first notebook.

Keep the dossier with the experiment, not in a separate memory or chat. A rigorous
training result remains interpretable only when its assumptions, code revision,
dataset version, and decision context travel with it.
