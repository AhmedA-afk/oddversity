---
title: "Building a Neuron and a Layer in NumPy"
track: "ai-foundations"
status: live
summary: "An implementation walkthrough that turns the hand-computed neuron forward pass into ~15 lines of NumPy — a single neuron, then a vectorized layer via matrix multiply, then two laye"
duration: "6 min read"
---

You already did this arithmetic with a calculator. Now you'll write the twelve lines of NumPy that do it for you — and prove, number by number, that the code isn't hiding anything.

## What we're building

A `neuron()` function (dot product, add bias, apply activation), then a `layer()` function that does the same thing for a whole row of neurons at once using matrix multiplication instead of a loop, then a tiny `forward()` that chains two layers together. If you worked through [what-is-a-neural-network](/learn/ai-foundations/what-is-a-neural-network) and [neural-network-forward-pass-by-hand](/learn/ai-foundations/neural-network-forward-pass-by-hand), this is the payoff: every number the code prints will match a number you could get with pen and paper, so by the end you'll trust that "matrix multiply" isn't a different operation from "a bunch of neurons firing" — it's the exact same operation, just written so the CPU can do all of it in one instruction instead of one neuron at a time.

## Setup

You need Python 3.9+ and NumPy. Nothing else — no deep learning framework, no GPU. That's worth sitting with for a second: everything a neural network does at inference time is dot products, addition, and a nonlinear function applied elementwise. Frameworks like PyTorch exist to make training and hardware acceleration easier, not because the forward pass itself needs anything fancier than what we're about to write.

```bash
pip install numpy
python -c "import numpy as np; print(np.__version__)"
```

If you haven't spent time with array shapes and broadcasting yet, skim [numpy-arrays-fundamentals](/learn/python-data-apis/numpy-arrays-fundamentals) first — everything below leans on broadcasting rules to turn "one neuron" into "a whole batch" without changing a line of code.

## Build it

### 1. One neuron, three lines

A neuron takes an input vector, does a weighted sum, adds a bias, and squashes the result through an activation function. In NumPy, "weighted sum" is `np.dot`.

```python
import numpy as np

def sigmoid(z):
    return 1 / (1 + np.exp(-z))

def neuron(x, w, b, activation=sigmoid):
    z = np.dot(x, w) + b
    return activation(z)
```

That's the entire neuron. `np.dot(x, w)` multiplies each input by its matching weight and sums the results — the same sum-of-products you did by hand, just without writing out each term.

### 2. Check it against numbers you can verify yourself

Pick simple values so you can redo the arithmetic on paper in ten seconds:

```python
x = np.array([2.0, 3.0, -1.0])
w = np.array([0.5, -0.2, 0.1])
b = 0.3

print(neuron(x, w, b))
```

By hand: `(0.5)(2.0) + (-0.2)(3.0) + (0.1)(-1.0) = 1.0 - 0.6 - 0.1 = 0.3`. Add the bias: `0.3 + 0.3 = 0.6`. Run that through sigmoid — `1 / (1 + e^-0.6)` — and you get approximately `0.6457`. Run the code and you should see the same number (with more decimal places, since you rounded and NumPy didn't). If it doesn't match, the bug is almost certainly a swapped sign or a misaligned weight — not the concept.

### 3. Turn the weight vector into a weight matrix

One neuron is one weight vector. A **layer** of neurons is just several weight vectors stacked side by side into a matrix — one column per neuron. Multiplying the input by that whole matrix at once computes every neuron's weighted sum in a single operation:

```python
W1 = np.array([
    [0.5,  0.1, -0.3],
    [-0.2, 0.4,  0.2],
    [0.1, -0.5,  0.6],
])                                  # shape (3 inputs, 3 neurons)
b1 = np.array([0.3, -0.1, 0.05])    # one bias per neuron

def layer(X, W, b, activation=sigmoid):
    Z = X @ W + b
    return activation(Z)

a1 = layer(x, W1, b1)
print(a1)
```

Look at the first column of `W1`: `[0.5, -0.2, 0.1]`, with bias `0.3` — identical to the single neuron from step 2. So the first entry of `a1` should come out to that same `≈0.6457` you already verified. This is the whole trick of vectorization: `x @ W1` isn't a new kind of math, it's three dot products computed in parallel because you asked for three columns instead of one.

### 4. Add the batch dimension for free

The reason this matters in practice: the exact same code scores many inputs at once, no changes required. Give `layer()` a 2-D array instead of a 1-D one — rows are examples, columns are features — and broadcasting handles the rest:

```python
X = np.array([
    [2.0,  3.0, -1.0],
    [0.0,  1.0,  1.0],
    [-1.0, -1.0, 2.0],
    [1.5,  0.5,  0.5],
])   # shape (4 examples, 3 features)

a1_batch = layer(X, W1, b1)
print(a1_batch.shape)   # (4, 3)
print(a1_batch[0])      # matches a1 from step 3 — same input, same output
```

`X @ W1` produces a `(4, 3)` matrix, and NumPy broadcasts the `(3,)` bias across every row automatically. First row of `X` is the exact `x` from before, so the first row of `a1_batch` matches `a1` exactly — the model doesn't know or care whether it's processing one example or four thousand.

### 5. Chain layers by feeding output back in as input

A second layer is nothing more than another `layer()` call, using the first layer's output as its input:

```python
W2 = np.array([[0.8], [-0.6], [0.4]])   # shape (3 inputs, 1 output neuron)
b2 = np.array([0.2])

def forward(X, params, activation=sigmoid):
    A = X
    for W, b in params:
        A = layer(A, W, b, activation)
    return A

params = [(W1, b1), (W2, b2)]
output = forward(x, params)
print(output)
```

Trace it: `x` (3 numbers) goes through `layer(x, W1, b1)` to become `a1` (3 numbers, from step 3), which goes through `layer(a1, W2, b2)` to become one number. Working it by hand with the rounded `a1 ≈ [0.6457, 0.8581, 0.3657]` from before: `(0.6457)(0.8) + (0.8581)(-0.6) + (0.3657)(0.4) + 0.2 ≈ 0.348`, and `sigmoid(0.348) ≈ 0.586`. That's a "network" — two layers deep — and it's the same twelve lines from step 1, called twice in a loop.

### 6. Confirm the chain matches doing it manually, step by step

Trust but verify — run both paths and diff them:

```python
manual = layer(layer(x, W1, b1), W2, b2)
chained = forward(x, params)
print(np.allclose(manual, chained))   # True
```

`np.allclose` rather than `==` because floating-point arithmetic accumulates tiny rounding differences depending on operation order — never compare floats with exact equality.

## Run it

Run the script top to bottom. You should see: `neuron(x, w, b)` print a single float near `0.6457`; `layer(x, W1, b1)` print a length-3 array whose first entry matches that same float; `layer(X, W1, b1).shape` print `(4, 3)`; and `forward(x, params)` print a single-element array near `0.586`. If you run `forward(X, params)` (the full batch) instead of `forward(x, params)`, you should get shape `(4, 1)` — four predictions, one per row, computed by the identical code. Nothing here is a fabricated benchmark number — every value is something you can re-derive with the arithmetic shown above, and the point of running it yourself is watching the code reproduce a number you already trust.

## Harden it

**Mismatched shapes fail loudly — use that.** `np.dot` and `@` raise a `ValueError` the moment dimensions don't line up (`shapes (3,) and (2,) not aligned: 3 (dim 0) != 2 (dim 0)`), which is exactly what you want during development. Don't suppress it — wrap it with a clearer message instead:

```python
def neuron(x, w, b, activation=sigmoid):
    x, w = np.asarray(x, dtype=float), np.asarray(w, dtype=float)
    if x.shape != w.shape:
        raise ValueError(f"x and w must match: got {x.shape} and {w.shape}")
    return activation(np.dot(x, w) + b)
```

**Bias shape is a silent trap, not a loud one.** If you accidentally build the bias as a column vector instead of a flat array — an easy mistake if you're used to math notation, where a bias is often written as a column —broadcasting won't error, it'll just compute the wrong thing:

```python
b1_wrong = np.array([[0.3], [-0.1], [0.05]])   # shape (3, 1), not (3,)
z = x @ W1 + b1_wrong
print(z.shape)   # (3, 3) — no error, but this is not the layer output you wanted
```

NumPy pads `x @ W1`'s shape `(3,)` to `(1, 3)`, then broadcasts it against `(3, 1)` into a `(3, 3)` outer-sum — every raw score added to every bias, instead of each score getting its own matching bias. There's no exception to catch here; the only defense is asserting the shape you expect right after computing it (`assert z.shape == (3,)`), especially anywhere a bias comes from a config file or gets reshaped upstream.

**Sigmoid overflows quietly on large negative inputs.** Before training, weights are often randomly initialized and can produce a large `|z|`; `np.exp(-z)` for very negative `z` means `np.exp` of a very large positive number, which overflows to `inf` and prints a `RuntimeWarning` (the answer, `0.0`, is still correct — but the warning noise is a signal worth fixing):

```python
def sigmoid(z):
    z = np.asarray(z, dtype=float)
    return np.where(z >= 0, 1 / (1 + np.exp(-z)), np.exp(z) / (1 + np.exp(z)))
```

This computes `exp` of a non-positive number on both branches, so it never overflows, and it returns the identical values as the naive version for every well-behaved input — you can check that with `np.allclose` against the original.

**Watch integer dtypes.** Writing `w = np.array([1, -1, 0])` without decimal points gives you an `int64` array. Multiplying by a float `x` still promotes correctly, but if you ever assign back into that array in place (`w[0] = 0.5`), NumPy silently truncates it to `0`. Habit: call `np.asarray(arr, dtype=float)` on anything that came from outside your control.

## Extend it

Swap `sigmoid` for a ReLU hidden layer (`np.maximum(0, z)`) and keep sigmoid only on the output — a very common real pattern, and worth understanding why it's the default rather than sigmoid everywhere; [why-nonlinearity-matters](/learn/ai-foundations/why-nonlinearity-matters) and [activation-functions-compared](/learn/ai-foundations/activation-functions-compared) cover the tradeoffs. Try adding a third layer to `params` — nothing about `forward()` changes, which is the point: depth is just list length.

Every weight here was hand-picked to make the arithmetic checkable. A real network learns them instead — that's the natural next step, in [gradient-descent-in-numpy](/learn/ai-foundations/gradient-descent-in-numpy), and eventually [backprop-worked-example](/learn/ai-foundations/backprop-worked-example) once you want to see how those weight updates get computed. Once you're comfortable with both, [neural-networks-quiz](/learn/ai-foundations/neural-networks-quiz) is a solid check on whether the code and the concepts have actually connected for you.

**Related:** [what-is-a-neural-network](/learn/ai-foundations/what-is-a-neural-network) · [neural-network-forward-pass-by-hand](/learn/ai-foundations/neural-network-forward-pass-by-hand) · [why-nonlinearity-matters](/learn/ai-foundations/why-nonlinearity-matters) · [gradient-descent-in-numpy](/learn/ai-foundations/gradient-descent-in-numpy) · [backprop-worked-example](/learn/ai-foundations/backprop-worked-example) · [neural-networks-quiz](/learn/ai-foundations/neural-networks-quiz)
