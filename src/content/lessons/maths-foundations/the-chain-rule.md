---
title: "The chain rule"
track: "maths-foundations"
status: live
summary: "For a composition f(g(x)), the chain rule multiplies the outer sensitivity by the inner sensitivity: (f∘g)'(x)=f'(g(x))g'(x)."
duration: "3 min read"
---

## The short answer

For a composition `f(g(x))`, the chain rule multiplies the outer sensitivity by the inner sensitivity: `(f∘g)'(x)=f'(g(x))g'(x)`. It is the mathematical reason backpropagation can pass a local signal through preprocessing, affine layers, activations, and losses. Omitting one link gives the wrong gradient.

## Why this matters

An AI pipeline is usually nested: normalise a feature, form a score, apply a sigmoid, then compute a loss. Each stage changes how an upstream parameter affects the final output. The chain rule exposes both useful amplification and harmful vanishing gradients.

## How it works

Let `y=g(x)` and `z=f(y)`. A small change `dx` produces `dy≈g'(x)dx`, then `dz≈f'(y)dy`; multiplying gives `dz≈f'(g(x))g'(x)dx`. Taking the limit makes this exact for the derivative.

For `L(p)=−[y log p+(1−y)log(1−p)]` and `p=σ(z)`, the graph is `z→p→L`. The derivative is `dL/dz=(dL/dp)(dp/dz)`, with a simplification to `p−y` when the sigmoid and binary cross-entropy are paired.

## Worked examples and variations

### Example A: nested polynomial

**Input:** `h(x)=(3x+1)²` at `x=2`. **Mechanism:** outer derivative `2u` at `u=7` is 14; inner derivative is 3; product is 42. **Output:** `h'(2)=42`. **Inspect:** direct expansion `9x²+6x+1` also gives 42. **Decision:** use the composition tree for larger expressions.

### Example B: preprocessing sensitivity

**Input:** `z=(x−μ)/σ`, `s=2z`, with `σ=4`. **Mechanism:** `ds/dx=2·(1/4)=0.5`. **Output:** one unit of raw input changes score by 0.5 locally. **Inspect:** forgetting the standardisation derivative reports 2, a fourfold error. **Decision:** include preprocessing in the graph or freeze and document it.

### Boundary case: saturated sigmoid

**Input:** `p=σ(z)` at `z=10`. **Mechanism:** `σ'(z)=p(1−p)` is about `0.000045`. **Output:** upstream changes have a tiny effect on `p`. **Inspect:** the product contains a small local factor. **Decision:** distinguish a small true gradient from a missing gradient.

### Counterexample: multiply only the outer derivative

**Input:** `L(x)=log(2x+1)` at `x=1`. **Mechanism:** correct derivative is `2/(2x+1)=2/3`; the tempting `1/(2x+1)=1/3` omits `d(2x+1)/dx`. **Output:** the wrong gradient is half-sized. **Inspect:** finite differences expose the factor-of-two error. **Decision:** list every edge in the computation graph before differentiating.

## Two ways to see it

### Builder view

Draw nodes and arrows, store each node's forward value, and write one local derivative on each arrow. Backward work is then multiplication and accumulation along paths.

### Systems or numerical view

The chain product explains vanishing and exploding signals. Rescaling, activation choice, and architecture can change those products; a global symptom does not tell you which local factor is responsible.

## Hands-on

Build a three-node graph for `L(x)=log(2x+1)` and a second graph for sigmoid plus binary cross-entropy. Compute forward values and backward factors in a table.

**Failure state:** remove one inner derivative and use a saturated sigmoid fixture. **Test:** compare the manual gradient with a central difference and report both `wrong-factor` and `small-but-correct` cases. **Reset:** restore the edge, use a moderate logit, and rerun.

## Checkpoint

- [ ] Apply the chain rule to `(5x−2)³`.
- [ ] Explain why standardisation changes a downstream sensitivity.
- [ ] Name the local factors in the sigmoid/BCE path.
- [ ] Give one reason a tiny gradient can be mathematically correct.

## What this does not solve

The chain rule does not choose a useful parameterisation or prevent saturation. It also becomes more notationally demanding for vector-valued nodes, where Jacobians and vector–Jacobian products are needed.

## Continue, go deeper, apply it

- Continue: Critical points, monotonicity, and extrema
- Go deeper: Computational graphs and local derivatives
- Apply it: Loss, gradients, and gradient descent
