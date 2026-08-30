---
title: "Backpropagation: Credit Assignment via the Chain Rule"
track: "ai-foundations"
status: live
summary: "A CONCEPT-page lesson on backpropagation for Oddversity's AI Foundations track, explaining it as chain-rule bookkeeping for credit assignment, with a fully worked 2-2-1 network exa"
duration: "2 min read"
---

A network with a million weights makes one prediction and gets back exactly one number — the loss. Somehow every one of those million weights needs to find out how much it personally contributed to that number. Backpropagation is the trick that answers this for all of them at once, exactly, in about the same time as one extra forward pass.

## What it is

Backpropagation ("backprop") is an algorithm for computing the gradient of the loss with respect to every weight in a network — that is, for each weight, how much a tiny nudge to it would change the loss. It does this by applying the chain rule from calculus, starting at the loss and working backward through the network one layer at a time, reusing work as it goes.

It's worth being precise about what backprop is *not*. It is not the thing that changes your weights — that's [gradient descent](/learn/ai-foundations/gradient-descent-explained). Backprop only computes the gradient; gradient descent (or a variant like Adam) then decides how far to step using it. It's also not specific to any one loss function or architecture — swap in a different [loss function](/learn/ai-foundations/loss-functions-explained) or a different [activation function](/learn/ai-foundations/activation-functions) and the same backward mechanics apply, because the chain rule doesn't care what the functions are, only how they're composed.

So training a network is really three distinct steps, run in a loop:

1. **Forward pass** — push input through the network, layer by layer, to get a prediction and a loss.
2. **Backward pass (backprop)** — push the error signal back through the same network, layer by layer, to get a gradient for every weight.
3. **Weight update** — nudge every weight a small step opposite its gradient.

Conflating these three is the single most common source of confusion about training. Keep them separate in your head and everything else here will click faster.

## The mental model

Picture the forward pass you already know from [computing a network's output by hand](/learn/ai-foundations/neural-network-forward-pass-by-hand): input flows in, gets multiplied by weights, summed, squashed by an activation, and handed to the next layer, until a prediction pops out the end. Backprop is that same wiring diagram, run in reverse, carrying a different kind of signal: not values, but *blame*.

At the output, the blame signal starts as "how wrong was the prediction." Then at every junction going backward, the chain rule tells you exactly how to split that blame among whatever fed into it — proportional to how sensitive that junction's output was to each input. A weight that barely affected the output (because, say, the neuron it feeds into was saturated near 0) gets assigned very little blame. A weight that had a big lever on the output gets assigned a lot.

The mechanical rule underneath this is disarmingly simple: **local gradient × incoming gradient**. Every node in the network — every weight, every activation — only ever needs to know two things: its own local derivative (how its output changes with respect to its own input, a fact it can compute on the spot) and the gradient flowing in from whatever came after it (a number handed to it from downstream). Multiply the two and you get the gradient to hand further upstream. This is exactly the recursive step that autodiff engines like PyTorch's autograd or TensorFlow's `GradientTape` implement mechanically when you call something like `loss.backward()` — they build a graph during the forward pass and walk it backward applying this same multiply-and-pass-along rule, node by node, whether the network has 2 weights or 200 billion.

## Why it works this way

The chain rule says that if you compose functions, the derivative of the whole composition is the *product* of the derivatives of each piece. For a weight buried early in the network, the path from that weight to the loss runs through every layer after it:

```
dL/dw = (dL/da_out) · (da_out/dz_out) · (dz_out/da_1) · (da_1/dz_1) · (dz_1/dw)
```

Each factor is a "local" derivative — something you can compute knowing only that one layer. Backprop's efficiency trick is that the leftward-most factors — `(dL/da_out) · (da_out/dz_out) · (dz_out/da_1)` — are *identical* for every weight feeding into layer 1, not just this one. So instead of recomputing that whole product from scratch for each of the (potentially millions of) weights, backprop computes it once, caches it as a single number (often written `delta`), and every weight in that layer just multiplies its own tiny local factor onto the shared `delta`.

Compare that to the alternative: estimating each weight's gradient numerically, by nudging it slightly and rerunning the forward pass to see how the loss moved. That needs one extra forward pass *per weight* — for a network with a million weights, roughly a million forward passes just to get gradients for one training step. Backprop gets every one of those million gradients from a single backward pass, costing about the same as one more forward pass. That gap is the entire reason deep networks are trainable at any practical scale.

## A concrete example

Take a small version of the network from Module 3's forward pass: 2 inputs, one hidden layer of 2 neurons, 1 output, all sigmoid, trained with squared-error loss against a target of `1.0`.

**Step 1 — forward pass.** Run input through and cache every intermediate value; you'll need them for step 2.

```python
import numpy as np

def sigmoid(z):
    return 1 / (1 + np.exp(-z))

x = np.array([1.0, 0.5])   # inputs
y = 1.0                     # target

W1 = np.array([[0.3, 0.4],
               [-0.2, 0.1]])   # rows: x1, x2 | cols: hidden unit 1, 2
b1 = np.array([0.1, -0.1])

W2 = np.array([0.5, -0.3])     # hidden -> output
b2 = 0.2

z1 = x @ W1 + b1        # [0.30, 0.35]
h  = sigmoid(z1)        # [0.5744, 0.5866]  <- cache this
z2 = h @ W2 + b2        # 0.3112
y_hat = sigmoid(z2)     # 0.5772            <- cache this

loss = 0.5 * (y - y_hat) ** 2   # 0.0894
```

**Step 2 — backward pass.** Start at the loss, work back one layer at a time. Notice `delta_out` gets computed once and reused for both weights in `W2`; `delta_hidden` is the reusable term for `W1`.

```python
def sigmoid_deriv(a):        # a is already sigmoid(z)
    return a * (1 - a)

dL_dyhat  = -(y - y_hat)                     # dL/da_out
delta_out = dL_dyhat * sigmoid_deriv(y_hat)  # dL/dz_out ≈ -0.1032

dL_dW2 = delta_out * h    # ≈ [-0.0593, -0.0605]
dL_db2 = delta_out        # ≈ -0.1032

dL_dh        = delta_out * W2               # push blame back through W2
delta_hidden = dL_dh * sigmoid_deriv(h)     # ≈ [-0.0126, 0.0075]

dL_dW1 = np.outer(x, delta_hidden)   # ≈ [[-0.0126, 0.0075], [-0.0063, 0.0038]]
dL_db1 = delta_hidden
```

Every gradient in `dL_dW1` and `dL_dW2` came from exactly two numbers (`delta_out`, `delta_hidden`) fanned out with local factors — that's the shared-subexpression trick from the last section, made concrete.

**Step 3 — weight update.** This is the only step that touches a learning rate, and it's a completely separate concern from steps 1 and 2 (see [gradient descent](/learn/ai-foundations/gradient-descent-in-numpy) for why this rule specifically):

```python
lr = 0.5
W2 -= lr * dL_dW2
b2 -= lr * dL_db2
W1 -= lr * dL_dW1
b1 -= lr * dL_db1
```

Run this once and `y_hat` moves a little closer to `1.0`. Run the whole three-step loop thousands of times over real data and that's, mechanically, all training is. The full multi-step version of this example — watching the loss actually decrease over several iterations — is worked through in detail in the [backprop worked example](/learn/ai-foundations/backprop-worked-example).

## Where it shows up

Every deep learning framework's autograd — PyTorch, JAX, TensorFlow — is an implementation of exactly this algorithm, generalized to arbitrary computation graphs instead of a fixed stack of layers. When you train a convolutional net, a transformer, or anything else, the forward pass builds the graph and the framework walks it backward automatically; you never hand-derive the chain rule yourself, but the mechanism inside `.backward()` is the same local-gradient-times-incoming-gradient rule as the 2-weight example above.

It also shows up as a debugging technique in its own right: when people implement a custom layer by hand, a standard sanity check ("gradient checking") is to compare the analytic gradient backprop produces against a slow numerical estimate from nudging weights and rerunning the forward pass — if they disagree, the backward-pass code has a bug.

## Watch out for

**Vanishing and exploding gradients.** Because the gradient for an early weight is a *product* of many local derivatives (one per layer between it and the loss), and sigmoid/tanh derivatives never exceed 0.25–1.0, stacking many layers multiplies together a chain of numbers less than 1 — the gradient shrinks toward zero the further back you go, so early layers barely learn. Push in the other direction (large weights, unstable compositions) and gradients can blow up instead. This is a large part of why [activation functions](/learn/ai-foundations/activation-functions) like ReLU, and architectural tricks like residual connections, exist.

**Mistaking the gradient for the update.** Backprop tells you the *direction and steepness* of blame — it says nothing about how far to move. That choice (learning rate, momentum, Adam's adaptive scaling) belongs entirely to [gradient descent](/learn/ai-foundations/gradient-descent-explained), layered on top of a correct gradient. A training run that diverges or stalls is often a gradient-descent problem, not a backprop problem, and it's worth knowing which one you're debugging.

**Backprop needs the forward pass's cached activations.** Look back at step 2 above — it uses `h` and `y_hat`, both computed in step 1. You cannot run the backward pass from the weights alone; every intermediate activation from the forward pass has to stay in memory until the backward pass consumes it. That's the real reason training a model takes far more memory than just running inference on it, and it's why very deep or very long-sequence models sometimes use activation checkpointing — deliberately *not* caching everything, and recomputing some activations during the backward pass instead, trading compute for memory.

## Where next

Backprop is the calculus engine; it only makes sense sitting on top of the forward pass it walks backward through, and underneath the update rule it feeds. If either side is shaky, revisit [the forward pass by hand](/learn/ai-foundations/neural-network-forward-pass-by-hand) or [gradient descent](/learn/ai-foundations/gradient-descent-explained) first. Once this clicks, the [backprop worked example](/learn/ai-foundations/backprop-worked-example) runs the same network through several real training steps so you can watch the loss actually fall, and the [training and optimization quiz](/learn/ai-foundations/training-and-optimization-quiz) is a fast way to check the three-step model actually stuck.

**Related:** [Neural network forward pass by hand](/learn/ai-foundations/neural-network-forward-pass-by-hand) · [Gradient descent, explained](/learn/ai-foundations/gradient-descent-explained) · [Gradient descent in NumPy](/learn/ai-foundations/gradient-descent-in-numpy) · [Loss functions, explained](/learn/ai-foundations/loss-functions-explained) · [Activation functions](/learn/ai-foundations/activation-functions) · [Backprop worked example](/learn/ai-foundations/backprop-worked-example)
