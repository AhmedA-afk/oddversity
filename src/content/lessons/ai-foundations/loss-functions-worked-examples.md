---
title: "MSE vs. Cross-Entropy on Real Numbers"
track: "ai-foundations"
status: live
summary: "A single spam-email prediction, scored six different ways of confidence, run by hand through both MSE and cross-entropy — showing that the two losses don't just disagree by degree,"
duration: "14 min read"
---

Feed the exact same six numbers into two different loss formulas and you get two very different verdicts on how bad your model's mistake is. That gap isn't a quirk of notation — trace it far enough and it's the actual reason classifiers train on cross-entropy instead of the squared error you already trust for regression.

## The setup

If you haven't read [Loss Functions, Explained](/learn/ai-foundations/loss-functions-explained) yet, that page covers what a loss function does and introduces MSE and cross-entropy as a pair. This page assumes that and goes straight to arithmetic — same inputs, both formulas, watch what happens.

Here's the scenario: one email in your test set, genuinely spam, so its true label is `y = 1`. Six different classifiers look at it and each outputs a single number `p` — a probability estimate that the email is spam. `p` is the same *kind* of number every time; what differs is which formula you run it through afterward.

| Model | p (predicted P(spam)) | Verdict |
|---|---|---|
| A | 0.90 | confident and right |
| B | 0.60 | unsure, leaning right |
| C | 0.40 | unsure, leaning wrong |
| D | 0.10 | wrong, fairly confident |
| E | 0.01 | wrong, very confident |
| F | 0.001 | wrong, almost certain |

Nothing stops you from treating `p` as a plain continuous value and scoring it with mean squared error against the target `1.0` — this is a real, named thing (the [Brier score](/learn/maths-foundations/probability-basics-for-ai), used to grade weather forecasters), not a misuse of the formula. It's exactly the comparison [Classification vs. Regression](/learn/ai-foundations/classification-vs-regression) tells you to make explicit: same number, different assumption about what "distance from correct" means.

## Step by step

### Step 1 — score it as if `p` were a regression prediction

MSE for one example is just `(y - p)^2`.

| Model | p | y | MSE = (1 - p)^2 |
|---|---|---|---|
| A | 0.90 | 1 | 0.0100 |
| B | 0.60 | 1 | 0.1600 |
| C | 0.40 | 1 | 0.3600 |
| D | 0.10 | 1 | 0.8100 |
| E | 0.01 | 1 | 0.9801 |
| F | 0.001 | 1 | 0.9980 |

> **Why this step?** This is the baseline you already know how to reason about — squared distance, same units as "how far off was the number." It sets up the contrast: watch what the loss does as the model gets more and more confidently wrong, then compare it to Step 2 on the identical row.

### Step 2 — score the same six numbers as probabilities

Binary cross-entropy for one example is `-[y * ln(p) + (1 - y) * ln(1 - p)]`. Since `y = 1` here, the second term drops out and it collapses to `-ln(p)`.

| Model | p | Cross-entropy = -ln(p) |
|---|---|---|
| A | 0.90 | 0.105 |
| B | 0.60 | 0.511 |
| C | 0.40 | 0.916 |
| D | 0.10 | 2.303 |
| E | 0.01 | 4.605 |
| F | 0.001 | 6.908 |

> **Why this step?** `-ln(p)` isn't an arbitrary penalty curve — it's Shannon's definition of *surprise*. If you assigned probability `p` to the outcome that actually happened, `-ln(p)` is how surprised you should be, measured in nats (use `log2` instead of `ln` and you get bits — see [Entropy and Uncertainty](/learn/maths-foundations/entropy-and-uncertainty)). Cross-entropy is the average surprise, across your dataset, of the labels that actually showed up, given the odds you personally quoted. For a single hard-labeled example like this one, that average collapses to exactly one number, and it also equals the KL divergence from truth to your prediction — there's no separate "calibration term" hiding elsewhere, this *is* it.

### Step 3 — put them side by side

| Model | p | MSE | Cross-entropy |
|---|---|---|---|
| A | 0.90 | 0.010 | 0.105 |
| B | 0.60 | 0.160 | 0.511 |
| C | 0.40 | 0.360 | 0.916 |
| D | 0.10 | 0.810 | 2.303 |
| E | 0.01 | 0.980 | 4.605 |
| F | 0.001 | 0.998 | 6.908 |

Two things to notice, and they're both exact, not eyeballed:

1. **MSE is running out of room.** Between D and F, `p` drops by two full orders of magnitude, but MSE only crawls from 0.810 to 0.998 — it's asymptotically capped at 1.0, because the largest possible gap between a probability and a 0/1 target is 1. No matter how wrong the model gets, MSE cannot report more than "completely wrong."
2. **Cross-entropy has no such ceiling, and it grows on a clock.** Every time `p` drops by a factor of 10, cross-entropy goes up by *exactly* `ln(10) ≈ 2.303` — check the table: D→E→F each add almost precisely 2.303. That's not a coincidence, it falls straight out of `-ln(p/10) = -ln(p) + ln(10)`. Confident-wrong doesn't get cheaper as you go further into the tail. It gets billed at a constant rate, forever, with no maximum.

### Step 4 — check it in code

```python
import numpy as np

p = np.array([0.90, 0.60, 0.40, 0.10, 0.01, 0.001])
y = 1  # this email really is spam

mse = (y - p) ** 2
bce = -(y * np.log(p) + (1 - y) * np.log(1 - p))  # reduces to -np.log(p) since y == 1

for pi, m, c in zip(p, mse, bce):
    print(f"p={pi:<6} MSE={m:.4f}   cross-entropy={c:.4f}")

# confirm the "every 10x drop costs a fixed ln(10)" claim from Step 3
print(bce[3] - bce[4], bce[4] - bce[5], np.log(10))
```

Run it — the printed differences in that last line will match `np.log(10)` to floating-point precision.

## Where it breaks

Everything above compares the *value* of the two losses. That's not actually why cross-entropy wins for training a classifier — the value comparison is the headline, but the mechanism that matters lives one derivative down, in the gradient your optimizer actually follows (see [Gradient Descent, Explained](/learn/ai-foundations/gradient-descent-explained) if you need the refresher on why the gradient is the thing that matters).

Say model E's probability, `p = 0.01`, comes from a raw logit `z ≈ -4.6` passed through a sigmoid — that's the standard way a network produces a probability (see [Activation Functions Compared](/learn/ai-foundations/activation-functions-compared) for why sigmoid saturates at the tails). Backprop needs `dL/dz`, the gradient of the loss with respect to that logit, and this is where the two losses stop just disagreeing on magnitude and start disagreeing on *usefulness*.

```python
import numpy as np

def sigmoid(z):
    return 1 / (1 + np.exp(-z))

def mse_grad_wrt_logit(z, y):
    p = sigmoid(z)
    return 2 * (p - y) * p * (1 - p)     # chain rule: dL/dp * dp/dz

def bce_grad_wrt_logit(z, y):
    p = sigmoid(z)
    return p - y                          # the p*(1-p) terms cancel exactly

y = 1
for z in (-4.6, -6.91):   # ≈ model E (p≈0.01) and model F (p≈0.001)
    print(sigmoid(z), mse_grad_wrt_logit(z, y), bce_grad_wrt_logit(z, y))
```

Work the chain rule for cross-entropy and the `p * (1 - p)` from the sigmoid's own derivative cancels perfectly against the `p * (1 - p)` in the loss's derivative, leaving a clean `dL/dz = p - y`. For model E that's `0.01 - 1 = -0.99` — a large, honest correction signal proportional to how wrong the model is.

MSE has no matching term to cancel that `p * (1 - p)` factor, so it survives and multiplies the gradient toward zero right when `p` is near 0 or 1. Work it out for model E: `2 * (0.01 - 1) * 0.01 * 0.99 ≈ -0.0195` — roughly **50 times smaller** than cross-entropy's gradient, for the identical mistake. Push to model F (`p = 0.001`) and it's roughly **500 times smaller**. The pattern is exactly backwards from what you want: the more confidently wrong the model gets, the weaker the signal telling it to fix that. A network trained with MSE on a sigmoid output can get stuck loudly, stubbornly wrong, because the very saturation that makes it confident is also numbing its own gradient (this is the same saturating-derivative mechanism covered in [Backprop, Worked Example](/learn/ai-foundations/backprop-worked-example)).

There's a second, more mundane failure sitting right next to it: if a saturated sigmoid ever rounds all the way to a literal `0.0` in floating point — which happens for large negative `z` — then `-np.log(p)` isn't a big number, it's `-inf`, and your next gradient update is `nan` forever after.

```python
>>> import numpy as np
>>> np.log(0.0)
-inf
```

**The fix** solves both problems with one move: don't compute a sigmoid and then a separate loss on its output at all. Compute cross-entropy directly from the logit, fused, the way `torch.nn.BCEWithLogitsLoss` or `tf.nn.sigmoid_cross_entropy_with_logits` do internally. That fused form never evaluates `ln(0)` as a standalone step (it's numerically stabilized), and its gradient is the same clean `p - y` derived above, with no saturating multiplier attached. Cheap patch if you're stuck with raw probabilities: clip with `np.clip(p, 1e-7, 1 - 1e-7)` before taking the log — it stops the `-inf`, but it does nothing for the vanishing-gradient problem, because that lives in the calculus, not the arithmetic.

## Takeaways

- **Same numbers, different question.** MSE asks "how far in value-space?"; cross-entropy asks "how surprised should I be?" They aren't interchangeable defaults — they encode different assumptions about what "wrong" means, which is exactly the choice [Classification vs. Regression](/learn/ai-foundations/classification-vs-regression) is telling you to make deliberately.
- **"Punishes harder" is a precise, checkable claim, not a vibe.** MSE tops out at 1.0 no matter how wrong you get; cross-entropy has no ceiling and adds a fixed `ln(10) ≈ 2.303` nats every time your confidence in the wrong answer grows by 10x.
- **The log term is Shannon surprise, not decoration.** `-ln(p)` is the information content of an event you assigned probability `p`; minimizing cross-entropy is minimizing your model's average surprise at the labels that actually occurred, and for hard labels it's exactly a KL divergence from truth to prediction.
- **The real reason to prefer cross-entropy for training isn't the loss value, it's the gradient.** Backpropagated through a sigmoid, MSE's gradient inherits a `p * (1 - p)` term that vanishes exactly when the model is most confidently wrong. Cross-entropy's gradient cancels that term and stays a clean `p - y` all the way to the extremes.
- **In practice:** use MSE (or MAE, or Huber) when the target is a continuous quantity with a real notion of distance. Use cross-entropy when the target is a class label or probability. You can *evaluate* a probability forecast with an MSE-like metric (Brier score) — plenty of forecasters do — just don't backpropagate through it.

**Related:** [Loss Functions, Explained](/learn/ai-foundations/loss-functions-explained) · [Entropy and Uncertainty](/learn/maths-foundations/entropy-and-uncertainty) · [Classification vs. Regression](/learn/ai-foundations/classification-vs-regression) · [Backprop, Worked Example](/learn/ai-foundations/backprop-worked-example) · [Gradient Descent, Explained](/learn/ai-foundations/gradient-descent-explained)
