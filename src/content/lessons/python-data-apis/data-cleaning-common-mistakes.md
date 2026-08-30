---
title: "Cleaning Mistakes That Corrupt Data Silently"
track: "python-data-apis"
status: live
summary: "A field guide to five pandas cleaning bugs that never raise an exception — view-vs-copy assignment, uncounted row drops, object-dtype columns hiding mixed types, iterrows mutation "
duration: "16 min read"
---

The dangerous bugs in a cleaning pipeline aren't the ones that throw a traceback — those get fixed by lunchtime. The dangerous ones return a DataFrame that looks completely normal, ships to a report or a model, and quietly poisons everything downstream of it. Here are five ways clean-looking pandas code corrupts data without saying a word, and the guard that catches each one before it reaches production.

### 1. Cleaning in place on a view, not a copy

```python
import pandas as pd

df = pd.DataFrame({
    "status":   ["active", "closed", "active", "active"],
    "quantity": [2, 5, 1, 3],
    "price":    [10.0, 20.0, 15.0, 8.0],
})

active = df[df["status"] == "active"]
active["total"] = active["quantity"] * active["price"]
```

**Why it's wrong**: `df[df["status"] == "active"]` returns a new object, but pandas doesn't tell you — and often can't determine itself — whether that object shares memory with `df` (a view) or owns its data outright (a copy). Assigning into it with `active["total"] = ...` is chained indexing on an object of ambiguous origin. Depending on the dtypes involved and the pandas version, that write sometimes lands on `df`'s underlying array and sometimes lands on a throwaway copy that vanishes when `active` falls out of scope. Nothing in the code tells you which one happened. See [Pandas SettingWithCopy mistakes](/learn/python-data-apis/pandas-settingwithcopy-mistakes) for the full view-vs-copy model this bug comes from.

**Symptom**: You get a `SettingWithCopyWarning` — easy to miss in a notebook full of output, and easy to disable by accident, since `pd.options.mode.chained_assignment = None` shows up in a lot of "fixes" you'll find online and just switches off the smoke alarm. Worse, the warning doesn't tell you whether the write actually succeeded. You find `total` missing from `df` entirely, or present but wrong, three steps later when a merge comes up short or a groupby total doesn't match a number someone cross-checked by hand.

**Fix**: Make the copy explicit the instant you slice, and do the assignment as a single `.loc` call instead of two chained ones.

```python
active = df[df["status"] == "active"].copy()
active["total"] = active["quantity"] * active["price"]

# or modify df itself directly, in one indexing operation:
df.loc[df["status"] == "active", "total"] = df["quantity"] * df["price"]
```

Turn the warning into a hard failure while you develop, so these surface immediately instead of three files later:

```python
pd.options.mode.chained_assignment = "raise"
```

### 2. Dropping rows without counting them

```python
df = pd.read_csv("signups.csv")
df = df.dropna(subset=["email"])
df = df[df["email"].str.contains("@")]
df = df.drop_duplicates(subset=["user_id"])
```

**Why it's wrong**: Every one of these lines is a reasonable cleaning step in isolation. Chained together with no bookkeeping, they're also three unlogged opportunities to lose a chunk of your dataset — a `str.contains` that returns `NaN` (and gets treated as false) on rows pandas parsed oddly, a duplicate key that's broader than you meant, a `dropna` that catches more columns than you intended once someone edits the `subset` list. Nothing errors, because nothing is wrong from pandas' point of view — you asked it to drop rows, and it did exactly that. The bug lives in the gap between what you meant and what you wrote, and only a count exposes it.

**Symptom**: Numbers don't reconcile — a report shows 8,000 signups where a stakeholder expected 8,400, and nobody can say where the other 400 went, because the loss happened upstream in a cell nobody re-reads. Aggregations look internally consistent because everything downstream is quietly operating on the smaller set.

**Fix**: Treat every row-dropping call as something you log, not something you trust silently.

```python
def drop_and_report(df, keep_mask, reason):
    dropped = (~keep_mask).sum()
    if dropped:
        print(f"{reason}: dropping {dropped} of {len(df)} rows ({dropped / len(df):.1%})")
    return df[keep_mask]

df = drop_and_report(df, df["email"].notna(), "missing email")
df = drop_and_report(df, df["email"].str.contains("@", na=False), "malformed email")
df = drop_and_report(df, ~df["user_id"].duplicated(), "duplicate user_id")
```

Set a threshold and fail the pipeline, not just the report, when a step drops more than expected:

```python
before = len(df)
df = df.dropna(subset=["email"])
loss = 1 - len(df) / before
if loss > 0.05:
    raise ValueError(f"dropna on email removed {loss:.1%} of rows — investigate before continuing")
```

For the broader question of when a value should be dropped versus imputed in the first place, see [handling missing values](/learn/python-data-apis/handling-missing-values).

### 3. Letting mixed dtypes through

```python
revenue = pd.Series(["100", "250", "300"])
print(revenue.dtype)   # object
print(revenue.sum())   # '100250300' -- string concatenation, not 650
```

**Why it's wrong**: pandas infers a column's dtype from its contents at load time. If even one value in a numeric-looking CSV column fails to parse as a number — a stray `"N/A"`, a thousands separator like `"1,200"`, a trailing unit like `"42kg"` — the *entire column* falls back to `object` dtype, which stores individual boxed Python values instead of a typed numeric array. An all-numeric-looking `object` column of strings sails through a `.head()` glance and a `df.info()` skim without raising a flag. The corruption only shows up on aggregation: `.sum()` on strings concatenates them, `.mean()` on strings raises a `TypeError` — and often not in the cell where the dtype went wrong, but three transformations later inside a groupby.

**Symptom**: A total that's obviously nonsense (a nine-digit "revenue" for four rows) if someone happens to eyeball it; a `TypeError: unsupported operand type(s)` deep inside an aggregation if the column has a real mix of types; or, worst case, a number that's merely wrong rather than absurd, and ships.

**Fix**: Check dtypes right after load and again after any join or merge — merges are a common place for a clean numeric column to pick up `object` dtype from the other side. When you coerce, count what fails instead of discarding that count.

```python
assert df["revenue"].dtype.kind in "if", f"expected numeric revenue, got {df['revenue'].dtype}"

numeric = pd.to_numeric(df["revenue"], errors="coerce")
broke = numeric.isna() & df["revenue"].notna()
if broke.any():
    print(df.loc[broke, "revenue"].tolist())   # see the actual bad values
    raise ValueError(f"{broke.sum()} revenue values didn't parse as numbers")
df["revenue"] = numeric
```

`errors="coerce"` is fine to use — silently discarding the count of what it turned into `NaN` is the mistake, not the coercion itself. See [type coercion and parsing dates](/learn/python-data-apis/type-coercion-and-parsing-dates) for the same pattern applied to dates and categoricals, which fail in the same quiet way.

### 4. Mutating a DataFrame while iterating over it

```python
for idx, row in df.iterrows():
    if row["price"] < 0:
        row["price"] = 0   # looks like it fixes df -- it doesn't
```

**Why it's wrong**: `iterrows()` builds a fresh `Series` for every row it hands you — a copy of that row's data, not a live window into `df`. Assigning into it changes the copy and discards it on the next loop iteration; `df` never sees the write. This isn't a corner case you're expected to intuit — pandas' own `iterrows()` documentation says it outright: "You should never modify something you are iterating over. This is not guaranteed to work in all cases. Depending on the data types, the iterator returns a copy and not a view, and writing to it will have no effect." The failure mode is worse than an error, because nothing stops the loop — it runs to completion, looks like it did its job, and leaves the source data untouched.

**Symptom**: No exception, no warning. The loop finishes normally, and it's only when you check `df["price"].min()` afterward — or a downstream step chokes on a negative price you thought you'd already zeroed — that you discover the "fix" never landed.

**Fix**: Don't put row-by-row mutation inside `iterrows()` at all. Use vectorized boolean masking, which is also typically much faster on anything but a tiny frame.

```python
df.loc[df["price"] < 0, "price"] = 0
```

If the per-row logic is genuinely too irregular to vectorize, write back by label with `.at` instead of into the borrowed row:

```python
for idx, row in df.iterrows():
    if row["price"] < 0:
        df.at[idx, "price"] = 0   # writes to df, not to the copy
```

The same mismatch shows up with row deletion — `iterrows()` snapshots what it will iterate over up front, so calling `df.drop(idx, inplace=True)` mid-loop mutates `df` without changing what the loop sees next. Whenever "what I'm modifying" and "what I'm iterating" are two different objects, you've built a bug that's hard to reproduce from reading the code alone. See [selecting, filtering, and indexing](/learn/python-data-apis/selecting-filtering-indexing) for the vectorized alternative to almost every `iterrows()` loop you'll be tempted to write.

### 5. Sending data to a model with no validation gate

```python
import requests

def score_customer(row):
    payload = {"age": row["age"], "income": row["income"], "region": row["region"]}
    resp = requests.post(MODEL_ENDPOINT, json=payload)
    return resp.json()["risk_score"]

scores = [score_customer(row) for _, row in customers.iterrows()]
```

**Why it's wrong**: This code has no opinion about what a valid `age`, `income`, or `region` looks like — it forwards whatever survived cleaning, unchecked. If a row has `age = NaN` (how pandas represents a missing value in a float column), Python's `json` module will happily serialize it as the non-standard token `NaN`; some servers parse that back to a float, some reject it, some silently coerce it to `0` or `null`. If `region` is an empty string rather than genuinely missing, most model APIs won't reject it either — they'll apply whatever default or fallback logic they have and return a score computed against the wrong baseline. None of this raises in your code. You get a number back for every single row, and a number that comes back without an error looks exactly like a correct one.

**Symptom**: Predictions that are individually plausible but wrong for a subset of rows you can't identify after the fact, because the bad input and the bad output are separated by a network call with no record of what was actually sent. Aggregate model metrics look fine because the corrupted rows are a minority — the same minority, every run.

**Fix**: Validate against an explicit schema before the request leaves your process, and refuse to send anything that fails it. A hard failure on one row beats a silent wrong answer on all of them.

```python
from pydantic import BaseModel, ValidationError, field_validator

class CustomerInput(BaseModel):
    age: int
    income: float
    region: str

    @field_validator("age")
    @classmethod
    def plausible_age(cls, v):
        if not (0 < v < 120):
            raise ValueError(f"age {v} is out of plausible range")
        return v

    @field_validator("region")
    @classmethod
    def region_not_blank(cls, v):
        if not v.strip():
            raise ValueError("region is empty")
        return v

def score_customer(row):
    validated = CustomerInput(**row.to_dict())   # raises, doesn't guess
    resp = requests.post(MODEL_ENDPOINT, json=validated.model_dump())
    resp.raise_for_status()
    return resp.json()["risk_score"]

scores, failures = [], []
for _, row in customers.iterrows():
    try:
        scores.append(score_customer(row))
    except ValidationError as e:
        failures.append((row.get("user_id"), str(e)))

if failures:
    print(f"{len(failures)} rows failed validation and were never sent to the model")
```

The gate is the entire point — a row that fails validation should exit the pipeline as a visible failure, not a silently degraded prediction. See [validating dataframes with schemas](/learn/python-data-apis/validating-dataframes-with-schemas) for building this into a reusable schema instead of one-off validators, and [turning messy data into model inputs](/learn/python-data-apis/turning-messy-data-into-model-inputs) for the full path from raw rows to a validated payload.

> None of these five mistakes throws an exception at the moment it happens. That's exactly why a checklist earns its place — a try/except can't catch a bug that never raises.

## Pre-flight checklist

Run through this before a cleaned DataFrame leaves your hands — for a report, a merge, or a model call:

- [ ] Every slice you're about to assign into was made with `.copy()`, or you're assigning with a single `.loc[...] = ...` call rather than chained indexing.
- [ ] Every `dropna`, `drop_duplicates`, boolean filter, or join has a before/after row count next to it, printed or logged — not assumed.
- [ ] `df.dtypes` has been checked right after load and again after any merge, and every column you expect to be numeric actually is.
- [ ] No loop mutates the frame it's iterating over through a `Series` copy from `iterrows()` — writes go through `.loc`/`.at` on the original frame, or are vectorized away entirely.
- [ ] Nothing reaches a model, an API, or a report without an explicit schema check first, with a real failure on anything that doesn't pass it — never a silent default.

**Related:** [Pandas SettingWithCopy mistakes](/learn/python-data-apis/pandas-settingwithcopy-mistakes) · [Data cleaning workflow](/learn/python-data-apis/data-cleaning-workflow) · [Handling missing values](/learn/python-data-apis/handling-missing-values) · [Type coercion and parsing dates](/learn/python-data-apis/type-coercion-and-parsing-dates) · [Selecting, filtering, indexing](/learn/python-data-apis/selecting-filtering-indexing) · [Validating dataframes with schemas](/learn/python-data-apis/validating-dataframes-with-schemas) · [Data contracts and validation](/learn/python-data-apis/data-contracts-and-validation) · [Turning messy data into model inputs](/learn/python-data-apis/turning-messy-data-into-model-inputs)
