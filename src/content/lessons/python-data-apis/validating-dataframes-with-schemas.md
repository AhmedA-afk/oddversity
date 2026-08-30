---
title: "Validating Cleaned Data with a Schema"
track: "python-data-apis"
status: live
summary: "A hands-on walkthrough that builds a pydantic schema for cleaned review data, turns it into a hard gate before any API call, and shows the exact error messages, thresholds, and fai"
duration: "18 min read"
---

Your cleaning script ran without errors, which tells you nothing — a `dropna()` that missed a column, a rating scraped as `"5"` instead of `5`, a date parser that silently gave up on one row and left a string behind, none of that raises. It just sits in your "cleaned" data until it reaches your LLM call three functions later and blows up with a stack trace that points at the API client instead of the row that caused it.

## What we're building

A [data contract](/learn/python-data-apis/data-contracts-and-validation) is the idea that the shape of your data should be checked, not assumed. This page is the implementation: a `pydantic` schema for a cleaned product-reviews dataset, a validation pass that splits every row into "provably fine" and "rejected, with a reason," and a hard gate that refuses to let a batch through to an API call if too many rows failed. By the end you'll have a script you can run against real JSON and watch it reject bad rows by name.

## Setup

You need `pydantic` (v2). If you're working through this module in order you already have a venv — see [Python environments and venv](/learn/python-data-apis/python-environments-and-venv) if not.

```bash
pip install pydantic
```

We'll validate a file of cleaned reviews shaped like this — save it as `cleaned_reviews.json`:

```json
[
  {
    "review_id": "r-1001",
    "product_id": "p-77",
    "rating": 5,
    "review_text": "Works exactly as described, arrived early.",
    "review_date": "2026-06-02",
    "verified_purchase": true
  },
  {
    "review_id": "r-1003",
    "product_id": "p-12",
    "rating": 0,
    "review_text": "meh",
    "review_date": "2026-06-04",
    "verified_purchase": false
  },
  {
    "review_id": "r-1004",
    "product_id": "p-12",
    "rating": 4,
    "review_text": "   ",
    "review_date": "2026-06-04",
    "verified_purchase": false
  }
]
```

That's a stand-in for whatever your cleaning step actually produces. If yours ends in a pandas DataFrame instead of JSON, `df.to_dict(orient="records")` gets you the same list of dicts in one line — from there, every row is an untrusted dict until the schema says otherwise.

## Build it

### 1. Define the schema as the contract

```python
from datetime import date
from pydantic import BaseModel, Field, field_validator

class Review(BaseModel):
    review_id: str
    product_id: str
    rating: int = Field(ge=1, le=5)
    review_text: str = Field(min_length=1)
    review_date: date
    verified_purchase: bool = False

    @field_validator("review_text")
    @classmethod
    def not_just_whitespace(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("review_text is empty after stripping whitespace")
        return v.strip()
```

Every constraint here traces back to a real failure mode, not a hypothetical one: `ge=1, le=5` catches the `0` and the `8` that a scraper or a bad join introduces; `min_length=1` plus the validator catches the row that "cleaned" fine because it wasn't `null`, just three spaces; `date` as the type (not `str`) means pydantic parses `review_date` for you and rejects anything it can't parse — see [type coercion and parsing dates](/learn/python-data-apis/type-coercion-and-parsing-dates) for what that parser will and won't accept. This model *is* the contract: it's the one place that says what a review is allowed to look like, instead of that knowledge being scattered across five `if` checks in three files.

### 2. Load the cleaned rows and validate every one

```python
import json
from pydantic import ValidationError

def load_cleaned_reviews(path: str) -> list[dict]:
    with open(path) as f:
        return json.load(f)

def validate_reviews(raw_reviews: list[dict]) -> tuple[list[Review], list[dict]]:
    good: list[Review] = []
    bad: list[dict] = []
    for row in raw_reviews:
        try:
            good.append(Review.model_validate(row))
        except ValidationError as e:
            bad.append({"row": row, "errors": e.errors()})
    return good, bad
```

`model_validate` is where a plain dict either becomes a real `Review` object or raises `ValidationError`. Catching it per-row instead of letting one bad row kill the whole batch is the difference between "the pipeline saw 500 rows and 3 were bad" and "the pipeline crashed, go find out why." `e.errors()` gives you a list of dicts with `loc` (which field), `type` (what kind of failure), and `msg` (human-readable) — that's your clear message, structured enough to log or turn into a report, not just a stack trace.

### 3. Fail loudly before anything downstream sees the data

```python
REJECT_THRESHOLD = 0.05  # tune this to your batch size, see Harden it

for failure in bad:
    row_id = failure["row"].get("review_id", "?")
    for err in failure["errors"]:
        field = ".".join(str(p) for p in err["loc"])
        print(f"  {row_id}: {field} -> {err['msg']}")

if raw_reviews and len(bad) / len(raw_reviews) > REJECT_THRESHOLD:
    raise RuntimeError(
        f"{len(bad)}/{len(raw_reviews)} rows failed validation "
        f"({len(bad) / len(raw_reviews):.1%}) - stopping before the API call"
    )
```

This is the part that actually enforces the contract. A handful of bad rows in a big batch is normal noise from upstream — log them and move on. A third of the batch failing means something upstream broke (a schema change in the source, a scraper regression, a bad join), and the right move is to stop before you spend API calls classifying garbage, not to silently drop rows and let someone notice the model's outputs look weird two days later.

### 4. Gate the API call on validated data only

```python
def call_sentiment_api(reviews: list[Review]) -> list[dict]:
    payloads = [{"id": r.review_id, "text": r.review_text} for r in reviews]
    # send `payloads` to your endpoint here — see calling-llm-apis-in-python
    ...

results = call_sentiment_api(good)
```

Notice `call_sentiment_api` takes `list[Review]`, not `list[dict]`. That's not decoration — it means the function's type signature itself refuses a raw, unvalidated dict. Anyone calling it later has to go through the schema first. Wire the real request following [calling LLM APIs in Python](/learn/python-data-apis/calling-llm-apis-in-python).

## Run it

Run the script against the file above. With those three rows (one clean, one rating out of range, one whitespace-only text) you get:

```
1 valid rows, 2 rejected
  r-1003: rating -> Input should be greater than or equal to 1
  r-1004: review_text -> Value error, review_text is empty after stripping whitespace
```

Two out of three rows failed here (66%), well over the 5% threshold, so the script raises `RuntimeError` and stops — no API call happens. That's deliberately harsh for a 3-row demo; against a real batch of a few thousand cleaned reviews you'd expect the vast majority to pass, with a small number of genuinely malformed rows rejected by name. Run it again against a batch where only one row is bad and the rest are fine, and instead of raising, you'll see it print the rejected row's reason and then proceed: `call_sentiment_api` runs, but only on the rows that passed. That's the whole point — the bad row never reaches the model, and you know exactly why it didn't.

## Harden it

**Reject unexpected fields, not just missing ones.** By default pydantic ignores extra keys, which hides a scraper sending a field your schema doesn't know about. Add `model_config = ConfigDict(extra="forbid")` to the model and an unexpected key becomes an `extra_forbidden` error instead of silent data loss.

**Decide when coercion is a feature and when it's a bug.** Pydantic will happily turn `"5"` into `5` for an `int` field — usually convenient, but if a rating arriving as a string means your scraper is degrading, that's a signal you want to see, not paper over. Add `strict=True` to the field (`rating: int = Field(ge=1, le=5, strict=True)`) and a numeric string is now rejected as `int_type` instead of silently accepted.

**Nested data gets nested error paths.** If a review carries a `reviewer: {reviewer_id, country}` object, make that a second `BaseModel` and nest it — `reviewer: Reviewer`. A missing `reviewer_id` shows up in `err["loc"]` as `("reviewer", "reviewer_id")`, so your error report still tells you exactly where the problem is, three levels down.

**Don't load everything into memory to validate it.** For a big JSONL file, validate one line at a time instead of `json.load`-ing the whole thing:

```python
def iter_valid_reviews(path: str):
    with open(path) as f:
        for line_no, line in enumerate(f, start=1):
            line = line.strip()
            if not line:
                continue
            try:
                yield Review.model_validate_json(line)
            except ValidationError as e:
                print(f"line {line_no} rejected: {e.errors()[0]['msg']}")
```

This streams — see [JSON and JSONL files](/learn/python-data-apis/json-and-jsonl-files) — so a 2GB file of reviews doesn't need to fit in RAM just to be checked.

**Pick row-level or column-level validation on purpose.** `pydantic` validates one record at a time, which is exactly right once you're about to turn each row into an API payload. If you're still holding the data as a DataFrame and want to check it in bulk — column dtypes, value ranges across the whole column, uniqueness — that's a job for a dataframe-native tool instead; see validating dataframes with schemas (pandera) for that side of the same problem.

**Size the threshold to the batch.** A 5% reject threshold is meaningless noise-tolerance on a 20-row batch (one bad row is already 5%) and might be too loose on a 50,000-row batch. For small batches, use an absolute count (`len(bad) > 2`) instead of a percentage.

## Extend it

The schema at the boundary only covers what goes *in*. The response coming back from the model needs the same treatment — see [parsing and validating API responses](/learn/python-data-apis/parsing-and-validating-api-responses) so a malformed API reply doesn't poison whatever consumes it next. Once validation is solid, the natural next steps are running the good rows through [concurrent API calls with asyncio](/learn/python-data-apis/concurrent-api-calls-with-asyncio) or [batching LLM calls for throughput](/learn/python-data-apis/batching-llm-calls-for-throughput), wrapping the actual request in the retry logic from [rate limits and retries](/learn/python-data-apis/rate-limits-and-retries), and writing a couple of tests that assert your schema rejects known-bad shapes — see [testing data pipelines](/learn/python-data-apis/testing-data-pipelines). If you want to see this gate sitting inside a full pipeline end to end, that's exactly what the [capstone](/learn/python-data-apis/messy-data-to-llm-pipeline-capstone) walks through.

**Related:** [Data contracts and validation](/learn/python-data-apis/data-contracts-and-validation) · Validating dataframes with schemas · [Parsing and validating API responses](/learn/python-data-apis/parsing-and-validating-api-responses) · [Testing data pipelines](/learn/python-data-apis/testing-data-pipelines) · [Turning messy data into model inputs](/learn/python-data-apis/turning-messy-data-into-model-inputs) · [Messy data to LLM pipeline capstone](/learn/python-data-apis/messy-data-to-llm-pipeline-capstone)
