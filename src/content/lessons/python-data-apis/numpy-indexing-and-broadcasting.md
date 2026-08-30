---
title: "Indexing, Masks, and Broadcasting"
track: "python-data-apis"
status: live
summary: "A hands-on walkthrough of slicing, boolean masks, fancy indexing, and reshape on a real feature matrix, ending with vectorized per-column mean subtraction via broadcasting — with t"
duration: "22 min read"
---

You already know a NumPy array is a grid of numbers with a shape and a dtype. The real skill is pulling exactly the slice you want out of that grid — and doing it without writing a single `for` loop.

## What we're building

You'll build an 8-row, 4-column feature matrix — think of it as engagement data for 8 learners, with columns for `minutes_active`, `lessons_completed`, `quiz_avg`, and `streak_days`. Then you'll work it four ways: slice it, filter it with a boolean mask, reorder it with fancy indexing, and reshape it. You'll finish by centering every column — subtracting each feature's mean from every value in that column — in one line, with no loop, and you'll walk through exactly why NumPy lets you subtract a length-4 array from an 8×4 matrix.

Everything below is copy-paste runnable. Every number in the "Run it" section is the real output of the code, not a guess.

## Setup

You need Python 3.10+ and NumPy. If you haven't set up an isolated environment yet, do that first — see [Python environments and venv](/learn/python-data-apis/python-environments-and-venv) — then install NumPy inside it:

```bash
python3 -m venv .venv
source .venv/bin/activate    # Windows: .venv\Scripts\activate
pip install numpy
```

Any reasonably current NumPy works here (1.24+ or the 2.x line). Open a REPL, a script, or a notebook — this lesson assumes nothing beyond `import numpy as np`.

If arrays themselves are still new territory, [NumPy arrays fundamentals](/learn/python-data-apis/numpy-arrays-fundamentals) is the page to read first — this lesson picks up right where it leaves off.

## Build it

### Step 1: Create the feature matrix and check its shape

```python
import numpy as np

# rows = learners, columns = [minutes_active, lessons_completed, quiz_avg, streak_days]
X = np.array([
    [ 42.0,  3.0,  88.5,  2.0],
    [ 15.0,  1.0,  61.0,  0.0],
    [ 97.0,  7.0,  93.2,  9.0],
    [  8.0,  1.0,  45.0,  0.0],
    [ 60.0,  4.0,  77.8,  3.0],
    [ 33.0,  2.0,  70.1,  1.0],
    [120.0,  9.0,  95.0, 14.0],
    [ 25.0,  2.0,  55.5,  1.0],
])
feature_names = ["minutes_active", "lessons_completed", "quiz_avg", "streak_days"]

print(X.shape)   # (8, 4)
print(X.dtype)   # float64
```

The convention that matters for everything that follows: **rows are observations, columns are features.** `X.shape` is `(8, 4)` — 8 learners, 4 features — and every operation below either picks rows, picks columns, or acts on both axes at once. Get this orientation wrong and every slice you write next will select the wrong thing.

### Step 2: Slice rows, columns, and windows

```python
X[0]         # first row -> array([42. ,  3. , 88.5,  2. ])
X[:, 2]      # the quiz_avg column, all rows
X[2:5, :]    # rows 2, 3, 4 (row 5 excluded), all columns
X[::2]       # every other row, starting at 0
```

`X[:, 2]` is the pattern to internalize: the first slot is the row selector, the second is the column selector, and `:` means "all of this axis." So `X[:, 2]` reads as "all rows, column 2" — it pulls out `quiz_avg` as a 1-D array of length 8. `X[2:5, :]` reads as "rows 2 up to but not including 5, all columns" — a 3×4 sub-matrix.

One thing worth knowing before you rely on it: basic slices like these return a **view**, not a copy. `X[2:5, :]` shares memory with `X` — mutate the slice and you mutate the original array. That's a deliberate NumPy performance choice (no data gets copied just to look at it), and it's exactly the behavior you want when you *do* mean to edit in place. Keep it in mind, because the next two techniques behave differently.

### Step 3: Build a boolean mask and filter rows by threshold

This is the "select rows where a score exceeds a threshold" piece from the brief, and it's the single most useful pattern in this lesson:

```python
mask = X[:, 2] > 80
print(mask)
# array([ True, False,  True, False, False, False,  True, False])

high_scorers = X[mask]
print(high_scorers)
# array([[ 42. ,   3. ,  88.5,   2. ],
#        [ 97. ,   7. ,  93.2,   9. ],
#        [120. ,   9. ,  95. ,  14. ]])
```

`X[:, 2] > 80` doesn't loop over the column — it applies `>` element-wise and hands back a boolean array the same length as the column. `X[mask]` then keeps every row where the mask is `True` and drops the rest. Three of the eight learners have a `quiz_avg` above 80, and that's exactly what comes back.

Combine conditions with `&` and `|` (never Python's `and`/`or` — those don't vectorize), and wrap each condition in parentheses because `&` binds tighter than `>`:

```python
engaged_and_good = (X[:, 2] > 60) & (X[:, 3] >= 2)
X[engaged_and_good]
# keeps learners with quiz_avg > 60 AND streak_days >= 2 -> 4 rows
```

Unlike a plain slice, indexing with a boolean mask always returns a **copy**. Editing `high_scorers` won't touch `X`. But assigning *through* a mask — `X[mask, 0] = 0` — does mutate `X` directly, because that's a `__setitem__` call on the original array, not an edit of an already-materialized copy. Both things are true at once, and the distinction (reading vs. assigning) is what determines whether you're touching a copy or the original.

### Step 4: Fancy indexing to rank and reorder

Fancy indexing means indexing with a list or array of integers instead of a slice. It's how you reorder rows, not just filter them:

```python
order = np.argsort(X[:, 2])[::-1]   # row indices, quiz_avg descending
print(order)
# array([6, 2, 0, 4, 5, 1, 7, 3])

ranked = X[order]        # the whole matrix, reordered by quiz_avg
top3 = X[order[:3]]      # just the top 3 rows
```

`np.argsort` doesn't sort the values — it returns the *indices* that would sort them. `[::-1]` reverses that to get descending order. Then `X[order]` uses those indices to pull rows out in ranked order: row 6 (`quiz_avg` 95.0) first, row 2 (93.2) second, and so on.

The same mechanism works on columns — pass the integer list as the second index to reorder features:

```python
col_order = [2, 0, 3, 1]   # quiz_avg, minutes_active, streak_days, lessons_completed
X[:, col_order]
```

Like boolean masking, fancy indexing always returns a copy — `X[order]` and `X` share no memory, so reordering never disturbs your original matrix. That's usually what you want: rank a dataset for display without worrying about corrupting the source.

### Step 5: Reshape without copying data

`.reshape()` changes how the same underlying numbers are grouped into axes, without touching a single value:

```python
batches = X.reshape(2, 4, 4)   # 2 batches of 4 learners x 4 features
print(batches.shape)           # (2, 4, 4)
print(batches[0])              # the first 4 learners, same values as X[:4]
```

The rule: the total element count must stay the same. `X` has 8 × 4 = 32 numbers; `(2, 4, 4)` also multiplies out to 32, so it's valid. `X.reshape(5, 5)` would fail immediately — 25 ≠ 32 — and NumPy raises a `ValueError` rather than guessing what you meant. You can also hand it a `-1` for one dimension and let NumPy compute it: `X.reshape(4, -1)` infers `8` for the second axis on its own.

Reshape returns a view whenever the array's memory layout allows it — mutate the reshaped array and, in the common case, you mutate the original too. It only falls back to copying when the data isn't laid out contiguously enough to reinterpret in place (for example, reshaping the result of a transpose). Either way the values you get back are correct; what changes is just whether editing one edits the other, which matters if you're relying on in-place mutation for performance.

### Step 6: Broadcast a per-column mean subtraction — no loop

Here's the payoff. You want to subtract each column's mean from every value in that column, for all 8 rows, in one shot:

```python
col_means = X.mean(axis=0)
print(col_means)
# array([50.    ,  3.625 , 73.2625,  3.75  ])

centered = X - col_means
```

`axis=0` means "collapse the rows, keep the columns" — `X.mean(axis=0)` produces one mean per column, so `col_means` has shape `(4,)`. `X` has shape `(8, 4)`. Those shapes don't match, and yet `X - col_means` works. That's broadcasting, and the rule behind it is worth memorizing rather than just trusting:

> **Broadcasting rule:** compare two shapes starting from the *right-hand* (last) dimension and working left. Two dimensions are compatible if they're equal, or if either one is 1, or if one array simply has no dimension there (treated as if it were 1). If every pair of dimensions clears one of those, the shapes broadcast — and any dimension that's 1 (or missing) gets conceptually stretched to match the other.

Applied here: `X` is `(8, 4)`, `col_means` is `(4,)`. Line up the trailing dimensions — `4` and `4` — equal, so that pair is fine. `col_means` has no dimension to the left of that, so NumPy treats it as if it were shape `(1, 4)`, and that leading `1` stretches to `8` to match `X`'s row count. The subtraction runs as though `col_means` had been copied into all 8 rows — without NumPy ever actually allocating that duplicated 8×4 array in memory.

Check the result: subtracting the column mean should leave each column averaging to (essentially) zero.

```python
print(centered.mean(axis=0))
# array([ 0.00000000e+00,  0.00000000e+00, -3.55271368e-15,  0.00000000e+00])
```

Three columns land exactly on `0.0`; `quiz_avg` lands on `-3.55e-15` — a floating-point rounding artifact, not a bug. Wanting genuinely zero output there would mean fighting how binary floats represent decimals like `73.2625`, which no amount of correct NumPy code changes.

Divide by the per-column standard deviation on top of that and you've built a full z-score standardization — the exact preprocessing step most models expect as input — in two broadcasted lines and zero loops:

```python
col_stds = X.std(axis=0)
z = (X - col_means) / col_stds
print(z.mean(axis=0))   # ~0 for every column
print(z.std(axis=0))    # array([1., 1., 1., 1.])
```

## Run it

Paste Steps 1 through 6 into one file (or run the snippets in order in a notebook) and execute it:

```bash
python3 feature_matrix.py
```

Here's what a representative slice of that output looks like, so you can confirm your run matches:

```text
X.shape: (8, 4)
mask: [ True False  True False False False  True False]
high_scorers rows: 3
order (quiz_avg desc): [6 2 0 4 5 1 7 3]
col_means: [50.     3.625 73.2625  3.75  ]
centered.mean(axis=0): [0. 0. -3.55e-15 0.]
z.std(axis=0): [1. 1. 1. 1.]
```

If your `mask` doesn't come back `[True, False, True, False, False, False, True, False]`, double check you're comparing `X[:, 2]` (the `quiz_avg` column) and not a different column index — that's the most common off-by-one here. If `order` doesn't start with `6`, check whether you applied `[::-1]` — without it, `argsort` gives you ascending order, and your "top" learner would actually be your lowest scorer.

## Harden it

Real feature matrices don't come pre-cleaned, and a few of these operations have sharp edges worth knowing about before they bite you in production code.

**NaN silently fails your mask instead of raising.** If a value is missing and stored as `np.nan`, a comparison against it doesn't error — it just quietly evaluates to `False`:

```python
Y = X.copy()
Y[1, 2] = np.nan
print(Y[:, 2] > 80)       # [ True False  True False False False  True False]
print(np.isnan(Y[:, 2]))  # [False  True False False False False False False]
```

Row 1 vanishes from your "high scorers" mask not because it failed the threshold, but because `NaN > 80` is `False` by definition, and so is `NaN <= 80` — NaN fails every ordinary comparison. If missing data is possible, check `np.isnan()` explicitly rather than trusting a threshold mask to surface it. This is exactly the failure mode covered in [handling missing values](/learn/python-data-apis/handling-missing-values).

**Mismatched shapes fail loudly — read the message, don't guess.** Try to subtract an array whose trailing dimension doesn't match:

```python
row_something = np.array([1.0, 2.0, 3.0])   # length 3, but X has 4 columns
X - row_something
# ValueError: operands could not be broadcast together with shapes (8,4) (3,)
```

The error names both shapes so you can immediately see the mismatch: `4` versus `3` on the trailing axis, no `1` on either side to absorb the difference. When this happens on real data it's almost always because you computed a summary statistic (a mean, a max) over the wrong axis — `axis=0` versus `axis=1` — so the fix is usually to check which axis you collapsed, not to force a reshape.

**A boolean mask must match the array's length on that axis, or indexing fails outright:**

```python
bad_mask = np.array([True, False, True])   # length 3, X has 8 rows
X[bad_mask]
# IndexError: boolean index did not match indexed array along axis 0;
# size of axis is 8 but size of corresponding boolean axis is 3
```

This surfaces immediately if the mask comes from `X` itself, but it's a real risk if you build a mask from one array and apply it to a differently-filtered one — always derive the mask from the same array (or the same row count) you intend to index.

**Reshape can silently copy instead of viewing — check with `np.shares_memory` if it matters.** Reshaping a transposed array is a common trap:

```python
t = X.T                      # transpose: shape (4, 8), non-contiguous memory
r = t.reshape(-1)
np.shares_memory(r, X)       # False — this reshape had to copy
```

The values in `r` are still correct. What's different is that mutating `r` no longer touches `X`, and if you wrote code assuming otherwise (say, for in-place performance), that assumption just quietly broke. When it matters, check `np.shares_memory()` rather than assuming.

**Validate shapes at the boundary of a function, not deep inside a broadcasting expression.** In a script it's fine to let a bad shape raise; in a function other code calls, fail with a message that says what's actually wrong:

```python
def center_columns(X, col_means):
    if col_means.shape != (X.shape[1],):
        raise ValueError(
            f"col_means shape {col_means.shape} doesn't match "
            f"X's {X.shape[1]} columns"
        )
    return X - col_means
```

This is the same instinct behind [data contracts and validation](/learn/python-data-apis/data-contracts-and-validation): catch a shape mismatch at the function boundary with a clear message, instead of leaving your caller to decode a raw broadcasting error three stack frames deep.

## Extend it

You've now got the four indexing patterns and the broadcasting rule that together cover the overwhelming majority of real NumPy work. A few directions to take it from here:

- **Full standardization pipeline.** You already built the z-score in Step 6 — see [normalizing features with NumPy](/learn/python-data-apis/numpy-normalize-features-example) for the complete version, including handling a zero-standard-deviation column (a constant feature) without dividing by zero.
- **The same patterns in pandas.** Once your matrix has named, mixed-type columns instead of a plain float grid, this exact vocabulary — boolean masks, `.loc[]` fancy indexing — carries over almost unchanged; see [selecting, filtering, and indexing in pandas](/learn/python-data-apis/selecting-filtering-indexing) and [pandas DataFrames fundamentals](/learn/python-data-apis/pandas-dataframes-fundamentals).
- **Think of each row as a vector.** Centering and scaling columns is the first step toward comparing rows geometrically — nearest-neighbor search, similarity, clustering. [What is a vector](/learn/maths-foundations/what-is-a-vector) is the natural next stop if that direction interests you.
- **Check your understanding.** Run through the [NumPy quiz](/learn/python-data-apis/numpy-quiz) to confirm the shape rules actually stuck before you move on.

**Related:** [NumPy arrays fundamentals](/learn/python-data-apis/numpy-arrays-fundamentals) · [Normalizing features with NumPy](/learn/python-data-apis/numpy-normalize-features-example) · [Selecting, filtering, and indexing in pandas](/learn/python-data-apis/selecting-filtering-indexing) · [Handling missing values](/learn/python-data-apis/handling-missing-values) · [Data contracts and validation](/learn/python-data-apis/data-contracts-and-validation) · [NumPy quiz](/learn/python-data-apis/numpy-quiz)
