---
title: "Supervised Learning, Worked by Hand"
track: "ai-foundations"
status: live
summary: "A hand-computed walkthrough of one full supervised learning cycle on 5 labeled emails and 3 features — forward pass, loss, gradient, weight update, and the same trained output read"
duration: "25 min read"
---

Every explanation of supervised learning eventually says some version of "the model adjusts its weights to reduce error." Here's what that sentence looks like as arithmetic you can check by hand: five emails, three features, one gradient descent step, and every number that moves along the way — including the numbers that get worse before you find the setting that makes them better.

## The setup

If you want the concept first, [Supervised Learning, Explained](/learn/ai-foundations/supervised-learning-explained) covers what training data, labels, and the training loop mean. This page assumes you have that and goes straight to the numbers.

Five emails, three features you'd extract from the raw text, and a human-assigned label:

| # | Email (shortened) | `!` count (x1) | has "free" (x2) | # links (x3) | label y (spam=1) |
|---|---|---|---|---|---|
| 1 | "WIN FREE MONEY NOW!!!" | 3 | 1 | 1 | 1 |
| 2 | "Hey, lunch tomorrow at noon?" | 0 | 0 | 0 | 0 |
| 3 | "FREE gift inside, click here or here" | 0 | 1 | 2 | 1 |
| 4 | "Quarterly report attached, one link to the shared doc" | 0 | 0 | 1 | 0 |
| 5 | "Congratulations!!! You've been selected, claim your prize" | 3 | 0 | 1 | 1 |

Notice rows 4 and 5 are the hard cases: row 4 has a link but isn't spam, row 5 has no "free" but is spam. No single feature separates this dataset — the model has to actually weigh three signals against each other, which is the whole point of a worked example instead of a toy with one feature.

The model is the simplest thing that can combine three numbers into one:

```
ŷ = w1·x1 + w2·x2 + w3·x3 + b
```

A weighted sum, nothing else — no activation function yet. Real spam filters usually pass this sum through a sigmoid to get a valid 0–1 probability (that's logistic regression); this page leaves the sigmoid out so every number below is exact, ordinary arithmetic, and puts it back at the end where it matters.

Starting weights: `w = (0.1, 0.1, 0.1)`, `b = 0`. These are picked only because they make the numbers below easy to follow — real training starts from small random values instead.

## Step by step

### 1. Features are already numbers

The middle three columns of the table above are your feature matrix `X`; the last column is `y`. This step is usually the hardest part of a real project (deciding what to count, how to normalize it, how to handle text a regex can't parse cleanly) and it's already done here — which is itself worth noticing: once you have `X` and `y`, everything from here on is the same fixed procedure no matter what the features meant.

### 2. Make a first guess (the forward pass)

Plug each row into `ŷ = 0.1·x1 + 0.1·x2 + 0.1·x3 + 0`. For row 1: `0.1(3) + 0.1(1) + 0.1(1) = 0.5`. Doing that for all five rows:

| email | ŷ (initial) | y | error = y − ŷ |
|---|---|---|---|
| 1 | 0.5 | 1 | 0.5 |
| 2 | 0.0 | 0 | 0.0 |
| 3 | 0.3 | 1 | 0.7 |
| 4 | 0.1 | 0 | −0.1 |
| 5 | 0.4 | 1 | 0.6 |

> **Why this step?** The forward pass is the model's entire external behavior — everything else in this page (loss, gradients) exists purely as machinery to improve what this one function outputs. If you froze the weights right here and shipped it, this table is exactly what your users would get.

### 3. Measure how wrong, as one number (loss)

"Error" above is per-row and signed — useful for reading, useless for optimizing, because you need one number to push down, not five. Squash the five errors into a single loss:

```
L = (1 / 2n) · Σ (ŷᵢ − yᵢ)²  =  (0.5² + 0² + 0.7² + (−0.1)² + 0.6²) / 10  =  1.11 / 10  =  0.111
```

The `1/2` is a standard convention (see [Loss Functions, Explained](/learn/ai-foundations/loss-functions-explained) for why squared error is one of several reasonable choices) — it exists purely so the derivative in the next step doesn't carry a stray factor of 2. It changes nothing about what the model learns.

> **Why this step?** "Error" and "loss" get used interchangeably in conversation, but the optimizer only ever sees the scalar `L = 0.111`. It has no idea row 3 was off by 0.7 and row 4 was only off by 0.1 — it just knows the single number it's trying to shrink. Keeping that distinction straight matters the moment you start debugging a model that's "learning" in aggregate while getting specific cases wrong.

### 4. Work out which way to nudge each weight (the gradient)

Define `δᵢ = ŷᵢ − yᵢ` (prediction minus label — same numbers as the error column, sign flipped, because that's the sign the calculus produces):

| email | δ = ŷ − y | x1 | x2 | x3 |
|---|---|---|---|---|
| 1 | −0.5 | 3 | 1 | 1 |
| 2 | 0.0 | 0 | 0 | 0 |
| 3 | −0.7 | 0 | 1 | 2 |
| 4 | 0.1 | 0 | 0 | 1 |
| 5 | −0.6 | 3 | 0 | 1 |

The gradient for each weight is the average, across all five emails, of `δᵢ × (that weight's feature value)` — this is one step of *batch* gradient descent, updating once after seeing all five rows rather than after each one individually:

```
grad_w1 = (−0.5·3 + 0·0 + −0.7·0 + 0.1·0 + −0.6·3) / 5 = −3.3 / 5 = −0.66
grad_w2 = (−0.5·1 + 0·0 + −0.7·1 + 0.1·0 + −0.6·0) / 5 = −1.2 / 5 = −0.24
grad_w3 = (−0.5·1 + 0·0 + −0.7·2 + 0.1·1 + −0.6·1) / 5 = −2.4 / 5 = −0.48
grad_b  = (−0.5 + 0 − 0.7 + 0.1 − 0.6) / 5             = −1.7 / 5 = −0.34
```

> **Why this step?** A weight's gradient is basically "how correlated is this feature with how wrong I was." `w1`'s gradient is large and negative because the biggest exclamation counts (rows 1 and 5) both belong to under-predicted spam — the model is being told, forcefully, to weight `x1` up. But look at the magnitudes: `grad_w1 = −0.66` is nearly three times `grad_w2 = −0.24`, and that's not because exclamation marks are three times more informative than the word "free" — it's partly because `x1` ranges 0–3 while `x2` is stuck at 0 or 1. A bigger raw feature scale mechanically produces a bigger gradient. Hold that thought for [Gradient Descent, Explained](/learn/ai-foundations/gradient-descent-explained) — it comes back below.

### 5. Nudge the weights

`w := w − lr · grad`, with a learning rate `lr = 0.1`:

| parameter | old | gradient | new |
|---|---|---|---|
| w1 | 0.100 | −0.66 | 0.166 |
| w2 | 0.100 | −0.24 | 0.124 |
| w3 | 0.100 | −0.48 | 0.148 |
| b  | 0.000 | −0.34 | 0.034 |

> **Why this step?** This *is* the learning. No new data arrived, no architecture changed — three numbers and a bias moved by a small amount in the direction that reduces the loss you computed two steps ago. Everything a much larger model does during training is this same update, repeated millions of times across many more weights.

### 6. Guess again — same emails, new weights

```python
import numpy as np

X = np.array([
    [3, 1, 1],   # WIN FREE MONEY NOW!!!
    [0, 0, 0],   # Hey, lunch tomorrow at noon?
    [0, 1, 2],   # FREE gift inside, click here or here
    [0, 0, 1],   # Quarterly report attached, one link to the shared doc
    [3, 0, 1],   # Congratulations!!! You've been selected, claim your prize
], dtype=float)
y = np.array([1, 0, 1, 0, 1], dtype=float)

w, b, lr = np.array([0.1, 0.1, 0.1]), 0.0, 0.1

def forward(X, w, b):
    return X @ w + b

def loss(y, y_hat):
    return np.mean((y_hat - y) ** 2) / 2

y_hat = forward(X, w, b)
print("predictions:", np.round(y_hat, 3), "loss:", round(loss(y, y_hat), 3))

delta = y_hat - y
grad_w = (X.T @ delta) / len(y)
grad_b = np.mean(delta)
w = w - lr * grad_w
b = b - lr * grad_b

y_hat_new = forward(X, w, b)
print("new predictions:", np.round(y_hat_new, 3), "new loss:", round(loss(y, y_hat_new), 3))
```

Running that reproduces exactly what you'd get by hand:

| email | ŷ old | ŷ new | y | error old | error new |
|---|---|---|---|---|---|
| 1 | 0.500 | 0.804 | 1 | 0.500 | 0.196 |
| 2 | 0.000 | 0.034 | 0 | 0.000 | −0.034 |
| 3 | 0.300 | 0.454 | 1 | 0.700 | 0.546 |
| 4 | 0.100 | 0.182 | 0 | −0.100 | −0.182 |
| 5 | 0.400 | 0.680 | 1 | 0.600 | 0.320 |

Loss: **0.111 → 0.047** — less than half, from one update.

> **Why this step?** This confirms the update actually worked, but read the table closely: rows 2 and 4 — both legitimate emails — got *slightly worse* (error moved from 0.000 to −0.034, and from −0.100 to −0.182). Gradient descent minimizes the *average* loss, not every row's loss individually. A metric improving in aggregate can hide individual cases moving the wrong direction, which is exactly why you look at per-example errors and not just the headline number when something's "learning."

### 7. One trained score, two different jobs

Look at the final column of predictions — `[0.804, 0.034, 0.454, 0.182, 0.680]` — and notice you can read it two ways without touching the model again.

**As classification** (threshold at 0.5, output a verdict):

| email | ŷ | verdict | actual | correct? |
|---|---|---|---|---|
| 1 | 0.804 | spam | spam | yes |
| 2 | 0.034 | not spam | not spam | yes |
| 3 | 0.454 | not spam | spam | **no** |
| 4 | 0.182 | not spam | not spam | yes |
| 5 | 0.680 | spam | spam | yes |

Four out of five, after a single gradient step — row 3 needs more training, or better features, before a hard threshold gets it right.

**As regression** (report the raw score as a graded estimate): row 3's 0.454 isn't "wrong" the same way a flipped verdict is — it's the model saying "45% likely, closer to the line than most." An inbox that sorts by this score rather than filtering on a hard cutoff keeps that uncertainty visible instead of erasing it, which for a borderline email is arguably the more honest output.

Same weights, same forward pass, same five numbers — [classification and regression](/learn/ai-foundations/classification-vs-regression) aren't two different models here, they're two different ways of reading and scoring one model's output. Keep that in mind for the failure below, where reading this particular output as a probability stops making sense.

## Where it breaks

Everything above used `lr = 0.1`. Change one line — `lr = 0.5` — and rerun the same six lines from step 6, same `X`, same `y`, same starting weights:

| email | ŷ (lr=0.5) | y | error |
|---|---|---|---|
| 1 | 2.020 | 1 | −1.020 |
| 2 | 0.170 | 0 | −0.170 |
| 3 | 1.070 | 1 | −0.070 |
| 4 | 0.510 | 0 | −0.510 |
| 5 | 1.800 | 1 | −0.800 |

Loss: **0.111 → 0.197.** It went up. Run the exact same update again from here and it climbs further still — the loss isn't settling, it's diverging, from the same gradients and the same data that produced a clean improvement one section ago.

Two things went wrong at once, and both are visible in this same table:

1. **The step overshot.** The gradient correctly pointed toward lower loss, but a step size of 0.5 moved the weights past the point where loss would have been minimized and out the other side. Row 1's error actually got bigger (0.5 → 1.02) instead of smaller — the direction was right, the distance wasn't.
2. **`ŷ1 = 2.02` isn't a valid probability.** Read as regression, row 1 now claims a "202% chance of spam." That's not a rounding quirk — it's a direct consequence of skipping the sigmoid back in the setup. A plain linear model has nothing physically stopping its output from leaving `[0, 1]`; a real probability-producing classifier squashes the sum precisely to prevent this.

The fix for the first problem is the one you already saw work: go back to `lr = 0.1`. More generally — start the learning rate small and increase it only if training is converging too slowly to be practical, rather than starting large and hoping it's fine. It's also worth connecting this to the feature-scale aside from step 4: because `x1` ranges 0–3 while `x2` is 0 or 1, `w1`'s effective step size at any given learning rate is already several times larger than `w2`'s — scaling your features to comparable ranges before training (standardizing, or scaling to `[0, 1]`) removes that compounding effect and typically lets you use a larger, safer learning rate across the board. If you want to see this failure mode from more angles — oscillation, slow convergence, the effect of scaling — [Gradient Descent in NumPy](/learn/ai-foundations/gradient-descent-in-numpy) is built for exactly that kind of experimentation.

## Takeaways

- Training is this loop, exactly: forward pass → loss → gradient → update. A trillion-parameter model runs the same four steps you just did by hand; it just does it more times, on more numbers, in parallel.
- A weight's gradient tells you "correlation with error," not "importance" — a feature with a wider numeric range gets a mechanically larger gradient at the same learning rate, independent of how predictive it actually is.
- Loss dropping on average doesn't mean every example improved. Rows 2 and 4 both got slightly worse in the very update that cut total loss by more than half — check individual predictions, not just the headline metric.
- Learning rate is the one number in this whole example that wasn't derived from the data, and it was also the only thing that turned a working update into a diverging one. Small and slow beats large and unstable until you have a specific reason to believe otherwise.
- The same trained weights can be read as a classifier (threshold, verdict) or a regressor (raw score, graded estimate) — see [Classification vs. Regression](/learn/ai-foundations/classification-vs-regression). Nothing about the model changes between those two readings; only your evaluation does.
- This whole page trained and evaluated on the same five emails, with no held-out data — completely fine for arithmetic you can check by hand, and a real problem the moment "it learned!" is a claim about anything you intend to trust. See [Train/Validation/Test Splits](/learn/ai-foundations/train-validation-test-splits) before you believe a result you scored on its own training data.

**Related:** [Supervised Learning, Explained](/learn/ai-foundations/supervised-learning-explained) for the concepts this page assumes · [Loss Functions, Explained](/learn/ai-foundations/loss-functions-explained) · [Gradient Descent, Explained](/learn/ai-foundations/gradient-descent-explained) · [Gradient Descent in NumPy](/learn/ai-foundations/gradient-descent-in-numpy) for hands-on practice with learning rate and scaling · [Classification vs. Regression](/learn/ai-foundations/classification-vs-regression) · [Train/Validation/Test Splits](/learn/ai-foundations/train-validation-test-splits).
