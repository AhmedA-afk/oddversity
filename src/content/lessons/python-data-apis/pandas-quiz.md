---
title: "Quiz: pandas DataFrames"
track: "python-data-apis"
status: live
summary: "A 6-question self-check on pandas DataFrames: loc vs iloc (label vs position, inclusive vs exclusive slicing), predicting groupby.agg output, picking the right merge how=, spotting"
duration: "15 min read"
---

Six scenarios, no trivia — every wrong option here is a mistake someone actually ships. Read the code, predict the output before you scroll, then check not just whether you got it right but whether you know why the other three are wrong.

## 1. A leaderboard, sorted

You build a quick leaderboard. Two scores tie, so you sort descending — and the row labels come along for the ride instead of resetting to 0, 1, 2, 3.

```python
import pandas as pd

scores = pd.DataFrame({
    "player": ["nova", "kip", "wren", "ash"],
    "score":  [88, 95, 71, 95],
})

top = scores.sort_values("score", ascending=False)
print(top)
```

```
  player  score
1    kip     95
3    ash     95
0   nova     88
2   wren     71
```

What do `top.loc[1]` and `top.iloc[1]` return?

- A. Both return kip's row — once you sort, `.loc` and `.iloc` line back up.
- B. `top.loc[1]` returns kip's row; `top.iloc[1]` returns ash's row.
- C. `top.loc[1]` raises a `KeyError` — label `1` no longer exists after sorting.
- D. `top.iloc[1]` returns kip's row; `top.loc[1]` returns ash's row.

<details><summary>Answer</summary>

**Correct: B.** `sort_values` reorders rows but never touches their index labels — kip's row was built with label `1` and keeps it no matter where it physically ends up. `top.loc[1]` looks up *label* 1 and finds kip. `top.iloc[1]` ignores labels and grabs whatever sits in physical row 1 of the *current* order — after sorting, that's ash. Same digit, two different rows, because one indexer reads labels and the other reads position — see [selecting, filtering, and indexing](/learn/python-data-apis/selecting-filtering-indexing) for the full mental model.

**A.** Tempting because `.loc[1]` and `.iloc[1]` do agree — but only when the index is still its untouched default `0..n-1` order. The moment you sort, filter, concatenate, or set a custom index, that coincidence breaks, and the two indexers quietly start disagreeing for the same integer.

**C.** Label `1` never went anywhere — `sort_values` (like `sort_index`, boolean masks, `.drop()`, etc.) rearranges or removes rows without renumbering the survivors. You'd only get a `KeyError` here after calling `.reset_index(drop=True)`, which replaces the labels with a fresh range.

**D.** This swaps which indexer does what. `.iloc` is the position-based one; `.loc` is the label-based one. Memorize it by the vowel: `.loc` = **lo**okup by label.

</details>

## 2. Where does the slice end?

Same distinction, different failure mode: slicing instead of single-row lookup.

```python
import pandas as pd

df = pd.DataFrame({
    "day":    [1, 2, 3, 4, 5],
    "visits": [120, 135, 98, 142, 110],
})

a = df.loc[1:3]
b = df.iloc[1:3]
```

How many rows end up in `a` and in `b`?

- A. 2 rows in both — both slices exclude the stop value, same as Python list slicing.
- B. 3 rows in `a`, 2 rows in `b`.
- C. 2 rows in `a`, 3 rows in `b`.
- D. 3 rows in both — a colon slice is inclusive on both indexers.

<details><summary>Answer</summary>

**Correct: B.** `df.loc[1:3]` is a *label* slice: it keeps every row from label `1` through label `3` **inclusive** — three rows. `df.iloc[1:3]` is a *position* slice, and position slicing follows the same convention as ordinary Python list slicing — stop is **exclusive** — so it keeps positions 1 and 2, two rows. Same two numbers, different rule, because `.loc` is answering "which labels" (where there's no natural "one past" a label) and `.iloc` is answering "which positions" (where there is).

**A.** This describes `.iloc`, not `.loc`. Assuming `.loc` slicing behaves like a Python list slice is one of the most common off-by-one bugs when porting NumPy or list code to pandas.

**C.** Backwards — `.loc` is the inclusive one, `.iloc` is the exclusive one, for the reason above.

**D.** Only `.loc` is inclusive; `.iloc` keeps its exclusive stop no matter the syntax. If both indexers were inclusive, `df.iloc[0:len(df)]` would overshoot and raise an `IndexError` instead of returning the whole frame.

</details>

## 3. What did that aggregation actually compute?

You group sales by region and ask for three summary stats in one call — the bread and butter of [groupby and aggregation](/learn/python-data-apis/groupby-and-aggregation).

```python
import pandas as pd

sales = pd.DataFrame({
    "region": ["east", "east", "west", "west", "west"],
    "rep":    ["a", "b", "c", "c", "d"],
    "amount": [100, 150, 200, 50, 300],
})

result = sales.groupby("region")["amount"].agg(["sum", "mean", "count"])
print(result)
```

What does `result.loc["west", "mean"]` evaluate to?

- A. 550.0
- B. ≈183.33
- C. 125.0
- D. 200.0

<details><summary>Answer</summary>

**Correct: B.** groupby-agg first splits `sales` into an east group (100, 150) and a west group (200, 50, 300), then runs every function against each group independently. West's mean is (200 + 50 + 300) / 3 = 550 / 3 ≈ 183.33.

**A.** That's `result.loc["west", "sum"]` — the raw total, before dividing by the count. Easy to grab by accident because `sum` and `mean` sit one column apart in the printed table.

**C.** That's east's mean, not west's — (100 + 150) / 2 = 125. Reading the wrong region's row is the single most common `groupby.agg` mistake, especially once you have more groups than fit on one screen.

**D.** This treats "west" as a single row rather than three rows folded into one number per function. `groupby` never picks a representative value — 200 is just what the first west row happened to hold before aggregation combined it with the other two.

</details>

## 4. Which join keeps the users you need?

You're building a churn dashboard. `users` has one row per registered account; `purchases` has one row per order — and only people who've actually bought something show up there at all.

```python
import pandas as pd

users = pd.DataFrame({
    "user_id":     ["u1", "u2", "u3", "u4"],
    "signup_date": ["2026-01-03", "2026-01-05", "2026-02-11", "2026-03-01"],
})

purchases = pd.DataFrame({
    "user_id": ["u1", "u1", "u3"],
    "amount":  [42, 19, 88],
})
```

You need one row per user — including the ones who've never bought anything, so you can flag them as at-risk:

```python
report = users.merge(purchases, on="user_id", how=___)
```

Which `how=` finishes this correctly?

- A. `"inner"`
- B. `"left"`
- C. `"right"`
- D. `"outer"`

<details><summary>Answer</summary>

**Correct: B.** `users` is the left table, and `how="left"` keeps every one of its rows no matter what, filling `amount` with `NaN` wherever there's no match in `purchases`. That's exactly `u2` and `u4` — the never-bought users the report exists to surface.

**A.** `"inner"` (the default if you don't think about `how=` at all) keeps only `user_id`s present in *both* tables — `u1` and `u3`. `u2` and `u4` vanish silently, which is backwards: they're the two rows you actually need.

**C.** `"right"` keeps every row of `purchases`, matched against `users`. Since `purchases` only ever contains buyers, you still lose every non-buyer — the same missing rows as `inner`, just approached from the other side.

**D.** `"outer"` keeps all users *and* all purchases, which happens to include the non-buyers here — but it solves a broader problem than you asked for: it also pulls in any `purchases.user_id` that isn't in `users` at all (a deleted account, a test order, a typo'd id), silently adding rows the churn report never wanted. `left` says "every user, nothing else"; `outer` says "everything from either side" — a real difference the moment two tables don't agree perfectly. More on this in [joining and merging dataframes](/learn/python-data-apis/joining-and-merging-dataframes).

</details>

## 5. Which line actually breaks?

Four ways to add a `status` column to a filtered slice of a DataFrame. Exactly one of them prints `SettingWithCopyWarning`.

```python
# A
adults = df[df["age"] >= 18]
adults["status"] = "adult"

# B
adults = df[df["age"] >= 18].copy()
adults["status"] = "adult"

# C
df.loc[df["age"] >= 18, "status"] = "adult"

# D
df["status"] = df["age"].apply(lambda a: "adult" if a >= 18 else "minor")
```

Which snippet raises the warning?

- A
- B
- C
- D

<details><summary>Answer</summary>

**Correct: A.** `df[df["age"] >= 18]` returns something that might be a view into `df` or might be an independent copy — which one depends on internal memory layout pandas doesn't promise you. Writing `adults["status"] = "adult"` into that ambiguous result means pandas can't tell whether you meant to mutate `df` through `adults` or work on a separate table, so it warns rather than guess — and the write may or may not actually land on `df`, which is the dangerous part. This exact ambiguity is the whole subject of [pandas SettingWithCopy mistakes](/learn/python-data-apis/pandas-settingwithcopy-mistakes).

**B.** Adding `.copy()` up front resolves the ambiguity: `adults` is now unquestionably its own object, so assigning into it never touches `df` and never triggers the warning. This is the fix for A, not a different bug.

**C.** `df.loc[mask, "status"] = "adult"` is one call that tells pandas exactly which rows and which column to write, directly on `df`. There's no intermediate object of uncertain parentage — nothing for pandas to warn about.

**D.** This builds a brand-new Series with `.apply()` and assigns it as a whole new column directly on `df` — no filtering, no slicing, no intermediate object at all. There's nothing here that could be a view of anything.

</details>

## 6. Where did the float come from?

You flag outlier readings as missing so a later step can impute them.

```python
import pandas as pd
import numpy as np

df = pd.DataFrame({
    "id":  [1, 2, 3, 4, 5],
    "qty": [10, 20, 30, 40, 50],
})
print(df["qty"].dtype)   # int64

df.loc[df["qty"] > 45, "qty"] = np.nan
print(df["qty"].dtype)
```

What does the second `print` show, and why?

- A. `int64` — pandas rounds `NaN` to 0 internally for integer columns.
- B. `float64` — assigning `NaN` into an `int64` column upcasts the whole column.
- C. `object` — mixing a float value into an integer column falls back to a generic dtype.
- D. `float64` for row 4 only — the untouched rows stay `int64`.

<details><summary>Answer</summary>

**Correct: B.** NumPy's `int64` (what backs a default pandas integer column) has no bit pattern reserved for "missing" — every value it can hold is a real number. `np.nan` is a float and simply cannot be represented in that dtype, so the instant you assign it anywhere in the column, pandas upcasts the **entire** column to `float64`, which does have a NaN representation. Notice the shape of the bug: the filter (`df["qty"] > 45`) only *picks* one row, but the *assignment* is what forces the whole column's dtype to flip — one changed value, one changed dtype, for every row in the Series. If you need whole numbers to coexist with missing markers, pandas' nullable `"Int64"` dtype (capital I) holds `pd.NA` without this upcast — see [type coercion and parsing dates](/learn/python-data-apis/type-coercion-and-parsing-dates).

**A.** pandas never silently substitutes a real number for a missing value you asked it to store — that would corrupt data in a way nobody could detect. If it truly couldn't represent the assignment, it would raise, not round.

**C.** `object` dtype shows up when a column holds genuinely mixed Python types NumPy can't unify — strings and numbers together, for instance. `NaN` and integers *do* unify, cleanly, into `float64`, a real efficient NumPy dtype — there's no need to fall back to `object`.

**D.** A dtype belongs to the whole column — the single NumPy array backing it — not to individual cells. You can't have four `int64` values and one `float64` value living in the same Series; once anything forces a wider type, every value in that column is stored as that wider type, even the ones you never touched.

</details>

## What to do with a miss

If you got 1 or 2 wrong, that's normal — `.loc`/`.iloc` and `SettingWithCopyWarning` are the two things almost everyone gets bitten by at least once before it clicks. If you missed the merge question, go build the churn table yourself with a duplicate key thrown in and watch row counts change under `how=`. If the dtype question surprised you, run it with `.astype("Int64")` instead of the default and watch the `NaN` assignment stop upcasting — seeing the fix work is worth more than reading why the bug happens.

**Related:** [pandas DataFrames fundamentals](/learn/python-data-apis/pandas-dataframes-fundamentals) · [selecting, filtering, and indexing](/learn/python-data-apis/selecting-filtering-indexing) · [groupby and aggregation](/learn/python-data-apis/groupby-and-aggregation) · [joining and merging dataframes](/learn/python-data-apis/joining-and-merging-dataframes) · [pandas SettingWithCopy mistakes](/learn/python-data-apis/pandas-settingwithcopy-mistakes) · [type coercion and parsing dates](/learn/python-data-apis/type-coercion-and-parsing-dates)
