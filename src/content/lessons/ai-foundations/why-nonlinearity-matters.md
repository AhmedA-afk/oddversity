---
title: "Why Stacking Linear Layers Gains You Nothing"
track: "ai-foundations"
status: live
summary: "Intuition-first lesson proving that stacked linear layers collapse into one affine map (analogy, algebra, and a runnable numpy check), then showing why XOR is provably unsolvable b"
duration: "9 min read"
---

Two dense layers with no activation between them aren't a deeper network — they're one linear layer wearing a trench coat. Here's the proof, the dataset that exposes it, and the one-line fix that actually buys you a curve.

## The photocopier test

Think of a linear layer — `y = Wx + b` — as a photocopier's "resize and reposition" function. It can stretch the page, shrink it, rotate it, skew it, slide it around the tray. What it can never do is fold a corner or bend an edge. Every straight line on the original page comes out the other side as a straight line. Every pair of parallel lines stays parallel.

Now feed the output of one copier into a second copier that does its own stretch-rotate-slide. Obvious question: did you gain a new *kind* of operation? No. Stretch-rotate-slide followed by stretch-rotate-slide is still just a stretch-rotate-slide — a fancier one, with different numbers, but the same family of move. You could always find a single copier setting that produces the identical final page in one pass. That's the whole story of stacking linear layers: composition of affine maps is itself an affine map. No amount of restacking escapes the family.

## Walk it frame by frame

Picture a sheet of graph paper with two clusters of dots on it, cleanly split by a diagonal line — one clean, straight decision boundary. Layer 1 stretches the paper 2x horizontally and rotates it 15 degrees. Layer 2 shrinks everything by half and slides it up and to the left. Trace what happens to the grid:

- The grid lines are still straight after layer 1. Still straight after layer 2.
- Lines that were parallel before are still parallel after both transforms.
- The diagonal boundary that separated your two clusters is *still a straight line* — a different straight line, with a new slope and position, but still describable as `w1x1 + w2x2 + b = 0` for some new `w1, w2, b`.

Here's the part worth sitting with: a linear map treats every point in space identically. The stretch applied to a dot near the origin is the exact same stretch applied to a dot far away — position doesn't change the rule, only the input value does. To carve a boundary that bends — to treat the middle of the plane differently from the edges — you need an operation whose behavior actually depends on *where* a point lands, not just a uniform rescaling of the whole canvas. That's the ingredient two stacked linear layers structurally cannot provide, no matter how you tune the weights.

## The intuition that trips people up

The common wrong intuition: "a `Linear(4) -> Linear(4) -> Linear(1)` stack has three times the parameters of one `Linear(4) -> Linear(1)` layer, so it must be able to represent three times the shapes." It feels true because more weights usually does mean more capacity — that's your prior from every other part of ML, and here it silently misfires.

Here's the algebra that corrects it. Say layer 1 maps `x -> W1x + b1` and layer 2 maps that result to `W2(·) + b2`. Composing them:

```
y = W2(W1 x + b1) + b2
  = (W2 W1) x + (W2 b1 + b2)
  = W' x + b'
```

That's it — one matrix, one bias, indistinguishable from a single layer. Every weight you added went into computing `W'` and `b'`, and once training converges, nothing downstream can tell whether it came from one matrix multiply or fifty. Check it yourself:

```python
import numpy as np

rng = np.random.default_rng(0)

W1 = rng.normal(size=(4, 3))   # layer 1: 3 -> 4
b1 = rng.normal(size=(4,))
W2 = rng.normal(size=(2, 4))   # layer 2: 4 -> 2
b2 = rng.normal(size=(2,))

x = rng.normal(size=(3,))

# run x through both layers
h = W1 @ x + b1
y_stacked = W2 @ h + b2

# collapse into one equivalent layer
W_combined = W2 @ W1
b_combined = W2 @ b1 + b2
y_single = W_combined @ x + b_combined

print(np.allclose(y_stacked, y_single))  # True — always, for any x
```

There's a second, subtler cost. `W_combined = W2 @ W1` can't have more rank than the narrower of the two matrices — so a skinny hidden layer doesn't just fail to add expressiveness, it actively caps it. Depth without a nonlinearity between layers isn't neutral. It's a bottleneck wearing a costume. This is exactly the gap [activation functions](/learn/ai-foundations/activation-functions) exist to close — go there for what each one computes; this page is about why the gap needs closing at all. If you haven't walked a layer's arithmetic by hand yet, [building a neuron in numpy](/learn/ai-foundations/building-a-neuron-in-numpy) and [the forward pass by hand](/learn/ai-foundations/neural-network-forward-pass-by-hand) are the companion pieces — this collapse is what happens when you chain those forward passes with nothing but `Wx + b` at every step.

## A dataset no straight line can touch: XOR

Four points, two classes:

| x1 | x2 | class |
|----|----|-------|
| 0  | 0  | 0 |
| 0  | 1  | 1 |
| 1  | 0  | 1 |
| 1  | 1  | 0 |

This is XOR — output 1 exactly when the inputs disagree. Plot it: class 0 sits on two opposite corners of a unit square, class 1 on the other two. Any straight line you draw slices the square into two half-planes, and there is no way to put both class-0 corners on one side and both class-1 corners on the other — they alternate around the square like a checkerboard.

You don't have to trust the picture. Suppose a linear rule `w1x1 + w2x2 + b > 0` predicts class 1. Plugging in all four points gives four requirements:

```
(0,0) -> class 0:  b < 0
(1,1) -> class 0:  w1 + w2 + b < 0        =>  w1 + w2 < -b
(0,1) -> class 1:  w2 + b > 0             =>  w2 > -b
(1,0) -> class 1:  w1 + b > 0             =>  w1 > -b
```

Add the two class-1 requirements: `w1 + w2 > -2b`. Combine that with `w1 + w2 < -b` from above and you get `-2b < -b`, which simplifies to `b > 0`. But the very first requirement said `b < 0`. Contradiction — no `w1, w2, b` satisfies all four at once. And by the collapse proof above, this isn't just true for one layer; it's true for *any* number of stacked linear layers feeding into that final decision, because they all reduce to some single `w1x1 + w2x2 + b`.

You can watch this fail in practice, too. Fit the best possible straight line to XOR by least squares:

```python
import numpy as np

X = np.array([[0, 0], [0, 1], [1, 0], [1, 1]], dtype=float)
y = np.array([0, 1, 1, 0], dtype=float)

A = np.hstack([np.ones((4, 1)), X])          # bias column + features
coeffs, *_ = np.linalg.lstsq(A, y, rcond=None)
print(coeffs)        # ~[0.5, 0.0, 0.0]  -- bias only, weights wash out
print(A @ coeffs)    # [0.5, 0.5, 0.5, 0.5] for every single point
```

The optimizer doesn't even try to use `x1` or `x2` — the best a straight line can do is predict the average (0.5) for every point, because any nonzero slope helps two corners and hurts the other two equally. This is what "a linear model can't separate XOR" looks like when you actually run the numbers: not a bad fit, a *flat* one. This is the same shape of failure as [concentric rings](/learn/ai-foundations/activation-functions) — an inner class fully surrounded by an outer one — where separating them needs a closed curve, and a straight line can only ever cut the plane in half.

## One ReLU layer, same four points

Insert one nonlinear hidden layer and the impossibility proof above stops applying, because the network is no longer expressible as a single affine map.

```python
import numpy as np

def relu(z):
    return np.maximum(0, z)

X = np.array([[0, 0], [0, 1], [1, 0], [1, 1]], dtype=float)

# hidden layer: 2 ReLU units
W1 = np.array([[1.0, 1.0],
               [1.0, 1.0]])
b1 = np.array([0.0, -1.0])

# output layer: linear combination of the hidden activations
W2 = np.array([1.0, -2.0])
b2 = 0.0

H = relu(X @ W1.T + b1)     # shape (4, 2)
out = H @ W2 + b2

print(out)   # [0. 1. 1. 0.]  -- exact XOR, no rounding needed
```

Walk through why: both hidden units compute `a = x1 + x2` before the nonlinearity, but unit 1 activates as soon as `a > 0` while unit 2 only activates once `a > 1`. That's a genuinely *location-dependent* rule — points near the origin get treated differently from points further out, unit by unit. The output layer just takes `unit1 - 2*unit2`, and that combination happens to zero out exactly at the two same-class corners while staying positive at the other two. One hidden layer, two ReLU units, exact fit — something no depth of pure linear layers can reach, verified in the section above.

Notice what actually fixed it: not "smoothness" or "curviness" — ReLU is two straight rays glued at a kink. What fixed it is that the kink lets different regions of input space get treated differently, which is precisely the ingredient a global affine map cannot supply. For the menu of functions that provide this and how they differ in practice, see [activation functions compared](/learn/ai-foundations/activation-functions-compared).

## Where this analogy breaks

The photocopier picture makes it tempting to conclude "stacking linear layers is always pointless, never do it." That's not quite right, and the exception is instructive.

**Deliberate bottlenecks are a real technique.** If you factor one big `W` (say 512×512) into two smaller matrices `W2 @ W1` with a narrow middle dimension (say 512×16 and 16×512), you get exactly the same *kind* of function — still one collapsed affine map — but with far fewer numbers to store and train, and a rank constraint baked in. Nobody does this for expressiveness; they do it for compression and as an implicit regularizer, deliberately trading capacity for fewer parameters. See [regularization techniques](/learn/ai-foundations/regularization-techniques) for other ways people trade capacity for generalization on purpose. The collapse theorem still holds — that's the point, not a loophole in it.

**The moment one nonlinearity appears anywhere in the chain, the whole proof stops applying.** You don't need every layer to be nonlinear — you need exactly one break in the chain of pure matrix multiplies, because that's the one spot where `W2(f(W1x + b1)) + b2` can no longer be algebraically regrouped into a single `W'x + b'`. That's also why architectures with residual (skip) connections don't defeat this argument: as long as a nonlinearity sits somewhere on the path, depth starts buying you something again — which is the entire premise the rest of this module builds on. If any of the underlying neural network mechanics still feel shaky before you lean on that premise, [what a neural network is](/learn/ai-foundations/what-is-a-neural-network) is the right place to firm that up.

**Related:** [activation functions](/learn/ai-foundations/activation-functions) · [activation functions compared](/learn/ai-foundations/activation-functions-compared) · [what is a neural network](/learn/ai-foundations/what-is-a-neural-network) · [building a neuron in numpy](/learn/ai-foundations/building-a-neuron-in-numpy) · [the forward pass by hand](/learn/ai-foundations/neural-network-forward-pass-by-hand) · [regularization techniques](/learn/ai-foundations/regularization-techniques)
