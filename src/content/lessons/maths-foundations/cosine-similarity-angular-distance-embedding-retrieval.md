---
title: "Cosine similarity, angular distance, and embedding retrieval"
track: "maths-foundations"
status: live
summary: "Cosine similarity compares direction rather than raw length."
duration: "5 min read"
---

## The short answer

Cosine similarity compares direction rather than raw length:
`cos(q,x)=q·x/(||q||||x||)`. It ranks vectors by angle when magnitude should
not dominate, which is common for text embeddings. Angular distance is
`arccos(cos(q,x))`; `1−cos` is a convenient dissimilarity but should not be
called the same metric. Zero vectors have no direction and must be handled
explicitly.

## Why this matters

Two documents can express the same direction in an embedding space but have
different norms because of length, confidence, or an encoder detail. Raw dot
product rewards both alignment and norm; cosine removes that norm factor. That
can fix a retrieval bias—or discard a magnitude signal that the application
actually needs. Metric selection is a product decision, not a universal
embedding rule.

## How it works

For nonzero vectors, define unit vectors
`q̂=q/||q||` and `x̂=x/||x||`. Then

```text
cos(q,x) = q̂·x̂ = (q·x)/(||q||||x||)
angular_distance(q,x) = arccos(cos(q,x)).
```

The angle relation from the dot product gives this directly. For unit vectors,
there is also a useful equivalence:

```text
||q̂−x̂||² = ||q̂||² + ||x̂||² − 2q̂·x̂ = 2 − 2cos(q,x).
```

Thus ranking by cosine similarity is the same as ranking by Euclidean distance
between normalised vectors. It is not the same as Euclidean distance on the
original vectors.

## Worked examples and variations

### Example A: exact same direction

**Input:** `q=(1,2)` and `x=(2,4)`. **Mechanism:** `x=2q`, so the angle is
zero and `cos(q,x)=1`; the raw dot product is `10`. **Output:** perfect cosine
alignment despite different lengths. **Inspect:** normalised vectors are equal:
`q̂=x̂=(1/√5,2/√5)`. **Decision:** cosine is appropriate when scale should not
change relevance.

### Example B: dot-product and cosine rankings reverse

**Input:** query `q=(1,0)`, candidate `a=(10,5)`, candidate `b=(1,0)`.
**Mechanism:** dot scores are `10` and `1`, so raw dot ranks `a` first. Cosines
are `10/√125≈0.894` and `1`, so cosine ranks `b` first. **Output:** a norm
bias reversal. **Inspect:** `a` is longer but points away from the query by a
larger angle. **Decision:** choose cosine when direction is the intended signal;
choose dot when magnitude represents useful evidence.

### Example C: nearest-neighbour retrieval

**Input:** a query embedding and four document embeddings, all normalised.
**Mechanism:** compute `q̂·x̂ᵢ` and sort descending. **Output:** the largest
score is the smallest angular distance, and the same order comes from
Euclidean distance on the normalised rows. **Inspect:** keep the document ID
next to each score; a score without its candidate is not an explanation.
**Decision:** choose `k` and any threshold using labelled or reviewed pairs,
not a memorised score such as `0.8`.

### Boundary case: a zero embedding

**Input:** `x=(0,0)`. **Mechanism:** the denominator `||x||` is zero, so cosine
and angular distance are undefined. **Output:** a division warning or `NaN` if
the implementation is careless. **Inspect:** the zero may signal an empty
document, encoder failure, or a legitimate null representation. **Decision:**
reject, fallback to lexical retrieval, or route for review according to a stated
policy; do not let `NaN` sort as if it were a score.

### Counterexample: normalisation erases a useful magnitude

**Input:** two vectors point in the same direction, but one represents a short
uncertain passage and the other a well-supported passage whose norm is meant to
encode confidence. **Mechanism:** cosine assigns both `1`. **Output:** tied
retrieval scores. **Inspect:** the discarded norm carried application meaning.
**Decision:** use a documented hybrid score, a separate quality feature, or raw
dot product if magnitude is validated as useful; cosine alone cannot preserve it.

## Two ways to see it

### Symbolic view

Cosine is the dot product after two independent normalisations. `arccos` turns
similarity into an angle in `[0,π]` for real nonzero vectors. Clipping a computed
cosine to `[-1,1]` can protect `arccos` from tiny floating-point drift, but it
must not hide a large numerical error.

### Geometric view

Project every vector onto the unit circle or sphere. Vectors with different
lengths collapse to the same direction; angular sectors become retrieval
neighbourhoods. This picture makes the trade-off visible: the radial signal is
discarded.

### Computational view

```python
import numpy as np

q = np.array([1., 0.])
candidates = np.array([[10., 5.], [1., 0.]])
dot_scores = candidates @ q
norms = np.linalg.norm(candidates, axis=1)
cos_scores = dot_scores / norms
assert np.argmax(dot_scores) == 0
assert np.argmax(cos_scores) == 1
```

For production code, reject non-finite rows and zero norms before division, and
record the normalisation policy with the index metadata.

## Hands-on

Build a four-candidate retrieval fixture. Report candidate ID, raw norm, dot
score, cosine score, and angular distance. Plot the vectors in 2D and label the
query and candidates.

**Failure fixture:** add a zero vector and one very long, moderately misaligned
candidate. **Test:** the implementation must report `undefined` for the zero
vector, keep the long candidate's dot and cosine ranks separate, and assert that
normalised-row Euclidean order matches cosine order. **Reset:** remove or route
the zero vector through the documented fallback and rerun the ranking test.

Feedback prompts:

- Retrieve: which factor does cosine remove from a dot product?
- Calculate: compute cosine for `(3,4)` and `(0,5)`.
- Compute: normalise two rows and verify `||u−v||²=2−2(u·v)`.
- Diagnose: give one reason a norm may be useful rather than noise.

Submit the ranking table and failure analysis in A1, the embedding geometry
lab.

## Checkpoint

- [ ] Explain why cosine similarity of `(1,2)` and `(2,4)` is one.
- [ ] Reproduce the ranking reversal for `q=(1,0)`, `a=(10,5)`, and `b=(1,0)`.
- [ ] State the difference between cosine similarity, cosine distance `1−cos`,
  and angular distance.
- [ ] Choose a policy for a zero embedding and explain why returning zero is a
  potentially misleading default.

## What this does not solve

Cosine similarity does not prove semantic relevance, calibrate a retrieval
threshold, handle encoder drift, or preserve magnitude-based confidence. A good
metric cannot repair a poor representation, leaked document, bad chunk, or
missing access filter. Evaluate retrieval with task-specific reviewed cases.

## Continue, go deeper, apply it

- Continue: Orthogonality and orthonormal coordinates
- Go deeper: Ingestion, chunking, and retrieval
- Apply it: A1 embedding geometry lab
