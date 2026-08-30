---
title: "pandas DataFrames and Series"
track: "python-data-apis"
status: live
summary: "A foundational, hands-on introduction to the pandas DataFrame and Series — how they're built on NumPy, why every column has one dtype, and how to size up a support-ticket dataset w"
duration: "14 min read"
---

You've just been handed a CSV export of every support ticket filed this quarter — tens of thousands of rows, a dozen columns, and no schema anyone can hand you. Before you filter it, aggregate it, or feed any of it to a model, you need a fast, honest read of what's actually in the file. That's the job of a DataFrame — and the four methods you're about to learn are how you do that read in under a minute.

## What it is

A pandas **DataFrame** is a two-dimensional, labeled table of data: rows and columns, where every column holds values of one specific type. Under the hood, each column is stored as a NumPy array (or a pandas extension array that behaves like one), so operations on a column run as compiled, vectorized NumPy code instead of a Python `for` loop over individual values. A DataFrame also carries two labeled axes: an **index** for the rows, and **column names** for the columns.

A **Series** is a DataFrame's single-column sibling — a one-dimensional labeled array. Pull one column out of a DataFrame and you get a Series back. Build one on its own:

```python
import pandas as pd

resolution = pd.Series([4.5, 26.0, None, 2.25, None, 18.75], name="resolution_hours")
print(resolution)
```

```
0     4.50
1    26.00
2      NaN
3     2.25
4      NaN
5    18.75
Name: resolution_hours, dtype: float64
```

Two things to notice immediately: the numbers on the left (`0` through `5`) are the **index**, not part of your data — pandas generated it automatically. And the `None` values became `NaN` (Not a Number), because a float64 array has no way to hold a mixed value; missing data in a numeric column has to be a float itself.

```python
print(resolution.index)
print(resolution.dtype)
```

```
RangeIndex(start=0, stop=6, step=1)
float64
```

A DataFrame is best understood as a dict of Series that all share the same index:

```python
ticket_id = pd.Series([1001, 1002, 1003, 1004, 1005, 1006])
priority  = pd.Series(["high", "low", "medium", "high", "low", "medium"])

df_small = pd.DataFrame({
    "ticket_id": ticket_id,
    "priority": priority,
    "resolution_hours": resolution,
})
print(df_small)
print(df_small.dtypes)
```

```
   ticket_id priority  resolution_hours
0       1001     high              4.50
1       1002      low             26.00
2       1003   medium               NaN
3       1004     high              2.25
4       1005      low               NaN
5       1006   medium             18.75
ticket_id             int64
priority                str
resolution_hours    float64
dtype: object
```

Each column kept its own dtype (`int64`, text, `float64`) while sharing one row index. That's the whole structure — everything else pandas does is built on top of it.

## The mental model

If you've spent time with JSON, your instinct for tabular data is probably a list of dicts — one record per row, keys as field names:

```python
tickets = [
    {"ticket_id": 1001, "priority": "high", "resolution_hours": 4.5},
    {"ticket_id": 1002, "priority": "low",  "resolution_hours": 26.0},
]
```

That's a **row-oriented** picture: each record stands alone, and nothing stops one dict from having a missing key or a value of the wrong type. A DataFrame flips the orientation. It's **column-oriented** — a `priority` column is one contiguous, strictly-typed array end to end, and a `ticket_id` column is a separate one. Consistency is enforced per column, not per row. This is also why a DataFrame reads and stores nested structures worse than a plain list of dicts does — flat, uniform columns are the whole point. For genuinely nested JSON, see [nested JSON in memory](/learn/python-data-apis/nested-json-in-memory) before you try to force it into a table.

Picture a spreadsheet, but each column has been given a strict data type and a solid block of memory, instead of every cell being an independent, freely-typed Python object. That's the row/column grid. Now add the part spreadsheets don't have: the **index** isn't just row numbers for display — it's a real label axis you can select on, sort by, and align on. Two Series with the same index line up element-by-element automatically when you do arithmetic between them; two DataFrames merge on matching index or column values without you writing a manual key-lookup loop. Positions (0, 1, 2, ...) are the default label, but they're a convenience default, not the mechanism — you'll meet this properly in [selecting, filtering, and indexing](/learn/python-data-apis/selecting-filtering-indexing).

## Why it works this way

NumPy gets its speed from knowing, in advance, the exact type and byte width of every element in an array — that's what lets it hand a whole column to a tight compiled loop instead of paying Python's per-object overhead on every single value. See [NumPy arrays fundamentals](/learn/python-data-apis/numpy-arrays-fundamentals) for why that matters even before pandas enters the picture. If a DataFrame let each column freely mix types the way a Python list can, you'd lose that speed on *every* column, not just the messy ones — so pandas commits to one dtype per column, and only relaxes to a slower, general-purpose fallback when a column genuinely can't be reduced to one numeric or string type.

That's also why arithmetic on a column is a single vectorized call instead of a loop. Converting hours to minutes for the whole `resolution_hours` column is one multiply, broadcast across every element (missing values propagate as `NaN` automatically, they don't crash the operation):

```python
minutes = df["resolution_hours"] * 60
```

```
0     270.0
1    1560.0
2       NaN
3     135.0
4       NaN
5    1125.0
Name: resolution_hours, dtype: float64
```

Text is the interesting edge case. NumPy has no native variable-length string type, so older pandas stored text columns as `dtype: object` — an array of pointers to ordinary Python `str` objects. It worked, but you gave up most of the speed and memory efficiency that made columnar typing worth doing in the first place. Current pandas (3.x) gives text its own dedicated string dtype instead, shown as `str` in `dtypes` output — same core idea (one type per column, stored efficiently), just extended to cover text properly. If you're on an older pandas, you'll see the same columns reported as `object` — it's the same concept under an older label.

The index exists for the same reason: alignment by label is something pandas can do fast and automatically, so you don't hand-write the join yourself. You'll lean on this heavily once you get to [joining and merging DataFrames](/learn/python-data-apis/joining-and-merging-dataframes).

## A concrete example

Say your support platform exported this file, `tickets.csv`:

```python
import pandas as pd

tickets_csv = """ticket_id,created_at,priority,status,resolution_hours,customer_tier,agent
1001,2026-01-03,high,closed,4.5,enterprise,priya
1002,2026-01-03,low,closed,26.0,free,jordan
1003,2026-01-04,medium,open,,pro,priya
1004,2026-01-04,high,closed,2.25,enterprise,sam
1005,2026-01-05,low,open,,free,jordan
1006,2026-01-05,medium,closed,18.75,pro,sam
"""

with open("tickets.csv", "w") as f:
    f.write(tickets_csv)

df = pd.read_csv("tickets.csv")
```

This is the moment to size the dataset up before you do anything to it. Four calls, in this order, tell you almost everything you need.

**1. `df.head()` — what does this actually look like?**

```python
df.head()
```

```
   ticket_id  created_at priority  status  resolution_hours customer_tier   agent
0       1001  2026-01-03     high  closed              4.50    enterprise   priya
1       1002  2026-01-03      low  closed             26.00          free  jordan
2       1003  2026-01-04   medium    open               NaN           pro   priya
3       1004  2026-01-04     high  closed              2.25    enterprise     sam
4       1005  2026-01-05      low    open               NaN          free  jordan
```

Column names spelled the way you expect, values that look plausible, and you already spot a `NaN` in row 2 before you've run a single missing-value check.

**2. `df.dtypes` — what did pandas infer?**

```python
df.dtypes
```

```
ticket_id             int64
created_at              str
priority                str
status                  str
resolution_hours    float64
customer_tier           str
agent                   str
dtype: object
```

`created_at` came in as text, not a date — `read_csv` never guesses dates unless you tell it to. That's a real gap between "what the data means" and "what pandas thinks it is," and it's exactly the kind of thing you catch here instead of three cells later. When you're ready to close that gap, see [type coercion and parsing dates](/learn/python-data-apis/type-coercion-and-parsing-dates).

**3. `df.info()` — shape, nulls, and memory in one shot**

```python
df.info()
```

```
<class 'pandas.DataFrame'>
RangeIndex: 6 entries, 0 to 5
Data columns (total 7 columns):
 #   Column            Non-Null Count  Dtype  
---  ------            --------------  -----  
 0   ticket_id         6 non-null      int64  
 1   created_at        6 non-null      str    
 2   priority          6 non-null      str    
 3   status            6 non-null      str    
 4   resolution_hours  4 non-null      float64
 5   customer_tier     6 non-null      str    
 6   agent             6 non-null      str    
dtypes: float64(1), int64(1), str(5)
memory usage: 468.0 bytes
```

This is the single most useful call for sizing up an unfamiliar file. `RangeIndex: 6 entries` confirms the row count. `Non-Null Count` next to every column is your missing-data scan for free — `resolution_hours` is `4 non-null` out of 6, so two tickets have no resolution time yet (unsurprising, since two are still `open`). On a real 40,000-row export this one line is how you'd spot a column that's 60% empty before you waste time building logic around it — see [handling missing values](/learn/python-data-apis/handling-missing-values) for what to do about it. The exact memory-usage figure will vary a little by platform, pandas version, and whether an optional string backend is installed — don't read anything into the precise byte count, just notice it's there as a cheap footprint check.

**4. `df.describe()` — a statistical summary, numeric columns only by default**

```python
df.describe()
```

```
         ticket_id  resolution_hours
count     6.000000          4.000000
mean   1003.500000         12.875000
std       1.870829         11.399013
min    1001.000000          2.250000
25%    1002.250000          3.937500
50%    1003.500000         11.625000
75%    1004.750000         20.562500
max    1006.000000         26.000000
```

Notice `describe()` silently skipped every text column — `priority`, `status`, `customer_tier`, `agent`, even `created_at`. It only summarizes numeric dtypes unless you ask otherwise. The `count` row doubles as another missing-data check: `resolution_hours` counts 4, confirming what `info()` already told you.

Pull a single column out and it's a Series, with its own index and dtype, sliced straight from the DataFrame:

```python
print(type(df), type(df["priority"]))
```

```
<class 'pandas.DataFrame'> <class 'pandas.Series'>
```

Pull a single *row* instead, and something worth pausing on happens:

```python
print(df.loc[2])
```

```
ticket_id                 1003
created_at          2026-01-04
priority                medium
status                    open
resolution_hours           NaN
customer_tier               pro
agent                    priya
Name: 2, dtype: object
```

That row is also a Series — but its dtype is `object`, even though every column in the DataFrame is cleanly typed. A row necessarily mixes an `int64`, several strings, and a `float64` in one container, so pandas has nowhere to put it but the general-purpose fallback. This is the column-oriented mental model showing up directly in your terminal: rows are a convenient view, columns are the real storage.

## Where it shows up

Any time tabular data enters a Python workflow, it becomes a DataFrame almost by default — a CSV export, a database query result, a Parquet file (see [files and data formats overview](/learn/python-data-apis/files-and-data-formats-overview) and [Parquet and columnar formats](/learn/python-data-apis/parquet-and-columnar-formats)), or a REST API response you've flattened into rows. The head/dtypes/info/describe routine you just ran is the standard first move on all of them — every experienced practitioner runs some version of it before writing a line of cleaning or filtering code, because it's the fastest way to find out whether the data matches what you were told it looks like.

From there, it feeds straight into the rest of the pandas toolchain: grouping tickets by `priority` or `agent` for a summary (see [GroupBy and aggregation](/learn/python-data-apis/groupby-and-aggregation)), joining a tickets table against a customers table, or cleaning and reshaping columns until they're safe inputs for a model — the path covered in [turning messy data into model inputs](/learn/python-data-apis/turning-messy-data-into-model-inputs). Every one of those steps assumes you already know your row count, your dtypes, and where the gaps are — which is exactly what this lesson gives you.

## Watch out for

**`describe()` only covers numeric columns by default.** On a wide, real-world file it's easy to run `describe()`, see clean-looking statistics, and conclude the data is fine — while every text column went unchecked. Pass `include="all"` (or `include=["object", "str"]` on older/newer pandas respectively) when you actually want every column summarized.

**An inferred dtype is a guess, not a guarantee.** `read_csv` decided `created_at` was text and `resolution_hours` was `float64` based only on what was in this file. A single stray value — a blank cell forcing an ID column to `float64`, a rogue string forcing a numeric column to text — will silently change a column's dtype on your next load, and everything downstream that assumed the old dtype breaks quietly instead of loudly. Always re-check `dtypes` after loading a file you didn't create yourself.

**A DataFrame you got by slicing another one may not be independent.** `subset = df[df["priority"] == "high"]` can hand you back a *view* into the original data rather than a fresh copy, and then `subset["status"] = "escalated"` may trigger a `SettingWithCopyWarning` instead of reliably updating anything. It's one of the most common mid-level pandas bugs — see [pandas SettingWithCopy mistakes](/learn/python-data-apis/pandas-settingwithcopy-mistakes) for how to avoid it before it costs you a debugging afternoon.

## Where next

You now know how to look at a DataFrame and trust what you're seeing. The natural next steps are loading real files with the options that matter (encoding, dtypes, date parsing) in [loading data into pandas](/learn/python-data-apis/loading-data-into-pandas), then actually working with the rows and columns you've inspected in [selecting, filtering, and indexing](/learn/python-data-apis/selecting-filtering-indexing).

**Related:** [Loading data into pandas](/learn/python-data-apis/loading-data-into-pandas) · [Selecting, filtering, and indexing](/learn/python-data-apis/selecting-filtering-indexing) · [GroupBy and aggregation](/learn/python-data-apis/groupby-and-aggregation) · [Handling missing values](/learn/python-data-apis/handling-missing-values) · [pandas quiz](/learn/python-data-apis/pandas-quiz)
