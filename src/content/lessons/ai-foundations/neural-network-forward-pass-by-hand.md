---
title: "A Forward Pass, One Number at a Time"
track: "ai-foundations"
status: live
summary: "A fully-worked forward pass through a 2-input, 2-hidden-neuron, 1-output network — every multiply, sum, bias, and activation written out with real numbers, plus a demonstration of "
duration: "14 min read"
---

A neural net doesn't do anything mysterious to a number — it multiplies, adds, and squashes it, over and over, at every neuron. [What is a neural network](/learn/ai-foundations/what-is-a-neural-network) gives you the shape of that idea. This page gives you the arithmetic, in full, on one tiny network, so you can watch a prediction get built one number at a time.

## The setup

Nine numbers. That's the whole model.

**The scenario:** you're hand-building a toy classifier that guesses whether you'd go back to a coffee shop, from two inputs scaled to 0–1:

- `x1` — coffee quality, rated 8/10 → `0.8`
- `x2` — wifi speed, rated 3/10 → `0.3`

**The architecture:** 2 inputs → a hidden layer of 2 neurons (ReLU) → 1 output neuron (sigmoid), fully connected. If you've worked through [building a neuron in numpy](/learn/ai-foundations/building-a-neuron-in-numpy), this is that same neuron, wired up twice in a hidden layer and read out by a third.

Every connection has a weight, every neuron has a bias — 6 weights + 3 biases = 9 parameters total:

| connection | symbol | value |
|---|---|---|
| x1 → h1 | w11 | 2.0 |
| x2 → h1 | w12 | 0.5 |
| bias → h1 | b1 | -1.0 |
| x1 → h2 | w21 | -1.0 |
| x2 → h2 | w22 | 3.0 |
| bias → h2 | b2 | 0.2 |
| h1 → out | v1 | 1.2 |
| h2 → out | v2 | -0.5 |
| bias → out | c | -0.4 |

We didn't train these — we picked them by hand, on purpose, so every downstream number traces back to something you can check with a calculator. [Activation functions](/learn/ai-foundations/activation-functions) covers what ReLU and sigmoid actually look like as curves; here we only need their formulas: `ReLU(z) = max(0, z)` and `sigmoid(z) = 1 / (1 + e^-z)`.

## Step by step

**Step 1 — multiply each input by its weight, for neuron h1.**

`x1 * w11 = 0.8 * 2.0 = 1.6`
`x2 * w12 = 0.3 * 0.5 = 0.15`

> **Why this step?** The weight is how much this neuron cares about this particular input. w11 = 2.0 says "quality matters a lot to h1." w12 = 0.5 says "wifi matters, but a fifth as much." A negative weight (you'll see one in h2) doesn't just weaken a signal — it inverts it.

**Step 2 — sum the weighted inputs, then add the bias.**

`z_h1 = 1.6 + 0.15 + b1 = 1.6 + 0.15 - 1.0 = 0.75`

> **Why this step?** Summing collapses every incoming connection into one number — this is the "linear combination" that every textbook diagram is drawing when it shows arrows converging on a node. The bias then shifts that number independent of the inputs. b1 = -1.0 makes h1 skeptical by default: even a decent quality score alone (0.8 * 2.0 = 1.6) barely clears the bar once the bias drags it back down.

**Step 3 — apply the activation.**

`h1 = ReLU(0.75) = 0.75`

> **Why this step?** Without this step, "layer 2" would just be more addition, and two layers of pure addition are one layer wearing a costume — more on that below. ReLU passes positive signal through unchanged and kills negative signal to exactly zero. Here z_h1 was already positive, so nothing gets clipped — but that won't always be true, and when it isn't, it matters a lot.

**Step 4 — repeat steps 1–3 for h2, using the same two inputs and h2's own weights.**

`z_h2 = (0.8 * -1.0) + (0.3 * 3.0) + 0.2 = -0.8 + 0.9 + 0.2 = 0.3`
`h2 = ReLU(0.3) = 0.3`

> **Why this step?** h1 and h2 see the exact same `x1, x2` — the only thing that differs is their weights. That's the entire idea of a "hidden representation": the layer computes two different derived features from the same raw inputs. h1 is roughly a quality detector; h2 is roughly a wifi detector that mildly discounts quality. Neither is the final answer — they're intermediate opinions.

**Step 5 — the output neuron combines the hidden opinions the same way: multiply, sum, add bias.**

`z_out = (h1 * v1) + (h2 * v2) + c`
`z_out = (0.75 * 1.2) + (0.3 * -0.5) + (-0.4) = 0.9 - 0.15 - 0.4 = 0.35`

> **Why this step?** The output weights say how much to trust each hidden neuron's opinion, and in which direction. v1 = 1.2 says "when h1 fires, that's evidence *for* coming back." v2 = -0.5 says "when h2 fires, treat that as mild evidence *against*" — a place that's mostly about wifi and light on quality isn't the one you go back for.

**Step 6 — apply the output activation to get an interpretable number.**

`y = sigmoid(0.35) = 1 / (1 + e^-0.35) ≈ 0.5866`

> **Why this step?** z_out = 0.35 is an unbounded real number with no fixed meaning. Sigmoid squashes it into (0, 1), so `0.5866` can be read as "the model gives this about a 59% chance you'd go back" — a number you could threshold, log, or compare against a true label with a loss function.

Here's the whole thing as code, so you can rerun it and check every intermediate value against what's above:

```python
import numpy as np

x = np.array([0.8, 0.3])          # quality, wifi

W1 = np.array([
    [2.0,  0.5],                  # neuron h1's weights
    [-1.0, 3.0],                  # neuron h2's weights
])
b1 = np.array([-1.0, 0.2])

def relu(z):
    return np.maximum(0, z)

def sigmoid(z):
    return 1 / (1 + np.exp(-z))

z1 = W1 @ x + b1                  # [0.75, 0.3]
h  = relu(z1)                     # [0.75, 0.3]  -- nothing clipped this time

W2 = np.array([1.2, -0.5])
b2 = -0.4

z2 = W2 @ h + b2                  # 0.35
y  = sigmoid(z2)                  # 0.5866...

print(z1, h, z2, y)
```

That's a full forward pass: two matrix-vector products, two bias adds, two activations, one prediction.

## Where it breaks

Change one thing: delete the ReLU. Pretend the hidden layer just passes its sum through unchanged — an "identity" activation. This is a real, easy-to-make mistake: in Keras, for example, `Dense(units)` defaults to no activation at all unless you specify one, so a copy-pasted layer can silently be linear.

At our original input, nothing looks wrong, because both `z_h1` and `z_h2` were already positive — ReLU wasn't clipping anything anyway, so removing it changes nothing *for this one input*:

```python
h_linear = z1                     # skip relu entirely
z2_linear = W2 @ h_linear + b2
print(z2_linear)                  # 0.35 -- identical to before
```

That should worry you more, not less. It means two full layers — six weights, three biases, a hidden layer of two neurons — collapsed into something you can compute directly from the raw inputs with no hidden layer at all:

```python
W_combined = W2 @ W1              # [2.9, -0.9]
b_combined = W2 @ b1 + b2         # -1.7

z2_check = W_combined @ x + b_combined
print(z2_check)                   # 0.35 -- same answer, one neuron, no hidden layer
```

Without a nonlinearity anywhere, a stack of linear layers is *always* algebraically identical to one linear layer — that's not a quirk of these nine numbers, it's true for any weights you'd plug in, because composing linear maps just gives you another linear map. The hidden layer added parameters, training cost, and inference latency, and bought zero additional representational power. [Why nonlinearity matters](/learn/ai-foundations/why-nonlinearity-matters) has the general argument; this is what it looks like in numbers.

Now watch it actually diverge. Feed in a different pair of inputs — low quality, great wifi — where a hidden neuron's pre-activation goes negative:

```python
x2_input = np.array([0.1, 0.9])

z1b = W1 @ x2_input + b1          # [-0.35, 2.8]
hb  = relu(z1b)                   # [0.0, 2.8]   -- h1 clipped to zero
z2b = W2 @ hb + b2                # -1.8
print(sigmoid(z2b))                # ≈ 0.142

z2b_linear = W_combined @ x2_input + b_combined
print(sigmoid(z2b_linear))         # ≈ 0.098
```

With ReLU doing its job, h1's pre-activation (`-0.35`) gets clipped to exactly `0` — it contributes nothing to this particular prediction, because "quality" evidence was too weak to matter here. The real network says about 14% chance you'd return; the fake "equivalent" linear model, which can no longer see that clipping, says about 10%. Same inputs, same original weights, a meaningfully different answer — because the moment ReLU actually clips something, the network stops being reducible to any single linear map. That clipping *is* the nonlinearity earning its keep.

Don't confuse this with a **dead ReLU**, which is a different, more permanent failure: a neuron whose pre-activation is negative for every input it will ever see, so it outputs zero forever and its gradient never updates it again during training. What you just saw is ordinary, healthy ReLU behavior — a neuron switching off for inputs it doesn't consider relevant, then switching back on for others. [Activation functions compared](/learn/ai-foundations/activation-functions-compared) covers the permanent version and why leaky variants exist to prevent it.

**The fix**, such as it is: never treat "no activation between layers" as a harmless default. If a hidden layer's activation is identity — whether you meant it or a framework default did it for you — every layer you've stacked on top of it is decoration. Real nonlinearity between layers is what makes depth mean anything at all.

## Takeaways

- A forward pass is `(weights · inputs) + bias`, then an activation, repeated once per layer — nothing in this page was more complicated than that.
- Every neuron's number is fully determined by its own weights and bias and the values feeding into it. Given the weights, you can always hand-verify the output — that's what you just did.
- Nonlinearity isn't a nice-to-have between layers — it's the only thing that makes stacking layers do anything a single layer couldn't. Delete it and depth becomes an illusion, provably, with a matrix multiplication.
- The nine numbers here were handed to you. In a real model they come from training — [backprop worked example](/learn/ai-foundations/backprop-worked-example) runs this exact kind of hand-traceable arithmetic in reverse, turning a wrong prediction into weight updates.
- Before trusting any deeper network's forward pass, check that a genuine, non-identity activation sits between every pair of layers — the failure mode above hides in plain sight because the output still looks like a normal number.

**Related:** [What is a neural network](/learn/ai-foundations/what-is-a-neural-network) · [Building a neuron in numpy](/learn/ai-foundations/building-a-neuron-in-numpy) · [Activation functions](/learn/ai-foundations/activation-functions) · [Activation functions compared](/learn/ai-foundations/activation-functions-compared) · [Neural networks quiz](/learn/ai-foundations/neural-networks-quiz)
