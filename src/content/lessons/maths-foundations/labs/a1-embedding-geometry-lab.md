---
title: "A1 · Embedding geometry lab"
track: "maths-foundations"
status: live
summary: "This lab turns the M1 vector toolkit into a checked retrieval decision."
duration: "11 min read"
---

## The short answer

This lab turns the M1 vector toolkit into a checked retrieval decision. You will
calculate norms, dot products, cosine similarities, projections, and nearest
neighbours by hand and with NumPy, then explain a deliberate ranking reversal
caused by vector magnitude. You will finish with a tested similarity-search
specification, a failure fixture with a reset path, and a short decision memo.

## Why this matters

An embedding search can return a number while still making the wrong decision.
Raw dot products reward alignment and magnitude; cosine removes magnitude;
Euclidean distance responds to coordinate differences; projections expose what a
chosen direction can and cannot represent. This lab makes those choices visible
on one small fixture before a vector index hides them behind an API.

The lab is the concrete A1 deliverable from the mathematics assignment
sequence. It is deterministic by design: the vectors are
small enough to audit on paper, and NumPy is used to verify—not replace—the
calculation.

## How it works

Use the query and candidate vectors below. Treat each row of `X` as one
candidate in the stated coordinate order. These are illustrative vectors, not
embeddings from a real model.

```text
q  = (1, 2)
x₁ = (3, 4)
x₂ = (2, 0)
x₃ = (−1, 2)
x₄ = (0, −1)
```

For a candidate `x`, calculate:

```text
L₀(x)       = number of nonzero coordinates
L₁(x)       = Σᵢ |xᵢ|
L₂(x)       = √(Σᵢ xᵢ²)
L∞(x)       = maxᵢ |xᵢ|
dot(q,x)    = qᵀx
cos(q,x)    = dot(q,x)/(||q||₂||x||₂)
d₂(q,x)     = ||q−x||₂
```

For the projection task, use direction `u=(1,1)`. The projection and residual
are

```text
p = ((q·u)/(u·u))u
r = q−p.
```

The check that makes the result inspectable is `u·r=0`. For retrieval, rank
dot/cosine scores from high to low and L2 distances from low to high. Keep the
candidate ID attached to every number.

## Worked examples and variations

### Part 1 — hand calculations

Show intermediate steps. Do not use a calculator until after you have written
the exact form.

### 1. Coordinate and norm table

Complete this table for `q`, `x₁`, `x₂`, `x₃`, and `x₄`:

| Vector | L₀ | L₁ | L₂ | L∞ |
|---|---:|---:|---:|---:|
| `q=(1,2)` |  |  |  |  |
| `x₁=(3,4)` |  |  |  |  |
| `x₂=(2,0)` |  |  |  |  |
| `x₃=(−1,2)` |  |  |  |  |
| `x₄=(0,−1)` |  |  |  |  |

At minimum, show why `L₂(x₁)=5`, why `L₁(q)=3`, and why the zero coordinate
in `x₂` contributes to neither L₀ nor L1.

### 2. Dot products and cosine similarity

Compute these by hand:

```text
q·x₁ = (1)(3)+(2)(4) = 11
q·x₃ = (1)(−1)+(2)(2) = 3
||q||₂ = √5,  ||x₁||₂ = 5,  ||x₃||₂ = √5
cos(q,x₁) = 11/(5√5) ≈ 0.984
cos(q,x₃) = 3/5 = 0.6
```

Continue the table for `x₂` and `x₄`. Record whether each cosine is positive,
zero, or negative and what that says about direction—not about factual
relevance.

### 3. Projection and residual

Project `q=(1,2)` onto `u=(1,1)`:

```text
q·u = 3
u·u = 2
p = (3/2)(1,1) = (1.5,1.5)
r = (1,2)−(1.5,1.5) = (−0.5,0.5)
u·r = (1)(−0.5)+(1)(0.5) = 0
```

Explain in one or two sentences why the zero dot product is the relevant test,
and why it would be wrong to use `(q·u)u` here without the denominator.

### 4. Nearest-neighbour rankings

Complete this inspection table. Distances are shown in exact form first.

| Candidate | dot `q·x` | cosine `cos(q,x)` | L2 distance `||q−x||₂` |
|---|---:|---:|---:|
| `x₁` | `11` | `11/(5√5) ≈ 0.984` | `√8 ≈ 2.828` |
| `x₂` |  |  | `√5 ≈ 2.236` |
| `x₃` | `3` | `0.6` | `2` |
| `x₄` |  |  | `√10 ≈ 3.162` |

Write three rankings:

1. dot product, descending;
2. cosine similarity, descending;
3. L2 distance, ascending.

Then answer: which candidate is nearest under cosine, and which is nearest
under raw L2? What decision would change if the task cares about direction
rather than absolute coordinate displacement?

## Two ways to see it

### Hand-audit view

The paper route keeps exact forms, dimensions, and invariants visible: expand a
dot product, keep the norm denominator, check `u·r=0`, and compare the ranking
after each metric. This is the fastest way to locate an axis, sign, or scale
mistake before a plot or index makes the output look authoritative.

### Retrieval-system view

The same fixture is a small retrieval pipeline: representation → preprocessing
→ score → ranking → abstention policy. A metric is a decision about which signal
to preserve. Candidate IDs, model version, zero-vector policy, and threshold
belong beside the score because geometry alone cannot enforce access, freshness,
or factual relevance.

## Hands-on

### Part 2 — NumPy fixture

Run this as one notebook or script. State your Python and NumPy versions in the
submission. It uses no random state because every expected value is auditable.

```python
import numpy as np

q = np.array([1.0, 2.0])
X = np.array([
    [3.0, 4.0],
    [2.0, 0.0],
    [-1.0, 2.0],
    [0.0, -1.0],
])
ids = np.array(["x1", "x2", "x3", "x4"])

assert q.shape == (2,)
assert X.shape == (4, 2)
assert np.isfinite(q).all() and np.isfinite(X).all()

l0 = np.count_nonzero(X, axis=1)
l1 = np.linalg.norm(X, ord=1, axis=1)
l2 = np.linalg.norm(X, ord=2, axis=1)
linf = np.linalg.norm(X, ord=np.inf, axis=1)
dot_scores = X @ q
q_norm = np.linalg.norm(q)
row_norms = np.linalg.norm(X, axis=1)
cos_scores = dot_scores / (q_norm * row_norms)
l2_distances = np.linalg.norm(X - q, axis=1)

assert np.isclose(q_norm, np.sqrt(5))
assert np.isclose(l2[0], 5.0)
assert np.isclose(dot_scores[0], 11.0)
assert np.isclose(cos_scores[2], 0.6)
assert np.isclose(l2_distances[2], 2.0)

print("norms", dict(zip(ids, zip(l0, l1, l2, linf))))
print("dot order", ids[np.argsort(-dot_scores)].tolist())
print("cosine order", ids[np.argsort(-cos_scores)].tolist())
print("L2 order", ids[np.argsort(l2_distances)].tolist())
```

Expected order is dot: `x1, x3, x2, x4`; cosine: `x1, x3, x2, x4`; and L2:
`x3, x2, x1, x4`. If your output differs, inspect orientation, axis, and
whether you sorted scores ascending by mistake.

### A checked projection function

Add this cell and retain both `p` and `r` in the output:

```python
u = np.array([1.0, 1.0])
denominator = u @ u
if denominator == 0:
    raise ValueError("projection direction has zero norm")
p = (q @ u) / denominator * u
r = q - p
assert np.allclose(p, [1.5, 1.5])
assert np.allclose(r, [-0.5, 0.5])
assert np.isclose(u @ r, 0.0)
```

The residual test is stronger than checking only the plotted point: it verifies
that the remainder is perpendicular to the chosen direction.

## Part 3 — the magnitude ranking reversal

Use a separate two-candidate fixture so the cause of the reversal is isolated:

```text
qᵣ = (1,0)
a  = (10,5)
b  = (1,0)
```

Hand calculation:

```text
dot(qᵣ,a) = 10       dot(qᵣ,b) = 1
cos(qᵣ,a) = 10/√125 ≈ 0.894
cos(qᵣ,b) = 1
```

Raw dot product ranks `a` first because its larger norm boosts its aligned
component. Cosine ranks `b` first because it points exactly in the query
direction. This is not a software bug; it is a disagreement about whether
magnitude should count as evidence. State which ranking matches your imagined
task and what additional review would be needed before changing the metric.

Verify the reversal with NumPy:

```python
q_r = np.array([1.0, 0.0])
R = np.array([[10.0, 5.0], [1.0, 0.0]])
dot_r = R @ q_r
cos_r = dot_r / (np.linalg.norm(R, axis=1) * np.linalg.norm(q_r))
assert np.argmax(dot_r) == 0       # a first
assert np.argmax(cos_r) == 1       # b first
print("dot", dot_r.tolist(), "cosine", cos_r.tolist())
```

Do not report this as “cosine is always better.” Report it as a controlled
counterexample that makes the magnitude assumption visible.

## Failure fixture, test, and reset

Run the bad state before repairing it. The fixture contains a zero vector and a
deliberate temptation to accept a `NaN` as a ranked score:

```python
broken = np.vstack([R, np.array([0.0, 0.0])])

def unsafe_cosine(query, candidates):
    return (candidates @ query) / (
        np.linalg.norm(candidates, axis=1) * np.linalg.norm(query)
    )

unsafe_scores = unsafe_cosine(q_r, broken)
assert not np.isfinite(unsafe_scores).all()  # this exposes the failure
```

The acceptance test must require a named failure, not a silently sorted `NaN`:

```python
def safe_cosine(query, candidates):
    query = np.asarray(query, dtype=float)
    candidates = np.asarray(candidates, dtype=float)
    if query.ndim != 1 or candidates.ndim != 2:
        raise ValueError("expected one query and a candidate matrix")
    if candidates.shape[1] != query.shape[0]:
        raise ValueError("query and candidate dimensions do not match")
    if not np.isfinite(query).all() or not np.isfinite(candidates).all():
        raise ValueError("non-finite vector")
    query_norm = np.linalg.norm(query)
    candidate_norms = np.linalg.norm(candidates, axis=1)
    if query_norm == 0 or np.any(candidate_norms == 0):
        raise ValueError("zero vector has undefined cosine")
    return (candidates @ query) / (candidate_norms * query_norm)

try:
    safe_cosine(q_r, broken)
except ValueError as error:
    assert str(error) == "zero vector has undefined cosine"
else:
    raise AssertionError("zero-vector fixture was not rejected")
```

**Failure state:** `unsafe_cosine` emits a non-finite score, and a naive
`argsort` may still produce a candidate order. **Test:** the repaired function
must reject the fixture with the named `ValueError`, while the ranking-reversal
test still passes on the nonzero rows. **Reset:** remove the zero row or route
it to an explicit fallback such as lexical search, restore the valid `R` fixture,
and rerun the shape, finiteness, cosine, projection, and ranking assertions.

Add one more local failure if you want the extension: replace `u` with
`[2.0,2.0]` and remove the denominator from the projection. The residual
orthogonality assertion must fail; restore the denominator and rerun it.

## Deliverables and feedback

Submit one folder or notebook containing:

1. the completed hand-calculation tables and exact-to-decimal conversions;
2. the NumPy fixture, printed rankings, and checked projection;
3. the magnitude ranking reversal with a two-paragraph interpretation;
4. the failure fixture, the failing unsafe output, the named test, and the reset
   result; and
5. a **150–300 word decision memo** answering: which metric and preprocessing
   policy would you choose for a stated retrieval task, what signal does that
   choice preserve, when should it abstain, and which failure would you monitor?

Use these feedback prompts before submitting:

- Retrieve: define L1, L2, L∞, dot product, cosine, projection, and residual in
  your own words.
- Calculate: reproduce `q·x₁`, `cos(q,x₁)`, and the projection of `q` onto `u`.
- Compute: change one candidate coordinate and explain which rankings move.
- Diagnose: explain the magnitude reversal without saying that one metric is
  universally correct.
- Review: confirm that candidate IDs, axes, units/representation, and model
  version would be attached in a real retrieval system.

## Acceptance rubric

| Criterion | Weight | Full-credit evidence |
|---|---:|---|
| Mathematical model | 25% | Correct notation, all hand calculations, dimensions, assumptions, and the projection derivation. |
| Computation | 20% | Reproducible NumPy output, fixed fixture, assertions, and no hidden library call replacing the core calculation. |
| Interpretation | 20% | Correct metric-specific rankings, clear magnitude-reversal explanation, and a defensible task choice. |
| Diagnostics | 20% | Zero-vector or shape failure is exposed, named, tested, repaired, and reset; residual orthogonality is checked. |
| Communication | 15% | Labelled table/output, readable plots if used, and a 150–300 word decision memo with limitations. |

Pass requires at least 60% overall **and** no zero in Mathematical model or
Diagnostics. A correct top result without the failure analysis is incomplete.

## Checkpoint

- [ ] My hand table contains L0, L1, L2, and L∞ for all five vectors.
- [ ] My dot, cosine, and L2 rankings match the expected orders, with the
  intermediate scores visible.
- [ ] My projection residual is orthogonal to `u` within a stated tolerance.
- [ ] My reversal fixture ranks `a` first by dot and `b` first by cosine, and my
  memo explains the norm assumption behind the change.
- [ ] My failure test rejects a zero vector with a named error, and the reset
  returns the valid fixture to passing tests.
- [ ] My decision memo states a representation, metric, preprocessing policy,
  abstention rule, and one monitoring failure.

## What this does not solve

This lab does not prove that a vector representation is semantically relevant,
that a threshold generalises to a new corpus, or that a retrieved document is
current, authorised, or sufficient to answer a question. It does not evaluate
an embedding model, replace access-control filters, or establish factual
grounding. Those require reviewed data, metadata/provenance checks, retrieval
evaluation, and downstream answer tests.

## Continue, go deeper, apply it

- Continue: Similarity-search design clinic
- Go deeper: Ingestion, chunking, and retrieval
- Apply it: Linear algebra for ML

## M1 reference route

- M1.1 Vectors as coordinates, measurements, and features
- M1.2 Vector addition, affine combinations, and centroids
- M1.3 Dot products and bilinear scores
- M1.4 Norms and distances
- M1.5 Cosine similarity and embedding retrieval
- M1.6 Orthogonality and orthonormal coordinates
- M1.7 Projections and residuals
- M1.8 Angles, margins, and separating hyperplanes
- M1.9 Vector means, centring, and feature standardisation
- M1.10 Geometry in high dimensions
- M1.11 Similarity-search design clinic
- A1 assignment specification
