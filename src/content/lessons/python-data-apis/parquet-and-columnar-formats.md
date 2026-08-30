---
title: "Parquet: Columnar, Compressed, Typed"
track: "python-data-apis"
status: live
summary: "A worked conversion of a 1M-row CSV to Parquet with pandas and pyarrow, measuring real file size, read time for a two-column load, and the dtypes CSV silently throws away."
duration: "16 min read"
---

A CSV is a million rows of pure text — every int, float, date, and boolean flattened into digits and commas, re-guessed by whoever reads it next. Convert the same file to Parquet and you get a smaller file, a faster load, and a format that remembers its own types. Below is that conversion end to end, with real numbers from actually running it — not benchmarks quoted from somewhere else.

## The setup (specific)

You've got an orders table: the kind of thing an e-commerce backend dumps nightly. One million rows, eight columns, mixed types on purpose so the round trip has something to lose:

```python
import numpy as np
import pandas as pd

np.random.seed(0)
n = 1_000_000

start = pd.Timestamp("2024-01-01")
order_date = start + pd.to_timedelta(np.random.randint(0, 500, n), unit="D")
statuses = np.array(["placed", "shipped", "delivered", "cancelled", "returned"])

orders = pd.DataFrame({
    "order_id": np.arange(1, n + 1),
    "customer_id": np.random.randint(1, 200_000, n),
    "order_date": order_date,
    "status": np.random.choice(statuses, n, p=[0.15, 0.2, 0.5, 0.1, 0.05]),
    "quantity": np.random.randint(1, 6, n).astype("int32"),
    "unit_price": np.round(np.random.uniform(3.0, 250.0, n), 2),
    "is_gift": np.random.choice([True, False], n, p=[0.08, 0.92]),
})
orders["total_price"] = np.round(orders["quantity"] * orders["unit_price"], 2)

print(orders.dtypes)
```

```text
order_id                int64
customer_id             int64
order_date     datetime64[us]
status                  object   # or "str" on newer pandas — same idea either way
quantity                 int32
unit_price              float64
is_gift                    bool
total_price             float64
dtype: object
```

Eight columns, five distinct dtypes, one deliberately narrow one (`quantity` is `int32`, not the default `int64`, because in a real system someone tuned that to save memory). This is the frame before it has touched a file format. Everything from here is about what survives writing it to disk and reading it back.

> **Why this step?** You need a baseline. "Dtypes survive the round trip" only means something if you know exactly what the dtypes were *before* the round trip, so you can catch anything that quietly changed.

## Step by step

### 1. Write it to CSV, the normal way

```python
orders.to_csv("orders.csv", index=False)
```

```text
$ ls -la orders.csv
54,468,696 bytes   (51.9 MB)
```

That's the file everyone already knows how to work with — see [reading and writing CSV](/learn/python-data-apis/reading-and-writing-csv) if you want the fundamentals refresher. It opens in any editor, diffs cleanly in git, and any tool on the planet can read it. It's also just text: `273.88` is stored as the six characters `2`, `7`, `3`, `.`, `8`, `8`, not as a float.

> **Why this step?** You need a real CSV on disk to convert — and you need to actually look at its size before optimizing anything, otherwise "smaller" is just a claim.

### 2. Write the same frame to Parquet

```python
orders.to_parquet("orders.parquet", engine="pyarrow", index=False)
```

```text
$ ls -la orders.parquet
15,495,259 bytes   (14.8 MB)
```

Same 1,000,000 rows, same 8 columns, same data. One line of code, `to_parquet` instead of `to_csv` — pandas hands the frame to pyarrow, which lays it out column by column and compresses each column independently (Snappy by default) before writing.

> **Why this step?** This is the entire "conversion." There's no schema file to write, no separate tool to run. The point worth noticing is how little ceremony this takes relative to what you get back.

### 3. Compare the file sizes

```python
import os
csv_size = os.path.getsize("orders.csv")
parquet_size = os.path.getsize("orders.parquet")
print(f"CSV:     {csv_size:,} bytes")
print(f"Parquet: {parquet_size:,} bytes")
print(f"CSV is {csv_size / parquet_size:.2f}x the size of Parquet")
```

```text
CSV:     54,468,696 bytes
Parquet: 15,495,259 bytes
CSV is 3.52x the size of Parquet
```

That 3.5x isn't uniform across columns, and looking at *why* is more useful than the headline number. You can ask pyarrow directly:

```python
import pyarrow.parquet as pq

meta = pq.ParquetFile("orders.parquet").metadata.row_group(0)
for i in range(meta.num_columns):
    col = meta.column(i)
    print(col.path_in_schema, col.total_compressed_size, "/", col.total_uncompressed_size)
```

```text
order_id      4,276,991 / 8,274,562
customer_id   4,763,430 / 7,791,712
order_date    1,134,733 / 1,134,917
status          379,791 / 379,531
quantity        380,285 / 380,033
unit_price    1,996,517 / 2,076,028
is_gift         104,861 / 127,350
total_price   2,454,153 / 2,685,112
```

`status` has five distinct values repeated a million times — Parquet dictionary-encodes it into a five-entry lookup table plus a small integer code per row, so it costs almost nothing before Snappy even runs. `is_gift` is a boolean column bit-packed to roughly one-eighth of a byte per row: 127 KB uncompressed for a million booleans. `unit_price` and `total_price`, on the other hand, are near-random floats to two decimal places — high entropy, nothing repeating for a compressor to exploit — so they barely shrink at all. Compression on a columnar layout isn't one trick; it's several, and which one pays off depends on what's actually *in* the column, which is only visible once same-typed values are sitting next to each other instead of scattered across a row. This is the same reason a [NumPy array beats a Python list](/learn/python-data-apis/why-arrays-beat-lists-intuition) for numeric work — grouping same-typed values together unlocks representations a mixed, one-at-a-time layout can't use.

> **Why this step?** "Parquet is smaller" is true but lazy as an explanation. Knowing *which* columns shrink and *why* tells you what to expect on your own data — a table of mostly low-cardinality strings and booleans will compress far better than a table of high-precision floats or random IDs.

### 4. Read the whole file back, both formats, and time it

```python
import time

def best_of(fn, runs=5):
    return min(_timed(fn) for _ in range(runs))

def _timed(fn):
    t0 = time.perf_counter()
    fn()
    return time.perf_counter() - t0

t_csv = best_of(lambda: pd.read_csv("orders.csv", parse_dates=["order_date"]))
t_parquet = best_of(lambda: pd.read_parquet("orders.parquet", engine="pyarrow"))

print(f"CSV full read:     {t_csv:.3f}s")
print(f"Parquet full read: {t_parquet:.3f}s")
```

```text
CSV full read:     0.603s
Parquet full read: 0.028s
```

Roughly 21x, on this run, on ordinary hardware. Run it yourself and you'll get different absolute numbers — disk speed, OS file caching, and your pandas/pyarrow versions all move the needle. What won't move is the *shape*: CSV makes pandas parse a million lines of text character by character and convert each field, every time, from scratch. Parquet is already binary and already typed — there's no parsing step, just deserializing bytes that are close to their in-memory representation already.

> **Why this step?** A file-size win is nice; a load-time win is what you actually feel every time a notebook, dashboard, or training job runs. This is the number your teammates will notice.

### 5. Read only the two columns you actually need

Say a downstream job just needs `customer_id` and `total_price` — for a spend-per-customer rollup, say. You don't need the other six columns at all.

```python
cols = ["customer_id", "total_price"]

t_csv_two = best_of(lambda: pd.read_csv("orders.csv", usecols=cols))
t_parquet_two = best_of(lambda: pd.read_parquet("orders.parquet", engine="pyarrow", columns=cols))

print(f"CSV, 2 of 8 columns:     {t_csv_two:.3f}s")
print(f"Parquet, 2 of 8 columns: {t_parquet_two:.3f}s")
```

```text
CSV, 2 of 8 columns:     0.219s
Parquet, 2 of 8 columns: 0.017s
```

Both formats got faster than their full read, but by very different amounts:

```text
CSV:     full 0.603s -> two-column 0.219s   (2.8x)
Parquet: full 0.028s -> two-column 0.017s   (1.7x)
```

CSV is row-oriented — every value in a row sits right next to every other value on disk, so to find `total_price` on row 500,000 the parser has to walk past `order_id`, `customer_id`, `order_date`, `status`, and `quantity` first, on every single row. `usecols` saves you the *cost of building* the columns you don't want, but not the cost of scanning past their bytes. Parquet's column chunks are laid out separately and the file's footer records exactly where each one starts and ends, so `columns=[...]` lets pyarrow skip the other six chunks' bytes entirely — it never reads them off disk, let alone parses them. That's a structural difference, not a tuning difference, and it's the one that matters most for analytics workloads, which routinely touch a handful of columns across a table with a hundred.

> **Why this step?** This is the whole reason Parquet — not just "a smaller CSV," but a *columnar* format — matters at scale. Most real analytical queries and feature-extraction jobs read a small slice of columns across a large number of rows. Row-oriented formats can't skip work for that access pattern; column-oriented ones can. For the full mental model behind this, see Parquet and columnar formats.

### 6. Check that the dtypes actually survived

```python
orders_from_parquet = pd.read_parquet("orders.parquet", engine="pyarrow")
print(orders_from_parquet.dtypes)
print(orders_from_parquet["order_date"].dt.month.head(3).tolist())
```

```text
order_id                int64
customer_id             int64
order_date     datetime64[us]
status                  object
quantity                 int32
unit_price              float64
is_gift                    bool
total_price             float64
dtype: object

[6, 2, 4]
```

Every dtype matches the original frame exactly — including `quantity` staying `int32`, the narrow type nobody had to remember to ask for. `pd.read_parquet` needed zero extra arguments to get any of this right, because the schema isn't something pandas infers from the values — it's stored in the file's own footer, written there the moment `to_parquet` ran.

> **Why this step?** This is the payoff the whole lesson is chasing. A file format that carries its own types means every reader — your notebook, a teammate's script, a Spark job next year — gets the same dtypes without re-deriving them, which is exactly the property [data contracts](/learn/python-data-apis/data-contracts-and-validation) are trying to buy you through validation code. Parquet gets a slice of that for free, at the file level.

## Where it breaks

Now do the obvious thing instead: read the CSV back with no hints, the way most people actually first load a file they didn't just write themselves.

```python
orders_from_csv = pd.read_csv("orders.csv")
print(orders_from_csv.dtypes)
```

```text
order_id         int64
customer_id      int64
order_date         object   # or "str" on newer pandas
status           object
quantity          int64    # <- was int32
unit_price      float64
is_gift            bool
total_price     float64
dtype: object
```

Two things already went wrong, and neither raised an error:

- `order_date` came back as plain text, not a datetime. pandas has no way to know `"2024-06-21"` was ever meant to be a date rather than a string that happens to look like one — CSV doesn't encode a distinction between "date" and "string that looks like a date."
- `quantity` silently widened from `int32` to `int64`, doubling its memory footprint, because CSV has no concept of integer *width* either — every integer column defaults to whatever pandas' generic inference picks.

The first one breaks loudly the moment you touch it:

```python
orders_from_csv["order_date"].dt.month
```

```text
AttributeError: Can only use .dt accessor with datetimelike values
```

The usual fix is to tell `read_csv` what it's looking at: `parse_dates=["order_date"]`, maybe `dtype={"quantity": "int32"}`. That works — but it only works if whoever's reading the file *already knows* the original schema, and that knowledge doesn't travel with the CSV. It lives in a comment, a README, a Slack message, or nowhere at all, and it silently goes stale the day someone adds a column and forgets to update the `parse_dates` list. See [type coercion and parsing dates](/learn/python-data-apis/type-coercion-and-parsing-dates) for the full set of ways this bites people.

Parquet sidesteps the whole category of bug, not by being smarter about type inference, but by not needing to infer at all — the type was decided once, at write time, and it travels inside the file from then on.

That said, don't walk away thinking Parquet is strictly better and CSV is obsolete — the columnar layout that makes column-selection and compression so effective is also exactly what makes Parquet a poor fit for a few real workloads:

- **Row-at-a-time appends.** If a service logs one new order the moment it happens, appending a single row to a Parquet file means rewriting the file (or juggling a growing pile of tiny part-files). CSV's "just write another line at the end" model, or a proper database, wins there.
- **Fetching one specific row.** Columnar layout is built for scanning many rows across few columns, not for "give me order #482,193." Getting one row still means decompressing the row group it lives in — there's no index the way a database gives you. That's a job for a database, not a file format.
- **Small files.** Parquet's schema footer and row-group bookkeeping are fixed overhead. For a 200-row config file, that overhead can wipe out the size advantage, and CSV's readability just wins on convenience.

[Choosing a data format](/learn/python-data-apis/choosing-a-data-format) walks through this trade-off more generally — the short version is that Parquet earns its keep specifically for read-heavy, analytical access over data that's written once (or in occasional batches) and read many times, which is precisely the shape of most analytics and ML workloads.

## Takeaways

- **Columnar layout is the structural win, not a side effect of compression.** Because each column's values sit contiguously on disk with their locations recorded in the file's footer, a reader can skip whole columns' worth of bytes it doesn't need — CSV's row-oriented layout can never do that, no matter how you tune the read call.
- **Compression compounds on top of that layout, unevenly.** Low-cardinality strings and booleans can shrink to a fraction of a byte per row; high-entropy floats barely shrink at all. Expect your own real-world savings to depend heavily on which columns your data actually has, not to hit exactly 3.5x.
- **The schema lives in the file, not in someone's memory.** `pd.read_parquet` needs no `parse_dates`, no `dtype=`, no tribal knowledge — every reader downstream gets the same types pandas wrote, which is the core reason analytics and ML pipelines standardize on it: a feature-engineering job, a Spark cluster, and a DuckDB query all agree on what a column *is* without re-deriving it from text.
- **The two-column read is the tell.** A pipeline that only ever needs a handful of columns out of many pays for the columns it skips under CSV (scanning past their bytes) but not under Parquet (never reading those bytes at all) — and that gap only grows as tables get wider.
- **It's not a universal upgrade.** Row-at-a-time writes, single-row lookups, and tiny files all work against the same design that makes Parquet fast for everything else — know which shape your workload actually is before reaching for it.

**Related:** Parquet and columnar formats · [Loading data into pandas](/learn/python-data-apis/loading-data-into-pandas) · [Validating dataframes with schemas](/learn/python-data-apis/validating-dataframes-with-schemas) · [Turning messy data into model inputs](/learn/python-data-apis/turning-messy-data-into-model-inputs) · [Files and data formats overview](/learn/python-data-apis/files-and-data-formats-overview)
