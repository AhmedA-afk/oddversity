---
title: "A5 · Backpropagation from scratch"
track: "maths-foundations"
status: live
summary: "You will implement a two-layer neural network using only NumPy for its forward pass, backward pass, loss, and update."
duration: "8 min read"
---

## The short answer

You will implement a two-layer neural network using only NumPy for its forward pass, backward pass, loss, and update. The network is two trainable affine layers: `X→tanh→sigmoid`, trained with binary cross-entropy on a four-row XOR-like dataset. A passing lab has matching hand and finite-difference gradients, decreasing loss, explicit shapes, and a diagnosed saturated or non-smooth failure.

## Why this matters

Backpropagation is a chain of local derivatives plus accumulation. Writing it from scratch makes the graph, cached values, reduction factor, and parameter shapes inspectable. The point is not to compete with a framework; it is to know what a framework must be doing before trusting a training curve.

## Lab contract

Submit a NumPy-only implementation plus:

1. the problem statement in your own words;
2. a graph drawing and shape ledger;
3. forward and backward equations with one worked numerical row;
4. a finite-difference gradient check over every parameter array or a documented representative subset;
5. one saturated and one non-smooth diagnostic, with reset evidence;
6. acceptance-test output and a 150–300 word decision memo; and
7. the rubric items below.

Use `np.float64`, a fixed seed for any random experiment, and record `np.__version__`. Do not call an autodiff or neural-network library for the core calculation.

## Network, data, and notation

Use four binary inputs and XOR-like targets:

```python
X = np.array([[0., 0.],
              [0., 1.],
              [1., 0.],
              [1., 1.]], dtype=np.float64)       # (N=4, D=2)
Y = np.array([[0.], [1.], [1.], [0.]], dtype=np.float64)  # (4, 1)

W1 = np.array([[ 0.4, -0.2,  0.1],
               [ 0.3,  0.5, -0.4]], dtype=np.float64)     # (2, 3)
b1 = np.array([0.1, -0.2, 0.05], dtype=np.float64)        # (3,)
W2 = np.array([[ 0.2], [-0.3], [0.4]], dtype=np.float64)   # (3, 1)
b2 = np.array([0.1], dtype=np.float64)                    # (1,)
```

There are two affine layers, with `H=3` hidden units:

```text
X (N,D) → Z1=XW1+b1 (N,H) → A1=tanh(Z1) (N,H)
  → Z2=A1W2+b2 (N,1) → P=sigmoid(Z2) (N,1) → BCE mean (scalar)
```

Backward flow is:

```text
dL/dP → dL/dZ2 → dL/dW2, dL/db2, dL/dA1
      → dL/dZ1 → dL/dW1, dL/db1, dL/dX
```

## How it works

Use a numerically stable binary cross-entropy from logits:

```text
L = mean(max(Z2,0) − Y·Z2 + log(1+exp(−|Z2|))).
```

With `P=sigmoid(Z2)`, the combined BCE/sigmoid derivative is `dZ2=(P−Y)/N`. Then:

```text
dW2 = A1ᵀ dZ2             (H,1)
db2 = sum(dZ2, axis=0)     (1,)
dA1 = dZ2 W2ᵀ             (N,H)
dZ1 = dA1 ⊙ (1−A1²)       (N,H)
dW1 = Xᵀ dZ1              (D,H)
db1 = sum(dZ1, axis=0)     (H,)
dX  = dZ1 W1ᵀ             (N,D)
```

The `/N` in `dZ2` is the loss mean reduction. Omitting it produces a gradient that changes with batch size.

### One forward row to inspect

For `X[0]=[0,0]`, `Z1[0]=b1=[0.1,−0.2,0.05]`, so `A1[0]≈[0.099668,−0.197375,0.049958]`. Then `Z2[0]≈0.199130`, `P[0]≈0.549619`. Across the four rows, the initial mean loss is approximately `0.696964`. Show your own intermediate values rather than reporting only the final loss.

## Worked examples and variations

### Case A: ordinary forward/backward pass

**Input:** the provided moderate fixture. **Mechanism:** compute all cached arrays, then apply the equations in reverse graph order. **Output:** finite scalar loss and gradients with shapes matching `W1`, `b1`, `W2`, and `b2`. **Inspect:** print min/max of `Z1`, `A1`, `Z2`, and `P`. **Decision:** proceed to a gradient check only when shapes and finiteness pass.

### Case B: mean-reduction variation

**Input:** duplicate the four rows to make an eight-row batch. **Mechanism:** with the same examples and mean loss, `dZ2=(P−Y)/N` keeps the gradient scale approximately stable. **Output:** the loss is unchanged up to floating-point noise and the gradient is close to the original. **Inspect:** compare the sum-loss mutant, which doubles the gradient. **Decision:** keep the reduction explicit in code and memo.

### Boundary case: saturation

**Input:** set `b2=[40.]` and use `Y=np.ones_like(Y)`. **Mechanism:** `P≈1`, sigmoid output is saturated, and `P−Y≈0`. **Output:** tiny or zero backpropagated signal is expected; it is not automatically a coding bug. **Inspect:** logits, probabilities, and `max(abs(dZ2))` together. **Decision:** reset to the moderate fixture or reparameterise/initialise so the network receives useful signal.

### Counterexample: non-smooth hidden activation

**Input:** temporarily replace `tanh` with ReLU, set `b1=[0,0,0]`, and inspect the zero-input row. **Mechanism:** `Z1[0]=0`, where ReLU has no unique classical derivative; a backward implementation must choose a kink policy. **Output:** central differences and the chosen backward slope can disagree at that row. **Inspect:** one-sided perturbations and the activation mask. **Decision:** label the check `nondifferentiable`, move away from the kink, or restore tanh.

## Reference implementation shape

Implement functions with no hidden global mutation:

```python
def sigmoid(z):
    out = np.empty_like(z)
    positive = z >= 0
    out[positive] = 1.0 / (1.0 + np.exp(-z[positive]))
    ez = np.exp(z[~positive])
    out[~positive] = ez / (1.0 + ez)
    return out

def forward(params, X):
    W1, b1, W2, b2 = params
    Z1 = X @ W1 + b1
    A1 = np.tanh(Z1)
    Z2 = A1 @ W2 + b2
    P = sigmoid(Z2)
    cache = (X, W1, b1, W2, b2, Z1, A1, Z2, P)
    return P, cache

def loss_from_logits(Z2, Y):
    return np.mean(np.maximum(Z2, 0.0) - Y * Z2
                   + np.log1p(np.exp(-np.abs(Z2))))

def backward(Y, cache):
    X, W1, b1, W2, b2, Z1, A1, Z2, P = cache
    N = X.shape[0]
    dZ2 = (P - Y) / N
    dW2 = A1.T @ dZ2
    db2 = dZ2.sum(axis=0)
    dA1 = dZ2 @ W2.T
    dZ1 = dA1 * (1.0 - A1 * A1)
    dW1 = X.T @ dZ1
    db1 = dZ1.sum(axis=0)
    dX = dZ1 @ W1.T
    return (dW1, db1, dW2, db2), dX
```

Keep the parameter order fixed in `pack`/`unpack` helpers so a finite-difference test cannot silently perturb the wrong array. The loss function used by the checker must rebuild a fresh forward pass for every `+h` and `−h` perturbation.

## Hands-on

1. Implement `sigmoid`, stable BCE-from-logits, and the forward pass.
2. Print the graph's intermediate shapes and one row's numerical values.
3. Implement the backward equations without a framework gradient.
4. Run the finite-difference test on the moderate tanh fixture.
5. Train for a short deterministic run and plot or tabulate the loss trace.
6. Run the saturation fixture and the ReLU/kink fixture separately.
7. Restore the saved-good state and rerun all acceptance tests.

## Gradient test, failure, and reset

For each parameter coordinate, use:

```text
g_num[j] = [L(params+h·eⱼ) − L(params−h·eⱼ)]/(2h).
```

Use `h=1e-5` in `float64`, compare with symmetric relative error, and print the worst coordinate and parameter name. **Test:** require `max relative error < 1e-5` on the moderate tanh fixture and fail with the parameter name and coordinate when it does not pass.

**Deliberate saturated failure:** run the `b2=40`, all-positive-target fixture. The diagnostic must say `saturated-signal` when logits are extreme and `dZ2` is tiny; do not “fix” it by replacing the correct derivative with a large artificial gradient.

**Deliberate non-smooth failure:** run the ReLU/zero-bias fixture. The diagnostic must say `nondifferentiable-kink` when central and chosen backward slopes disagree at zero.

**Reset:** restore tanh, the original parameters, and the original `Y`; start a clean process, rerun the moderate gradient check, and confirm the same loss and error summary. Save the last known-good parameter fixture before each failure experiment.

## Acceptance tests

- [ ] Every parameter and intermediate has the declared shape.
- [ ] Forward loss and all gradients are finite on the moderate fixture.
- [ ] The initial loss is approximately `0.696964`.
- [ ] Finite-difference gradients pass `max symmetric relative error < 1e-5` away from kinks.
- [ ] A short deterministic run with `lr=0.5` lowers loss below the initial value; a 500-step reference run is around `0.018`.
- [ ] Saturated logits are detected and explained without being mislabeled as a sign bug.
- [ ] ReLU at zero is detected as non-smooth or uses a documented derivative convention.
- [ ] Reset reproduces the original loss and passing gradient check.
- [ ] The graph, equations, code, tests, and decision memo agree.

## Rubric

| Criterion | Weight | Full-credit evidence |
|---|---:|---|
| Mathematical model | 25% | correct two-layer graph, BCE/sigmoid and tanh derivation, reductions, shapes |
| Computation | 20% | clean NumPy forward/backward implementation with stable sigmoid and tests |
| Interpretation | 20% | loss/gradient behaviour connected to training and an AI decision |
| Diagnostics | 20% | gradient check, saturation and kink diagnoses, saved-good reset path |
| Communication | 15% | labelled graph/table/trace, readable code, 150–300 word limitation memo |

## Two ways to see it

### Builder view

Treat the network as a typed computational graph. Every edge has a shape, every node has a cached forward value, and every backward rule has a local derivative plus an accumulation/reduction rule.

### Systems or numerical view

A falling training loss can still reflect leakage, a bad target, or a model that fails outside four toy rows. Saturation and kinks are reminders that gradient magnitude is evidence about the local graph, not a complete health report.

## Checkpoint

- [ ] Draw the forward and reverse graph with all shapes.
- [ ] Derive `dZ2`, `dW2`, `db2`, `dZ1`, `dW1`, and `db1`.
- [ ] Show one row's forward values and the batch loss.
- [ ] Explain the `/N` reduction and what changes under a sum loss.
- [ ] Explain why saturation and a ReLU kink need different diagnostics.

## What this does not solve

This network is a teaching fixture, not evidence that an XOR-sized model is suitable for a real task. Passing gradient checks does not establish generalisation, calibration, fairness, robustness, or deployment readiness; those require data, evaluation, and system-level tests.

## Continue, go deeper, apply it

- Continue: Gradient checking and debugging
- Go deeper: Derivatives of affine layers and elementwise activations
- Apply it: Deep learning: loss, gradients, and optimisation
