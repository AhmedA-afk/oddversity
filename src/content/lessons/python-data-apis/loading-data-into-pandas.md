---
title: "Loading Data from CSV, JSON, and Parquet"
track: "python-data-apis"
status: live
summary: "A hands-on walkthrough that loads the same small dataset four ways — read_csv with dtype hints, read_json, read_parquet, and a DataFrame built from a list of API dicts — showing wh"
duration: "28 min read"
---

Every data source you touch as an AI builder picked its file format for its own reasons, not yours — and the exact same six rows behave differently depending on whether they arrive as CSV, JSON, Parquet, or a raw API response. This walkthrough loads one small dataset all four ways so you can see precisely what each format remembers, what it quietly forgets, and how to tell pandas the difference.

## What we're building

You'll start with one dataset — a handful of orders with an id, a customer, a date, an amount, and a status — and materialize it as `orders.csv`, `orders.json`, and `orders.parquet`, plus a fourth version as a plain Python list of dicts standing in for what `response.json()` would hand you from a REST API. Then you'll load each one back into a DataFrame and compare notes: which formats need `dtype` hints and `parse_dates`, which lose the index and need `set_index` after the fact, and which one turns out to just remember everything on its own. Along the way you'll pick up `nrows` for peeking at a file too big to load in full.

## Setup

You need pandas, and — because one of the four formats is Parquet — a Parquet engine. `pyarrow` is the standard choice and also does double duty later for peeking inside a large file without pandas.

```bash
python -m venv .venv
source .venv/bin/activate  # Windows: .venv\Scripts\activate
pip install pandas pyarrow
```

If you haven't set up isolated environments before, [python-environments-and-venv](/learn/python-data-apis/python-environments-and-venv) covers why this matters before you start installing things globally. Run everything below from a scratch directory — it creates four small files you can open afterward and look at with a text editor, which is worth doing at least once.

## Build it

### 1. Build one typed dataset, then export it three ways

Start by building the DataFrame you actually want — the one with real dtypes — and let pandas write it out to each file format. This matters: it means any type information CSV or JSON *loses* on the way out is a property of the format, not a mistake you made.

```python
import pandas as pd

orders = [
    {"order_id": "ORD-1001", "customer_id": "CUST-77", "order_date": "2026-01-05", "amount": 129.99, "status": "shipped"},
    {"order_id": "ORD-1002", "customer_id": "CUST-12", "order_date": "2026-01-06", "amount": 54.50,  "status": "pending"},
    {"order_id": "ORD-1003", "customer_id": "CUST-77", "order_date": "2026-01-06", "amount": 12.00,  "status": "cancelled"},
    {"order_id": "ORD-1004", "customer_id": "CUST-45", "order_date": "2026-01-07", "amount": 999.00, "status": "shipped"},
    {"order_id": "ORD-1005", "customer_id": "CUST-12", "order_date": "2026-01-08", "amount": 76.25,  "status": "shipped"},
    {"order_id": "ORD-1006", "customer_id": "CUST-90", "order_date": "2026-01-08", "amount": 210.10, "status": "pending"},
]

df_source = pd.DataFrame(orders)
df_source["order_date"] = pd.to_datetime(df_source["order_date"])
df_source["status"] = df_source["status"].astype("category")

df_source.to_csv("orders.csv", index=False, date_format="%Y-%m-%d")
df_source.to_json("orders.json", orient="records", date_format="iso")
df_source.to_parquet("orders.parquet", index=False)
```

`df_source` has real dtypes: `order_date` is `datetime64`, `status` is `category`. Watch what each export does to them.

### 2. `read_csv` with dtype hints, `parse_dates`, and `index_col`

CSV is plain text. Every value — dates, numbers, categories — gets written out as a string and pandas has to re-guess the type on the way back in. Left alone, `order_date` comes back as an object column of strings and `status` comes back as generic text, not `category`. You fix both explicitly:

```python
df_csv = pd.read_csv(
    "orders.csv",
    dtype={
        "order_id": "string",
        "customer_id": "string",
        "amount": "float64",
        "status": "category",
    },
    parse_dates=["order_date"],
    index_col="order_id",
)

print(df_csv.dtypes)
```

`dtype` and `parse_dates` do two different jobs: `dtype` is a straight cast per column, `parse_dates` runs pandas' date parser on the named columns before the frame is assembled. `index_col="order_id"` sets the index in the same call — no separate step needed for CSV. This combination is also where CSV bites people in production: a numeric-looking id column like `"00012"` will silently become the integer `12` unless you pin it to `"string"` the way `order_id` is pinned here. See [reading-and-writing-csv](/learn/python-data-apis/reading-and-writing-csv) for the rest of `read_csv`'s dial-heavy surface area.

### 3. `read_json` — no `index_col`, and category doesn't survive either

JSON has real number, boolean, and null types, so — unlike CSV — `amount` comes back as a genuine float without you asking. But JSON has no concept of a pandas `category` or `datetime64`, so those two still need help, and `read_json` has no `index_col` parameter at all — you set the index yourself after loading:

```python
df_json = (
    pd.read_json("orders.json", orient="records", convert_dates=["order_date"])
    .astype({"customer_id": "string", "status": "category"})
    .set_index("order_id")
)

print(df_json.dtypes)
```

`convert_dates` is `read_json`'s version of `parse_dates` — pass it the column names, since `read_json`'s automatic date detection only fires on columns named things like `date`, `modified`, or ending in `_at`/`_time`, and `order_date` doesn't match that list. Details on the format live in [json-and-jsonl-files](/learn/python-data-apis/json-and-jsonl-files).

### 4. `read_parquet` — the one that just remembers

Parquet stores an actual schema alongside the data: column types, including whether a column is dictionary-encoded (pandas' `category`) and what a datetime column's unit is. There's nothing to hint:

```python
df_parquet = pd.read_parquet("orders.parquet").set_index("order_id")

print(df_parquet.dtypes)
```

You still call `set_index` yourself — `read_parquet` has no `index_col` either — but `order_date` and `status` need no casting at all. There's a shortcut worth knowing: if you set the index *before* writing, Parquet stores it as part of the file and restores it automatically, no `set_index` call required on read:

```python
df_source.set_index("order_id").to_parquet("orders_indexed.parquet")

df_reloaded = pd.read_parquet("orders_indexed.parquet")
print(df_reloaded.index.name)  # 'order_id' — restored with zero extra code
```

That's the cleanest version of "set the index at load time" of the four: bake it in once, at write time, and every future read gets it for free. More on why the format behaves this way in [parquet-and-columnar-formats](/learn/python-data-apis/parquet-and-columnar-formats).

### 5. A DataFrame straight from an API response

A REST API handing you JSON is really the same situation as step 3, just without a file in between — `response.json()` gives you a Python list of dicts, and you build the DataFrame directly:

```python
# stand-in for: response.json()
api_orders = [
    {"order_id": "ORD-2001", "customer_id": "CUST-31", "order_date": "2026-01-09", "amount": 45.0,  "status": "shipped"},
    {"order_id": "ORD-2002", "customer_id": "CUST-31", "order_date": "2026-01-10", "amount": 18.75, "status": "pending"},
]

df_api = (
    pd.DataFrame(api_orders)
    .assign(order_date=lambda d: pd.to_datetime(d["order_date"]))
    .astype({"customer_id": "string", "status": "category"})
    .set_index("order_id")
)

print(df_api.dtypes)
```

Same shape of fix as the JSON file: numbers and booleans arrive typed correctly, dates and categories don't, and there's no `index_col` equivalent on the `DataFrame` constructor — `set_index` is the standard pattern regardless of where the dicts came from. Once you're pulling real records over the network instead of hardcoding them, [calling-rest-apis-with-python](/learn/python-data-apis/calling-rest-apis-with-python) is the natural next stop.

### 6. `nrows` — peek before you commit to a full load

Everything above assumed the file was small enough to just load. On a multi-gigabyte export, you want to check column names, spot-sample values, and confirm dtypes *before* waiting on a full parse:

```python
df_peek = pd.read_csv("orders.csv", nrows=5)
```

`nrows=5` stops reading after the fifth data row — on a 5-million-row file this returns about as fast as opening the file at all. The same idea applies to JSON, but only for JSON Lines (one record per line), because a single JSON array has no line boundary to stop at — pandas would have to parse the whole structure just to find row five:

```python
df_source.to_json("orders.jsonl", orient="records", lines=True, date_format="iso")

df_peek_json = pd.read_json("orders.jsonl", lines=True, nrows=5)
```

Parquet's peek looks different because it's columnar — the cheap operation is reading fewer *columns*, not fewer rows:

```python
df_cols = pd.read_parquet("orders.parquet", columns=["order_id", "amount"])
```

If you specifically need the first few rows of a huge Parquet file without pandas loading the whole thing, drop to `pyarrow` directly and read one row-group batch:

```python
import pyarrow.parquet as pq

pf = pq.ParquetFile("orders.parquet")
first_batch = next(pf.iter_batches(batch_size=5))
df_peek_parquet = first_batch.to_pandas()
```

## Run it

Load all four and compare dtypes side by side:

```python
for name, df in [("csv", df_csv), ("json", df_json), ("parquet", df_parquet), ("api", df_api)]:
    print(name, dict(df.dtypes))
```

You should see `order_date` as `datetime64[ns]`, `status` as `category`, and `amount` as `float64` in all four — that's the payoff of the casts above. One thing won't match by default: `customer_id` comes back as pandas' `string` dtype in `df_csv`, `df_json`, and `df_api` because you explicitly asked for it, but as plain `object` in `df_parquet`, because you never told `read_parquet` to prefer the nullable string type (that's what `dtype_backend="pyarrow"` is for — more in Extend it). It's a real difference, and a reminder to check `dtypes`, not just eyeball `.head()`, before you concatenate or compare DataFrames built from different sources.

> The lesson underneath all four loaders is the same: CSV and JSON only remember what your data *looked like* when it was written. Parquet remembers what it *is*.

## Harden it

A few things that go wrong once these files aren't ones you generated yourself:

- **Encoding.** A CSV exported from Excel often carries a byte-order mark, which shows up as a mangled first column name like `"\ufeforder_id"`. Read it with `encoding="utf-8-sig"` instead of the default `"utf-8"` to strip it.
- **Dtype hints can crash the load, not just fail quietly.** If `amount` has a stray `"N/A"` in one row, `dtype={"amount": "float64"}` raises a `ValueError` at parse time — the whole load fails, which is at least honest. A softer pattern for genuinely messy data: load the column as a string, then convert with `pd.to_numeric(df["amount"], errors="coerce")` and check `.isna().sum()` afterward so you know exactly how many rows you just turned into missing values, rather than finding out downstream.
- **`parse_dates` can fail silently.** If a date string doesn't parse, older pandas versions leave the column as plain text instead of raising. Confirm with `pd.api.types.is_datetime64_any_dtype(df["order_date"])`, and if it's `False`, re-run `pd.to_datetime(df["order_date"], errors="coerce")` and check for new `NaT` values. [type-coercion-and-parsing-dates](/learn/python-data-apis/type-coercion-and-parsing-dates) goes deeper on this failure mode.
- **Category dtype freezes its category set at load time.** If a later batch of rows introduces a `status` value like `"refunded"` that wasn't in the file you loaded, appending it under a fixed `category` dtype gives you `NaN`, not the new label. Recheck `df["status"].cat.categories` before trusting a groupby on that column.
- **"Missing" doesn't look identical across formats.** A blank CSV field, a JSON `null`, and a Parquet null all end up as pandas missing values, but the exact marker differs by dtype (`NaN` for floats, `NaT` for datetimes, `pd.NA` for nullable types) — check with `.isna()`, never `== None` or `== ""`.

Before you merge data that arrived through different pipelines, it's worth asserting the schemas actually agree rather than assuming they do — see [validating-dataframes-with-schemas](/learn/python-data-apis/validating-dataframes-with-schemas).

## Extend it

- **Cache the clean version.** Once you've loaded a messy CSV or JSON file and paid the cost of casting dates and categories, write the result straight to Parquet (`df.to_parquet("orders_clean.parquet")`). Every subsequent run reads it back exact and fast, with no re-parsing.
- **Try `dtype_backend="pyarrow"`** on `read_csv`, `read_json`, and `read_parquet` (pandas 2.x) to get consistent nullable, Arrow-backed types across all three loaders instead of the object-vs-string mismatch you saw in Run it.
- **Read straight from a URL.** `pd.read_csv("https://.../orders.csv")` takes the same `dtype`, `parse_dates`, and `nrows` arguments as a local file — handy for a first look at a dataset before you decide it's worth downloading.
- **Decide your project's default format up front** rather than per-file — [choosing-a-data-format](/learn/python-data-apis/choosing-a-data-format) walks through the tradeoffs you just saw in practice.
- Once the DataFrame is loaded and typed, the next steps are cleaning it and shaping it into something a model can consume — see [turning-messy-data-into-model-inputs](/learn/python-data-apis/turning-messy-data-into-model-inputs).

**Related:** [validating-dataframes-with-schemas](/learn/python-data-apis/validating-dataframes-with-schemas) · [handling-missing-values](/learn/python-data-apis/handling-missing-values) · [choosing-a-data-format](/learn/python-data-apis/choosing-a-data-format) · [turning-messy-data-into-model-inputs](/learn/python-data-apis/turning-messy-data-into-model-inputs) · [python-data-pipeline-whole-game](/learn/python-data-apis/python-data-pipeline-whole-game)
