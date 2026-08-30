---
title: "Dot products and bilinear scores"
track: "maths-foundations"
status: live
summary: "The dot product a·b=Σᵢaᵢbᵢ compresses two equal-length vectors into one."
duration: "5 min read"
---

## The short answer

The dot product `a·b=Σᵢaᵢbᵢ` compresses two equal-length vectors into one
scalar. It measures aligned magnitude: `a·b=||a||||b||cosθ`. A bilinear score
`aᵀWb` inserts a learned interaction matrix between the vectors. In AI, dot
products score linear models, attention, and retrieval, but a large score may
come from either alignment or vector norm.

## Why this matters

Elementwise multiplication, a dot product, and a learned bilinear score are
different objects. Confusing them can change a model from one scalar score to a
vector of per-feature interactions, or can make a retrieval system rank long
embeddings rather than semantically aligned ones. Always state the output shape
and whether magnitude is supposed to matter.

## How it works

For `a,b∈Rᵈ`,

```text
a·b = aᵀb = Σᵢ₌₁ᵈ aᵢbᵢ.
```

To derive the angle relation, expand the squared length of the difference in
two ways:

```text
||a−b||² = ||a||² + ||b||² − 2a·b
||a−b||² = ||a||² + ||b||² − 2||a||||b||cosθ.
```

Equating the right sides gives `a·b=||a||||b||cosθ` for nonzero vectors. A
bilinear score is

```text
s(a,b) = aᵀWb = ΣᵢΣⱼ aᵢWᵢⱼbⱼ.
```

With `W=I`, it reduces to the dot product. If `W` is not symmetric, swapping
the inputs can change the score; that can be intentional in query-document
scoring, but it should not be assumed symmetric.

## Worked examples and variations

### Example A: hand-computable dot product and angle

**Input:** `a=(1,2)`, `b=(3,4)`. **Mechanism:**
`a·b=1·3+2·4=11`, `||a||=√5`, `||b||=5`, so
`cosθ=11/(5√5)≈0.984`. **Output:** a positive, strongly aligned score.
**Inspect:** the vectors are not identical; the angle is small, not zero.
**Decision:** use the score for ranking only after deciding whether its scale
should be comparable across vector norms.

### Example B: a learned bilinear interaction

**Input:** `a=(1,2)`, `b=(3,4)`, and
`W=[[2,0],[0,1]]`. **Mechanism:** `Wb=(6,4)`, then
`aᵀWb=1·6+2·4=14`. **Output:** the first coordinate interaction is weighted
twice as strongly. **Inspect:** `a·b=11`, so the matrix changed the score.
**Decision:** use `W` when feature interactions have been learned or specified;
do not describe the result as an ordinary dot product.

### Example C: attention-style compatibility

**Input:** query `q=(1,0)` and keys `k₁=(1,0)`, `k₂=(0,1)`.
**Mechanism:** `q·k₁=1`, `q·k₂=0`. **Output:** the first key is more aligned.
With a temperature or scale, scores may be divided by `√d` before a softmax.
**Inspect:** this is a score, not yet a probability or a decision. **Decision:**
normalise or calibrate downstream only if the application requires it.

### Boundary case: orthogonal and zero vectors

**Input:** `a=(1,0)`, `b=(0,1)`. **Mechanism:** `a·b=0` although both vectors
are nonzero; their angle is `90°`. For `z=(0,0)`, `z·b=0` too, but the angle
with `b` is undefined because `||z||=0`. **Output:** zero score in both cases.
**Inspect:** dot-product zero alone cannot distinguish orthogonality from a
zero vector. **Decision:** reject zero vectors before using angle/cosine logic.

### Counterexample: treating elementwise multiplication as a dot product

**Input:** `a=(2,3)`, `b=(4,5)`. **Mechanism:** elementwise product is
`a*b=(8,15)`; dot product is the reduction `8+15=23`. **Output:** a vector
versus a scalar. **Inspect:** a later matrix operation may accept the vector and
silently implement a different model. **Decision:** name the reduction and
assert the expected output shape.

## Two ways to see it

### Symbolic view

`aᵀb` is a one-row-by-one-column matrix product. `aᵀWb` is bilinear: holding
either input fixed makes the score linear in the other. This is why it can serve
as a linear classifier score or a learned pairwise compatibility.

### Geometric view

Project `a` onto the direction of `b`: the dot product is `||b||` times the
signed length of that projection. Same direction gives a positive score,
opposite direction a negative score, and perpendicular directions zero. Length
still matters unless both vectors are normalised.

### Computational view

```python
import numpy as np

a = np.array([1., 2.])
b = np.array([3., 4.])
W = np.array([[2., 0.], [0., 1.]])
assert np.isclose(a @ b, 11.)
assert np.isclose(a @ W @ b, 14.)
assert (a * b).shape == (2,)
```

The three expressions intentionally return different things: scalar dot,
scalar bilinear score, and elementwise vector product.

## Hands-on

Create a score table for one query and at least four candidate vectors. Compute
elementwise product, dot product, norm, cosine, and (optionally) a bilinear
score as separate columns.

**Failure fixture:** pass vectors of different lengths, or replace a candidate
with the zero vector while attempting to report an angle. **Test:** assert equal
shapes before `@`, assert a scalar output for the dot score, and return a named
`undefined-angle` state for a zero norm. **Reset:** restore equal-length,
nonzero vectors and compare the first row with the hand calculation above.

Feedback prompts:

- Retrieve: name the two factors that determine `a·b`.
- Calculate: compute `(−1,2)·(3,−4)` and say whether the angle is acute or obtuse.
- Compute: replace `W` by the identity matrix and verify the bilinear score
  becomes the dot product.
- Diagnose: explain what a high dot score cannot tell you about semantic angle
  when candidate norms vary.

Submit the score table as part of A1, the embedding geometry lab.

## Checkpoint

- [ ] Compute `(2,−1)·(5,3)` and its sign.
- [ ] Derive the cosine relation from the two expressions for `||a−b||²`.
- [ ] Distinguish the shapes and meanings of `a*b`, `a@b`, and `a@W@b`.
- [ ] Explain why a zero dot product is not enough to conclude that an angle is
  defined.

## What this does not solve

A dot product is not automatically a probability, semantic similarity, causal
effect, or calibrated confidence. Its magnitude depends on coordinate scaling
and vector norms. Norms, centring, and task-specific validation determine whether
the score is a defensible signal.

## Continue, go deeper, apply it

- Continue: Norms and distances
- Go deeper: Linear algebra for ML
- Apply it: A1 embedding geometry lab
