---
title: "Type Coercion and Parsing Dates"
track: "python-data-apis"
status: live
summary: "A hands-on pandas walkthrough that fixes a messy reviews dataset column by column — astype for safe casts, to_numeric(errors='coerce') for junk prices, to_datetime with an explicit"
duration: "22 min read"
---

A CSV never lies about the data — it just lies about the types. That `$24.50` you can see with your own eyes is a string, `03/04/2024` is a landmine, and pandas will happily let you build a whole pipeline on top of both before something downstream quietly breaks or loudly crashes. This is the fix, done properly, column by column.

## What we're building

You'll take a small, deliberately messy product-reviews export — the kind of file a real system produces after a schema change, a currency symbol left in by an upstream export tool, and a timestamp field two different code paths wrote in two different formats — and turn it into a dataframe where every column has the dtype it should have:

- `quantity` cast cleanly with `astype`, because it's already trustworthy
- `price` run through `to_numeric(errors="coerce")`, because it has currency symbols, blanks, and outright garbage mixed in
- `review_date` parsed with an explicit `strptime` format and converted to timezone-aware UTC, because it has two formats mixed in one column
- `city` collapsed into a `category` dtype, because it's a small set of values repeated thousands of times

Along the way you'll build a "bad rows" report that tells you *which* rows failed and *why*, not just how many `NaN`s you ended up with — the difference between a cleaning script you can trust and one that silently eats data.

## Setup

You need pandas. NumPy comes along as a dependency, and you don't need anything else for this lesson:

```bash
python -m venv .venv
source .venv/bin/activate   # .venv\Scripts\activate on Windows
pip install pandas
```

If you haven't set up a project environment before, [python-environments-and-venv](/learn/python-data-apis/python-environments-and-venv) and [setting-up-venv-and-jupyter](/learn/python-data-apis/setting-up-venv-and-jupyter) cover the "why" and the exact commands. Everything below runs as a plain `.py` file or in a notebook cell — no external services, no API keys.

One version note: this lesson shows output from pandas 2.x, which is what most environments have installed today. Text columns show up as dtype `object`. If you're on pandas 3.x, the same columns show as dtype `str` instead — it's the same idea (plain Python strings), just a renamed label. Nothing else here changes.

## Build it

### Load the messy reviews data and look at what pandas actually gave you

We'll write the CSV ourselves so this is fully runnable without a hosted file — treat it as a stand-in for an export from a reviews system:

```python
import pandas as pd

csv_text = """review_id,product,city,quantity,price,rating,review_date
1,Wireless Mouse,Austin,1,19.99,4.5,2024-03-02 14:05:00
2,Wireless Mouse,austin,2,$24.50,5,2024-03-02 09:30:00
3,USB-C Hub,Denver,1,29.99 ,3,03/04/2024 11:00:00
4,USB-C Hub,Denver,3,N/A,4,2024-03-05 16:45:00
5,Desk Lamp,Chicago,1,15,,2024-03-06 08:15:00
6,Desk Lamp,chicago,2,,4.2,not a date
7,Webcam HD,Austin,1,twenty,3.8,2024-03-08 13:00:00
8,Webcam HD,Austin,4,49.99,5,2024-03-09 10:20:00
9,Mechanical Keyboard,Denver,1,89.99,4.7,2024-03-10 19:00:00
10,Mechanical Keyboard,Denver,2,$89.99,,2024-03-11 07:40:00
"""

with open("reviews.csv", "w") as f:
    f.write(csv_text)

reviews = pd.read_csv("reviews.csv")
print(reviews.dtypes)
```

```
review_id        int64
product         object
city            object
quantity         int64
price           object
rating         float64
review_date     object
dtype: object
```

Three things worth noticing immediately. `review_id` and `quantity` came in as `int64` and `rating` as `float64` — pandas' own type inference handled those fine because every value in each column actually looked numeric (row 4's blank `price` shows as `NaN` too, but that's because `N/A` is one of the strings pandas' `read_csv` treats as missing by default — a dollar sign is not, so `$24.50` stays as text). `price` and `review_date` came in as `object`, which is pandas' way of saying "I gave up and stored these as plain Python strings" — because at least one value in each column doesn't look uniformly numeric or date-like. That's your signal that both columns need explicit coercion before you can do arithmetic or date math on them. If this is your first time loading a file into pandas, [loading-data-into-pandas](/learn/python-data-apis/loading-data-into-pandas) covers `read_csv` in more depth.

### Cast the columns that are already clean, with astype

`astype` is the right tool when you're already confident every value in a column will convert — it's a direct, fast cast, and it fails loudly (an exception, not a silent wrong answer) the moment it hits something that doesn't fit:

```python
reviews["quantity"] = reviews["quantity"].astype("int64")
```

That works because every value in `quantity` really is digit text. Now watch what happens if you reach for the same tool on `price`:

```python
reviews["price"].astype(float)
```

```
ValueError: could not convert string to float: '$24.50'
```

`astype` stops at the first value it can't convert and throws away the whole operation — it won't give you 9 good floats and 1 error, it gives you nothing. That's exactly correct behavior for a column you expect to be uniform, and exactly the wrong tool for a column you know has some junk mixed in. For that, you want a coercion that keeps going.

### Turn junk into NaN instead of crashing, with to_numeric(errors="coerce")

`pd.to_numeric(..., errors="coerce")` converts what it can and turns everything else into `NaN`, instead of raising. First, clean up the obvious textual noise — a leading `$` and stray whitespace — using the `.str` accessor directly on the column:

```python
price_stripped = (
    reviews["price"]
    .str.strip()
    .str.replace("$", "", regex=False)
)
reviews["price"] = pd.to_numeric(price_stripped, errors="coerce")
print(reviews["price"])
```

```
0    19.99
1    24.50
2    29.99
3      NaN
4    15.00
5      NaN
6      NaN
7    49.99
8    89.99
9    89.99
Name: price, dtype: float64
```

Notice we called `.str` straight on the `object` column rather than `.astype(str)` first. That matters: a couple of these cells are already real, actual `NaN` (from the blank cell and the recognized `N/A`), and `.str` methods pass `NaN` straight through untouched. If you called `.astype(str)` first, those `NaN`s would turn into the literal text `"nan"` — which happens to still parse back to `NaN` through `to_numeric` by luck (Python recognizes the word "nan" as a float), but that's not something you want to depend on.

We're also assigning straight back into `reviews["price"]` on the original frame, not into a filtered slice we're about to keep using — that's the pattern that avoids the classic `SettingWithCopyWarning` trap; see [pandas-settingwithcopy-mistakes](/learn/python-data-apis/pandas-settingwithcopy-mistakes) if you've hit that warning before and want to know exactly when it bites.

### Parse review_date with an explicit format, not a guess

Before touching the real column, run this small experiment on its own:

```python
sample = pd.Series(["03/04/2024", "04/05/2024", "13/02/2024"])
print(pd.to_datetime(sample, errors="coerce"))
```

```
0   2024-03-04
1   2024-04-05
2          NaT
```

Look closely at that output. Pandas silently decided `03/04/2024` means March 4th and `04/05/2024` means April 5th — it assumed US-style month-first ordering for both, without telling you it made that choice. It only produced `NaT` (pandas' `NaN` for datetimes) for the third row, and only because `13` can't possibly be a month, so the guess had nowhere to land. If your source data is actually day-first (as most of the world writes dates), rows 0 and 1 are now silently wrong, and nothing in that output tells you to double-check them. That's the real danger of parsing dates without a format: it isn't that ambiguous dates fail, it's that they often *don't* — they just fail silently in the wrong direction.

The fix is to tell `to_datetime` exactly what to expect, using the same format codes as `datetime.strptime`:

```python
reviews["review_date"] = pd.to_datetime(
    reviews["review_date"], format="%Y-%m-%d %H:%M:%S", errors="coerce"
)
print(reviews["review_date"])
```

```
0   2024-03-02 14:05:00
1   2024-03-02 09:30:00
2                   NaT
3   2024-03-05 16:45:00
4   2024-03-06 08:15:00
5                   NaT
6   2024-03-08 13:00:00
7   2024-03-09 10:20:00
8   2024-03-10 19:00:00
9   2024-03-11 07:40:00
Name: review_date, dtype: datetime64[ns]
```

Now there's no guessing at all: row 2 (`03/04/2024 11:00:00`, the wrong shape entirely) and row 5 (`not a date`, garbage) both fail to match the format string and become `NaT`, deterministically, on every run and every pandas version. That's a trade you want — a hard-coded format is less flexible than letting pandas infer, but "deterministic and explicit" beats "usually right" for anything you're going to trust. `NaT` is exactly the datetime equivalent of the `NaN` you saw in the price column; [handling-missing-values](/learn/python-data-apis/handling-missing-values) covers the general pattern for working with either.

### Attach a timezone and convert to a shared standard

The timestamps in `review_date` are *naive* — they carry no timezone information — because that's how this (imaginary) review system logs them: in the store's local clock time. If those reviews come from stores in different time zones, or you're joining this data against anything else that's timezone-aware, you need to fix that before doing any date math:

```python
reviews["review_date_utc"] = (
    reviews["review_date"]
    .dt.tz_localize("America/Chicago", ambiguous="NaT", nonexistent="NaT")
    .dt.tz_convert("UTC")
)
print(reviews[["review_date", "review_date_utc"]])
```

```
          review_date           review_date_utc
0 2024-03-02 14:05:00 2024-03-02 20:05:00+00:00
1 2024-03-02 09:30:00 2024-03-02 15:30:00+00:00
2                 NaT                       NaT
3 2024-03-05 16:45:00 2024-03-05 22:45:00+00:00
4 2024-03-06 08:15:00 2024-03-06 14:15:00+00:00
5                 NaT                       NaT
...
```

`tz_localize` *attaches* a timezone identity to a naive timestamp without changing the clock reading — it's saying "this `14:05:00` was always Chicago time, I'm just labeling it now." `tz_convert` *shifts* an already timezone-aware timestamp to a different zone's clock reading, which is why `14:05` Chicago becomes `20:05` UTC. Store cleaned data in UTC and convert to a local zone only for display — it's the one convention that stops "whose midnight is this" bugs before they start. The `ambiguous="NaT"` and `nonexistent="NaT"` arguments matter more than they look: twice a year, daylight saving transitions create clock times that either happen twice (ambiguous, at the fall-back) or never happen at all (nonexistent, at the spring-forward), and without telling `tz_localize` what to do with those, it raises an exception on rows you didn't even know were a problem.

### Collapse repeated labels into category dtype

`city` only takes a handful of distinct values across what could be millions of rows — a textbook case for `category`. But look at the raw values first:

```python
print(reviews["city"].unique())
```

```
['Austin' 'austin' 'Denver' 'Chicago' 'chicago']
```

`Austin` and `austin` are the same city with different capitalization. If you cast to `category` before fixing that, you get two categories for one place — the dtype change doesn't fix a data quality problem, it just encodes whatever inconsistency was already there. Normalize first, then cast:

```python
reviews["city"] = reviews["city"].str.strip().str.title()
reviews["city"] = reviews["city"].astype("category")
print(reviews["city"].dtype)
print(reviews["city"].cat.categories)
```

```
category
Index(['Austin', 'Chicago', 'Denver'], dtype='object')
```

Under the hood, a `category` column stores each distinct value once and represents every row as a small integer code pointing at that value, instead of repeating the full string on every row. On this 10-row toy example the saving is already visible — measuring it directly:

```python
print(reviews["city"].memory_usage(deep=True))          # category
print(reviews["city"].astype("object").memory_usage(deep=True))  # plain text
```

On a run of this exact code, that printed 416 bytes for the category version against 684 for the plain-text version — real numbers from this dataset, not a universal ratio (the exact byte counts depend on your pandas version and platform, so run `memory_usage(deep=True)` yourself rather than trust a number from someone else's machine). The gap only grows as row count grows relative to the number of distinct categories — a column with 3 cities repeated across ten million rows sees a far bigger win than one repeated across ten.

## Run it

Run the full script top to bottom and check the final dtypes:

```python
print(reviews.dtypes)
```

```
review_id                        int64
product                          object
city                           category
quantity                          int64
price                           float64
rating                          float64
review_date              datetime64[ns]
review_date_utc     datetime64[ns, UTC]
dtype: object
```

Every column now has the type it should. `price` has 3 `NaN`s in it (rows for `N/A`, the blank cell, and `twenty`), and `review_date` has 2 `NaT`s (the slash-formatted row and the literal garbage row). Nothing raised an exception, and nothing silently kept a wrong value — every value that couldn't be trusted is now explicitly marked as missing, which you can find, count, and report on. That's the entire point of `errors="coerce"`: it converts "the script crashed" and "the script lied to you" into "the script told you exactly which rows to go look at."

## Harden it

**Don't conflate "was already missing" with "failed to parse."** `reviews["price"].isna().sum()` after coercion counts 3, but only one of those (`twenty`) is actually a parsing failure — the other two were already `NaN`/blank before you touched them. If you only look at the post-coercion `NaN` count, you can't tell whether your cleaning step introduced new missing data or just inherited what was already there. Compare against the original:

```python
raw = pd.read_csv("reviews.csv")
newly_broken = reviews.loc[
    reviews["price"].isna() & raw["price"].notna(), ["review_id", "product"]
]
print(newly_broken)
```

```
   review_id    product
6          7  Webcam HD
```

That's the row you actually need to go look at — the other two were already gaps in the source data, not something your pipeline broke.

**Coerce numeric-looking columns defensively too, not just the obviously messy ones.** `rating` loaded as clean `float64` in this dataset because every value happened to look numeric. But a single stray value anywhere in that column — one `"five"` typed by hand into a spreadsheet upstream — flips the *entire* column's dtype to `object`, silently, at load time. Then a downstream `reviews["rating"].mean()` doesn't fail where you'd expect; it fails (or misbehaves) wherever you first try to do math on the whole column, far from the row that actually caused it. Running `pd.to_numeric(reviews["rating"], errors="coerce")` even on a column that "looks fine" costs almost nothing and turns that failure mode into an explicit, countable `NaN` at the source instead of a mysterious `TypeError` three functions later.

**Watch category dtype with new data.** If you fit a `category` dtype on today's batch and later cast a new batch with `.astype(reviews["city"].dtype)`, any city name that wasn't in the original set becomes `NaN` — silently:

```python
known = reviews["city"].dtype
incoming = pd.Series(["Austin", "Miami"]).astype(known)
print(incoming)
```

```
0    Austin
1       NaN
dtype: category
```

`Miami` disappears without a warning if you're not looking for it. Either recompute categories from the union of old and new data before casting, or explicitly call `.cat.add_categories([...])` when you know new values are legitimate — don't assume last week's category list still covers this week's data.

> Once these checks are second nature, wire them into something more formal: [validating-dataframes-with-schemas](/learn/python-data-apis/validating-dataframes-with-schemas) shows how to turn "the dtypes and NaN counts look right" into an actual schema you can assert against on every run.

A cheap version of that formality right now is a handful of assertions at the end of your cleaning function:

```python
assert pd.api.types.is_float_dtype(reviews["price"])
assert pd.api.types.is_datetime64_any_dtype(reviews["review_date"])
assert isinstance(reviews["city"].dtype, pd.CategoricalDtype)
```

Cheap, fast, and it turns "the pipeline ran" into "the pipeline ran *and produced what I expect it to.*"

## Extend it

Wrap the whole sequence into a single function — `astype` for the trustworthy columns, `to_numeric`/`to_datetime` with `errors="coerce"` for the messy ones, normalize-then-`category` for repeated labels, finishing with the bad-rows report and assertions above — and you have something you can unit test in isolation from wherever the data actually comes from; [testing-data-pipelines](/learn/python-data-apis/testing-data-pipelines) walks through exactly that pattern. From there:

- **Stop round-tripping through CSV.** Every time you write cleaned data back to `.csv` and read it again, you lose every dtype you just fixed — dates go back to text, categories go back to plain strings — and you pay the coercion cost all over again. Writing to [Parquet](/learn/python-data-apis/parquet-and-columnar-formats) instead preserves dtypes exactly, including `category` and timezone-aware datetimes, across processes and languages.
- **Reach for nullable integer/boolean dtypes** (`Int64`, `boolean` — capitalized, distinct from `int64`/`bool`) when you need a whole-number or true/false column that can also legitimately contain missing values; plain `int64` can't hold `NaN` at all, which is why an integer column with any missing values silently becomes `float64` today.
- **Feed the typed, validated frame forward.** Clean types are the actual prerequisite for turning a dataframe into something a model can consume reliably — see [turning-messy-data-into-model-inputs](/learn/python-data-apis/turning-messy-data-into-model-inputs) for what comes after this step in a real pipeline.

**Related:** [handling-missing-values](/learn/python-data-apis/handling-missing-values) · [validating-dataframes-with-schemas](/learn/python-data-apis/validating-dataframes-with-schemas) · [pandas-settingwithcopy-mistakes](/learn/python-data-apis/pandas-settingwithcopy-mistakes) · [data-cleaning-common-mistakes](/learn/python-data-apis/data-cleaning-common-mistakes) · [parquet-and-columnar-formats](/learn/python-data-apis/parquet-and-columnar-formats) · [turning-messy-data-into-model-inputs](/learn/python-data-apis/turning-messy-data-into-model-inputs)
