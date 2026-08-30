---
title: "Normalizing Features and Embeddings"
track: "python-data-apis"
status: live
summary: "A worked example that standardizes a raw feature matrix (subtract column mean, divide by column std) and L2-normalizes embedding rows so cosine similarity becomes a plain dot produ"
duration: "16 min read"
---

You've got two kinds of vectors that both need scaling before they're comparable — but for different reasons and in different directions. Get the axis wrong on either one and NumPy won't always tell you; it'll just quietly give you the wrong answer.

## The setup (specific)

You're building two "similar products" features for a small electronics storefront: one compares raw specs, one compares product descriptions. Five products, two matrices.

The first is a feature matrix — price, weight, and review count for each product:

```python
import numpy as np

# rows: earbuds, speaker, laptop_stand, webcam, keyboard
# cols: price_usd, weight_kg, rating_count
X = np.array([
    [ 79.0, 0.05, 1200.0],
    [ 45.0, 0.60,  340.0],
    [ 32.0, 1.10,   85.0],
    [ 59.0, 0.15,  610.0],
    [110.0, 0.90,  920.0],
])
print(X.shape)  # (5, 3)
```

Five products, three features — a `(5, 3)` array, one row per product. This is the shape you get from almost any tabular source, and it's exactly the kind of thing worth building as a real [array](/learn/python-data-apis/numpy-arrays-fundamentals) instead of a list of lists, because every step below is a single vectorized operation over the whole table.

The second is a set of toy embeddings for the product *descriptions* — pretend a text encoder turned each description into a 4-number vector (real ones are usually hundreds of dimensions; 4 keeps the arithmetic checkable by hand):

```python
# same row order as X: earbuds, speaker, laptop_stand, webcam, keyboard
E = np.array([
    [0.80, 0.60, 0.0, 0.10],  # earbuds
    [1.60, 1.20, 0.0, 0.20],  # speaker
    [0.50, 1.00, 4.5, 1.50],  # laptop_stand (long, repetitive description)
    [0.70, 0.50, 0.1, 0.20],  # webcam
    [0.05, 0.05, 0.05, 0.05], # keyboard
])
print(E.shape)  # (5, 4)
```

Each row of `E` is a point in 4-D space — the same idea as [what a vector is](/learn/maths-foundations/what-is-a-vector), just with more coordinates than you can sketch on paper. Two products land close together if their descriptions talk about similar things, which is the geometric intuition behind [embeddings](/learn/maths-foundations/the-geometry-of-embeddings) generally.

`X` needs **standardization** before you feed it to any distance-based comparison. `E` needs **L2 normalization** before you compare rows by dot product. Same family of problem — a vector's raw numbers are misleading until you rescale them — but the fix runs in a different direction for each.

## Step by step

### Step 1 — Get the per-column mean and std

```python
mean = X.mean(axis=0)
std = X.std(axis=0)

print(mean.shape, std.shape)  # (3,) (3,)
print(mean)  # [ 65.    0.56 631.  ]
print(std)   # [ 27.37   0.41 397.62]
```

`axis=0` collapses down the rows, leaving one number per column — average price, average weight, average rating count. Shape goes from `(5, 3)` to `(3,)`.

> **Why this step?** `mean(axis=0)` and `std(axis=1)` are easy to swap by accident, and NumPy won't stop you — you'd just get one mean per *product* instead of one per *feature*, and every later step would silently normalize the wrong thing. Axis 0 is "down the rows, one result per column," which is what you want when a column is a feature. This is the same axis logic that trips people up in [broadcasting and indexing](/learn/python-data-apis/numpy-indexing-and-broadcasting) generally — always ask "what shape do I expect back?" before trusting the line you just wrote.

### Step 2 — Standardize: subtract the mean, divide by the std

```python
Z = (X - mean) / std

print(Z.shape)  # (5, 3) — unchanged
print(Z.round(2))
# [[ 0.51 -1.25  1.43]
#  [-0.73  0.1  -0.73]
#  [-1.21  1.32 -1.37]
#  [-0.22 -1.   -0.05]
#  [ 1.64  0.83  0.73]]

print(Z.mean(axis=0).round(8))  # [0. 0. 0.]
print(Z.std(axis=0))            # [1. 1. 1.]
```

`X` is `(5, 3)`, `mean` and `std` are `(3,)`. NumPy broadcasts the `(3,)` arrays against every row of `X`, so the shape after standardizing is still `(5, 3)` — same table, rescaled columns. Every column now has mean 0 and std 1, so no single feature's raw units decide the outcome.

> **Why this step?** Watch what raw scale does to a real query — "which product is closest to the earbuds?" — using plain Euclidean distance:
> ```python
> def dists_from(M, i):
>     return np.linalg.norm(M - M[i], axis=1)
>
> print(dists_from(X, 0).round(1))
> # [   0.  860.7 1116.  590.3  281.7]  <- keyboard (281.7) looks closest
>
> print(dists_from(Z, 0).round(2))
> # [0.   2.83 4.17 1.67 2.47]           <- webcam (1.67) is actually closest
> ```
> On raw features, the keyboard "wins" — not because it's genuinely most similar, but because `rating_count` ranges from 85 to 1200 while `price` only ranges from 32 to 110. A 280-point gap in ratings outweighs any plausible gap in price or weight, so ratings alone decide the answer. Standardize first, and weight and price get to matter too — the webcam turns out closer once every feature has an equal voice. This is the whole reason to standardize before *any* distance, similarity, or gradient-based comparison: whichever feature happens to have the biggest numbers otherwise wins by default, regardless of whether it's the most meaningful one.

### Step 3 — Get each embedding row's L2 norm

```python
norms = np.linalg.norm(E, axis=1, keepdims=True)

print(norms.shape)   # (5, 1)
print(norms.round(3))
# [[1.005]
#  [2.01 ]
#  [4.873]
#  [0.889]
#  [0.1  ]]
```

This time you reduce across columns, not rows — `axis=1` — because you want one number *per product*, the length of that product's whole description vector. `keepdims=True` keeps the result as `(5, 1)` instead of collapsing it to `(5,)`.

> **Why this step?** That `keepdims=True` is not cosmetic — it's what makes the division in the next step broadcast correctly against `(5, 4)`. Drop it and you get a `(5,)` array that lines up against the *columns* of `E`, not the rows, which is the wrong axis entirely. You'll see exactly what that does in "Where it breaks" below.

### Step 4 — Divide each row by its own norm

```python
E_norm = E / norms

print(E_norm.shape)                        # (5, 4)
print(np.linalg.norm(E_norm, axis=1))       # [1. 1. 1. 1. 1.]
```

`(5, 4)` divided by `(5, 1)` broadcasts the single norm across all 4 columns of its row — each row gets divided by its *own* length, independently. Every row is now a unit vector: same direction as before, length exactly 1.

> **Why this step?** Cosine similarity between two vectors `a` and `b` is defined as `(a · b) / (‖a‖ · ‖b‖)` — dot product over the product of the lengths. Once every row already has length 1, that denominator is just `1 * 1 = 1`, and the formula collapses to plain `a · b`. You're not approximating cosine similarity here — you're doing the exact same math, just once per row instead of once per comparison. For a catalog of 5 products that's a rounding error in compute; for a search index of a million embeddings, normalizing once up front and then doing plain [dot products](/learn/maths-foundations/cosine-similarity-angular-distance-embedding-retrieval) at query time is the difference between one fast matrix multiply and recomputing every norm on every query.

### Step 5 — Cosine similarity as a single matmul

```python
sims = E_norm @ E_norm.T
print(sims.shape)  # (5, 5)

print(sims[0, 3])  # cosine(earbuds, webcam)        -> 0.985
print(sims[0, 2])  # cosine(earbuds, laptop_stand)  -> 0.235
```

`(5, 4) @ (4, 5)` gives you `(5, 5)` — every pairwise cosine similarity, computed as one matrix multiplication instead of a Python loop over pairs.

> **Why this step?** Compare that to what the *raw*, un-normalized dot products say:
> ```python
> raw = E @ E.T
> print(raw[0, 3])  # raw dot(earbuds, webcam)       -> 0.88
> print(raw[0, 2])  # raw dot(earbuds, laptop_stand)  -> 1.15
> ```
> On raw dot products, the laptop stand (1.15) beats the webcam (0.88) for "most similar to the earbuds." But the laptop stand's description happens to be long and repetitive, which inflated its vector's magnitude to 4.87 — nearly 5x the webcam's 0.89 — without making its *content* any more related to earbuds. Once you normalize, the truth comes out: cosine similarity puts the webcam at 0.985 (genuinely close) and the laptop stand at 0.235 (not close at all). Raw dot product conflates "says similar things" with "has a longer or more repetitive description," and only one of those is what you actually want to measure. This is the standard justification for L2-normalizing before [semantic similarity search](/learn/rag/embeddings-and-semantic-similarity) — otherwise verbosity masquerades as relevance.

## Where it breaks

### Break 1: a zero-variance column turns standardization into NaN

Say a data-entry bug records every product's weight as exactly `0.5`:

```python
X_bug = X.copy()
X_bug[:, 1] = 0.5

std_bug = X_bug.std(axis=0)
print(std_bug)  # [ 27.37   0.   397.62]

Z_bug = (X_bug - X_bug.mean(axis=0)) / std_bug
print(Z_bug[:, 1])  # [nan nan nan nan nan]
```

No exception, no warning you'll necessarily notice in a pipeline — just `0 / 0` producing `nan`, silently, in the one column that had no spread. Everything downstream that touches that column (a distance calculation, a model input) now silently carries `nan` too.

**Fix:** guard the denominator, or drop the column before it gets this far:

```python
eps = 1e-8
Z_fixed = (X_bug - X_bug.mean(axis=0)) / (std_bug + eps)
print(Z_fixed[:, 1])  # [0. 0. 0. 0. 0.]
```

With the epsilon, a zero-variance column becomes a column of zeros — "this feature had no information, so it contributes nothing" — instead of poisoning the row with `nan`. This is also a case worth catching earlier, as part of [validating your data](/learn/python-data-apis/validating-dataframes-with-schemas) before it ever reaches a NumPy array.

### Break 2: forgetting `keepdims` breaks the broadcast entirely

```python
flat_norms = np.linalg.norm(E, axis=1)  # no keepdims
print(flat_norms.shape)  # (5,)

broken = E / flat_norms
```

```text
ValueError: operands could not be broadcast together with shapes (5,4) (5,)
```

This one at least fails loudly — NumPy tries to line up `(5,)` against the *last* axis of `(5, 4)`, sees 5 doesn't match 4, and refuses. That's actually the safer failure mode. The dangerous version is when the shapes accidentally *do* line up (say you had exactly 4 products instead of 5) — then it broadcasts the wrong way with no error at all, quietly normalizing by the wrong axis, and you get a matrix of nonsense that still looks like valid output.

**Fix:** keep the reduced axis as a size-1 dimension so the broadcast can only align one way:

```python
norms = np.linalg.norm(E, axis=1, keepdims=True)  # (5, 1)
E_norm = E / norms                                 # (5, 4) — broadcasts correctly
```

### Break 3: a blank input produces a zero vector, and zero has no direction

A sixth product gets added with a missing description — the encoder returns all zeros for it:

```python
E_missing = np.vstack([E, np.zeros((1, 4))])
norms_missing = np.linalg.norm(E_missing, axis=1, keepdims=True)
print(norms_missing.ravel())  # [1.005 2.01  4.873 0.889 0.1   0.   ]

E_missing_norm = E_missing / norms_missing
print(E_missing_norm[-1])  # [nan nan nan nan]
```

A zero vector has no direction to normalize *to* — dividing by a norm of 0 gives `nan` for that entire row. If this feeds a similarity search, that row will compare as `nan` against everything, which can quietly knock real results out of a top-k ranking depending on how your comparison handles `nan`.

**Fix:** treat a zero norm as its own case — leave the row at zero rather than dividing into it, and handle the missing input further upstream if you can:

```python
safe_norms = np.where(norms_missing == 0, 1.0, norms_missing)
E_missing_fixed = E_missing / safe_norms
print(E_missing_fixed[-1])  # [0. 0. 0. 0.]
```

A zero-vector row similarity of 0 with everything is a defensible fallback — "we don't know anything about this one" — which is a much safer default than `nan` silently spreading. The real fix is catching the [missing description](/learn/python-data-apis/handling-missing-values) before it ever reaches the encoder, but the safety net matters because upstream data quality never stays perfect for long.

## Takeaways

- **Standardization and L2 normalization solve different problems.** Standardizing rescales *columns* (features) so no single feature dominates a comparison because of its raw units. L2-normalizing rescales *rows* (individual vectors) so magnitude — length, verbosity, whatever produced a bigger vector — stops masquerading as similarity.
- **The axis argument is the whole ballgame.** `axis=0` for per-feature stats over a table, `axis=1` for per-row norms over embeddings. Get it backwards and NumPy usually won't error — it'll just hand you a number that looks plausible and is wrong.
- **`keepdims=True` isn't optional when you're about to broadcast-divide.** Without it you either get a hard `ValueError` (the safe failure) or, worse, a shape that happens to align on the wrong axis (the dangerous one).
- **Once rows are unit vectors, cosine similarity is just `@`.** Normalize once, then every future comparison — one pair or a full similarity matrix — is a plain dot product. That's not an approximation; it's the same formula with the denominator already baked in.
- **Zero variance and zero vectors both fail the same way: division by zero, silently, as `nan`.** Neither raises by default. Decide explicitly what a "no information" row should mean in your pipeline — a zero, a dropped column, a flag for review — rather than discovering `nan` three steps downstream.

**Related:** [NumPy arrays fundamentals](/learn/python-data-apis/numpy-arrays-fundamentals) · [Indexing and broadcasting](/learn/python-data-apis/numpy-indexing-and-broadcasting) · [The geometry of embeddings](/learn/maths-foundations/the-geometry-of-embeddings) · [Cosine similarity and angular distance](/learn/maths-foundations/cosine-similarity-angular-distance-embedding-retrieval) · [Embeddings and semantic similarity](/learn/rag/embeddings-and-semantic-similarity) · [Handling missing values](/learn/python-data-apis/handling-missing-values)
