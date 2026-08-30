---
title: "Structuring the Pipeline as a Service"
track: "python-data-apis"
status: live
summary: "Breaks the notebook pipeline into small pure functions — io, clean, validate, call, persist — with config injected explicitly and error handling placed deliberately at each functio"
duration: "16 min read"
---

The first time you turn a notebook into a service, the code usually still *looks* like a notebook — one long function, a few module-level constants for the API key and file paths, and a `try/except` wrapped around the whole thing "just in case." It runs. Then someone asks you to run it against a different input file without editing the source, or to unit test the cleaning step without hitting the network, and you discover the whole thing is one indivisible block.

This page is about the fix: cutting that block into small functions with names that describe exactly one job, and being deliberate about where config comes from and where errors get caught. It builds directly on [Python for AI services](/learn/python-data-apis/python-for-ai-services) — if that page was about *why* a notebook becomes a service, this one is about how the inside of that service should actually be shaped.

## What it is

Structuring a pipeline as a service means decomposing it into a short sequence of small functions, each doing one of five jobs:

- **io** — get raw data in (read a file, fetch a page of results, receive a request payload) or write results out
- **clean** — reshape and normalize types, with no knowledge of where the data came from or where it's going
- **validate** — check the cleaned data against a contract, and reject or flag what doesn't meet it
- **call** — do the expensive, fallible thing (an LLM call, a REST API call, a database write) against data you've already validated
- **persist** — commit the result somewhere durable

Each function takes a plain-value input and returns a plain-value output — no hidden reads from a database, no writes to a variable outside its own scope, no reliance on something set earlier in the file. Configuration (API keys, URLs, thresholds, file paths) is passed in explicitly as an argument, typically one object, rather than pulled from a module-level constant or read fresh from `os.environ` inside the function body.

That last part matters as much as the function split. A pipeline can be broken into five nicely-named functions and still be just as untestable as the original notebook, if every one of them quietly reaches for a global `API_KEY` or `CONFIG` object. The functions being small is not the point — the functions being *self-contained*, with every dependency visible in the signature, is the point.

## The mental model

Picture the pipeline as a small assembly line, not a single machine. Each station does one transformation and hands a physical object to the next station — it never reaches back to an earlier station, and it never has a hidden wire running to a control room somewhere else in the building. If you want to know what a station does, you look at what comes in and what goes out. You don't need to have read the whole factory's wiring diagram first.

Config, in this picture, is the work order clipped to the pallet — it travels with the data, explicitly, from station to station. It is not a setting scrawled on the wall that every station is supposed to remember to check. A wall-mounted setting (a global) is invisible from any one station's point of view: you can't tell by looking at the `call` station alone that it depends on a `TIMEOUT_SECONDS` scribbled on a whiteboard three rooms away. A work order riding on the pallet (a parameter) is visible in exactly the place you'd look for it — the function signature.

This is also why the five stages have a fixed order and don't blend into each other. `clean` never validates, and `validate` never cleans — a station that both reshapes data *and* decides whether it's acceptable is really two stations wearing one name tag, and you lose the ability to test or replace either half independently.

## Why it works this way

Three concrete payoffs, in order of how often you'll feel them:

**You can test a stage without the rest of the pipeline.** `validate_row` takes a dict and a config object and returns a dict or raises — no file on disk, no network, no environment variable needs to exist for the test to run. Contrast with a notebook cell that validates *and* reads the file *and* calls the API in one block: to test the validation logic you're forced to also mock the network.

**You can swap one stage without touching the others.** Move from reading CSV to reading Parquet, or from one LLM provider to another — if `io` and `call` are the only functions that know about file formats and providers respectively, that's a change in one place. If file-reading logic is tangled into the same block that also cleans and validates, the format concern is smeared across all three and a "small" swap touches everything.

**Error handling has an obvious address.** With five distinct stages, you get five distinct kinds of failure, and each belongs at the boundary of the function that can actually detect it — not caught three functions later by a general `except Exception` that can no longer tell you which stage went wrong:

- `io` fails on missing files, malformed CSV, a 404 — these are *retrieval* failures
- `validate` fails (or flags) rows that parsed fine but don't meet your contract — see [data contracts and validation](/learn/python-data-apis/data-contracts-and-validation) for what a contract actually specifies
- `call` fails on timeouts, rate limits, malformed responses from the far end — this is where retry logic belongs, see [rate limits and retries](/learn/python-data-apis/rate-limits-and-retries)
- `persist` fails on disk-full, permission errors, partial writes

Config injection supports all three payoffs at once: a function that takes `config: PipelineConfig` as a parameter declares its dependencies in its type signature, which is also exactly what makes it mockable in a test and swappable in production. See [secrets and config management](/learn/python-data-apis/secrets-and-config-management) for how the config object itself should be built — the short version is that `os.environ` gets read *once*, at the program's entry point, and never again inside the pipeline.

## A concrete example

Say you have a CSV of customer feedback rows that needs cleaning, validating, sentiment-scoring via an API, and writing out as JSON Lines.

```csv
customer_id, feedback,                     rating
101,          Great support, fast reply!,   5
102,          ok i guess,
103,           ,                            3
104,          Took three weeks to reply.,   9
```

Config as one explicit, typed object — this is what gets threaded through every stage instead of living as module-level constants:

```python
from dataclasses import dataclass
from pathlib import Path


@dataclass(frozen=True)
class PipelineConfig:
    input_path: Path
    output_path: Path
    api_url: str
    api_key: str
    min_text_length: int = 5
    timeout_s: float = 10.0
```

**io** — file on disk in, list of raw dicts out. Nothing else.

```python
import csv


def read_rows(path: Path) -> list[dict[str, str]]:
    with path.open(newline="", encoding="utf-8") as f:
        return list(csv.DictReader(f))
```

**clean** — normalize types and whitespace. No opinion on whether the result is *acceptable*, only on what shape it should be in.

```python
from typing import Any


def clean_row(row: dict[str, str]) -> dict[str, Any]:
    rating_raw = row.get("rating", "").strip()
    return {
        "customer_id": row["customer_id"].strip(),
        "feedback": " ".join(row["feedback"].split()),
        "rating": int(rating_raw) if rating_raw else None,
    }
```

**validate** — the contract lives here, explicitly, as code you can read top to bottom. It takes `config` because the threshold (`min_text_length`) is a config value, not a hardcoded constant.

```python
class ValidationError(Exception):
    pass


def validate_row(row: dict[str, Any], config: PipelineConfig) -> dict[str, Any]:
    if not row["customer_id"]:
        raise ValidationError("missing customer_id")
    if len(row["feedback"]) < config.min_text_length:
        raise ValidationError(f"feedback too short: {row['feedback']!r}")
    if row["rating"] is not None and not (1 <= row["rating"] <= 5):
        raise ValidationError(f"rating out of range: {row['rating']}")
    return row
```

Row 103 (blank feedback) and row 104 (rating of 9) both fail here — deliberately, before either one reaches the API call. That's the point of the boundary: expensive, rate-limited calls only ever see rows that already passed the contract. For the dataframe equivalent of this same idea, see [validating dataframes with schemas](/learn/python-data-apis/validating-dataframes-with-schemas).

**call** — the one function allowed to be slow, flaky, and expensive. Retry policy lives here because this is the only stage that talks to the network.

```python
import requests
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry


def classify_sentiment(row: dict[str, Any], config: PipelineConfig) -> dict[str, Any]:
    session = requests.Session()
    session.mount("https://", HTTPAdapter(max_retries=Retry(total=3, backoff_factor=0.5)))
    response = session.post(
        config.api_url,
        headers={"Authorization": f"Bearer {config.api_key}"},
        json={"text": row["feedback"]},
        timeout=config.timeout_s,
    )
    response.raise_for_status()
    return {**row, "sentiment": response.json()["label"]}
```

**persist** — in-memory rows to durable output, and it reports what it actually did rather than returning `None` and hoping.

```python
import json


def persist_rows(rows: list[dict[str, Any]], config: PipelineConfig) -> int:
    with config.output_path.open("w", encoding="utf-8") as f:
        for row in rows:
            f.write(json.dumps(row) + "\n")
    return len(rows)
```

And the orchestrator — the only place that knows about *all five* stages, and the only place where `os.environ` gets read:

```python
def run_pipeline(config: PipelineConfig) -> dict[str, int]:
    raw_rows = read_rows(config.input_path)
    cleaned = [clean_row(r) for r in raw_rows]

    valid_rows, errors = [], []
    for row in cleaned:
        try:
            valid_rows.append(validate_row(row, config))
        except ValidationError as e:
            errors.append({"row": row, "reason": str(e)})

    classified = [classify_sentiment(row, config) for row in valid_rows]
    written = persist_rows(classified, config)

    return {
        "read": len(raw_rows),
        "valid": len(valid_rows),
        "rejected": len(errors),
        "written": written,
    }


if __name__ == "__main__":
    import os

    config = PipelineConfig(
        input_path=Path("feedback.csv"),
        output_path=Path("feedback_scored.jsonl"),
        api_url="https://api.example.com/v1/sentiment",
        api_key=os.environ["SENTIMENT_API_KEY"],
    )
    print(run_pipeline(config))
```

The payoff shows up immediately in tests — `validate_row` needs no network and no real API key, just a config object with placeholder values:

```python
import pytest


def test_validate_row_rejects_short_feedback():
    config = PipelineConfig(
        input_path=Path("x"), output_path=Path("y"),
        api_url="", api_key="", min_text_length=5,
    )
    with pytest.raises(ValidationError):
        validate_row({"customer_id": "1", "feedback": "ok", "rating": None}, config)
```

No fixture stands up a fake server, no environment variable needs to be set, and the test runs in milliseconds. That's the entire argument for this shape, made concrete: [testing data pipelines](/learn/python-data-apis/testing-data-pipelines) goes deeper on what to test at each boundary.

## Where it shows up

- **Batch scoring jobs** — a cron job or Airflow/Prefect task that reads a table or file, cleans, validates, calls a model API, writes results back. The five-stage shape above *is* that job, almost unmodified.
- **Behind a web endpoint** — a FastAPI or Flask handler reuses the exact same `clean`, `validate`, `call`, `persist` functions; only `io` changes, from "read a file" to "read the request body."
- **RAG ingestion pipelines** — fetch documents, clean text, chunk, embed, write to a vector store follows the identical stage split, just with different verbs at each station.
- **Any pipeline feeding [turning messy data into model inputs](/learn/python-data-apis/turning-messy-data-into-model-inputs)** — that page's cleaning and shaping logic is exactly the kind of work that belongs in a standalone `clean` function here, reusable regardless of what calls it afterward.

## Watch out for

**Pure in name only.** Splitting a monolith into five functions buys you nothing if `call` still reaches for a module-level `SESSION` or `API_KEY` instead of receiving it as a parameter. A quick check: could you call this function from a test file with no imports from your main module except the function itself? If not, something is still global.

**The boundary between clean and validate blurring.** `clean_row` above converts `rating` to an int inside a `try`-free expression — if a row has `rating = "banana"`, that line raises `ValueError` from inside *clean*, not the `ValidationError` from *validate*, and your pipeline's except clause never catches it. Decide up front which stage owns "this string won't parse" versus "this value parsed but is out of range," and keep that decision consistent — don't let `clean` start making acceptability judgments, and don't let it silently default bad values to `None` either, which hides a data quality problem instead of surfacing it at `validate`.

**Persist that can't tell you what happened.** A `persist_rows` that returns `None` looks identical whether it wrote all the rows, half of them, or none, if the process is killed mid-write. Returning a count (as above) is the minimum; for anything that matters, write to a temp file and rename it into place atomically, or write to a staging table and swap it, so a crash never leaves a half-written result that the next run can't distinguish from a good one.

## Where next

Once each stage is a small function, the calling code between them becomes the interesting part again: [rate limits and retries](/learn/python-data-apis/rate-limits-and-retries) and [pagination patterns](/learn/python-data-apis/pagination-patterns) both live inside `call`, and [concurrent API calls with asyncio](/learn/python-data-apis/concurrent-api-calls-with-asyncio) is what you reach for once `call` needs to run across thousands of rows instead of one at a time. When you're ready to put the whole shape under test properly, [testing data pipelines](/learn/python-data-apis/testing-data-pipelines) and the [messy data to LLM pipeline capstone](/learn/python-data-apis/messy-data-to-llm-pipeline-capstone) are the natural next stops, and the [AI service quiz](/learn/python-data-apis/ai-service-quiz) is a quick check on whether the boundaries above actually stuck.

**Related:** [Python for AI services](/learn/python-data-apis/python-for-ai-services) · [Data contracts and validation](/learn/python-data-apis/data-contracts-and-validation) · [Secrets and config management](/learn/python-data-apis/secrets-and-config-management) · [Rate limits and retries](/learn/python-data-apis/rate-limits-and-retries) · [Testing data pipelines](/learn/python-data-apis/testing-data-pipelines) · [Turning messy data into model inputs](/learn/python-data-apis/turning-messy-data-into-model-inputs)
