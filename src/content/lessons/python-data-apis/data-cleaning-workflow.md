---
title: "The Data Cleaning Workflow"
track: "python-data-apis"
status: live
summary: "Teaches the repeatable profile-fix-validate-re-profile loop for cleaning raw data, worked through a batch of messy scraped product reviews in pandas, with an emphasis on reproducib"
duration: "16 min read"
---

Say you've just scraped a batch of product reviews for a sentiment model, and the rating column alone has four different ways of saying "five stars." Fix it by hand in a spreadsheet and it works exactly once — tomorrow's scrape brings the same mess back, and you won't remember what you changed or why.

## What it is

The data cleaning workflow is a repeatable four-step loop you run against every batch of raw data before it reaches a model, a dashboard, or another team:

1. **Profile** — look at the data as it actually is, not as you assume it is: dtypes, null counts, duplicate counts, the distinct values sitting in each column.
2. **Fix** — write functions that transform the raw records into the shape you need: parsing types, handling missing values, deduplicating.
3. **Validate** — run an explicit set of checks against the fixed data that either pass or fail, with no eyeballing and no judgment call in the loop.
4. **Re-profile** — profile again, with the same profiling code, and compare the new numbers to the old ones to confirm the fix did what you think it did — and nothing else.

When a validation check fails, or a re-profile turns up something you didn't expect, you go back to Fix, adjust the code, and run the whole loop again. The output of this workflow isn't "clean data" as a one-time artifact sitting in a file — it's a function you can hand any new batch of raw data with roughly the same shape, and get clean data back, deterministically, every time. If a step in your process can't be rerun on tomorrow's batch without a human reopening a spreadsheet, it isn't part of the workflow — it's a one-off that you'll be repeating forever.

## The mental model

Picture this less like editing a document and more like a quality-control loop on a production line: every batch that comes off the belt — a new scrape, a new export, a new API pull — gets inspected, corrected, and inspected again before it's allowed onto the truck. You never trust a batch just because the last one was fine, because the source that gave you dirty data yesterday will give you dirty data tomorrow, possibly in a new way.

Profile and validate are doing different jobs, and you need both. Profiling is open-ended and descriptive — "show me what's actually in this column" — with no pass/fail attached. Validation is a closed yes/no gate — "does this data meet the contract I've written down." Profiling without validation gives you information you have to re-derive by eye every single batch. Validating without profiling tells you something's wrong but gives you no clues about why. The checks you write in the validate step are, in effect, a [data contract](/learn/python-data-apis/data-contracts-and-validation) between "raw scraped junk" and "data a model is allowed to see" — and like any contract, it only protects you if it's written down as code, not held in your head.

## Why it works this way

Each step earns its place:

- **Profile first, always.** If you start fixing before you've measured what's broken, you end up "fixing" things you assumed were wrong without evidence, and missing things you didn't think to check — like a date field that's silently empty for one product line but not others.
- **Fix has to be code, not a human touching values.** A manual edit in a notebook cell you don't save, or a value retyped in a spreadsheet, leaves no diff, no audit trail, and nothing to rerun when the next batch arrives with the identical bug. Code is the only form a fix can take if you want to apply it more than once.
- **Validate is what lets you stop personally checking each batch.** This is the part that makes cleaned data trustworthy before a model, a report, or a teammate ever consumes it — you're replacing "I looked at it and it seemed fine" with an explicit, rerunnable check that either passes or tells you exactly what's wrong.
- **Re-profile closes the loop.** A cleaning function can run without throwing a single error and still produce the wrong result — silently. Re-profiling, and comparing the after-numbers to the before-numbers (row count, null counts, dtypes), is how you catch that a fix quietly dropped 40% of your rows instead of fixing them.

## A concrete example

Here's a small batch of raw scraped reviews with exactly the problems you'll actually see: an exact duplicate, missing fields, a rating column that mixes ints, numeric strings, and units, and dates in three different formats.

```python
import re
import pandas as pd
import numpy as np

raw_reviews = [
    {"review_id": "r001", "product_id": "P100", "rating": "5",
     "review_text": "Great product, works as expected.", "reviewer": "alice_k",
     "date": "2026-01-15", "verified": "true", "helpful_votes": 12},
    {"review_id": "r002", "product_id": "P100", "rating": 4,
     "review_text": "Pretty good, minor issues.", "reviewer": "bob99",
     "date": "01/16/2026", "verified": True, "helpful_votes": "3"},
    {"review_id": "r002", "product_id": "P100", "rating": 4,          # exact duplicate row
     "review_text": "Pretty good, minor issues.", "reviewer": "bob99",
     "date": "01/16/2026", "verified": True, "helpful_votes": "3"},
    {"review_id": "r003", "product_id": "P100", "rating": "5 stars",
     "review_text": None, "reviewer": "carol",                       # missing review text
     "date": "2026-01-17", "verified": "false", "helpful_votes": 0},
    {"review_id": "r004", "product_id": "P101", "rating": None,       # missing rating
     "review_text": "Didn't work for me at all.", "reviewer": "",    # empty reviewer
     "date": "2026-01-18", "verified": "true", "helpful_votes": 5},
    {"review_id": "r005", "product_id": "P101", "rating": 3,
     "review_text": "It's okay.", "reviewer": "dave_h",
     "date": "Jan 19 2026", "verified": None, "helpful_votes": None},
    {"review_id": "r006", "product_id": "P101", "rating": "10",       # out of range
     "review_text": "Amazing, exceeded expectations!", "reviewer": "erin",
     "date": "2026-01-20", "verified": "true", "helpful_votes": 8},
]
```

**Step 1: Profile.** Write the profiling logic once, as a function you'll reuse both now and after fixing.

```python
def profile(df: pd.DataFrame) -> None:
    print("shape:", df.shape)
    print("dtypes:\n", df.dtypes)
    print("nulls per column:\n", df.isna().sum())
    print("full-row duplicates:", df.duplicated().sum())
    print("unique ratings:", df["rating"].unique())
    print("unique verified values:", df["verified"].unique())

df = pd.DataFrame(raw_reviews)
profile(df)
```

Running this on the raw [dataframe](/learn/python-data-apis/pandas-dataframes-fundamentals) tells you exactly what's wrong, with evidence instead of guesswork: 7 rows, 1 exact duplicate, and a `rating` column whose unique values are `['5', 4, '5 stars', None, 3, '10']` — six different spellings of "a rating," including one (`'10'`) that isn't a valid rating at all if the scale is 1–5. `verified` mixes the strings `'true'`/`'false'` with real booleans and `None`. That's the profile telling you precisely what the fix step needs to do — not vibes, evidence.

**Step 2: Fix.** Every transformation is a small, named, testable function — never a value changed by hand.

```python
def parse_rating(value):
    """Coerce a messy rating to a float in [1, 5], or NaN if it can't be parsed or is out of range."""
    if value is None or (isinstance(value, float) and np.isnan(value)):
        return np.nan
    if isinstance(value, (int, float)):
        num = float(value)
    else:
        match = re.match(r"\s*(\d+(\.\d+)?)", str(value))   # pulls "5" out of "5 stars"
        if not match:
            return np.nan
        num = float(match.group(1))
    if num < 1 or num > 5:
        return np.nan   # out-of-range values are invalid, not clamped
    return num


def parse_verified(value):
    """Normalize a messy verified-purchase flag to a real bool, or pd.NA if unknown."""
    if isinstance(value, bool):
        return value
    if value is None or (isinstance(value, float) and np.isnan(value)):
        return pd.NA
    text = str(value).strip().lower()
    if text in ("true", "yes", "1"):
        return True
    if text in ("false", "no", "0"):
        return False
    return pd.NA


def clean_reviews(records: list[dict]) -> pd.DataFrame:
    df = pd.DataFrame(records)
    df = df.drop_duplicates(subset=["review_id"]).copy()
    df["rating"] = df["rating"].apply(parse_rating)
    df["date"] = pd.to_datetime(df["date"], errors="coerce", format="mixed")  # pandas 2.0+
    df["verified"] = df["verified"].apply(parse_verified)
    df["helpful_votes"] = pd.to_numeric(df["helpful_votes"], errors="coerce")
    df["reviewer"] = df["reviewer"].replace("", pd.NA)      # empty string is missing, too
    df = df.dropna(subset=["review_text"]).reset_index(drop=True)
    return df

clean = clean_reviews(raw_reviews)
```

Notice `parse_rating` refuses to clamp `'10'` down to `5` — an out-of-range value is a sign the record is broken, not a hint about what the "real" value was, so it becomes `NaN` like any other unparseable rating. That's a judgment call worth making explicitly in code, where you can see it and change it later, rather than silently. This is also where you handle [missing values](/learn/python-data-apis/handling-missing-values) deliberately — an empty string and a real null are both "missing," but only if you say so — and where messy dates and mixed-type numbers get [coerced to real types](/learn/python-data-apis/type-coercion-and-parsing-dates) instead of staying as strings you'll have to re-parse every time you use them.

**Step 3: Validate.** This is a separate function from `clean_reviews`, on purpose — it doesn't trust that the fix step worked, it checks.

```python
def validate_reviews(df: pd.DataFrame) -> list[str]:
    errors = []
    required_cols = {"review_id", "product_id", "rating", "review_text", "date"}
    if required_cols - set(df.columns):
        errors.append(f"missing columns: {required_cols - set(df.columns)}")
        return errors
    if df["review_id"].duplicated().any():
        errors.append("duplicate review_id values found")
    ratings = df["rating"].dropna()
    if len(ratings) and not ratings.between(1, 5).all():
        errors.append("rating values outside the 1-5 range")
    if not pd.api.types.is_datetime64_any_dtype(df["date"]):
        errors.append("date column is not a datetime dtype")
    if df["review_text"].isna().sum() > 0:
        errors.append(f"{df['review_text'].isna().sum()} rows have null review_text")
    return errors

errors = validate_reviews(clean)
if errors:
    raise ValueError(f"Validation failed: {errors}")
```

This is what you'd wire into something like [pandera or a schema library](/learn/python-data-apis/validating-dataframes-with-schemas) as your pipeline grows, but the idea holds even with plain Python: each check states an invariant about the data ("no duplicate IDs," "ratings are in range," "dates are real dates") and fails loudly if it's violated. Notice the `review_text` check runs even though `clean_reviews` already drops null text — that's not redundant, it's a safety net. If someone edits `clean_reviews` next month and accidentally removes that `dropna`, this check is what catches it, instead of a model quietly training on empty reviews.

**Step 4: Re-profile.** Run the exact same `profile()` function from step 1 on `clean`, and compare:

- **Shape:** 7 rows → 5 rows. Two gone: the exact duplicate (`r002`) and the row with no review text (`r003`). Expected, and small enough to be safe.
- **Dtypes:** `rating` and `helpful_votes` are now real numeric columns instead of `object`; `date` is a proper datetime column you can sort and filter on.
- **Duplicates:** 0.
- **Rating nulls:** 2 remain — one review that genuinely never had a rating (`r004`), and one that had an invalid rating (`r006`'s `'10'`). Both `NaN`, both visible, neither silently guessed at.

That comparison — not just "did `validate_reviews` return an empty list" — is the re-profile step. It's how you confirm the fix changed what you meant it to change and didn't quietly wreck something else. If you'd forgotten the `drop_duplicates` line in `clean_reviews`, `validate_reviews` would immediately report `duplicate review_id values found` — you don't have to reread the data by eye to catch it, the loop catches it for you.

## Where it shows up

- **Scheduled ETL jobs** that ingest a new scrape, export, or file drop every day and can't have a human review each one before it lands in a warehouse.
- **Prepping raw text for a model** — reviews, support tickets, scraped pages — where [messy fields becoming clean model inputs](/learn/python-data-apis/turning-messy-data-into-model-inputs) is the entire point of the exercise, and a model trained on unvalidated data just learns your bugs.
- **Feature pipelines before training**, where a schema check is often literally called a "gate" — bad data doesn't get to reach the training job at all.
- **Data handoffs between teams**, where the validation function is the actual, executable version of the contract both sides agreed to, instead of a paragraph in a wiki page nobody rereads.

## Watch out for

**Silent coercion.** `errors="coerce"` turns anything it can't parse into `NaN` without telling you — that's the point, but it also means a typo in an upstream format can quietly null out half your column and you'd never know unless you check.

```python
before = df["helpful_votes"].notna().sum()
coerced = pd.to_numeric(df["helpful_votes"], errors="coerce")
after = coerced.notna().sum()
if after < before:
    print(f"warning: coercion dropped {before - after} previously non-null values")
```

**Validating only the output, never the input.** If you only ever run checks on the cleaned data, you lose your ability to notice when the raw data's shape changes upstream — a scraper update that switches date formats, say. Profile the raw batch every time, even briefly, so you have a "before" to compare the "after" against.

**One-off fixes that live outside the code.** A value corrected by hand in a spreadsheet, a row deleted in a notebook cell that never got turned into a function — these disappear the moment the notebook closes, and the next batch arrives with the identical problem and no memory of how it was solved last time. If a fix isn't in `clean_reviews` (or wherever your pipeline lives), it isn't part of your workflow, no matter how correct it was in the moment.

## Where next

Go deeper on the pieces of this loop: [handling missing values](/learn/python-data-apis/handling-missing-values) properly, [coercing types and parsing dates](/learn/python-data-apis/type-coercion-and-parsing-dates) without losing data silently, [validating dataframes with real schemas](/learn/python-data-apis/validating-dataframes-with-schemas) instead of hand-rolled checks, and the [common mistakes](/learn/python-data-apis/data-cleaning-common-mistakes) that break this loop in practice. Then test yourself with the [data cleaning quiz](/learn/python-data-apis/data-cleaning-quiz), and see the whole loop as one link in a bigger chain in the [messy-data-to-LLM-pipeline capstone](/learn/python-data-apis/messy-data-to-llm-pipeline-capstone).

**Related:** [Handling missing values](/learn/python-data-apis/handling-missing-values) · [Type coercion and parsing dates](/learn/python-data-apis/type-coercion-and-parsing-dates) · [Validating dataframes with schemas](/learn/python-data-apis/validating-dataframes-with-schemas) · [Data contracts and validation](/learn/python-data-apis/data-contracts-and-validation) · [Turning messy data into model inputs](/learn/python-data-apis/turning-messy-data-into-model-inputs) · [Data cleaning common mistakes](/learn/python-data-apis/data-cleaning-common-mistakes)
