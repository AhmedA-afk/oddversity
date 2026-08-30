---
title: "Neural Networks: Trace and Predict"
track: "ai-foundations"
status: live
summary: "A six-question self-check where you hand-compute a forward pass, predict what happens when an activation gets stripped out, match activation shapes to their names, and build intuit"
duration: "15 min read"
---

You can define "forward pass" and "activation function" perfectly and still ship code that's secretly broken — a network collapsed to a straight line, or a weight matrix transposed into nonsense. These six questions are built to catch exactly those failure modes, not just check whether you remember the vocabulary.

## 1. The forward pass, by hand

A single neuron takes inputs x = [2, 3], weights w = [0.5, -1], and bias b = 2, followed by a sigmoid activation. What does the neuron output?

- A. 0
- B. 0.5
- C. 1
- D. 6

<details><summary>Answer</summary>

**Correct: B.** First find the weighted sum: z = 0.5(2) + (-1)(3) + 2 = 1 - 3 + 2 = 0. Then apply the activation: sigmoid(0) = 1 / (1 + e^0) = 0.5. Worth keeping as a landmark fact: sigmoid always outputs exactly 0.5 when its input lands on 0, no matter which weights and inputs produced that 0. If you want to check hand-arithmetic like this without trusting your mental math, it's three lines:

```python
import numpy as np

x, w, b = np.array([2, 3]), np.array([0.5, -1]), 2
z = x @ w + b
print(1 / (1 + np.exp(-z)))  # 0.5
```

**A** is the value of z before the activation is applied — the weighted sum plus bias, correctly computed, but the neuron isn't done yet. Forgetting the final squashing step is one of the most common hand-trace errors, and it's easy to miss because the number looks perfectly plausible sitting on its own.

**C** treats sigmoid like a step function: "z is non-negative, so the neuron fires, output 1." Sigmoid is smooth, not a switch — at z = 0 it sits exactly on the fence at 0.5, and only approaches 0 or 1 as z moves far in either direction. See [activation functions compared](/learn/ai-foundations/activation-functions-compared) for what actually separates a smooth squashing curve from a hard threshold.

**D** comes from dropping the minus sign on the second weight — treating (-1)(3) as +3 instead of -3 — and then, on top of that, forgetting to apply the activation at all and reporting the raw (already wrong) sum. Two stacked mistakes, but a genuinely common combination when you're doing this by hand under time pressure.

</details>

## 2. Pull the nonlinearity out

Take a 5-layer network where every hidden layer currently uses ReLU. You strip the ReLU out of all of them, leaving only the matrix multiplies and bias additions in place — same weights, same biases, same number of layers. What does the network compute now?

- A. It becomes the identity function, just passing the input through unchanged.
- B. It collapses to something equivalent to a single linear transformation of the input, no matter how many layers or how wide each one is.
- C. It still computes a complex nonlinear function, since it has 5 layers of learned weights.
- D. It turns into a lookup table that memorizes the training set exactly.

<details><summary>Answer</summary>

**Correct: B.** A linear layer computes Wx + b. Feed the output of one straight into the next and you get W2(W1x + b1) + b2 = (W2W1)x + (W2b1 + b2) — itself just some matrix times x plus some vector. Do that five times and you still end up with one effective matrix and one effective bias. Depth without a nonlinearity between the layers buys you nothing beyond what a single linear layer could already do — see [why nonlinearity matters](/learn/ai-foundations/why-nonlinearity-matters) for the fuller version of this argument.

**A** confuses "linear" with "does nothing." A linear transformation can still scale, rotate, and reweight the input in complicated-looking ways — collapsing to one matrix multiply is not the same as collapsing to a no-op.

**C** is the instinct that "more layers = more power," and it's usually true — but only because a nonlinearity is breaking up the composition. Without one, stacking affine maps is like multiplying a number by 3 and then by 4 and calling it "two operations": mathematically it's just multiplying by 12.

**D** mixes up two unrelated things: whether a model can represent nonlinear functions (a capacity question, which this scenario answers "no" for) and whether it memorizes its training data (an overfitting question, which depends on parameter count versus data size, not on whether activations are present).

</details>

## 3. Name that curve

You're handed a plot with no legend. For every input below 0, the output is exactly 0. For every input above 0, the output increases with a slope of exactly 1. The two pieces meet at a sharp corner, right at the origin. Which activation function produced it?

- A. ReLU
- B. Sigmoid
- C. Tanh
- D. Softmax

<details><summary>Answer</summary>

**Correct: A.** That's max(0, x) — flat at zero for any negative input, then a straight line with slope 1 for positive input, meeting at a sharp, non-smooth kink at x = 0. It's the shape most modern hidden layers actually use, largely because it's cheap to compute and doesn't saturate for large positive inputs. See [activation functions](/learn/ai-foundations/activation-functions) for the shapes of the others laid out side by side.

**B** Sigmoid is a smooth S-curve bounded between 0 and 1 — it never touches 0 or 1 exactly, never has a sharp corner, and never grows without bound the way this plot does for positive x.

**C** Tanh is also a smooth S-curve, just rescaled and centered on 0 instead of 0.5, bounded between -1 and 1. Same problem as sigmoid: no sharp corner, no unbounded linear region.

**D** Softmax isn't a curve you can plot from a single number at all — it takes a whole vector of scores and turns them into a vector of probabilities that sum to 1. Asking "what does softmax output for the number 3" doesn't fully make sense on its own; the answer depends on every other number in the vector too. That's the confusion worth clearing up here: softmax operates on a set of numbers together, not on one input independently, the way the other three do.

</details>

## 4. Shapes through the layer

You're feeding a batch of 32 examples, each with 10 features, into a layer with 4 hidden units, computed as output = x @ W + b, where x has shape (32, 10). What shape does W need to be for the matrix multiply to work and produce the right output?

- A. (4, 10)
- B. (32, 4)
- C. (10, 32)
- D. (10, 4)

<details><summary>Answer</summary>

**Correct: D.** Matrix multiplication needs the inner dimensions to match: x is (32, 10), so W's first dimension must be 10. The output takes the outer dimensions, so W's second dimension has to be 4 to get a (32, 4) result — one row of 4 hidden-unit values per example. You can sanity-check any shape question like this without doing the multiplication by hand:

```python
import numpy as np

x = np.zeros((32, 10))
W = np.zeros((10, 4))
b = np.zeros(4)
out = x @ W + b
print(out.shape)  # (32, 4)
```

**A** is the weight-matrix shape you'd need under the other common convention — W as (out_features, in_features), used when you write the math as W @ x.T instead of x @ W. Both conventions are legitimate and both show up in real code; mixing them up mid-project is one of the most common shape bugs you'll actually hit. [Building a neuron in numpy](/learn/ai-foundations/building-a-neuron-in-numpy) walks through keeping this straight.

**B** is the shape of the layer's output, not its weights — a natural mix-up, since "what shape comes out of this layer" and "what shape are the numbers that produce it" feel like they should be the same question, but a (32, 4) output can come from many different weight shapes depending on the input size.

**C** puts the batch size into the weight matrix, which should never happen — weights are shared across every example in a batch. If they depended on how many examples you happened to feed in at once, you couldn't change your batch size without retraining the whole layer.

</details>

## 5. Removing just the last activation

A classifier ends with a softmax layer producing probabilities over 5 classes. You remove only that final softmax — nothing else about the model changes — and look at the raw outputs (the logits) instead. Compared to the probabilities softmax would have produced, what's true of the logits?

- A. They preserve the same ranking of classes as the probabilities would, but they're no longer bounded between 0 and 1 or guaranteed to sum to 1.
- B. They're meaningless — without softmax there's no way to tell which class the model favors.
- C. They're identical to the probabilities, just written differently.
- D. The network collapses to a linear model, the same way it would if you removed a hidden-layer activation.

<details><summary>Answer</summary>

**Correct: A.** Softmax computes exp(z_i) divided by the same shared sum of exp(z_j) across all classes for a given example — that shared denominator is one positive constant, so it can only rescale every class's score, never reorder them. Whatever ordering the logits have, the probabilities have the identical ordering, which is exactly why plenty of real inference code skips softmax entirely and just takes argmax(logits) when it only needs the predicted class. What you lose by dropping softmax is the guarantee that the numbers behave like a probability distribution — nonnegative, summing to 1 — not the information about which class wins. [Loss functions explained](/learn/ai-foundations/loss-functions-explained) covers why many cross-entropy implementations fold the softmax step in internally for exactly this kind of reason.

**B** overstates the damage: "not a valid probability" and "meaningless" aren't the same thing. The relative ordering and magnitude gaps between classes are all still sitting right there in the logits.

**C** confuses two numbers that agree on ranking with numbers that are the same value. Logits can be any real number — negative, above 1, whatever the last linear layer happens to output — while softmax specifically rescales them into [0, 1] summing to 1. They agree on which class wins; they don't agree on the actual values.

**D** borrows the answer from a different question. Removing a hidden-layer activation collapses the network because it breaks the composition chain running through every subsequent layer. Softmax sits at the very end, with nothing computed after it — removing it doesn't ripple backward and collapse anything upstream; it just changes what the final numbers mean.

</details>

## 6. Why width buys you (almost) any shape

A colleague says: "A network with just one hidden layer, if it's wide enough, can approximate almost any reasonable function." What's the best intuition for why that's true?

- A. Because with enough neurons, the network can memorize every training example individually, so it never needs to generalize between them.
- B. Because matrix multiplication can represent any function, as long as the matrix is large enough.
- C. Because each hidden unit with a nonlinearity contributes one small bump or kink to the output, and stacking enough of them side by side lets you trace out almost any curve as closely as you like.
- D. Because adding more neurons increases the learning rate, letting the network fit faster to arbitrary data.

<details><summary>Answer</summary>

**Correct: C.** Picture one ReLU unit: it's flat, then bends at some point and rises with some slope. Give it its own weight and bias and it can put that bend wherever you want on the input axis, at whatever slope and height you want. One bend on its own doesn't do much. But a hidden layer wide enough to have hundreds or thousands of these units, each with its bend placed somewhere different, gives you a huge pile of tiny, adjustable straight-line pieces you can add together — the same way you can trace a smooth curve to any precision you like with enough short straight segments, or approximate a wiggly wave with enough narrow rectangular pulses. This is the informal picture behind the universal approximation theorem: it's a statement about representational capacity — what a wide enough network could, in principle, represent — not a promise that training will find those weights, or that the result will generalize past the data it saw. [Generalization and overfitting](/learn/ai-foundations/generalization-and-overfitting) is where that second, separate question lives.

**A** describes overfitting, not approximation. A network can approximate a smooth function well while having seen only a scattering of points from it, and — going the other way — a network can memorize a fixed set of training points as isolated cases without learning anything sensible about the function in between them. Capacity to approximate and tendency to memorize are related but distinct.

**B** is the mistake the earlier question about removing activations should already have ruled out: a matrix multiplication is linear no matter how big the matrix is. It's the nonlinearity applied inside each unit, not the raw amount of arithmetic, that lets the pieces bend.

**D** mixes up two unrelated knobs. Width is about how expressive a family of functions the network can represent at all. Learning rate is a training hyperparameter controlling how big a step gradient descent takes on each update — it has nothing to do with how many distinct functions the architecture is capable of representing in the first place.

</details>

If most of these felt straightforward, the mechanics of a forward pass are solid — the rest of this module moves into how those weights actually get learned in the first place.

**Related:** [What Is a Neural Network](/learn/ai-foundations/what-is-a-neural-network) · [Neural Network Forward Pass, by Hand](/learn/ai-foundations/neural-network-forward-pass-by-hand) · [Building a Neuron in Numpy](/learn/ai-foundations/building-a-neuron-in-numpy) · [Why Nonlinearity Matters](/learn/ai-foundations/why-nonlinearity-matters) · [Activation Functions Compared](/learn/ai-foundations/activation-functions-compared)
