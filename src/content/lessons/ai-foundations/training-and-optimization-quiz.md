---
title: "Training & Optimization: Debug the Run"
track: "ai-foundations"
status: live
summary: "A 6-question self-check where learners read loss-curve scenarios (diverging, oscillating, plateaued, and overfit-vs-healthy), diagnose the mechanism, and pick the right fix — plus "
duration: "15 min read"
---

A loss curve is a symptom, not a diagnosis — the same shape can come from different causes, and the same cause can produce different shapes depending on what else is going on. These six questions each hand you a scenario and ask you to reason to the mechanism, the way you'd actually do it staring at a training log at 11pm.

## 1. The loss that climbs to NaN

You kick off training a small MLP. For the first few hundred steps the loss drops nicely, then around step 800 it starts climbing again — slowly at first, then loss reports `nan` by step 1200. You check the code: no bugs in the loss function or data loading. What's the most likely cause and fix?

- **A.** The model is overfitting the training set; add dropout or weight decay.
- **B.** The learning rate is too high for the current loss landscape; lower it, or add LR warmup/decay and gradient clipping.
- **C.** The batch size is too small, injecting too much noise into each gradient estimate; increase the batch size.
- **D.** The model is underparameterized for the task; add more layers or width.

<details><summary>Answer</summary>

**Correct: B.** The early drop shows learning is genuinely happening — the problem shows up later. As weights move and the loss surface's local curvature changes, a step size that was safe near initialization can start overshooting minima: each step lands somewhere with an even larger gradient than before, and the process compounds into an explosion. This is the classic overshoot pattern described in [Gradient Descent, Explained](/learn/ai-foundations/gradient-descent-explained) — lowering the learning rate, adding warmup/decay, or clipping gradients all address the same root cause: the step is too large relative to the landscape.

**A** — Overfitting shows up as a *gap* between training and validation loss while training loss keeps falling smoothly. It doesn't make your training loss itself blow up to `nan` — that's an optimization-stability failure, not a generalization one.

**C** — A small batch size makes the loss curve noisier and more erratic step to step, but noise alone doesn't produce a runaway, monotonically-worsening climb to `nan`. That directional pattern — consistently getting worse, not just jumping around — points at instability from step size, not estimate variance.

**D** — An underparameterized model plateaus at a higher-than-desired loss because it structurally can't fit the data. It doesn't cause the loss to explode, and adding capacity without touching the step size wouldn't fix a divergence that's already in progress.

</details>

## 2. The loss that won't stop bouncing

Loss bounces between very different values step to step — say 0.4, then 1.9, then 0.3, then 2.1 — with no clear net trend downward over hundreds of steps, but it never blows up to `nan`. You leave everything else untouched and increase the batch size from 8 to 256. The oscillation mostly disappears and a clear downward trend appears. What was actually going on?

- **A.** The learning rate was fundamentally too high for the loss landscape, independent of batch size.
- **B.** The model architecture was too shallow to represent the target function.
- **C.** Gradient estimates from tiny batches were too noisy and high-variance, so each step aimed at a different point on the loss surface; more samples per batch produced a more stable, representative estimate.
- **D.** The validation set was too small, so validation loss was unreliable.

<details><summary>Answer</summary>

**Correct: C.** A batch of 8 examples gives you a rough, high-variance estimate of the true gradient — each mini-batch can point in a noticeably different direction, so consecutive steps can partially cancel each other out or overshoot in different directions. Averaging over 256 examples produces a much more stable estimate of where the loss actually decreases, which is why the fix worked with the learning rate untouched.

**A** — If the learning rate itself were the core problem, increasing the batch size wouldn't have fixed it — a genuinely too-high learning rate overshoots minima regardless of how precise the gradient estimate is (that's the divergence pattern in question 1, not this one). Here, batch size alone resolved it, which points at gradient noise rather than step size.

**B** — A capacity problem shows up as a loss *floor* the model can't get below (a plateau), not as violent step-to-step oscillation that vanishes once you average over more samples per step.

**D** — The scenario describes *training* loss oscillating, not validation loss. A noisy validation estimate wouldn't make the training loss itself bounce between consecutive optimizer steps — those are computed from training batches only.

</details>

## 3. The loss that flatlines almost immediately

You train a deep network with sigmoid activations in every hidden layer. Loss drops for the first ~20 steps, then flatlines almost exactly — for the next several thousand steps it barely moves, even though a simpler baseline reaches a meaningfully lower loss on the same data. Swapping the hidden activations to ReLU, with everything else unchanged, fixes it. What was the likely mechanism?

- **A.** Sigmoid units saturate for inputs far from zero, driving their local derivative near zero; through the chain rule, gradients flowing back through many such layers shrink toward zero, so weights barely update.
- **B.** The learning rate was too low to escape a sharp local minimum.
- **C.** The optimizer had converged to the global minimum, and the plateau is the expected training floor.
- **D.** The loss function's gradient is undefined at that point, so the optimizer got stuck.

<details><summary>Answer</summary>

**Correct: A.** Sigmoid squashes its input into (0, 1), and once the input to a sigmoid unit is far from zero in either direction, the curve is nearly flat — its derivative is close to zero. [Backpropagation](/learn/ai-foundations/backpropagation-explained) multiplies these local derivatives together layer by layer via the chain rule, so stacking several near-zero derivatives shrinks the gradient reaching early layers toward nothing. Weights in those layers barely move, which is exactly the flatline you're seeing. ReLU's derivative is a clean 1 for any positive input, so it doesn't have this saturation problem — which is why swapping activations, and nothing else, fixed it. See [Activation Functions Compared](/learn/ai-foundations/activation-functions-compared) for why this tradeoff exists.

**B** — A too-low learning rate produces a slow-but-steady decline, not an abrupt flatline at high loss after only ~20 steps — and it wouldn't be fixed by changing the activation function, only by changing the learning rate itself.

**C** — A baseline reaching meaningfully lower loss on the same data is direct evidence you are *not* at a genuine minimum. This is a symptom of poor gradient flow, not of having found the training floor.

**D** — Sigmoid is smooth and differentiable everywhere; nothing here is mathematically undefined. The problem is a derivative that's very *small* across most of the input range, not one that fails to exist.

</details>

## 4. The curve that looks fine until it doesn't

Training loss decreases smoothly for the entire run. Validation loss decreases in step with it for the first many epochs, then starts climbing while training loss keeps falling. Which is the correct read, and the most direct fix?

- **A.** This is a healthy run — training loss falling is what matters, and validation loss will eventually follow it back down if you keep training.
- **B.** The learning rate is too high late in training; reduce it or add decay.
- **C.** The validation set and training set come from different distributions, so the comparison is meaningless.
- **D.** The model is overfitting: it's increasingly fitting patterns specific to the training set that don't generalize; address it with regularization, more or more varied training data, or early stopping at the point validation loss turns up.

<details><summary>Answer</summary>

**Correct: D.** This is the textbook signature covered in [Generalization and Overfitting](/learn/ai-foundations/generalization-and-overfitting): once the model has capacity to spare, continuing to train drives training loss down partly by memorizing training-set-specific noise rather than learning patterns that transfer — and that shows up as validation loss turning upward while training loss keeps improving. [Regularization Techniques](/learn/ai-foundations/regularization-techniques) (dropout, weight decay), more/varied data, or stopping at the validation turning point are the standard responses — see the shape of this in [Overfitting: Visual Intuition](/learn/ai-foundations/overfitting-visual-intuition).

**A** — This is precisely the *unhealthy* pattern, not a healthy one. Once train and validation curves diverge like this, continuing to train past that point typically keeps pushing validation loss up, not back down — it doesn't self-correct by waiting.

**B** — A too-high learning rate shows up as noisy or diverging *training* loss (the oscillation or explosion patterns in questions 1 and 2). Here training loss is decreasing smoothly, which rules out a step-size problem — the divergence is specifically between train and validation, which is a generalization signature, not an optimization one.

**C** — A distribution mismatch is possible in principle, but it isn't the default explanation for this exact shape, and you can't conclude it from curve shape alone. "Train keeps improving, validation turns up" is the standard overfitting signature and should be ruled in (with the fixes in D) before reaching for a rarer explanation.

</details>

## 5. One step, by hand

You're running plain gradient descent on a single weight `w` to minimize `L(w) = (w - 5)^2`. Current `w = 1`, learning rate `η = 0.1`. The update rule is:

```python
grad = 2 * (w - 5)      # dL/dw, by the chain rule on a squared term
w = w - lr * grad
```

What is `w` after exactly one step?

- **A.** 1.8
- **B.** 1.4
- **C.** 0.2
- **D.** 9

<details><summary>Answer</summary>

**Correct: A.** `dL/dw = 2(w - 5)`. At `w = 1`: `2 * (1 - 5) = 2 * -4 = -8`. Apply the update: `w_new = w - η * grad = 1 - 0.1 * (-8) = 1 + 0.8 = 1.8`. Notice the direction: the gradient was negative, so subtracting it *increases* `w`, moving it toward 5 — the actual minimum of `(w-5)^2`. That's the whole mechanism in [Gradient Descent, Explained](/learn/ai-foundations/gradient-descent-explained): you always move opposite the gradient's sign, scaled by `η`.

**B** — 1.4 comes from dropping the factor of 2 from the power rule — treating the gradient as `(w - 5) = -4` instead of `2(w - 5) = -8`. That gives `1 - 0.1 * (-4) = 1.4`. It's a common chain-rule slip when differentiating a squared term: the exponent has to come down as a coefficient.

**C** — 0.2 comes from adding the gradient instead of subtracting it: `w + η * grad = 1 + 0.1 * (-8) = 0.2`. That's gradient *ascent* — climbing the loss surface instead of descending it. The minus sign in the update rule isn't cosmetic; it's what makes the algorithm move downhill.

**D** — 9 comes from applying the raw gradient as the step itself and forgetting to scale it by the learning rate: `w - grad = 1 - (-8) = 9`. Without `η`, even a small, well-behaved landscape produces an uncontrolled jump — this is essentially what a learning rate that's far too high looks like in miniature.

</details>

## 6. What backprop actually needs from the forward pass

A teammate suggests saving memory by discarding each layer's activations immediately after computing the next layer's output during the forward pass, then recomputing them during backprop only if needed. You point out this breaks a step of backprop unless something specific is stored first. What exactly does backprop need from the forward pass, and why?

- **A.** Only the final output and the loss value — everything before that can be discarded, since backprop just describes how gradients flow.
- **B.** Nothing from the forward pass — backprop only needs the gradient of the loss with respect to the final output, and can compute the rest from the network's weights alone.
- **C.** The intermediate activations and pre-activations at each layer, because the local derivative at each layer — an activation function's slope, or the input a weight matrix was multiplied against — is evaluated at the specific value that layer saw during the forward pass; without it, you can't compute the correct local gradient to chain backward.
- **D.** Only the original input data, since the chain rule ultimately differentiates with respect to the input.

<details><summary>Answer</summary>

**Correct: C.** [Backpropagation](/learn/ai-foundations/backpropagation-explained) is repeated application of the chain rule, and the chain rule multiplies *local* derivatives — each one evaluated at the actual value that layer computed during the forward pass, not at some generic point on the function. A ReLU's derivative is 1 or 0 depending on whether its specific pre-activation was positive or negative that pass; a weight's gradient depends on what activation was flowing into it that pass. Discard those values and you have no way to know which local derivative to use — you'd have to redo the forward computation to get them back, which is exactly the recompute-vs-cache tradeoff frameworks like activation checkpointing make explicit. Walk the actual numbers in [Backprop, Worked Example](/learn/ai-foundations/backprop-worked-example).

**A** — The final output and loss give you the *starting* gradient signal (`dL/d output`), but propagating that signal back through each intermediate layer requires each layer's local derivative evaluated at what it actually saw — the final output alone doesn't tell you that.

**B** — Weights tell you the *shape* of the function a layer computes, not the derivative's value at a specific point on that function. Two different inputs to the same ReLU can have a derivative of 1 or 0 — you can't get that from the weights, only from the value that was actually passed through.

**D** — The chain rule computes gradients with respect to *every* intermediate quantity — weights and activations at every layer — not just the original input. Needing "the input" also doesn't explain why each layer's own cached values are required; recomputing everything from the raw input alone would mean redoing the entire forward pass, which is the very cost caching exists to avoid.

</details>

**Related:** [Gradient Descent in NumPy](/learn/ai-foundations/gradient-descent-in-numpy) · [Loss Functions, Explained](/learn/ai-foundations/loss-functions-explained) · [Train/Validation/Test Splits](/learn/ai-foundations/train-validation-test-splits)
