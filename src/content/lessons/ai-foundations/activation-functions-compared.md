---
title: "Sigmoid, Tanh, ReLU, GELU: Which and Why"
track: "ai-foundations"
status: live
summary: "A practitioner's side-by-side of sigmoid, tanh, ReLU (plus its Leaky/ELU patches), and GELU — comparing range, gradient behavior, and failure modes — ending in a decision table and"
duration: "12 min read"
---

The [activation-functions](/learn/ai-foundations/activation-functions) page told you these functions exist and roughly what they do. This one is about the decision itself: what each one costs you in gradient flow, where it actually breaks in training, and which one you reach for when you're staring at a hidden layer versus an output layer and need to pick something before lunch.

## The shape difference, side by side

Four numbers matter more than the curve's silhouette: the output range, the biggest gradient the function can ever hand back during backpropagation, whether the output is centered on zero, and what happens in the tails.

| Function | Range | Max \|gradient\| | Zero-centered? |
|---|---|---|---|
| Sigmoid | (0, 1) | 0.25, at x = 0 | No |
| Tanh | (-1, 1) | 1.0, at x = 0 | Yes |
| ReLU | [0, ∞) | 1.0 for all x > 0, 0 for x < 0 | No |
| GELU | roughly (-0.17, ∞) | roughly 1.1, near x ≈ 1.5-2 | Roughly (small negative dip only) |

That "max gradient" column is the whole story for [backpropagation](/learn/ai-foundations/backpropagation-explained): the chain rule multiplies these local gradients layer by layer, so a function whose best case is 0.25 is a very different citizen in a 20-layer network than one whose best case is 1.0.

If you want to see the shapes rather than take my word for the numbers, this runs anywhere with numpy and matplotlib:

```python
import numpy as np
import matplotlib.pyplot as plt

x = np.linspace(-5, 5, 200)

def sigmoid(x): return 1 / (1 + np.exp(-x))
def relu(x): return np.maximum(0, x)
def gelu(x): return 0.5 * x * (1 + np.tanh(np.sqrt(2 / np.pi) * (x + 0.044715 * x**3)))

plt.plot(x, sigmoid(x), label="sigmoid")
plt.plot(x, np.tanh(x), label="tanh")
plt.plot(x, relu(x), label="relu")
plt.plot(x, gelu(x), label="gelu")
plt.axhline(0, color="gray", linewidth=0.5)
plt.axvline(0, color="gray", linewidth=0.5)
plt.legend()
plt.show()
```

## Sigmoid

**How it works.** `sigmoid(x) = 1 / (1 + e^-x)`, squashing anything into (0, 1). Its derivative has a clean closed form, `sigmoid(x) * (1 - sigmoid(x))`, which peaks at exactly 0.25 when x = 0 and decays toward 0 as |x| grows.

**Where it wins.** As an output-layer activation for binary classification, where you genuinely want a number you can read as "probability of the positive class," paired with binary cross-entropy (see [loss-functions-explained](/learn/ai-foundations/loss-functions-explained) for why that pairing specifically, rather than mean squared error, keeps the gradient well-behaved). It also earns its keep inside LSTM/GRU gates, where you want a literal 0-to-1 "how much of this do I let through" signal — that's a deliberate use of saturation, not a bug.

**How it fails.** Stack sigmoids as hidden-layer activations and you get vanishing gradients: each layer's backward pass multiplies by at most 0.25, so gradient magnitude shrinks geometrically with depth. Ten layers deep, even in the best case:

```python
local_grad = 0.25
depth = 10
print(local_grad ** depth)   # ≈ 9.5e-7 — that's what's left for layer 1
```

By the time that signal reaches the earliest layers, it's too small to move the weights. This is the textbook reason sigmoid got pushed out of hidden layers once networks got deep. There's a secondary issue too: since sigmoid's output is always positive, every gradient flowing into the weights of the next layer during a single example shares the same sign, which historically produced inefficient zig-zag weight updates. Modern per-parameter optimizers like Adam mostly paper over that second problem, but the vanishing-gradient one is structural — no optimizer fixes a gradient that's already 9.5e-7.

**Cost.** Cheap — one exponential and one division per element — but cost was never the reason it fell out of favor for hidden layers.

## Tanh

**How it works.** `tanh(x) = 2 * sigmoid(2x) - 1`, range (-1, 1). Its derivative, `1 - tanh(x)^2`, peaks at 1.0 at x = 0 — four times sigmoid's ceiling — and the output is zero-centered, which sigmoid's isn't.

**Where it wins.** Recurrent hidden and cell states, where the classic LSTM/GRU design specifically wants a bounded, zero-centered value (so the cell state can move in both directions), and in shallow networks where zero-centering meaningfully speeds convergence and you're not stacking enough layers for saturation to bite.

**How it fails.** Same disease as sigmoid, milder dose: once |x| gets past roughly 3, `tanh(x)` is essentially ±1 and the gradient is essentially 0. In a deep feedforward stack you still get vanishing gradients, just with a bigger constant in front — a 10-layer tanh net doesn't collapse to 9.5e-7 the way sigmoid does, but it's heading the same direction.

**Cost.** Marginally more expensive than sigmoid, still trivial next to a matrix multiply. The reason it's rarer than ReLU in modern feedforward hidden layers isn't cost, it's that ReLU's non-saturating positive side wins outright once depth increases.

## ReLU

**How it works.** `f(x) = max(0, x)`. The derivative is 1 for x > 0, 0 for x < 0, and undefined at exactly 0 (frameworks just pick 0 or 1 there and move on). No exponential, no division — just a comparison. Because the gradient is a constant 1 for any positive input, it doesn't shrink with depth the way sigmoid's or tanh's does, which is a big part of why very deep networks became trainable at all — see [why-nonlinearity-matters](/learn/ai-foundations/why-nonlinearity-matters) for the broader case that a nonlinearity has to exist here in the first place.

**Where it wins.** The default hidden-layer activation for CNNs and MLPs. Combined with sane initialization (He initialization, sized for ReLU's asymmetry) and a reasonable learning rate, it's fast to compute, fast to train, and the go-to unless you have a specific reason not to use it.

**How it fails.** Dying ReLU. If a weight update pushes a unit's inputs so that its pre-activation is negative across your entire training set, the unit outputs 0 everywhere, its local gradient is 0 everywhere, and no future update can ever move it again — it's permanently off. This isn't hypothetical; it's a direct consequence of the flat zero region having zero gradient:

```python
def relu_grad(x):
    return (x > 0).astype(float)

w, b = -2.0, -3.0
x = np.array([0.1, 0.5, 1.0, 2.0])       # every example in the batch
pre_activation = w * x + b
print(pre_activation)                     # [-3.2 -4.  -5.  -7. ] — all negative
print(relu_grad(pre_activation))          # [0. 0. 0. 0.] — dead, permanently
```

In practice you catch this by logging the fraction of zero activations per layer during training; a layer where that fraction climbs toward 100% and stays there is a layer that's stopped learning.

**Cost.** The cheapest of the bunch — one comparison per element, nothing transcendental.

## Leaky ReLU, ELU, and friends

**How it works.** These exist specifically to patch the dead-zone problem without abandoning ReLU's cheap, non-saturating positive side. Leaky ReLU: `f(x) = x if x > 0 else α*x` for a small α like 0.01, so the negative side has a small but nonzero gradient — a "dead" unit can still receive a (tiny) gradient and eventually recover. PReLU makes α a learned parameter per channel instead of a fixed constant. ELU goes further: `f(x) = x if x > 0 else α*(e^x - 1)`, which is smooth (no kink at 0) and pushes the mean activation closer to zero, borrowing tanh's zero-centering benefit without tanh's saturation on the positive side.

**Where it wins.** When you've actually diagnosed dying ReLUs (that zero-activation logging from the previous section) and want the smallest possible change to fix it, rather than switching activation families entirely. Leaky ReLU is often the first thing worth trying because it's a one-line change with almost no added cost.

**How it fails.** Leaky ReLU and PReLU are still non-smooth at 0 — the kink doesn't go away, it just stops being fatal. The leak rate α is one more hyperparameter to tune, and PReLU's learned version can overfit on small datasets since it's extra free parameters riding along with the weights. ELU fixes the smoothness but reintroduces an exponential on the negative branch, so it's no longer "basically free" the way ReLU is.

**Cost.** Leaky ReLU: essentially the same as ReLU. PReLU: same plus a handful of extra learned parameters. ELU: noticeably more than ReLU on the negative branch, though still cheap relative to the linear algebra around it.

## GELU (and its cousin SiLU/Swish)

**How it works.** `GELU(x) = x * Φ(x)`, where Φ is the standard normal cumulative distribution function — intuitively, each input gets weighted by the probability that a standard normal variable would fall below it, so GELU is best read as "how much of x survives a soft, probabilistic gate" rather than the hard on/off gate ReLU applies. Since Φ has no simple closed form, most implementations use a tanh-based approximation instead of computing it exactly:

```python
def gelu(x):
    return 0.5 * x * (1 + np.tanh(np.sqrt(2 / np.pi) * (x + 0.044715 * x**3)))
```

Two properties fall out of this that ReLU doesn't have. First, it's smooth everywhere — no kink at 0 — which gives a smoother loss landscape to optimize over. Second, it's non-monotonic: it dips slightly negative for moderately negative inputs (down to roughly -0.17 near x ≈ -0.75) before climbing back toward 0 as x goes further negative, and its derivative actually rises a bit above 1 (roughly 1.1) for moderately positive inputs before settling back toward 1, rather than ReLU's hard cap at exactly 1. The practical upshot: a unit sitting in mildly negative territory still gets a small, informative, nonzero gradient instead of the flat, information-free 0 that kills a ReLU unit in the same spot.

**Where it wins.** Feedforward sublayers inside transformer blocks — GELU is the standard choice in BERT- and GPT-style architectures, and it's exactly the setting where [attention-mechanism-explained](/learn/llm-foundations/attention-mechanism-explained) and its surrounding feedforward layers benefit from that extra smoothness compounding across dozens of stacked layers and enormous parameter counts. If you see SiLU/Swish (`x * sigmoid(x)`) in a paper instead, treat it as GELU's close cousin: same smooth, non-monotonic shape, a slightly different weighting function, and in practice the choice between the two is usually inherited from whatever base architecture you're extending rather than something you tune yourself.

**How it fails.** Nothing dramatic — GELU doesn't die the way ReLU can — but there's no free lunch. It costs more compute per element (a tanh-and-cubic approximation, or an erf call, instead of one comparison), and on a small MLP or a latency-sensitive edge model where every operation is visible in your budget, that overhead is no longer negligible. In a transformer, the matrix multiplications around it dominate the FLOP count enough that GELU's extra cost per element mostly disappears into the noise; on a tiny feedforward classifier, it might not.

**Cost.** Moderate — an exponential-family approximation per element, versus ReLU's single comparison. Worth it when depth and scale are large enough that the smoother gradient behavior pays for itself; questionable overhead when the model is small enough that the activation cost is a visible fraction of the total.

## Decision table

| Approach | Best when | Avoid when | Cost |
|---|---|---|---|
| Sigmoid | Output layer for binary classification; gates inside LSTM/GRU | Hidden layers in anything beyond a couple of layers deep | Low (1 exp) |
| Tanh | Recurrent hidden/cell state; shallow nets where zero-centering matters | Deep feedforward hidden stacks | Low (1-2 exp) |
| ReLU | Default hidden layer for CNNs/MLPs; you want speed and simplicity | You're already seeing dead units and need a smooth or leaky alternative | Very low (1 comparison) |
| Leaky ReLU / ELU | You've measured dying ReLUs and want the smallest fix | You just want the well-trodden default with the most prior art | Low to moderate |
| GELU / SiLU | Transformer or attention-based architectures; very deep stacks | Small models or latency-critical inference where every op is counted | Moderate (exp/tanh approx per element) |

## How to choose

Work through this in order rather than picking by vibe or by whatever the last paper you read used:

1. **Is this the output layer?** Then the task picks the activation, not you. Binary classification → sigmoid, paired with binary cross-entropy. Mutually exclusive multi-class → softmax (a generalization of sigmoid to many classes) with categorical cross-entropy. Regression → no activation at all, just the linear output — see [classification-vs-regression](/learn/ai-foundations/classification-vs-regression) if that split isn't automatic for you yet.
2. **Is this a hidden layer, and is there already an established recipe for this architecture?** Don't reinvent it — transformer feedforward blocks use GELU or SiLU, recurrent gates use sigmoid/tanh by design. Inheriting the recipe is the right move, not a cop-out.
3. **No established recipe, just a plain MLP or CNN hidden layer?** Start with ReLU. It's the cheapest, fastest-to-train default, and it's right often enough that you should only move off it for a reason.
4. **Seeing signs of trouble** — training stalls, loss plateaus early, or you've logged the fraction of zero activations per layer and it's creeping toward 100%? Try Leaky ReLU or ELU first, since it's the smallest change. Reach for GELU/SiLU if you're already deep enough, or building something transformer-shaped, that the smoother gradient landscape is worth the extra compute per element.

**The rule of thumb that survives contact with a real project:** hidden layers start at ReLU and move to GELU/SiLU only when the architecture is transformer-shaped or deep enough that ReLU's dead units are a measured problem, not a guess. Output layers are never a style choice — they're dictated by the loss function and the task, so don't let a hidden-layer habit (like defaulting to ReLU everywhere) leak into the one layer where the math actually requires something else.

**Related:** [activation-functions](/learn/ai-foundations/activation-functions) · [why-nonlinearity-matters](/learn/ai-foundations/why-nonlinearity-matters) · [backpropagation-explained](/learn/ai-foundations/backpropagation-explained) · [loss-functions-explained](/learn/ai-foundations/loss-functions-explained) · [classification-vs-regression](/learn/ai-foundations/classification-vs-regression) · [attention-mechanism-explained](/learn/llm-foundations/attention-mechanism-explained)
