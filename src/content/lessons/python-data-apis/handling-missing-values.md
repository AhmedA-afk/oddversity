---
title: "Handling Missing and Empty Values"
track: "python-data-apis"
status: live
summary: "A hands-on pandas walkthrough that detects NaN, None, and empty-string 'missing' in a reviews dataset, then applies a documented per-column mix of dropna, fillna, and imputation — "
duration: "30 min read"
---

A rating column with three gaps and a rating column that's been zero-filled three times look identical in `.head()` — but one gives you a true average and the other silently drags it down by nearly a full star. This walkthrough builds a review-cleaning pipeline that catches all three faces of "missing" before anything gets aggregated, then proves the bias with numbers you can watch happen instead of taking it on faith.

## What we're building

A small, real pipeline over a product-reviews `DataFrame` that:

1. Detects `NaN`, `None`, **and** literal empty strings — because `isna()` only catches two of the three.
2. Applies a different, explicitly justified technique per column: targeted `dropna`, `fillna`, or simple imputation — never one blanket call for the whole frame.
3. Computes a rating average two ways and shows you the exact gap a careless `fillna(0)` introduces before you ever compute anything downstream.

By the end you'll have a reusable mental model — and a written table — for deciding what to do with a gap, instead of reaching for `fillna(0)` because it makes the error go away.

## Setup

You need pandas and NumPy. Nothing else.

```bash
python -m venv .venv
source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install pandas numpy
```

If you haven't set up an isolated environment before, [Setting up venv and Jupyter](/learn/python-data-apis/setting-up-venv-and-jupyter) covers it. Everything below runs in a plain script or a notebook cell — paste the blocks in order and they build on one running `df`.

## Build it

### Load a dataset with all three kinds of missing baked in

Real data almost never arrives with only `NaN`. A numeric column that came out of an aggregation gives you `NaN`. A field read from a database driver or a JSON `null` gives you Python's `None`. A field that came from an HTML form, a CSV that was already blank, or an API that returns `""` instead of omitting a key gives you a literal empty string. All three mean "missing" to a human — and pandas treats them very differently.

```python
import numpy as np
import pandas as pd

reviews = [
    {"review_id": 101, "product_id": "SKU-01", "rating": 5.0, "review_text": "Works great, exactly as described.", "reviewer_name": "Priya K.", "helpful_votes": 3.0, "verified_purchase": True, "review_date": "2026-01-04"},
    {"review_id": 102, "product_id": "SKU-01", "rating": np.nan, "review_text": "Battery life is disappointing.", "reviewer_name": "Marcus T.", "helpful_votes": 0.0, "verified_purchase": True, "review_date": "2026-01-06"},
    {"review_id": 103, "product_id": "SKU-02", "rating": 4.0, "review_text": None, "reviewer_name": "Dana R.", "helpful_votes": np.nan, "verified_purchase": True, "review_date": "2026-01-07"},
    {"review_id": 104, "product_id": "SKU-02", "rating": 2.0, "review_text": "", "reviewer_name": None, "helpful_votes": 1.0, "verified_purchase": None, "review_date": ""},
    {"review_id": 105, "product_id": "SKU-01", "rating": np.nan, "review_text": "Fine for the price.", "reviewer_name": "Ola B.", "helpful_votes": 2.0, "verified_purchase": False, "review_date": "2026-01-09"},
    {"review_id": 106, "product_id": "SKU-03", "rating": 5.0, "review_text": "Second one I've bought, still love it.", "reviewer_name": "Priya K.", "helpful_votes": np.nan, "verified_purchase": True, "review_date": "2026-01-10"},
    {"review_id": 107, "product_id": "SKU-03", "rating": 1.0, "review_text": "Broke after two days.", "reviewer_name": "Hassan M.", "helpful_votes": 5.0, "verified_purchase": True, "review_date": "2026-01-11"},
    {"review_id": 108, "product_id": "SKU-02", "rating": 3.0, "review_text": None, "reviewer_name": "Wei L.", "helpful_votes": 0.0, "verified_purchase": None, "review_date": "2026-01-13"},
    {"review_id": 109, "product_id": "SKU-01", "rating": np.nan, "review_text": "", "reviewer_name": None, "helpful_votes": np.nan, "verified_purchase": False, "review_date": ""},
    {"review_id": 110, "product_id": "SKU-03", "rating": 4.0, "review_text": "Solid value.", "reviewer_name": "Marcus T.", "helpful_votes": 1.0, "verified_purchase": True, "review_date": "2026-01-15"},
    {"review_id": None, "product_id": None, "rating": 3.0, "review_text": "Good.", "reviewer_name": "R.T.", "helpful_votes": 0.0, "verified_purchase": True, "review_date": "2026-01-16"},
]
df = pd.DataFrame(reviews)
print(df.shape)   # (11, 8)
```

That last row is deliberate: `review_id` and `product_id` are both `None`, standing in for a record a broken join or a bad scrape handed you — a row you can't trace back to anything. Keep it in mind; it's the first thing we'll deal with.

If you want a refresher on the DataFrame shape itself before going further, [pandas DataFrames fundamentals](/learn/python-data-apis/pandas-dataframes-fundamentals) covers it.

### Catch NaN and None with isna() — then watch it miss the empty string

`isna()` is your first pass, and it's good at its job for two of the three faces:

```python
print(df.isna().sum())
```

```text
review_id            1
product_id           1
rating               3
review_text           2
reviewer_name         2
helpful_votes         3
verified_purchase     2
review_date           0
dtype: int64
```

`rating`, `helpful_votes`, `reviewer_name`, `verified_purchase` — all correctly flagged. But look at `review_date`: zero. That column has two blank strings in it. Check directly:

```python
print(df["review_text"].isna().tolist())
# [False, False, True, False, False, False, False, True, False, False, False]
```

Rows 2 and 7 (the `None` values) show `True`. Rows 3 and 8 — the empty strings — show `False`. `isna()` considers a cell that holds `""` to be *present*, because as far as pandas is concerned it is: it's a zero-length string, not an absence. You have to go looking for it separately:

```python
print((df.astype(object) == "").sum())
```

```text
review_text    2
review_date    2
dtype: int64
```

Now you have the full picture. Build one report instead of trusting either check alone:

```python
missing_report = pd.DataFrame({
    "isna": df.isna().sum(),
    "empty_str": (df.astype(object) == "").sum(),
})
print(missing_report)
```

Where this bites in practice: `pd.read_csv()` converts a blank field **and** a literal `""` field to `NaN` by default, so the empty-string face quietly disappears before you ever get to check for it — you'd need `keep_default_na=False` to see it survive. A `dict`/JSON record, by contrast, keeps a `null` as `None` (which becomes `NaN`) but keeps an explicit `""` exactly as `""`. Which face you get depends on where the data came from — see [Reading and writing CSV](/learn/python-data-apis/reading-and-writing-csv) and [JSON and JSONL files](/learn/python-data-apis/json-and-jsonl-files) for the source-level detail.

### Decide, once, which "" cells really mean missing

Now that you've found the empty strings, normalize them — but only in the columns where blank genuinely means "nothing here," and only as a conscious step, not a blanket sweep:

```python
df["review_text"] = df["review_text"].replace("", np.nan)
df["review_date"] = df["review_date"].replace("", np.nan)

print(df.isna().sum()["review_text"])  # 4 now, not 2
```

This is the moment the three faces collapse into one: from here on, `isna()` is the single source of truth for these two columns. Resist the urge to run this across every column reflexively — a rating of `0` or a `verified_purchase` of `False` is a real, meaningful value that happens to be falsy. "Empty string" and "falsy" are not the same category, and treating them as interchangeable is how you accidentally erase a legitimate `False`.

### Drop the rows you truly can't use

A review with no `review_id` can't be deduplicated, joined back to its source, or audited if a customer disputes it. That's not a gap to fill — it's a record you cannot use, so remove it explicitly and narrowly:

```python
before = len(df)
clean = df.dropna(subset=["review_id"]).copy()
print(f"dropped {before - len(clean)} row(s); {len(clean)} remain")
# dropped 1 row(s); 10 remain
```

`subset=["review_id"]` matters. Call `df.dropna()` with no arguments on this frame and see what survives:

```python
print(len(df.dropna()))  # 3
```

Three rows out of eleven. A blanket `dropna()` throws away 8 reviews — most of your dataset — because nearly every row is missing *something*, and most of those somethings (a blank reviewer name, an un-voted-on review) are perfectly fine to keep. `dropna` is a scalpel here, not the default tool. For more on this kind of targeted selection, see [Selecting, filtering, indexing](/learn/python-data-apis/selecting-filtering-indexing).

One more thing while you're here — `review_id` picked up a missing value, so pandas silently upcast it from integer to `float64` (`101.0` instead of `101`). Now that the gap is gone, put it back as an integer:

```python
clean["review_id"] = clean["review_id"].astype("Int64")  # nullable, capital I
```

### Write down a per-column plan before you touch fillna

This is the step people skip, and it's the one that actually prevents bugs: decide the technique *and* the reason, per column, before running anything.

| Column | Technique | Why |
|---|---|---|
| `review_id` | targeted `dropna` | No id, no traceable record — already done above |
| `rating` | leave as `NaN` for aggregates | `0` is a real, terrible rating; filling with it invents an opinion nobody gave |
| `review_text` | `fillna("[no text provided]")` | Absence of text is meaningful and never feeds a calculation |
| `reviewer_name` | `fillna("Anonymous")` | Categorical placeholder, harmless to any aggregate |
| `helpful_votes` | `fillna(0)` | "Nobody has voted yet" genuinely does mean zero |
| `verified_purchase` | simple imputation (mode) | Categorical; borrow the majority class instead of inventing a third state |
| `review_date` | leave as `NaN` | Fabricating a date would corrupt any time-based analysis |

Notice `rating` and `helpful_votes` both look like "just call `fillna(0)`" — and that's exactly the trap. Same method, opposite correctness, because the *meaning* of zero is different in each column. The table is what makes that difference visible instead of implicit.

Apply the safe half of it now:

```python
clean["review_text"] = clean["review_text"].fillna("[no text provided]")
clean["reviewer_name"] = clean["reviewer_name"].fillna("Anonymous")
clean["helpful_votes"] = clean["helpful_votes"].fillna(0)

mode_val = clean["verified_purchase"].mode(dropna=True).iloc[0]
clean["verified_purchase"] = clean["verified_purchase"].fillna(mode_val)
print(mode_val)  # True
```

`mode()` picks the most common non-missing value — simple imputation for a categorical column, one line, fully explainable to anyone who asks why a row says `verified_purchase = True` when the source data said nothing at all. This is the kind of workflow decision [Data cleaning workflow](/learn/python-data-apis/data-cleaning-workflow) walks through end to end.

### Prove the naive fillna bias against a real average

Here's the column we deliberately did *not* fill: `rating`. Compute its average two ways.

```python
true_mean = clean["rating"].mean()
naive_mean = clean["rating"].fillna(0).mean()

print(round(true_mean, 2))    # 3.43
print(round(naive_mean, 2))   # 2.4
print(clean["rating"].notna().sum(), "of", len(clean), "rows have a real rating")
# 7 of 10 rows have a real rating
```

`.mean()` already skips `NaN` by default — `3.43` is the correct average across the seven reviews that actually carry a rating. The moment you call `.fillna(0)` *before* aggregating, you've told pandas those three missing reviews gave the worst score possible. The average drops to `2.4` — not because three customers were furious, but because you told the column they were.

This is exactly how the bug travels in a real pipeline: nobody computes `.fillna(0).mean()` in one line and ships it. Instead, someone fills the column with `0` upstream — to make a CSV export "look complete," or because a downstream function throws on `NaN` — and then a completely different piece of code, written by someone who never saw that decision, calls `.mean()` on what looks like a normal, gap-free rating column. No error. No warning. Just a wrong number that reads as plausible.

Group by product and you'll see a second, subtler version of the same trap:

```python
print(clean.groupby("product_id")["rating"].agg(["mean", "count"]))
```

```text
             mean  count
product_id
SKU-01       5.00      1
SKU-02       3.00      3
SKU-03       3.33      3
```

`SKU-01` shows a perfect `5.00` — but `count` says only one of its four reviews actually has a rating. A mean without its count is a number pretending to be more confident than the data supports. Always carry `count` alongside `mean` in a real report; [Groupby and aggregation](/learn/python-data-apis/groupby-and-aggregation) covers this pairing in depth.

### Impute deliberately for modeling, and mark what you invented

Sometimes you do need every row to carry a numeric rating — feeding a model that can't handle `NaN`, for instance. That's a legitimate use for imputation, but it belongs in a *separate* column, with a flag saying which rows are real:

```python
clean["rating_was_imputed"] = clean["rating"].isna()
clean["rating_for_model"] = clean["rating"].fillna(clean["rating"].median())

print(clean["rating"].median())  # 4.0
```

`rating_for_model` is safe to hand to a model because `rating_was_imputed` travels with it — anything downstream can filter to real ratings, weight imputed ones differently, or just audit how much of the signal is invented. This is the difference between imputation as a deliberate, visible modeling choice and `fillna` as a silent data-destroying shortcut. [Turning messy data into model inputs](/learn/python-data-apis/turning-messy-data-into-model-inputs) picks this pattern up from here.

### Assert the contract you just wrote

The table above is a set of promises. Turn it into code that fails loudly if a future data pull breaks one of them:

```python
filled_cols = ["review_text", "reviewer_name", "helpful_votes", "verified_purchase", "review_id"]
for col in filled_cols:
    assert clean[col].isna().sum() == 0, f"{col} should have no gaps left"

assert clean["rating"].isna().sum() > 0 or True   # rating is allowed to have gaps — that was the decision
assert clean["rating"].isna().mean() < 0.5, "more than half of ratings missing — investigate before trusting any average"
```

That last assertion is the one worth keeping in production: it doesn't block a *normal* amount of missing ratings, but it stops you cold if a future ingestion job starts dropping half the ratings and nobody notices until the average looks weirdly low. This is the validation half of the module — see [Validating DataFrames with schemas](/learn/python-data-apis/validating-dataframes-with-schemas) and [Data contracts and validation](/learn/python-data-apis/data-contracts-and-validation) for turning this into something that runs on every load, not just once in a notebook.

## Run it

Run the blocks above in order — script or notebook, doesn't matter — and you should see:

- `df.shape` starts at `(11, 8)`.
- The `isna`/`empty_str` report shows `rating` at 3 missing, `review_text` and `review_date` each hiding 2 more inside empty strings that `isna()` alone didn't catch.
- After the targeted `dropna(subset=["review_id"])`, you're at 10 rows — while a blanket `df.dropna()` on the original frame would have left only 3.
- `clean["rating"].mean()` comes out to `3.43`; the naive `fillna(0)` version comes out to `2.4` — the exact gap a careless fill introduces, computed from the data in front of you, not asserted.
- `verified_purchase`'s mode imputation fills with `True`; the median used for `rating_for_model` is `4.0`.
- The final `clean` frame has zero `NaN` in every column you deliberately filled, and still has `NaN` in `rating` and `review_date` — because that was the plan, not an oversight.

If any of those numbers come out different when you run it yourself, check whether you changed the source rows — the pipeline is deterministic on this exact dataset.

## Harden it

A few gaps this walkthrough's dataset doesn't show you, but production data will:

**Whitespace and sentinel strings.** A cell containing `"   "`, `"N/A"`, `"null"`, or `"None"` as literal text is not caught by `isna()` or by an `== ""` check — it looks occupied to both. Normalize before you trust either:

```python
s = pd.Series(["Alice", "   ", "", None, "n/a", "Bob", "NULL"])
looks_empty = s.str.strip().str.lower().isin(["", "n/a", "null", "none", "nan"]) | s.isna()
print(looks_empty.tolist())
# [False, True, True, True, True, False, True]
```

**Integer columns that silently become floats.** Any integer column that picks up a single missing value gets upcast to `float64` — `review_id` did exactly this above. If you're joining on that column later, `101` and `101.0` compare fine in pandas, but the moment that column round-trips through a CSV or an API payload as a string, `"101.0"` and `"101"` will not match. Use the nullable `"Int64"` dtype (capital I) to keep integers as integers with a real `<NA>` marker:

```python
naive = pd.Series([101, 102, None, 104])
print(naive.dtype)  # float64

nullable = pd.Series([101, 102, None, 104], dtype="Int64")
print(nullable.dtype)  # Int64
```

**Chained assignment after a filter.** `clean = df.dropna(...)` followed by assigning new columns onto `clean` works because of the explicit `.copy()` a few steps back. Drop that `.copy()` and pandas may warn you that you're modifying a view of `df`, not a frame of your own — a classic source of "why did my original DataFrame change" bugs. [pandas SettingWithCopy mistakes](/learn/python-data-apis/pandas-settingwithcopy-mistakes) is worth reading once so the warning stops being mysterious.

**Losing the empty-string signal at the loading stage.** If this dataset came from `pd.read_csv()` with default settings, the `""` cells you saw above would already be `NaN` before your code ever ran — CSV's default parser doesn't distinguish "blank" from "explicitly empty." If preserving that distinction matters for your source, load with `keep_default_na=False` and handle the conversion yourself, deliberately, rather than never knowing it happened.

## Extend it

- Turn the per-column table into an actual config — a dict mapping column name to a `(check_fn, treatment_fn, reason)` tuple — so the documentation and the code enforcing it can't drift apart. [Data cleaning workflow](/learn/python-data-apis/data-cleaning-workflow) and [Data cleaning: common mistakes](/learn/python-data-apis/data-cleaning-common-mistakes) are good next stops for generalizing this beyond one dataset.
- Add the assertions from the last build step to an actual test file that runs on every new data pull, not just once by hand — see [Testing data pipelines](/learn/python-data-apis/testing-data-pipelines).
- If `rating_for_model` and `rating_was_imputed` are headed toward an actual model or an LLM prompt, keep both columns attached all the way through — dropping the flag the moment it's inconvenient is how imputed values quietly get treated as ground truth two steps later.

**Related:** [Data cleaning workflow](/learn/python-data-apis/data-cleaning-workflow) · [Groupby and aggregation](/learn/python-data-apis/groupby-and-aggregation) · [Validating DataFrames with schemas](/learn/python-data-apis/validating-dataframes-with-schemas) · [Data contracts and validation](/learn/python-data-apis/data-contracts-and-validation) · [Turning messy data into model inputs](/learn/python-data-apis/turning-messy-data-into-model-inputs) · [Data cleaning: common mistakes](/learn/python-data-apis/data-cleaning-common-mistakes)
