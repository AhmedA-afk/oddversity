---
title: "Sweeping Model Complexity"
track: "ai-foundations"
status: live
summary: "A worked example that sweeps polynomial degree on one dataset, tabulates train vs. validation error to reveal the classical U-shaped curve and its sweet spot, then pushes complexit"
duration: "20 min read"
---

A model isn't "good" or "bad" in the abstract — it's good or bad *at a given complexity setting*, and that setting is a dial you control directly: polynomial degree, tree depth, hidden units, number of layers. [Bias-variance tradeoff](/learn/ai-foundations/bias-variance-tradeoff) explains why turning that dial trades one kind of error for another. This lesson turns it, on one real dataset, step by step — past the point where the classical story says things should only get worse.

## The setup

The task: fit a curve to 15 noisy points and predict 15 held-out points from the same distribution. The true function is `sin(2πx)` on `[0, 1]`; you never get to see it, only noisy samples of it. This is regression — see [classification vs. regression](/learn/ai-foundations/classification-vs-regression) if you want that distinction spelled out — but nothing here depends on that; the same sweep works for a classifier's decision boundary or a tree's depth.

The complexity knob is the degree of the polynomial you fit. Degree 0 is a flat line (just the mean of `y` — the least expressive model possible). Degree 14 has exactly as many coefficients (15) as you have training points, which means it can pass through every single one of them exactly, noise included. That number, 15, matters twice in this lesson: once as the point where classical theory says error is at its worst, and once as the point where the modern twist starts.

```python
import numpy as np

rng = np.random.default_rng(seed=0)
true_fn = lambda x: np.sin(2 * np.pi * x)

n_train, n_val = 15, 15
x_train = rng.uniform(0, 1, n_train)
y_train = true_fn(x_train) + rng.normal(0, 0.2, n_train)

x_val = rng.uniform(0, 1, n_val)
y_val = true_fn(x_val) + rng.normal(0, 0.2, n_val)

def mse(pred, target):
    return np.mean((pred - target) ** 2)
```

`x_train`/`y_train` and `x_val`/`y_val` are separate draws from the same distribution — not a split of one array. That distinction matters for what comes next.

## Step by step

### Step 1 — Fit at every degree, record both errors at once

```python
results = []
for degree in range(0, n_train):          # 0 .. 14
    coeffs = np.polyfit(x_train, y_train, degree)
    train_mse = mse(np.polyval(coeffs, x_train), y_train)
    val_mse = mse(np.polyval(coeffs, x_val), y_val)
    results.append((degree, train_mse, val_mse))
```

> **Why this step?** A validation number on its own tells you almost nothing — is it bad because the model is too weak, or too strong? You only find out by comparing it to the *train* number at that same degree. That comparison is the whole mechanism [bias-variance tradeoff](/learn/ai-foundations/bias-variance-tradeoff) describes; this loop is where you actually generate the numbers it's talking about.

### Step 2 — Read the table

Run it, and you get a table shaped like this one (your exact digits will differ with the seed and noise draw — the shape is what reproduces, not the decimals):

| degree | train MSE | val MSE | note |
|---|---|---|---|
| 0 | 0.52 | 0.61 | flat line, can't bend at all |
| 1 | 0.31 | 0.35 | still nearly flat |
| 2 | 0.10 | 0.14 | starting to curve the right way |
| 3 | 0.04 | 0.07 | **sweet spot** |
| 4 | 0.035 | 0.09 | val starts creeping back up |
| 6 | 0.02 | 0.18 | |
| 8 | 0.012 | 0.33 | |
| 10 | 0.006 | 0.55 | |
| 12 | 0.002 | 0.95 | |
| 14 | ~0.00 | 1.6 | exact interpolation — fits every training point, noise included |

Notice the train column only ever goes down. That's not a property of this particular noise draw — it's guaranteed. A degree-3 polynomial is a degree-4 polynomial with a zero leading coefficient, so every hypothesis class here is a superset of the last one; more capacity can never make the *training* fit worse, only equal or better. Train error is a monotone liar: it will always vote for the most complex model on the list, right up to the one that has memorized the noise.

The val column is the interesting one — down, then up. That's the U. The bottom of it, degree 3, is where the model is expressive enough to catch the curve of `sin(2πx)` but not yet expressive enough to start fitting this particular noise draw instead.

> **Why this step?** [Train/validation/test splits](/learn/ai-foundations/train-validation-test-splits) explains why you hold out data at all; this table is that idea with numbers in it. If you only ever looked at the train column, you'd walk straight to degree 14 and call it your best model — right when it's actually memorizing.

### Step 3 — Pick the sweet spot with code, not eyeballing

```python
degrees, train_mses, val_mses = zip(*results)
best_degree = degrees[int(np.argmin(val_mses))]
print(f"best degree by validation error: {best_degree}")
```

> **Why this step?** "Lowest validation error" is a selection rule you can automate; "the point where the curve looks like it turns" is not. `argmin` over held-out error is what model selection actually is, underneath every fancier version of it (cross-validation, early stopping, hyperparameter search) — this line is the primitive they're all built from.

### Step 4 — Confirm the shape visually

```python
import matplotlib.pyplot as plt

plt.plot(degrees, train_mses, marker="o", label="train MSE")
plt.plot(degrees, val_mses, marker="o", label="val MSE")
plt.axvline(best_degree, linestyle="--", color="gray")
plt.xlabel("polynomial degree")
plt.ylabel("MSE")
plt.legend()
plt.show()
```

> **Why this step?** A table of numbers can hide a shape your eye would catch in a second — a val curve that dips, flattens, then creeps up unevenly still reads as "noisy numbers" in a table but reads as an obvious U on a plot. For the same idea approached from the picture first, see [overfitting, visually](/learn/ai-foundations/overfitting-visual-intuition).

## Where it breaks

Degree 14 wasn't the end of the dial — it's just where the training set runs out of points to constrain the fit. Nothing stops you from asking for a degree-20 or degree-30 polynomial. Try it:

```python
for degree in range(15, 31):
    coeffs = np.polyfit(x_train, y_train, degree)
    val_mse = mse(np.polyval(coeffs, x_val), y_val)
    print(degree, val_mse)
```

Two things go wrong at once here. First, numpy tells you directly:

```
RankWarning: Polyfit may be poorly conditioned
```

Once you ask for more coefficients than you have points, the system is underdetermined — infinitely many polynomials fit the 15 training points exactly, and `polyfit` has to pick one (it quietly falls back to a least-squares solver that returns the minimum-norm answer among them). Second, and more subtly, even *before* you cross that line, the columns of a raw monomial fit — `x`, `x²`, `x³`, … `x¹³`, `x¹⁴` — are all small, smooth, and increasingly hard to tell apart for `x` between 0 and 1. That near-collinearity makes the fit numerically unstable well before the degree count alone would explain it. The upshot: val error doesn't just get worse past degree 15, it gets *erratic* — a run might show 2, then 40, then 300, then something in the thousands, sometimes even `inf` or `nan`, and the exact pattern changes between runs of the same code.

It's tempting to read that as confirmation of the obvious story: more complexity than data is always catastrophic, full stop. That reading is only half right — you're actually watching a real statistical effect (near the interpolation point, tiny amounts of noise get amplified into huge swings in the fitted curve) get tangled up with a numerical artifact (the monomial basis itself falling apart at this range). To see the statistical effect on its own, you need a basis that doesn't break first.

**The fix** — switch to Legendre polynomials, which stay bounded between −1 and 1 on their domain and are far better conditioned at high degree, and solve explicitly with `lstsq` (which handles the underdetermined case cleanly, no warnings) instead of `polyfit`:

```python
from numpy.polynomial import legendre as L

def to_domain(x):
    return 2 * x - 1  # Legendre polynomials are well-conditioned on [-1, 1]

def legendre_fit_predict(x_fit, y_fit, x_eval, degree):
    V_fit = L.legvander(to_domain(x_fit), degree)
    coeffs, *_ = np.linalg.lstsq(V_fit, y_fit, rcond=None)  # min-norm solution when underdetermined
    V_eval = L.legvander(to_domain(x_eval), degree)
    return V_eval @ coeffs

results2 = []
for degree in range(0, 41):
    train_pred = legendre_fit_predict(x_train, y_train, x_train, degree)
    val_pred = legendre_fit_predict(x_train, y_train, x_val, degree)
    results2.append((degree, mse(train_pred, y_train), mse(val_pred, y_val)))
```

Now push the sweep well past 14, and a different shape emerges — again, illustrative digits, real shape:

| degree | val MSE | note |
|---|---|---|
| 14 | 1.6 | same interpolation peak as before |
| 18 | 0.9 | past the peak, error is falling |
| 24 | 0.4 | |
| 32 | 0.2 | |
| 40 | 0.12 | still descending — short of the degree-3 sweet spot's 0.07, but clearly heading back down |

Error rises to a peak right around the interpolation threshold — exactly what classical theory predicts — and then, instead of climbing forever, it turns and falls again as you keep adding capacity past that point. That's **double descent**: a second downward slope in the over-parameterized regime, where the model has more free parameters than training examples. It doesn't always fall back below your original sweet spot (it didn't quite here, with only 15 noisy points and a fixed, deterministic basis — the effect shows up more cleanly with more data or randomized features), but the direction is real and reproducible, not a fluke of this dataset.

This is also where "sweep model complexity, watch for a U" stops being the whole story, and where a second, related surprise lives: hold capacity fixed and instead keep *training* past the point where train accuracy has been perfect for a long time, and validation accuracy can suddenly jump — a phenomenon called grokking. Different knob (time instead of parameters), same broken intuition ("it already memorized everything, so it can't still be improving"). The mechanism behind both — why over-parameterized and long-trained models don't just keep overfitting the way classical theory says they should — is covered in depth at [grokking and double descent](/learn/llm-foundations/grokking-and-double-descent); this lesson only had room to show you the shape.

## Takeaways

- The sweep-and-tabulate pattern from Steps 1–3 *is* model selection: fit at every complexity setting, log train and validation error side by side, take `argmin` over validation. Everything fancier (cross-validation, early stopping, hyperparameter search) is this primitive with more bookkeeping.
- Train error alone can't select a model — it's mathematically guaranteed to prefer the most complex option on your list, because more capacity never makes a nested hypothesis class fit its own training data worse.
- The interpolation threshold (parameters ≈ training examples) isn't a permanent wall. It's the worst point in the classical picture, but push capacity further and, at least in principle, error can fall again — treat "it's clearly overfit, look how many parameters it has" as a hypothesis to check against held-out numbers, not a verdict you can read off the parameter count.
- The numerical breakdown (`RankWarning`, exploding val error with the raw monomial basis) and the statistical double descent effect are two different things that happen to show up in the same range of the sweep. Don't let a warning message make you conclude more about "overfitting" than it's actually telling you.
- [Regularization](/learn/ai-foundations/regularization-techniques) is the other way to move along this same curve without touching the raw parameter count — it's often a cheaper knob to turn than architecture size once you know roughly where your sweet spot lives.

**Related:** [Bias-variance tradeoff](/learn/ai-foundations/bias-variance-tradeoff) · [Overfitting, visually](/learn/ai-foundations/overfitting-visual-intuition) · [Regularization techniques](/learn/ai-foundations/regularization-techniques) · [Data splits and leakage, worked](/learn/ai-foundations/data-splits-and-leakage-worked-example) · [Grokking and double descent](/learn/llm-foundations/grokking-and-double-descent) · [Generalization quiz](/learn/ai-foundations/generalization-quiz)
