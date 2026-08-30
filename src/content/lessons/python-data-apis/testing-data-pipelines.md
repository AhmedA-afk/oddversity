---
title: "Testing a Data Pipeline with pytest"
track: "python-data-apis"
status: live
summary: "Write pytest tests for a review-cleaning and schema-validation pipeline, then mock the LLM call with monkeypatch so the suite runs instantly and deterministically — with a test pro"
duration: "30 min read"
---

A pipeline that calls an LLM on every row has two ways to ruin your afternoon: a test suite that hits the real API and fails on a rate limit, and a malformed row that slips past your checks and burns a request on garbage input. This lesson kills both problems with a test suite that never touches the network and a validation boundary that a bad row physically cannot get past.

## What we're building

A small review-sentiment pipeline: read a CSV of product reviews, clean the rows, validate them against a schema, then send each valid row to an LLM for sentiment classification. Nothing exotic — it's the same read-clean-validate-call shape you'll use in almost every Python AI service you build.

The interesting part isn't the pipeline, though — it's the test suite. By the end you'll have:

- A reusable sample-CSV fixture that exercises clean data, dirty data, and outright garbage in one file
- Fast tests for the cleaning function that never touch disk beyond a temp file pytest manages for you
- A test proving the validation schema rejects bad rows with the specific errors you'd expect
- A mocked LLM call, so the "expensive" part of your pipeline runs in microseconds and produces the exact same output every time
- The test that matters most: proof that a malformed row is rejected *before* it ever reaches the model, not after a wasted API call

This is the shape of test suite you want before you scale a pipeline past "works on my machine."

## Setup

You need three packages: `pytest` to run tests, `pydantic` for the schema boundary, and `requests` for the (mockable) LLM call.

```bash
python -m venv .venv
source .venv/bin/activate  # Windows: .venv\Scripts\activate
pip install pytest pydantic requests
```

If you haven't set up a virtual environment before, [this walkthrough](/learn/python-data-apis/python-environments-and-venv) covers why you want one per project rather than installing everything globally.

Create the project as a flat directory — no `src/` layout needed for something this size:

```text
review_pipeline/
├── llm_client.py       # the one function that talks to the network
├── pipeline.py         # clean, validate, orchestrate
├── conftest.py         # shared fixtures
├── test_cleaning.py
├── test_validation.py
└── test_llm_mocking.py
```

pytest auto-discovers any `conftest.py` and any file matching `test_*.py` in the directory you run it from — no config file required for a project this size. One environment variable matters here too: `LLM_API_KEY`, which the real client reads at call time. Keep it out of your code and your tests — [secrets and config management](/learn/python-data-apis/secrets-and-config-management) covers the pattern; the whole point of this lesson is that your tests will never need a real key at all.

## Build it

### Write the pipeline: cleaning, a schema, and one function that touches the network

Start with the piece that makes everything else testable: put the LLM call behind a single function, in its own module, and never call it from more than one place. That one seam is what you'll mock later.

```python
# llm_client.py
"""Thin wrapper around the LLM API.

This is the ONLY function in the whole codebase that makes a network call.
Keeping it isolated in one place is what makes it easy to mock in tests.
"""
from __future__ import annotations

import os

import requests

LLM_API_URL = "https://api.example-llm.com/v1/classify"


def call_llm(prompt: str) -> dict:
    """Send a prompt to the sentiment-classification endpoint.

    Returns a dict like {"label": "positive", "confidence": 0.87}.
    Raises RuntimeError if the API key is missing, or an HTTPError if the
    request fails.
    """
    api_key = os.environ.get("LLM_API_KEY")
    if not api_key:
        raise RuntimeError("LLM_API_KEY is not set")

    response = requests.post(
        LLM_API_URL,
        headers={"Authorization": f"Bearer {api_key}"},
        json={"prompt": prompt},
        timeout=10,
    )
    response.raise_for_status()
    return response.json()
```

Now the pipeline itself. Note the type hint on `process_reviews`: it takes `list[ReviewRecord]`, not `list[dict]`. That's not decoration — it's the enforcement mechanism. A dict that hasn't been through `ReviewRecord(**row)` can't get here.

```python
# pipeline.py
"""Clean and validate product reviews, then classify sentiment via an LLM.

Data flows through three stages, each narrower than the last:

    raw CSV rows (dict[str, str])
        -> clean_rows()      strips/normalizes strings, drops junk rows
        -> validate_rows()   parses into ReviewRecord, rejects bad shapes
        -> process_reviews() calls the LLM -- but only on ReviewRecord objects
"""
from __future__ import annotations

import csv
from pathlib import Path

from pydantic import BaseModel, Field, ValidationError

import llm_client


class ReviewRecord(BaseModel):
    """The schema boundary. Anything that doesn't fit this shape never
    reaches the LLM."""

    review_id: str
    product: str = Field(min_length=1)
    rating: int = Field(ge=1, le=5)
    review_text: str = Field(min_length=1)
    email: str


def read_reviews_csv(path: str | Path) -> list[dict]:
    with open(path, newline="", encoding="utf-8") as f:
        return list(csv.DictReader(f))


def clean_rows(rows: list[dict]) -> list[dict]:
    """Row-level hygiene: trim whitespace, drop fully blank rows, drop
    duplicate review_ids (keep the first). This does NOT check whether
    values are *valid* -- that's validate_rows()'s job."""
    cleaned = []
    seen_ids = set()

    for row in rows:
        stripped = {k: (v.strip() if isinstance(v, str) else v) for k, v in row.items()}

        if not any(stripped.values()):
            continue  # fully blank row

        review_id = stripped.get("review_id")
        if review_id in seen_ids:
            continue
        seen_ids.add(review_id)

        cleaned.append(stripped)

    return cleaned


def validate_row(row: dict) -> ReviewRecord:
    """Parse one cleaned row into a ReviewRecord, or raise ValidationError.
    Nothing past this function ever sees an unvalidated row."""
    return ReviewRecord(**row)


def validate_rows(rows: list[dict]) -> tuple[list[ReviewRecord], list[dict]]:
    """Split cleaned rows into (valid records, error reports). Bad rows are
    reported, not raised -- one malformed review shouldn't crash a batch
    job processing thousands of others."""
    valid: list[ReviewRecord] = []
    errors: list[dict] = []

    for row in rows:
        try:
            valid.append(validate_row(row))
        except ValidationError as exc:
            errors.append({"row": row, "reason": str(exc)})

    return valid, errors


def classify_sentiment(record: ReviewRecord) -> dict:
    prompt = f"Classify the sentiment of this review as positive, neutral, or negative:\n{record.review_text}"
    return llm_client.call_llm(prompt)


def process_reviews(records: list[ReviewRecord]) -> list[dict]:
    """Classify sentiment for a batch of already-validated records."""
    results = []
    for record in records:
        sentiment = classify_sentiment(record)
        results.append({"review_id": record.review_id, **sentiment})
    return results
```

Why pydantic instead of a pile of `if` statements: `Field(ge=1, le=5)` and `min_length=1` are self-documenting, they coerce string CSV values ("5") into the right type (`int`), and a failure raises a structured `ValidationError` you can log or report — not a `KeyError` three functions downstream. This is the same pattern covered in [data contracts and validation](/learn/python-data-apis/data-contracts-and-validation); a testing lesson is a good place to see why that boundary earns its keep.

### Give your tests a small, dirty sample CSV

One fixture, shared across every test file via `conftest.py`, covering every case the pipeline needs to handle in a single 6-row file:

```python
# conftest.py
from pathlib import Path

import pytest

SAMPLE_CSV = """\
review_id,product,rating,review_text,email
r1,Widget,5,"Solid build quality, works as advertised.",alice@example.com
r2,  Gadget ,3,"  It's okay, does the job.  ",bob@example.com
r1,Widget,5,"Solid build quality, works as advertised.",alice@example.com
r3,Gizmo,7,Terrible experience,carol@example.com
r4,Thingamajig,4,,dave@example.com
,,,,
"""


@pytest.fixture
def sample_csv(tmp_path) -> Path:
    """Covers: a clean row (r1), a row needing whitespace stripped (r2),
    a duplicate id (r1 again), a rating outside 1-5 (r3), a missing
    review_text (r4), and a fully blank row."""
    path = tmp_path / "reviews.csv"
    path.write_text(SAMPLE_CSV, encoding="utf-8")
    return path
```

`tmp_path` is a built-in pytest fixture — it hands you a fresh, unique temp directory per test and cleans it up automatically. Writing the fixture as a real file on disk (rather than mocking `open`) means `read_reviews_csv` runs completely unmodified in tests, exactly as it would in production. That matters more than it sounds: `csv.DictReader` returns every value as a `str`, which is why `rating` arrives as `"5"` and `"7"`, not `5` and `7` — the schema in the next step has to coerce, not just compare.

### Test the cleaning function

```python
# test_cleaning.py
import pipeline


def test_read_reviews_csv_returns_all_rows(sample_csv):
    rows = pipeline.read_reviews_csv(sample_csv)
    assert len(rows) == 6  # every row, including junk -- cleaning hasn't run yet


def test_clean_rows_strips_whitespace(sample_csv):
    rows = pipeline.read_reviews_csv(sample_csv)
    cleaned = pipeline.clean_rows(rows)

    r2 = next(row for row in cleaned if row["review_id"] == "r2")
    assert r2["product"] == "Gadget"
    assert r2["review_text"] == "It's okay, does the job."


def test_clean_rows_drops_duplicate_ids(sample_csv):
    rows = pipeline.read_reviews_csv(sample_csv)
    cleaned = pipeline.clean_rows(rows)

    ids = [row["review_id"] for row in cleaned]
    assert ids.count("r1") == 1


def test_clean_rows_drops_blank_rows(sample_csv):
    rows = pipeline.read_reviews_csv(sample_csv)
    cleaned = pipeline.clean_rows(rows)

    assert all(row["review_id"] for row in cleaned)
    assert len(cleaned) == 4  # r1, r2, r3, r4 -- duplicate and blank row gone
```

Each test checks one behavior and names it in the function name — you should be able to read the test list and know exactly what `clean_rows` guarantees without opening the implementation. This mirrors the checks in the [data cleaning workflow](/learn/python-data-apis/data-cleaning-workflow) lesson; the difference here is you're asserting the *contract*, not eyeballing a printed dataframe.

### Test that the schema rejects bad rows — by name, not by accident

```python
# test_validation.py
import pytest
from pydantic import ValidationError

import pipeline


def test_valid_row_parses_into_review_record():
    row = {
        "review_id": "r1",
        "product": "Widget",
        "rating": "5",  # CSV values arrive as strings -- pydantic coerces this
        "review_text": "Solid build quality.",
        "email": "alice@example.com",
    }

    record = pipeline.validate_row(row)

    assert isinstance(record, pipeline.ReviewRecord)
    assert record.rating == 5  # coerced to int


def test_rating_out_of_range_is_rejected():
    row = {
        "review_id": "r3",
        "product": "Gizmo",
        "rating": "7",  # only 1-5 is allowed
        "review_text": "Terrible experience",
        "email": "carol@example.com",
    }

    with pytest.raises(ValidationError):
        pipeline.validate_row(row)


def test_empty_review_text_is_rejected():
    row = {
        "review_id": "r4",
        "product": "Thingamajig",
        "rating": "4",
        "review_text": "",
        "email": "dave@example.com",
    }

    with pytest.raises(ValidationError):
        pipeline.validate_row(row)


def test_validate_rows_splits_valid_and_invalid(sample_csv):
    rows = pipeline.read_reviews_csv(sample_csv)
    cleaned = pipeline.clean_rows(rows)

    valid, errors = pipeline.validate_rows(cleaned)

    assert [r.review_id for r in valid] == ["r1", "r2"]
    assert len(errors) == 2
    assert {e["row"]["review_id"] for e in errors} == {"r3", "r4"}
```

`pytest.raises(ValidationError)` is the idiom: it's a context manager that passes only if the wrapped code raises that exact exception. If `validate_row` silently accepted the bad row instead, the test fails with a clear "DID NOT RAISE" message — which is exactly the failure mode you want to catch before it ships. The last test is the one worth lingering on: it runs the *whole* cleaning-then-validating path against the messy fixture and asserts the split is exactly what you'd hand-compute it should be. That's your executable spec for the schema boundary.

### Isolate the mock: replace `call_llm`, not the HTTP library

Here's the piece that makes this fast, free, and deterministic. You don't need `pytest-mock` or any other package — pytest ships a `monkeypatch` fixture, and the standard library ships `unittest.mock.Mock`. That's enough.

```python
# test_llm_mocking.py (part 1)
from unittest.mock import Mock

import llm_client
import pipeline


def test_classify_sentiment_uses_mocked_llm(monkeypatch):
    fake_response = {"label": "positive", "confidence": 0.91}
    mock_call_llm = Mock(return_value=fake_response)
    monkeypatch.setattr(llm_client, "call_llm", mock_call_llm)

    record = pipeline.ReviewRecord(
        review_id="r1",
        product="Widget",
        rating=5,
        review_text="Solid build quality.",
        email="alice@example.com",
    )

    result = pipeline.classify_sentiment(record)

    assert result == fake_response
    mock_call_llm.assert_called_once()
    prompt_arg = mock_call_llm.call_args.args[0]
    assert "Solid build quality." in prompt_arg
```

> One detail that trips people up the first time: you patch `llm_client.call_llm`, not `pipeline.call_llm`, even though the test is exercising `pipeline.classify_sentiment`. That's because `pipeline.py` does `import llm_client` and calls `llm_client.call_llm(...)` — it looks the function up on the module object every time it's called. `monkeypatch.setattr(llm_client, "call_llm", ...)` replaces that attribute on the one shared module object, so every caller sees the mock. If `pipeline.py` had instead written `from llm_client import call_llm`, it would hold its own private reference, and you'd have to patch `pipeline.call_llm` instead. The rule of thumb: patch the name where it's looked up at call time, not where it was originally defined.

This is also why isolating the network call into its own module earlier wasn't just tidiness — it gives you exactly one seam to patch, instead of hunting through the codebase for every place that might call the API. It's the same reasoning behind [calling LLM APIs in Python](/learn/python-data-apis/calling-llm-apis-in-python): wrap the call once, and everything downstream — retries, logging, tests — gets simpler.

### Prove bad rows never reach the model

This is the test the whole lesson has been building toward.

```python
# test_llm_mocking.py (continued -- same file, same imports as above,
# plus these two at the top)
import pytest
from pydantic import ValidationError


def test_bad_row_rejected_before_reaching_llm(monkeypatch):
    mock_call_llm = Mock()
    monkeypatch.setattr(llm_client, "call_llm", mock_call_llm)

    bad_row = {
        "review_id": "r3",
        "product": "Gizmo",
        "rating": "7",  # out of the allowed 1-5 range
        "review_text": "Terrible experience",
        "email": "carol@example.com",
    }

    with pytest.raises(ValidationError):
        pipeline.validate_row(bad_row)

    mock_call_llm.assert_not_called()


def test_process_reviews_only_calls_llm_for_valid_rows(sample_csv, monkeypatch):
    mock_call_llm = Mock(return_value={"label": "neutral", "confidence": 0.5})
    monkeypatch.setattr(llm_client, "call_llm", mock_call_llm)

    rows = pipeline.read_reviews_csv(sample_csv)
    cleaned = pipeline.clean_rows(rows)
    valid, errors = pipeline.validate_rows(cleaned)

    results = pipeline.process_reviews(valid)

    assert len(errors) == 2  # r3 (bad rating) and r4 (empty review_text)
    assert len(results) == 2  # only r1 and r2 made it to the model
    assert mock_call_llm.call_count == 2  # never called for the two bad rows
```

Notice what these tests check: not "does the pipeline return the right sentiment" — that's already covered above — but "does the mock get called at all." `assert_not_called()` and `call_count` assertions test *control flow*, not just output. That's a stronger guarantee than checking the final result looks right, because a bug that accidentally validates a bad row but then produces a plausible-looking output would sail straight through an output-only test. Here, it can't: the mock's call count is a direct, tamper-proof record of how many times you almost paid for a request you shouldn't have made.

## Run it

From the project root:

```bash
pytest -v
```

You should see all eleven tests collected and passed, something close to:

```text
test_cleaning.py::test_read_reviews_csv_returns_all_rows PASSED
test_cleaning.py::test_clean_rows_strips_whitespace PASSED
test_cleaning.py::test_clean_rows_drops_duplicate_ids PASSED
test_cleaning.py::test_clean_rows_drops_blank_rows PASSED
test_llm_mocking.py::test_classify_sentiment_uses_mocked_llm PASSED
test_llm_mocking.py::test_bad_row_rejected_before_reaching_llm PASSED
test_llm_mocking.py::test_process_reviews_only_calls_llm_for_valid_rows PASSED
test_validation.py::test_valid_row_parses_into_review_record PASSED
test_validation.py::test_rating_out_of_range_is_rejected PASSED
test_validation.py::test_empty_review_text_is_rejected PASSED
test_validation.py::test_validate_rows_splits_valid_and_invalid PASSED

11 passed in 0.17s
```

The exact time will vary by machine, but the order of magnitude won't: this is milliseconds, because nothing here opens a socket. Unplug your network and run it again — it still passes, because `LLM_API_URL` is never actually contacted. That's the entire point of mocking at the `call_llm` boundary: your test suite's speed and reliability stop being coupled to a third party's uptime, latency, or rate limits.

If a test fails, pytest's output tells you exactly which assertion broke and shows you both sides of the comparison — for example, `test_rating_out_of_range_is_rejected` failing would mean `ReviewRecord` accepted a rating of 7, which is the kind of regression you want caught here, not in production three weeks after someone loosened a constraint "just for one case."

## Harden it

A handful of edge cases are cheap to add and catch real bugs:

**Parametrize the ways a row can be wrong**, instead of writing one test per case:

```python
import pytest
from pydantic import ValidationError

import pipeline


@pytest.mark.parametrize(
    "bad_row",
    [
        {"review_id": "x", "product": "Widget", "rating": "five", "review_text": "ok", "email": "a@b.com"},  # non-numeric rating
        {"review_id": "x", "product": "", "rating": "3", "review_text": "ok", "email": "a@b.com"},           # empty product
        {"review_id": "x", "product": "Widget", "rating": "0", "review_text": "ok", "email": "a@b.com"},     # rating below range
        {"review_id": "x", "product": "Widget", "rating": "3", "review_text": "ok"},                          # missing field entirely
    ],
)
def test_various_bad_rows_rejected(bad_row):
    with pytest.raises(ValidationError):
        pipeline.validate_row(bad_row)
```

Each dict in the list becomes its own test case in the output (`test_various_bad_rows_rejected[bad_row0]`, `[bad_row1]`, ...), so a failure tells you precisely which malformed shape broke through, without four nearly-identical functions to maintain.

**Test the failure path of the client itself**, not just the happy path you mock:

```python
import pytest

import llm_client


def test_call_llm_requires_api_key(monkeypatch):
    monkeypatch.delenv("LLM_API_KEY", raising=False)
    with pytest.raises(RuntimeError):
        llm_client.call_llm("some prompt")
```

`monkeypatch.delenv` removes an environment variable for the duration of the test and restores it afterward automatically — no manual cleanup, no leaking state into the next test. This is the same env-var discipline from [secrets and config management](/learn/python-data-apis/secrets-and-config-management), just exercised as a test rather than a runtime check.

**Add a network guard as a safety net**, in case a future change accidentally calls `call_llm` somewhere you forgot to mock:

```python
# conftest.py (addition)
@pytest.fixture(autouse=True)
def block_network(monkeypatch):
    """Fail loudly if any test tries to make a real HTTP call."""
    def guard(*args, **kwargs):
        raise RuntimeError("Network access is not allowed in tests")

    monkeypatch.setattr("requests.sessions.Session.request", guard)
```

`autouse=True` means every test gets this protection without asking for it by name. It costs nothing when your mocks are correct, and it turns "oops, this test quietly hit a real API and cost money" into an immediate, loud test failure instead. (The `pytest-socket` plugin does a more general version of this — worth adopting once you have more than a handful of network-adjacent tests.)

**Watch for the empty-batch case**: `process_reviews([])` should return `[]` without calling `call_llm` at all, and a batch that's entirely invalid rows should produce zero LLM calls, not an error. Both fall out for free from the code as written here, but they're worth a one-line assertion the moment someone "simplifies" `process_reviews` and introduces an off-by-one.

## Extend it

A few directions to take this once the base suite is solid:

- **Add retries to `call_llm`** for transient failures, then test the retry logic with a mock that raises on the first call and succeeds on the second — [rate limits and retries](/learn/python-data-apis/rate-limits-and-retries) covers the backoff pattern; your mock's `side_effect` list is what lets you simulate "fails twice, then works" without waiting for real backoff delays.
- **Batch multiple reviews per LLM call** instead of one request per row, and test that batching by asserting the mock was called with a list of prompts of the size you expect, not one call per row.
- **Measure what your tests actually cover** with `pytest-cov` (`pytest --cov=pipeline`) — it's a fast way to notice you never tested what happens when `rating` is missing entirely versus merely out of range.
- **Fuzz the schema boundary** with `hypothesis` instead of hand-written parametrize cases — it generates hundreds of malformed inputs automatically and shrinks any failure down to a minimal reproducing case, which is a strong way to gain confidence that the boundary has no gaps you didn't think to test for.
- **Keep one or two real, opt-in integration tests** that hit the actual LLM API, marked with `@pytest.mark.integration` and excluded from the default `pytest` run (via `-m "not integration"` in your CI config). Your mocked tests verify your pipeline's logic; a small number of real ones, run occasionally rather than on every commit, verify that the real API still returns the shape your mocks assume it does.

**Related:** [Structuring a Python AI service](/learn/python-data-apis/structuring-a-python-ai-service) · [Validating dataframes with schemas](/learn/python-data-apis/validating-dataframes-with-schemas) · [Python data pipeline: the whole game](/learn/python-data-apis/python-data-pipeline-whole-game) · [Messy data to LLM pipeline capstone](/learn/python-data-apis/messy-data-to-llm-pipeline-capstone)
