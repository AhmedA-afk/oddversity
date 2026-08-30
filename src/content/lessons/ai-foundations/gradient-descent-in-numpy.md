---
title: "Fitting a Line With Gradient Descent in NumPy"
track: "ai-foundations"
status: live
summary: "A hands-on walkthrough that codes gradient descent from scratch to fit y = wx + b to noisy data — deriving both gradients by hand, watching the loss fall over 50 iterations, then c"
duration: "30 min read"
---

Every optimizer running inside a modern neural network — SGD, RMSProp, Adam — is doing exactly three things you're about to code by hand: measure how wrong you are, work out which direction reduces that wrongness, and take a step. Fitting a line is that whole loop with nothing hiding behind an abstraction, and it's small enough that you can watch it fail.

## What we're building

You'll generate a noisy scatter of points that secretly comes from a line, `y = wx + b`, then recover `w` and `b` using nothing but NumPy: a forward pass, a mean-squared-error loss, two gradients you derive yourself with the chain rule, and an update loop that runs 50 times while printing the loss so you can watch it shrink. This is the simplest possible instance of [supervised learning](/learn/ai-foundations/supervised-learning-explained) — you know the right answers (`y`), you have a hypothesis with tunable knobs (`w`, `b`), and you adjust the knobs to make your predictions match. Then you'll set the learning rate 100x too high and run the identical loop again, so you can see divergence happen on your own screen instead of just being told it exists.

No `sklearn`, no autograd, no hidden `.backward()`. Every number that moves, moves because you wrote the line that moves it.

## Setup

You need Python 3.9+ and NumPy. Nothing else is required for the core exercise; a plotting library is optional if you want to visualize the fit later.

```bash
pip install numpy
```

Optionally, for the plots in "Extend it":

```bash
pip install matplotlib
```

Every snippet below builds on the ones before it — run them in order, in a script or a notebook, and by the end you'll have one working file. If you've worked through [NumPy arrays fundamentals](/learn/python-data-apis/numpy-arrays-fundamentals), the vectorized operations here (`x * w`, `np.sum(error * x)`) will look familiar — this is exactly why people reach for arrays instead of Python loops.

## Build it

### 1. Generate noisy data from a known line

```python
import numpy as np

rng = np.random.default_rng(seed=42)

n_samples = 200
true_w, true_b = 2.5, -1.0

x = rng.uniform(-5, 5, size=n_samples)
noise = rng.normal(loc=0.0, scale=1.0, size=n_samples)
y = true_w * x + true_b + noise
```

We pick `true_w` and `true_b` ourselves on purpose. In a real problem you'd never know the "true" relationship — that's the whole reason you're fitting a model. But baking the answer into the toy problem means that at the end you can literally compare what gradient descent found against what's actually in the data, instead of just trusting that a falling loss number means something.

### 2. Write the forward pass and the loss

```python
def predict(x, w, b):
    return w * x + b

def mse_loss(y_pred, y_true):
    return np.mean((y_pred - y_true) ** 2)
```

`predict` is the entire model — one multiply, one add. `mse_loss` is what turns "how wrong are we" into a single number you can minimize. Mean squared error isn't the only choice (see [loss functions, explained](/learn/ai-foundations/loss-functions-explained) for the alternatives and why you'd pick one over another), but it's the natural one here: it's differentiable everywhere, and squaring means a prediction that's off by 10 hurts a lot more than one that's off by 1, which is usually what you want.

### 3. Derive the two gradients by hand

This is the part most tutorials skip by calling `.grad` on something. You're not going to skip it.

The loss as a function of the parameters is:

```
L(w, b) = (1/n) * Σ (w·x_i + b - y_i)²
```

Let `error_i = w·x_i + b - y_i` (the signed prediction error for point `i`). Differentiate with respect to each parameter using the chain rule — the outer derivative of `error²` is `2·error`, times the inner derivative with respect to `w` (which is `x_i`) or `b` (which is `1`):

```
∂L/∂w = (1/n) * Σ 2·error_i·x_i = (2/n) * Σ error_i·x_i
∂L/∂b = (1/n) * Σ 2·error_i      = (2/n) * Σ error_i
```

That's it — that's the derivation. In code:

```python
def gradients(x, y_true, y_pred):
    n = x.shape[0]
    error = y_pred - y_true
    dw = (2.0 / n) * np.sum(error * x)
    db = (2.0 / n) * np.sum(error)
    return dw, db
```

Notice the shape of this: for every parameter, the gradient is "average the error, weighted by how much that parameter influenced the prediction." `w` scales `x`, so its gradient gets weighted by `x`. `b` just gets added, so its gradient is the plain average error. This exact pattern — local error times local sensitivity, summed up — is the chain rule doing its job, and it's the same rule that computes gradients for a network with a hundred layers instead of one multiply. [Backpropagation](/learn/ai-foundations/backpropagation-explained) is this calculation applied repeatedly, layer by layer; you're doing the one-layer, no-activation special case.

### 4. Initialize parameters and pick a learning rate

```python
w, b = 0.0, 0.0
learning_rate = 0.01
n_iterations = 50
```

Starting both parameters at exactly zero is fine here, which is worth pausing on. In a real [neural network](/learn/ai-foundations/what-is-a-neural-network) with multiple neurons per layer, zero-initializing every weight would make every neuron compute the same thing and receive the same gradient forever — they'd never differentiate from each other. That failure mode needs symmetry to break, and symmetry needs more than one unit. With a single line, there's no symmetry to break, so zero is a perfectly good starting point.

`learning_rate` is the one number in this whole exercise doing the most work, and it's the knob you're about to turn too far.

### 5. Write the training loop and watch the loss fall

```python
w, b = 0.0, 0.0
learning_rate = 0.01
n_iterations = 50

for i in range(n_iterations):
    y_pred = predict(x, w, b)
    loss = mse_loss(y_pred, y)
    dw, db = gradients(x, y, y_pred)

    w -= learning_rate * dw
    b -= learning_rate * db

    if i % 5 == 0 or i == n_iterations - 1:
        print(f"iter {i:2d} | loss {loss:8.4f} | w {w:6.3f} | b {b:6.3f}")

print(f"\nlearned: w={w:.3f}, b={b:.3f}   (true: w={true_w}, b={true_b})")
```

Read the four lines inside the loop as a sentence: predict, measure, differentiate, step. Everything above this loop was setup; this is the algorithm. Each iteration nudges `w` and `b` a little further downhill on the loss surface, and because MSE for a linear model is a smooth bowl-shaped (convex) function with a single minimum, "downhill, repeatedly, with a small enough step" is guaranteed to get there. That guarantee is specific to this problem — see [gradient descent, explained](/learn/ai-foundations/gradient-descent-explained) for why the same loop on a lumpier loss surface (which is what you get with real networks) doesn't come with that guarantee.

### 6. Break it on purpose: set the learning rate 100x too high

Change exactly one number and rerun the identical loop:

```python
w, b = 0.0, 0.0
learning_rate = 0.01 * 100   # 1.0 — 100x what we just used
n_iterations = 50

for i in range(n_iterations):
    y_pred = predict(x, w, b)
    loss = mse_loss(y_pred, y)
    dw, db = gradients(x, y, y_pred)

    w -= learning_rate * dw
    b -= learning_rate * db

    if i % 5 == 0 or i == n_iterations - 1:
        print(f"iter {i:2d} | loss {loss:15.4f} | w {w:12.3f} | b {b:12.3f}")
```

Same four lines, same data, same starting point. The only difference is the size of the step.

> **Why 100x breaks it, and why "100x" is the wrong way to think about the boundary.** For `x` drawn uniformly from -5 to 5, `Var(x) = (10)²/12 ≈ 8.33`, and since `x` is centered near zero, `E[x²] ≈ 8.33` too. The curvature of the loss bowl along the `w` axis works out to roughly `2·E[x²] ≈ 16.7`. Gradient descent on a bowl with curvature `k` stays stable only while `learning_rate < 2/k` — here, roughly `0.12`. Our original `0.01` sits comfortably inside that. `1.0` is about 8x past the edge of stability, not 100x — the "100x" was 100x *our chosen rate*, which happened to have a lot of headroom underneath it. What actually matters is the ratio between your step size and the steepness of the surface you're stepping on, and that steepness is set by the scale of your data (bigger `x` values mean a steeper, less forgiving bowl), not by any property of the learning rate in isolation.

## Run it

Run the stable version (step 5) first. At `iter 0`, before any update has happened, `w = b = 0`, so every prediction is exactly `0` — the printed loss at that point is nothing but `mean(y**2)`, the raw scale of your targets. There's no fitting yet, just a baseline measurement of "how far is a flat zero line from this data." From there the loss should fall every single iteration — no bumps, no plateaus that reverse — because you're descending a convex bowl with a safe step size.

Watch `w` and `b` separately, though, not just the loss. `w`'s gradient direction is steep (curvature ~16.7, from the derivation above), so it should converge quickly, landing close to `2.5` well before iteration 50. `b`'s direction is much shallower (curvature 2), so it converges more slowly — at iteration 50 it will likely still be visibly short of `-1.0`, still closing the gap. That asymmetry isn't a bug in the code; it's the loss surface being an elongated ellipse rather than a circular bowl, steeper in one direction than the other. It's also exactly the kind of problem that motivates per-parameter learning rates in optimizers like Adam, which you'll meet properly if you continue into [backpropagation](/learn/ai-foundations/backpropagation-explained).

Now run the broken version (step 6). The loss will not fall. It will climb, and it will climb fast — each printed checkpoint should be dramatically bigger than the last, not smaller. Depending on the exact numbers your run produces, you may see it overflow to `inf` or curdle into `nan` before all 50 iterations finish; NumPy may also print a `RuntimeWarning: overflow encountered` to your terminal along the way. That warning is not a bug — it's NumPy accurately reporting that a float64 ran out of room, which is what unbounded exponential growth eventually does. What's happening geometrically: a step size past the stability boundary doesn't just fail to reach the bottom of the bowl, it overshoots to the *opposite wall*, farther out than where it started. The next gradient there is even larger, so the next step overshoots even further. There's no floor to this — it compounds every iteration, which is why "too high" doesn't mean "slower to converge," it means "actively getting worse, forever."

## Harden it

The toy loop works because the data is clean and the caller (you) already knows the right learning rate. Real inputs won't cooperate. Wrap the loop in something that checks its assumptions and fails loudly instead of quietly printing garbage:

```python
def fit_line(x, y, learning_rate=0.01, n_iterations=50, tol=1e-10, verbose=False):
    x = np.asarray(x, dtype=np.float64)
    y = np.asarray(y, dtype=np.float64)

    if x.shape != y.shape:
        raise ValueError(f"x and y must have the same shape, got {x.shape} and {y.shape}")
    if x.size == 0:
        raise ValueError("x and y must contain at least one point")
    if not (np.isfinite(x).all() and np.isfinite(y).all()):
        raise ValueError("x and y must not contain NaN or inf")
    if learning_rate <= 0:
        raise ValueError(f"learning_rate must be positive, got {learning_rate}")

    w, b = 0.0, 0.0
    prev_loss = np.inf
    history = []

    for i in range(n_iterations):
        y_pred = predict(x, w, b)
        loss = mse_loss(y_pred, y)

        if not np.isfinite(loss):
            raise FloatingPointError(
                f"loss diverged to {loss} at iteration {i} — learning_rate "
                f"{learning_rate} is too high for this data's scale"
            )

        history.append(loss)
        if verbose and (i % 5 == 0 or i == n_iterations - 1):
            print(f"iter {i:2d} | loss {loss:.6f}")

        if abs(prev_loss - loss) < tol:
            break
        prev_loss = loss

        dw, db = gradients(x, y, y_pred)
        w -= learning_rate * dw
        b -= learning_rate * db

    return w, b, history
```

Three things this buys you over the raw loop:

- **It stops instead of lying.** The raw loop happily prints `nan` forty times in a row. This one raises the moment the loss stops being a real number, with a message that tells you which knob to check first.
- **It stops early when it's done.** If the loss stops improving by more than `tol`, further iterations are wasted compute — this returns early instead of running all 50 regardless.
- **It validates shape and finiteness up front**, which catches the two most common real-world bugs before they masquerade as a training problem: mismatched arrays, and a stray `NaN` that snuck into your data pipeline.

There's a subtler fix worth calling out, because it addresses the actual root cause of the divergence you triggered above, not just its symptom: **feature scaling**. The reason `x` ranging from -5 to 5 could only tolerate a learning rate below roughly `0.12` is that the loss curvature scales with `E[x²]` — bigger `x` values make the bowl steeper and less forgiving of a large step. If you standardize `x` before fitting:

```python
x_mean, x_std = x.mean(), x.std()
x_scaled = (x - x_mean) / x_std
```

`E[x_scaled²] ≈ 1`, which pushes the stability boundary much higher — you can use a larger, more aggressive learning rate on the same underlying data, purely by changing its scale. (If you fit on `x_scaled`, remember to convert back: `w_original = w_scaled / x_std` and `b_original = b_scaled - w_scaled * x_mean / x_std`.) This is why "normalize your inputs" is standard advice everywhere from linear regression to training large networks — it isn't cosmetic, it directly controls how large a step you're allowed to take.

## Extend it

**Vectorize it for more than one feature.** The bias trick turns `w` and `b` into a single vector, and the two-line update generalizes to any number of input features without changing shape:

```python
X = np.column_stack([x, np.ones_like(x)])   # shape (n, 2)
theta = np.zeros(2)                          # [w, b]
learning_rate = 0.01

for i in range(50):
    y_pred = X @ theta
    error = y_pred - y
    grad = (2.0 / len(y)) * (X.T @ error)
    theta -= learning_rate * grad
```

This is the same algorithm, but it's now the shape of the update rule for an actual linear layer inside a neural net (see [building a neuron in NumPy](/learn/ai-foundations/building-a-neuron-in-numpy) for the next step, which adds an activation function on top).

**Check your answer against a closed-form solution.** Linear regression has an exact solution — you don't strictly need gradient descent for this particular problem, only for problems where a closed form doesn't exist (which is most of deep learning). Use it as a correctness check on your implementation:

```python
theta_exact, *_ = np.linalg.lstsq(X, y, rcond=None)
print(theta_exact)   # should land close to your gradient-descent theta
```

**Fix the conditioning problem you saw in "Run it."** `w` converged faster than `b` because the loss bowl is an ellipse, not a circle. Two standard fixes: scale your features (above), or give momentum to the optimizer so it builds speed in the shallow direction instead of crawling — this is the actual origin story of Adam and friends, and it's worth building a plain-momentum version by hand once before trusting a library's.

**Switch from full-batch to mini-batch.** Right now every update looks at all 200 points. Try recomputing the gradient from a random subsample of, say, 20 points each iteration instead of all of them — you'll trade a smoother loss curve for far cheaper updates, which is the exact trade every large-scale training run makes.

**Plot it.** With `matplotlib`, plot `history` from `fit_line` on a log y-axis for both the stable and the diverging runs — the stable one looks like a decaying curve, the diverging one looks like a hockey stick (or a straight line, once you're on a log scale and it's growing exponentially). Then scatter `x, y` with the fitted line drawn through it, so "the loss went down" turns into a picture of a line actually landing on the data.

**Related:** [Gradient descent, explained](/learn/ai-foundations/gradient-descent-explained) · [Loss functions, explained](/learn/ai-foundations/loss-functions-explained) · [Backpropagation, explained](/learn/ai-foundations/backpropagation-explained) · [Building a neuron in NumPy](/learn/ai-foundations/building-a-neuron-in-numpy) · [What is a neural network?](/learn/ai-foundations/what-is-a-neural-network) · [NumPy arrays fundamentals](/learn/python-data-apis/numpy-arrays-fundamentals)
