---
title: "One Backprop Step, Fully Worked"
track: "ai-foundations"
status: live
summary: "A fully worked backprop step on the 2-neuron network from the forward-pass lesson: every gradient computed by hand, one update applied, and the loss verified to drop — then the sam"
duration: "16 min read"
---

You already pushed numbers forward through a tiny 2-neuron network and got a prediction. Now run the tape backward: find exactly how much blame each weight deserves for the error, nudge every one of them by hand, and prove — by literally recomputing the forward pass — that the network got better.

## The setup (specific)

Same network as the [forward pass lesson](/learn/ai-foundations/neural-network-forward-pass-by-hand): two inputs feed a hidden neuron, whose output feeds an output neuron. Both neurons use a sigmoid activation, `sigmoid(z) = 1 / (1 + e^-z)` — squashing is what makes the network [nonlinear](/learn/ai-foundations/why-nonlinearity-matters), which is the only reason stacking two neurons does anything a single linear layer couldn't.

| Parameter | Value | What it is |
|---|---|---|
| x1, x2 | 1.0, 0.5 | the two inputs |
| w1, w2, b1 | 0.8, -0.5, 0.0 | hidden neuron's weights and bias |
| w3, b2 | 0.6, 0.1 | output neuron's weight and bias |
| y (target) | 1.0 | what we want the output to be |
| η (learning rate) | 0.5 | how far we move per gradient step |

Loss is squared error, halved so its derivative comes out clean: `L = 0.5 * (y - o_out)^2`. Real classifiers usually pair a sigmoid output with cross-entropy, not squared error — see [Loss Functions, Explained](/learn/ai-foundations/loss-functions-explained) for why — but squared error makes the arithmetic in this lesson easy to check by hand, and the mechanics of backprop don't care which loss you plug in.

Forward pass, recapped:

```
h_in  = w1*x1 + w2*x2 + b1  = 0.8*1.0 + (-0.5)*0.5 + 0.0 = 0.55
h_out = sigmoid(0.55)       = 0.6341

o_in  = w3*h_out + b2       = 0.6*0.6341 + 0.1 = 0.4805
o_out = sigmoid(0.4805)     = 0.6179

L = 0.5 * (1 - 0.6179)^2 = 0.0730
```

The network currently predicts 0.6179 for a target of 1.0. Loss is 0.0730. Everything below is about turning that single number into five precise weight adjustments.

## Step by step

If the "chain rule, repeated" idea in [Backpropagation, Explained](/learn/ai-foundations/backpropagation-explained) is still abstract, this is where it becomes five lines of arithmetic you can rerun yourself.

### Step 1 — how wrong was the output?

```
dL/do_out = o_out - y = 0.6179 - 1 = -0.3821
```

This comes straight from differentiating `L = 0.5*(y - o_out)^2` with respect to `o_out`. Negative means: increasing `o_out` decreases the loss — which makes sense, since we undershot the target.

> **Why this step?** Backprop always starts at the loss, because that's the only place "wrong" is actually defined. A weight buried in the hidden layer has no idea whether it's too big or too small until this number exists — everything downstream is just this quantity getting relayed backward through the network, one multiplication at a time.

### Step 2 — chain back through the output neuron's activation

The output neuron didn't emit `o_in` directly — it emitted `sigmoid(o_in)`. To find how the loss responds to `o_in`, multiply by the local slope of sigmoid at that point:

```
sigmoid'(o_in) = o_out * (1 - o_out) = 0.6179 * 0.3821 = 0.2361

delta_o = dL/do_out * sigmoid'(o_in) = -0.3821 * 0.2361 = -0.0902
```

`delta_o` is the error signal sitting "just behind" the output neuron's activation — everything from here back is built out of this one number.

> **Why this step?** The error you computed in Step 1 is measured in "output units," but weights live upstream of the activation function, in "pre-activation units." The activation's slope is the conversion rate between the two. A steep slope lets most of the error through; a flat slope swallows it — keep that in mind, it's the entire failure mode in the next section.

### Step 3 — gradients for the output neuron's weight and bias

```
dL/dw3 = delta_o * h_out = -0.0902 * 0.6341 = -0.0572
dL/db2 = delta_o * 1     = -0.0902
```

> **Why this step?** Every weight's gradient has the same shape: *the error sitting at this neuron, times whatever value flowed into it on the forward pass.* `w3` carries `h_out` into the output neuron, so `h_out` is exactly what multiplies `delta_o`. `b2` has an implicit input of 1, which is why its gradient is just `delta_o` on its own. Memorize this pattern — it's the entire weight-update rule, at any depth.

### Step 4 — push the error back through the connection weight

Before you can grade the hidden neuron, you need to know how much of `delta_o` is actually its fault:

```
dL/dh_out = delta_o * w3 = -0.0902 * 0.6 = -0.0541
```

> **Why this step?** This is the "back" in backpropagation, made literal. `o_in = w3*h_out + b2`, so `w3` is the exact rate at which `h_out` influences `o_in`. Multiplying the downstream error by that weight distributes blame backward along the connection — a bigger weight means the hidden neuron's output mattered more, so it gets assigned more of the error.

### Step 5 — chain back through the hidden neuron's activation

Same move as Step 2, one layer earlier:

```
sigmoid'(h_in) = h_out * (1 - h_out) = 0.6341 * 0.3659 = 0.2320

delta_h = dL/dh_out * sigmoid'(h_in) = -0.0541 * 0.2320 = -0.0126
```

### Step 6 — gradients for the hidden neuron's weights and bias

```
dL/dw1 = delta_h * x1 = -0.0126 * 1.0 = -0.0126
dL/dw2 = delta_h * x2 = -0.0126 * 0.5 = -0.0063
dL/db1 = delta_h * 1  = -0.0126
```

> **Why this step?** Notice this is the identical formula from Step 3 — error at the neuron, times the input that fed it — just one layer further back, with `x1`/`x2` standing in for `h_out`. That repetition is the whole point: backprop isn't a different algorithm at every depth, it's this one local computation, applied layer by layer, for as many layers as you have.

### Step 7 — apply the update

Gradient descent moves each parameter opposite its gradient, scaled by the learning rate: `param -= η * gradient`. See [Gradient Descent, Explained](/learn/ai-foundations/gradient-descent-explained) if the sign convention feels backward — you're always moving *away* from the direction that increases loss.

| Parameter | Old | Gradient | New (`old - 0.5*grad`) |
|---|---|---|---|
| w1 | 0.8000 | -0.0126 | 0.8063 |
| w2 | -0.5000 | -0.0063 | -0.4969 |
| b1 | 0.0000 | -0.0126 | 0.0063 |
| w3 | 0.6000 | -0.0572 | 0.6286 |
| b2 | 0.1000 | -0.0902 | 0.1451 |

> **Why this step?** All that arithmetic was only useful because it points *somewhere*. This is the moment the gradients actually change the network — everything before was measurement, this is the one line that's training.

### Step 8 — re-run the forward pass and check the loss actually dropped

```
h_in_new  = 0.8063*1.0 + (-0.4969)*0.5 + 0.0063 = 0.5642
h_out_new = sigmoid(0.5642) = 0.6374

o_in_new  = 0.6286*0.6374 + 0.1451 = 0.5458
o_out_new = sigmoid(0.5458) = 0.6332

L_new = 0.5 * (1 - 0.6332)^2 = 0.0673
```

Loss went from **0.0730 to 0.0673** — a drop of about 7.8%, from one step, on two neurons. It didn't jump to zero, and it shouldn't have: gradient descent takes a step proportional to the local slope, not a leap to the answer. That's the entire training loop — this same eight-step cycle, repeated thousands of times, batch after batch.

> **Why this step?** A gradient computation is a claim, not a proof. The only way to know the math was right — and that the learning rate wasn't so large it overshot — is to actually rerun the network and watch the number move the direction you predicted.

Check all of this yourself:

```python
import numpy as np

def sigmoid(z):
    return 1 / (1 + np.exp(-z))

def dsigmoid(a):          # a is the sigmoid OUTPUT, not the raw input
    return a * (1 - a)

x1, x2 = 1.0, 0.5
y = 1.0
w1, w2, b1 = 0.8, -0.5, 0.0
w3, b2     = 0.6, 0.1

# forward
h_in, h_out = w1*x1 + w2*x2 + b1, None
h_out = sigmoid(h_in)
o_in  = w3*h_out + b2
o_out = sigmoid(o_in)
loss  = 0.5 * (y - o_out) ** 2
print(f"h_out={h_out:.4f} o_out={o_out:.4f} loss={loss:.4f}")

# backward
dL_do_out = o_out - y
delta_o   = dL_do_out * dsigmoid(o_out)
dL_dw3, dL_db2 = delta_o * h_out, delta_o

dL_dh_out = delta_o * w3
delta_h   = dL_dh_out * dsigmoid(h_out)
dL_dw1, dL_dw2, dL_db1 = delta_h * x1, delta_h * x2, delta_h

# update
lr = 0.5
w1 -= lr * dL_dw1; w2 -= lr * dL_dw2; b1 -= lr * dL_db1
w3 -= lr * dL_dw3; b2 -= lr * dL_db2

# forward again
h_out_new = sigmoid(w1*x1 + w2*x2 + b1)
o_out_new = sigmoid(w3*h_out_new + b2)
print(f"new loss = {0.5*(y-o_out_new)**2:.4f}  (was {loss:.4f})")
```

## Where it breaks

Rerun this exact network — same inputs, same target, same output-layer weights (`w3=0.6, b2=0.1`) — but imagine the hidden neuron had drifted to much larger weights earlier in training: `w1=6.0, w2=0.0, b1=0.0`. This isn't exotic; it's what happens with large initial weights or unnormalized inputs.

```
h_in  = 6.0*1.0 + 0.0*0.5 + 0.0 = 6.0
h_out = sigmoid(6.0) = 0.9975     <- pinned near 1
o_in  = 0.6*0.9975 + 0.1 = 0.6985
o_out = sigmoid(0.6985) = 0.6679
L     = 0.5*(1 - 0.6679)^2 = 0.0552
```

Backward pass, same steps as before:

```
dL/do_out = 0.6679 - 1 = -0.3321
sigmoid'(o_in) = 0.6679*0.3321 = 0.2218
delta_o = -0.3321*0.2218 = -0.0737

dL/dh_out = delta_o*w3 = -0.0737*0.6 = -0.0442
sigmoid'(h_in) = 0.9975*0.0025 = 0.0025     <- collapsed
delta_h = -0.0442*0.0025 = -0.00011

dL/dw1 = delta_h*x1 = -0.00011
```

Compare `dL/dw1 = -0.00011` here to `dL/dw1 = -0.0126` in the healthy run — almost 100x smaller, even though the error reaching the output neuron (`dL/do_out ≈ -0.33`) is roughly the same size as before (`-0.38`). Nothing about the loss changed the story; the hidden neuron's own activation did. At `h_in=6.0`, `sigmoid` is pinned so close to 1 that its slope, `sigmoid'(h_in) = 0.0025`, is nearly flat. Apply the same learning rate and `w1` moves from `6.0` to `6.000055` — for all practical purposes, frozen — while `w3` (sitting behind a non-saturated neuron) updates normally. That asymmetry, not any single bad number, *is* the vanishing gradient problem: layers behind a saturated unit stop learning while layers after it keep going.

**The fix** is to look at what's actually being multiplied into the chain. `delta_h = dL/dh_out * (local activation slope)`. Hold the upstream error fixed at `-0.0442` and swap only the activation:

```
sigmoid: delta_h = -0.0442 * sigmoid'(6.0) = -0.0442 * 0.0025  = -0.00011
ReLU:    delta_h = -0.0442 * relu'(6.0)    = -0.0442 * 1.0     = -0.0442
```

```python
def relu(z):  return np.maximum(0, z)
def drelu(z): return (z > 0).astype(float)

print(sigmoid(6.0)*(1-sigmoid(6.0)))   # ~0.0025 — nearly flat
print(drelu(6.0))                       # 1.0 — flat, but at full height
```

Same network, same upstream error, ~400x more gradient signal reaching `w1` and `w2` — purely from the activation's derivative. `sigmoid` maxes out at slope `0.25` (at `z=0`) and decays toward zero the further a neuron drifts either direction; `ReLU` holds a constant slope of `1` for any positive input, no matter how large. That's the practical reason hidden layers in modern networks default to ReLU-family activations instead of sigmoid — see [Activation Functions Compared](/learn/ai-foundations/activation-functions-compared) for the fuller picture, including ReLU's own failure mode (dead neurons) when the input goes negative instead of large-positive.

## Takeaways

- **A weight's gradient is always "error at this neuron times the value that fed it forward."** That single formula, applied at every layer, is the entire content of backpropagation — depth just means applying it more times.
- **`delta` at a layer = (blame passed down from the next layer) × (local activation slope).** Passing blame backward through a connection weight (Step 4) is the literal mechanic behind the word "backpropagation."
- **One update rarely fixes the loss — it should just make it a little better.** Loss dropped 7.8% here; the same eight steps, repeated over batches, is what training actually is.
- **Vanishing gradients aren't a separate bug you bolt a fix onto — they're this same arithmetic, predictably, when an activation saturates.** A flat local slope multiplies into every gradient behind it, no matter how large the upstream error is.
- **Before trusting a gradient, rerun the forward pass.** The math can be internally consistent and still be wrong if a sign, a learning rate, or an activation choice doesn't do what you assumed.

**Related:** [Neural Network Forward Pass, By Hand](/learn/ai-foundations/neural-network-forward-pass-by-hand) · [Backpropagation, Explained](/learn/ai-foundations/backpropagation-explained) · [Gradient Descent in NumPy](/learn/ai-foundations/gradient-descent-in-numpy) · [Loss Functions: Worked Examples](/learn/ai-foundations/loss-functions-worked-examples) · [Activation Functions Compared](/learn/ai-foundations/activation-functions-compared) · [Training and Optimization Quiz](/learn/ai-foundations/training-and-optimization-quiz)
