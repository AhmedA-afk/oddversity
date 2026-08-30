---
title: "Quiz: NumPy Arrays"
track: "python-data-apis"
status: live
summary: "A 6-question self-check quiz on NumPy arrays covering broadcasting shape prediction (including the row-vs-column outer-sum trap and left-vs-right alignment), choosing axis=0 vs axi"
duration: "12 min read"
---

You've read about broadcasting and axis reductions — now find out whether you'd actually predict them right under pressure, before a silent shape mismatch costs you an afternoon of debugging.

## 1. Broadcasting a row across a matrix

```python
import numpy as np

a = np.array([[1, 2, 3],
              [4, 5, 6]])          # shape (2, 3)
b = np.array([10, 20, 30])         # shape (3,)

result = a + b
```

What is `result`, and what shape does it have?

- **A.** A `ValueError`, because a 2-D array and a 1-D array can't be added
- **B.** `[[11, 22, 33], [4, 5, 6]]`, shape `(2, 3)` — `b` only gets added to the first row
- **C.** `[[11, 22, 33], [14, 25, 36]]`, shape `(2, 3)`
- **D.** `[[11, 22, 33], [14, 25, 36]]`, shape `(2, 3, 3)` — NumPy adds a new axis to reconcile the mismatch

<details><summary>Answer</summary>

**Correct: C.** NumPy compares shapes from the *trailing* axis inward. `a` is `(2, 3)`, `b` is `(3,)` — pad `b` with a leading `1` to get `(1, 3)`, then compare: last axis `3` matches `3`, and the size-`1` axis stretches to match `2`. So `b` gets added to every row: `[1,2,3]+[10,20,30]=[11,22,33]` and `[4,5,6]+[10,20,30]=[14,25,36]`. No copies of `b` are actually made — NumPy just reuses it across rows — but the *logical* result is as if it were.

**A** assumes NumPy needs matching ndim to add arrays, but broadcasting exists precisely so that a `(3,)` array can stand in for a `(2, 3)` one. This only becomes a real error when the shapes genuinely conflict after alignment (see question 2).

**B** is the "broadcasting only happens once" trap — as if `b` gets consumed after the first row. Broadcasting isn't a one-shot event; it's a rule about how shapes are interpreted for *every* element, so `b` applies to every row identically.

**D** confuses broadcasting with stacking. Broadcasting never adds a dimension to the *output* — it only conceptually pads the smaller *input's* shape during comparison so the ranks line up. The result always has the same number of dimensions as whichever input had the most axes here, i.e. 2, not 3.

</details>

## 2. When broadcasting should fail

```python
import numpy as np

a = np.array([[1, 2, 3],
              [4, 5, 6]])   # shape (2, 3)
b = np.array([10, 20])      # shape (2,)

result = a + b
```

What happens here?

- **A.** It raises a `ValueError` — the trailing dimensions (`3` and `2`) don't match and neither is `1`
- **B.** It works and returns `[[11, 12, 13], [24, 25, 26]]`, shape `(2, 3)` — `b`'s two values line up with `a`'s two rows
- **C.** It works and returns a `(2, 2)` array, trimming `a` down to match `b`
- **D.** It works and returns `[[11, 22, 13], [24, 15, 26]]`, shape `(2, 3)` — NumPy cycles `b`'s values across the columns to fill the gap

<details><summary>Answer</summary>

**Correct: A.** Alignment always starts from the *last* axis and works backward — never from the first. `a` is `(2, 3)`, `b` is `(2,)`. Compare trailing axes: `3` vs `2`. Neither matches, and neither is `1`, so there's no rule that saves it. NumPy raises exactly this: `operands could not be broadcast together with shapes (2,3) (2,)`. The fix, if you meant "add 10 to row 0 and 20 to row 1," is to reshape `b` to `(2, 1)` first — `b.reshape(-1, 1)` — so it aligns on the *first* axis instead.

**B** is the most common broadcasting misconception there is: pairing arrays by their *leading* axis because "2 matches 2." NumPy deliberately aligns from the right instead, which is exactly why a length-3 "per-feature" vector broadcasts naturally across any number of rows in question 1 — aligning from the left would break that every time the row count changed. It's a sensible-sounding rule that happens to be backward from the one NumPy actually uses.

**C** imagines broadcasting can shrink an array down to the smaller shape. Broadcasting only ever *grows* size-`1` axes to match — it never removes or truncates real data from an input.

**D** confuses broadcasting with `np.tile` or `np.resize`, which really do repeat values to fill a target length. Broadcasting has a strict compatibility rule (match, or one side is `1`) — it never invents repetition to paper over an actual mismatch like `3` vs `2`.

</details>

## 3. The column-vector trap

```python
import numpy as np

col = np.array([[1], [2], [3]])   # shape (3, 1)
row = np.array([10, 20, 30])       # shape (3,)

result = col + row
```

What shape is `result`?

- **A.** `(3,)`
- **B.** It raises a `ValueError` — `1` and `3` can't be reconciled on the same axis
- **C.** `(1, 3)`
- **D.** `(3, 3)`

<details><summary>Answer</summary>

**Correct: D.** Align from the right: `col` is `(3, 1)`, `row` is `(3,)` → padded to `(1, 3)`. Compare axis by axis: last axis `1` vs `3` → stretch the `1` to `3`. First axis `3` vs `1` → stretch the *other* array's `1` to `3`. Both arrays end up conceptually `(3, 3)`, and you get every pairwise sum — an outer sum:

```python
result
# array([[11, 21, 31],
#        [12, 22, 32],
#        [13, 23, 33]])
```

This is the single most useful broadcasting trick in NumPy (it's exactly how you'd build a distance or similarity matrix), and also the easiest one to trigger by accident — a stray `.reshape(-1, 1)` you forgot about turns an intended elementwise op into a full outer product, silently, with no error to warn you.

**A** assumes the two `3`s are "the same 3" and pair up elementwise like `zip`. But `col`'s `3` lives on axis 0 and `row`'s `3` lives on axis 1 (after padding) — they're different axes that both happen to have length 3, and broadcasting doesn't know or care that they came from "matching" source data.

**B** correctly notices there's a `1` and a `3` in play, but gets the rule backward: a dimension of `1` is exactly the case that's *allowed* to stretch. A `ValueError` would only happen if both non-matching dimensions were something other than `1`, e.g. `(3, 2) + (3,)`.

**C** assumes the row vector "wins" and the column vector's shape just gets discarded. Broadcasting never discards a real (non-1) dimension from either input — both `3`s survive into the output, which is exactly why you get `3×3`, not `3`.

</details>

## 4. Picking the axis for a column-wise total

```python
import numpy as np

sales = np.array([[1, 2, 3],
                   [4, 5, 6]])
# rows = days, columns = products
```

You want one total *per product* — i.e., summed down each column, collapsing the days. Which call gives you that?

- **A.** `sales.sum(axis=1)`
- **B.** `sales.sum(axis=0)`
- **C.** `sales.sum(axis=-1)`
- **D.** `sales.sum()`

<details><summary>Answer</summary>

**Correct: B.** `sales.sum(axis=0) → array([5, 7, 9])` — one value per column. The rule that actually sticks: `axis=N` names the axis that *disappears* from the output, not the axis you "move along" in some intuitive row/column sense. Axis 0 is the day axis; summing over it collapses the days and leaves one number per product. If you want to double check without memorizing anything: the output shape drops exactly the axis you named — `(2, 3)` with `axis=0` removed leaves `(3,)`, which is your 3 per-product totals.

**A** is the classic flip. `sales.sum(axis=1) → array([6, 15])` collapses the *columns* instead, giving one total per day — the opposite of what was asked. This mistake is common precisely because "`axis=0`" sounds like it should mean "operate on the rows" (index 0 = rows, so "row-wise"), when it actually means "collapse the row axis," which produces a per-column result. Say the rule out loud until the direction stops feeling backward: **the axis you name is the one that vanishes.**

**C** is a real, working axis — but for a 2-D array `axis=-1` is just another name for `axis=1` (the last axis), so it gives the same wrong per-day totals as A, `[6, 15]`. `axis=-1` is genuinely useful for writing code that works regardless of how many dimensions an array has, but it isn't "the other axis" — it's always the *last* one.

**D** with no axis argument collapses *everything* into a single scalar (`21` here), losing both the day and product breakdown. Good for "what's the grand total," useless for "what's the total per product."

</details>

## 5. Combining a reduction with broadcasting

```python
import numpy as np

data = np.array([[1., 2., 3.],
                  [4., 5., 6.]])

row_means = data.mean(axis=1)
centered = data - row_means
```

The intent is to subtract each row's own mean from that row (row 0 minus `2.0`, row 1 minus `5.0`). What actually happens when this runs?

- **A.** It works exactly as intended: `[[-1, 0, 1], [-1, 0, 1]]`
- **B.** It runs without error but produces the wrong numbers silently
- **C.** It raises a `TypeError`, because you can't subtract a 1-D array from a 2-D one
- **D.** It raises a `ValueError`, because `row_means` has shape `(2,)` and can't align against `data`'s shape `(2, 3)`

<details><summary>Answer</summary>

**Correct: D.** `data.mean(axis=1)` collapses axis 1, so `row_means` has shape `(2,)` — the mean *per row*, but stored as a flat vector with no memory of "which axis it came from." When you then compute `data - row_means`, broadcasting aligns from the right: `data` is `(2, 3)`, `row_means` is `(2,)` → padded to `(1, 2)`. Trailing axes: `3` vs `2` — mismatch, neither is `1`. `ValueError`.

The fix is `data.mean(axis=1, keepdims=True)`, which gives shape `(2, 1)` instead of `(2,)` — that extra `1` is exactly the size-1 axis that's allowed to stretch across all 3 columns, landing each row's mean back on that row. `data.mean(axis=1).reshape(-1, 1)` does the same thing manually. This keepdims-for-broadcasting pattern is worth internalizing early — see [numpy-indexing-and-broadcasting](/learn/python-data-apis/numpy-indexing-and-broadcasting) and the worked [normalize-features example](/learn/python-data-apis/numpy-normalize-features-example) for the full pattern applied to real feature scaling.

**A** is what you *want*, and it's exactly what you'd get with `keepdims=True` — but without it, this line never reaches that result; it errors out first.

**B** describes a real and much scarier failure mode that just doesn't happen to trigger *here* — but it will on a square matrix. If `data` were `(3, 3)`, `data.mean(axis=1)` would also be shape `(3,)`, and `3` vs `3` *does* satisfy the broadcast rule — so `data - row_means` would run with no error at all, silently subtracting the per-row means as if they were a *row to subtract from every row* (i.e., treating them as column means instead). Same code, wrong axis semantics, zero warning. That's the real danger of skipping `keepdims`: on non-square data it crashes loudly; on square data it corrupts your numbers quietly. Always reach for `keepdims=True` on purpose rather than relying on a shape mismatch to catch you.

**C** gets the failure right in spirit but the exception type wrong — shape incompatibility during arithmetic is a `ValueError` in NumPy, not a `TypeError`. `TypeError` shows up for things like mixing incompatible *dtypes* in an operation that truly can't be coerced, not for shape mismatches.

</details>

## 6. The slice that mutates the original

```python
import numpy as np

prices = np.array([100, 105, 98, 110, 95])
recent = prices[1:4]
recent[0] = 0

print(prices)
```

What does this print?

- **A.** `[100 105  98 110  95]`
- **B.** `[100   0  98 110  95]`
- **C.** A `ValueError`, because `recent` is a read-only view
- **D.** `[100 105  98 110  95]` — `prices` is protected because NumPy uses copy-on-write, like pandas 2.x

<details><summary>Answer</summary>

**Correct: B.** Basic slicing (`start:stop:step`, no lists or booleans involved) never copies data — it returns a **view**: a new array header pointing at the *same underlying memory* as `prices`. `recent[0] = 0` writes into that shared memory, so `prices[1]` — which is the same byte — becomes `0` too. You can confirm the aliasing directly: `recent.base is prices` is `True`. This is the bug worth internalizing before it costs you: any function that slices an array and then mutates "its own copy" for convenience is quietly mutating the caller's data too, unless it calls `.copy()` first. It's the array-level cousin of the mistake covered in [pandas-settingwithcopy-mistakes](/learn/python-data-apis/pandas-settingwithcopy-mistakes) — same root cause (a view masquerading as independent data), different library.

**A** is the "indexing always copies" myth, and it's half-right — just not for basic slicing. **Fancy indexing** (`prices[[1, 2, 3]]`) and **boolean indexing** (`prices[prices > 100]`) genuinely do return independent copies; mutating those never touches `prices`. The type of indexing you use determines view-vs-copy, and it's easy to test yourself: check `.base` — `None` means it's a copy, anything else means it's a view sharing that memory.

**C** over-corrects into the opposite myth. NumPy views are writable by default — that's the entire point of a view; it exists so you *can* edit a subset of an array in place without copying it. You'd only get a read-only error if something explicitly set `.flags.writeable = False` on the array, which doesn't happen from slicing alone.

**D** borrows a real feature from the wrong library. Pandas 2.x does ship a copy-on-write mode where a modification to a derived object triggers a fresh copy behind the scenes rather than touching the source. Base NumPy has no such mechanism — arrays and their views share memory permanently until one side is explicitly copied with `.copy()`. If you're moving between the two libraries, don't assume NumPy's aliasing rules got the pandas upgrade; they didn't.

</details>

**Related:** [NumPy arrays fundamentals](/learn/python-data-apis/numpy-arrays-fundamentals) · [NumPy indexing and broadcasting](/learn/python-data-apis/numpy-indexing-and-broadcasting) · [Normalize features with NumPy](/learn/python-data-apis/numpy-normalize-features-example) · [Why arrays beat lists](/learn/python-data-apis/why-arrays-beat-lists-intuition) · [Pandas SettingWithCopy mistakes](/learn/python-data-apis/pandas-settingwithcopy-mistakes)
