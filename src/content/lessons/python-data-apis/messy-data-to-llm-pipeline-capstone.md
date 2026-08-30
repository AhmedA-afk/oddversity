---
title: "Capstone: Messy Data to an LLM Pipeline"
track: "python-data-apis"
status: live
summary: "Wrote the capstone lesson body for 'Capstone: Messy Data to an LLM Pipeline' — a full end-to-end project brief (ingest mixed CSV/JSON support tickets, normalize, validate with Pyda"
duration: "7 min read"
---

## The brief

You're the new data person at a support-tooling startup. Someone dumps a folder on you: a handful of CSV exports from the old ticketing system, a couple of JSON exports from the new one, and a request to "just get this into something the categorization model can use." Nobody agreed on a schema between the two systems, half the dates are strings in three different formats, and one export nests the customer under `customer.email` while the other just has `customer_email` as a flat column.

You're building the pipeline that turns that folder into two things: a clean, validated, LLM-classified `tickets.jsonl` that a downstream service can stream line by line, and a summary report that tells a human whether the run can be trusted — how many tickets got classified, how many got rejected, and why. This is the project where ingestion, cleaning, validation, async API calls, and reporting stop being separate exercises and become one script that either works end to end or tells you exactly where it broke.

Build (or generate) your own multi-file dataset for this — a few hundred to a couple thousand synthetic tickets spread across 4-6 files is plenty. Deliberately inject the inconsistencies below rather than hunting for a "realistic" dataset; owning the mess means you also own the answer key, which matters for the last milestone.

## Acceptance criteria

- [ ] Discovers input files by pattern (e.g. everything under `data/raw/*.csv` and `*.json`), not by a hardcoded filename list — dropping a new export into the folder should require zero code changes.
- [ ] Normalizes at least these divergences into one shape before anything gets validated: date format (`2026-01-15` vs `01/15/2026` vs full ISO timestamp), priority scale (`"High"` vs `"P1"` vs integer `2`), field-name aliases (`body` vs `message`, `ticket_id` vs `id`), and tags (comma-separated string vs JSON array).
- [ ] Every normalized record passes through one Pydantic model. A record that fails validation is written to a `rejects.jsonl` with the original data and the validation error — it never crashes the run and never disappears silently.
- [ ] LLM classification runs concurrently through `asyncio`, with an explicit, tunable concurrency cap — not sequential, and not "as many as Python will let me fire at once."
- [ ] Transient failures (429, 5xx, connection errors) get retried with exponential backoff and jitter; after a fixed number of attempts the ticket is recorded as a classification failure, not retried forever.
- [ ] The LLM's reply is parsed and validated against a second Pydantic model with a constrained category set. A malformed or off-schema reply is handled as a failure, not an uncaught exception.
- [ ] Output is `tickets.jsonl` — one validated, classified ticket per line, safe for a downstream service to stream.
- [ ] A pandas-built summary report shows: total tickets seen, validation pass/fail counts, category counts, and classification failure rate broken down **per source file** (one bad export shouldn't hide in an aggregate number).
- [ ] You can state an actual accuracy number for the classifier, measured against ground-truth labels you wrote yourself when you generated the fixtures — not asserted, measured.
- [ ] Nothing in `rejects.jsonl`, the report, or your logs prints the API key. Take one look at whether ticket bodies (which may carry real-looking emails) belong in an artifact you'd hand to someone else.

## Suggested stack

- **Python 3.11+** in a project-local [venv](/learn/python-data-apis/python-environments-and-venv) — this project pulls in `pandas`, `pydantic`, an LLM SDK, and `python-dotenv`, and you don't want that leaking into system Python.
- **pandas** for the final report — `groupby`, `value_counts`, done.
- **pydantic v2** for both the ticket schema and the LLM response schema. `pip install "pydantic[email]"` if you validate `customer_email` as `EmailStr` (it needs the `email-validator` extra).
- **The official Anthropic Python SDK** (`pip install anthropic`), used through `AsyncAnthropic` — see [calling-llm-apis-in-python](/learn/python-data-apis/calling-llm-apis-in-python) for the base call shape before you wrap it in async and retries.
- **`asyncio.Semaphore`** for the concurrency cap. You don't need a third-party queueing library for this scale of project — the standard library covers it.
- **`python-dotenv`** to load your API key from a `.env` file that is in `.gitignore`, never in the script.
- **Your own fixture generator** instead of a scraped dataset — a 40-60 line script that writes a few CSVs and JSONs with the messiness above baked in, plus a hidden `answer_key.json` mapping `ticket_id -> true_category` that only your accuracy check reads.
- **pytest**, for at least one test that runs the pipeline against a tiny fixture with the LLM call mocked — you want to know normalization and validation still work without spending API calls on every test run.

## Milestones

**Ingest and normalize across formats.** Read every file in the input directory regardless of extension and produce one common in-memory shape — a list of dicts is fine — before validation ever sees the data. This is the part people underestimate: the messiness lives in the *shape*, not just bad values, so you need a dispatch per source shape, not a single `pd.read_csv` call that happens to also read JSON.

```python
def normalize_record(raw: dict, source_file: str) -> dict:
    if "meta" in raw:  # nested export shape
        return {
            "ticket_id": raw["id"],
            "created_at": raw["meta"]["created_at"],
            "customer_email": raw.get("customer", {}).get("email"),
            "subject": raw["subject"],
            "body": raw.get("message") or raw.get("body", ""),
            "priority": raw["meta"]["priority"],
            "tags": raw.get("tags", []),
            "source_file": source_file,
        }
    return {  # flat CSV shape
        "ticket_id": raw["ticket_id"],
        "created_at": raw["created"],
        "customer_email": raw.get("customer_email") or None,
        "subject": raw["subject"],
        "body": raw["body"],
        "priority": raw["priority"],
        "tags": raw.get("tags", ""),
        "source_file": source_file,
    }
```

[Turning messy data into model inputs](/learn/python-data-apis/turning-messy-data-into-model-inputs) is the module page for this specific translation step — read it before you design your own dispatch logic.

**Validate against one schema, reject loudly.** One `Ticket` model is the contract every downstream step trusts. Put the coercion *in* the model with `mode="before"` validators, so "priority normalization" and "date parsing" are testable in isolation rather than tangled into the ingestion loop:

```python
from datetime import datetime
from enum import Enum
from typing import Optional
from pydantic import BaseModel, EmailStr, Field, field_validator

class Priority(str, Enum):
    LOW = "low"; MEDIUM = "medium"; HIGH = "high"; URGENT = "urgent"

PRIORITY_MAP = {
    "1": Priority.URGENT, "p1": Priority.URGENT, "urgent": Priority.URGENT,
    "2": Priority.HIGH, "p2": Priority.HIGH, "high": Priority.HIGH,
    "3": Priority.MEDIUM, "p3": Priority.MEDIUM, "medium": Priority.MEDIUM,
    "4": Priority.LOW, "p4": Priority.LOW, "low": Priority.LOW,
}

class Ticket(BaseModel):
    ticket_id: str
    created_at: datetime
    customer_email: Optional[EmailStr] = None
    subject: str
    body: str = Field(min_length=1)
    priority: Priority
    tags: list[str] = Field(default_factory=list)
    source_file: str

    @field_validator("ticket_id", mode="before")
    @classmethod
    def stringify_id(cls, v):
        return str(v)

    @field_validator("priority", mode="before")
    @classmethod
    def normalize_priority(cls, v):
        key = str(v).strip().lower()
        if key not in PRIORITY_MAP:
            raise ValueError(f"unrecognized priority value: {v!r}")
        return PRIORITY_MAP[key]

    @field_validator("created_at", mode="before")
    @classmethod
    def parse_created_at(cls, v):
        if isinstance(v, datetime):
            return v
        for fmt in ("%Y-%m-%dT%H:%M:%SZ", "%Y-%m-%d", "%m/%d/%Y"):
            try:
                return datetime.strptime(v, fmt)
            except ValueError:
                continue
        raise ValueError(f"unparseable date: {v!r}")

    @field_validator("tags", mode="before")
    @classmethod
    def split_tags(cls, v):
        if isinstance(v, list):
            return v
        return [t.strip() for t in str(v).split(",") if t.strip()]
```

Then the loop that separates valid from rejected is almost boring, which is the point:

```python
from pydantic import ValidationError

valid, rejected = [], []
for raw in (normalize_record(r, src) for r, src in raw_records):
    try:
        valid.append(Ticket(**raw))
    except ValidationError as e:
        rejected.append({"source": raw.get("source_file"), "raw": raw, "errors": e.errors()})
```

[Data contracts and validation](/learn/python-data-apis/data-contracts-and-validation) is where the "reject, don't crash" philosophy is argued in full — worth reading before you decide what counts as a hard failure versus something worth a default.

**Classify concurrently, with a real concurrency budget and real retries.** This is the milestone that separates "calls an API in a loop" from "runs a batch job you'd trust overnight." The semaphore caps in-flight requests; it's released *before* you sleep for backoff, so a slow retry doesn't also block someone else's slot:

```python
import asyncio, random
import anthropic
from anthropic import AsyncAnthropic
from pydantic import BaseModel, ValidationError
from typing import Literal

client = AsyncAnthropic()
semaphore = asyncio.Semaphore(8)  # tune to your provider's rate limit, not your CPU count

class Classification(BaseModel):
    category: Literal["billing", "technical", "account", "feature_request", "other"]
    confidence: float

async def classify_ticket(ticket: Ticket, max_attempts: int = 5) -> Classification | None:
    prompt = (
        f"Subject: {ticket.subject}\nBody: {ticket.body}\n\n"
        "Classify this support ticket. Reply with JSON only, no other text: "
        '{"category": "<billing|technical|account|feature_request|other>", "confidence": <0-1 float>}'
    )
    for attempt in range(max_attempts):
        try:
            async with semaphore:
                response = await client.messages.create(
                    model="claude-haiku-4-5",  # high-volume, low-ambiguity classification is exactly what the cheap fast model is for
                    max_tokens=256,
                    messages=[{"role": "user", "content": prompt}],
                )
        except anthropic.RateLimitError:
            await asyncio.sleep(min(2 ** attempt + random.uniform(0, 1), 30))
            continue
        except anthropic.APIStatusError as e:
            if e.status_code >= 500:
                await asyncio.sleep(min(2 ** attempt + random.uniform(0, 1), 30))
                continue
            raise  # a 4xx that isn't 429 means the request is wrong - retrying won't fix it

        text = next((b.text for b in response.content if b.type == "text"), "")
        try:
            return Classification.model_validate_json(text)
        except ValidationError:
            return None  # off-schema reply counts as a failure, not a crash

    return None  # exhausted retries

async def classify_all(tickets: list[Ticket]) -> dict[str, Classification | None]:
    outcomes = await asyncio.gather(*(classify_ticket(t) for t in tickets))
    return dict(zip((t.ticket_id for t in tickets), outcomes))

results = asyncio.run(classify_all(valid))
```

[Rate limits and retries](/learn/python-data-apis/rate-limits-and-retries) and [concurrent API calls with asyncio](/learn/python-data-apis/concurrent-api-calls-with-asyncio) cover the two halves of this separately — the trick in a real pipeline is composing them without the retry loop starving your concurrency, which is exactly what holding the semaphore only around the request (not the sleep) buys you.

**Make failure a first-class outcome, not an afterthought.** By the time classification finishes, every ticket has landed in exactly one bucket: rejected at validation, classified, or classification-failed. If you can't answer "how many tickets ended up in each bucket, and does that add up to the input count" with one line of code, you don't have observability yet — you have a script that ran. This bucket accounting is what the report reads from next.

**Write JSONL out, build the report with pandas.** The output format matters: JSONL, not a single JSON array, so a downstream consumer can stream it and a partial write doesn't corrupt the whole file.

```python
import json

with open("tickets.jsonl", "w") as f:
    for ticket in valid:
        classification = results.get(ticket.ticket_id)
        record = ticket.model_dump(mode="json")
        record["category"] = classification.category if classification else None
        record["confidence"] = classification.confidence if classification else None
        f.write(json.dumps(record) + "\n")
```

```python
import pandas as pd

df = pd.DataFrame([t.model_dump() for t in valid])
df["category"] = df["ticket_id"].map(lambda tid: getattr(results.get(tid), "category", None))

category_counts = df["category"].value_counts(dropna=False)
error_rate_by_source = (
    df.assign(failed=df["category"].isna())
      .groupby("source_file")["failed"]
      .mean()
      .rename("llm_failure_rate")
)
```

[Groupby and aggregation](/learn/python-data-apis/groupby-and-aggregation) is the technique page for the second call — per-source error rates are the whole reason you keep `source_file` on the record all the way through the pipeline instead of dropping it after ingestion.

**Wire it into one script, not a notebook you re-run from the top.** Split into modules — `ingest.py`, `schema.py`, `classify.py`, `report.py` — with a thin `run.py` that calls them in order and takes `--input` / `--out` as arguments. This is the difference between a capstone and a class exercise: it should run unattended against a folder you hand it, and print a report at the end that tells you whether to trust the output.

## What good looks like

A run that works end to end prints something in the shape of this (numbers here are illustrative, not a target — yours depend on your fixtures):

```text
Tickets seen:        612
Validated:            588   (rejected: 24, see rejects.jsonl)
Classified:           571   (failed: 17)

category
technical           218
billing             142
account              98
feature_request      76
other                37
NaN (failed)         17

llm_failure_rate by source_file
tickets_jan.csv          0.02
tickets_api_export.json  0.04
tickets_feb.csv          0.09   <- worth a look
```

Beyond the report itself, a strong submission has a few properties in common: a single malformed record anywhere in the input cannot take down the whole run; the counts reconcile (`validated + rejected == total`, `classified + failed == validated`); the concurrency limit is a variable you set in one place, not a number baked into a loop; and you can point to a real accuracy percentage against the ground-truth labels from your fixture generator, because you know which category each ticket actually belongs to and the report doesn't have to take the model's confidence score on faith.

## Extensions

- **Resumable reruns.** Read the existing `tickets.jsonl` on startup, skip any `ticket_id` already present, and only classify what's new — turns a rerun after a crash from "redo everything" into "pick up where it stopped."
- **Prompt A/B test against your own labels.** You have ground truth from the fixture generator — use it to compare two prompt phrasings for the classifier and pick the one with higher measured accuracy, per [A/B testing prompts in production](/learn/prompt-engineering/ab-testing-prompts-in-production).
- **Persist the cleaned intermediate as Parquet** instead of recomputing normalization on every run — see [Parquet and columnar formats](/learn/python-data-apis/parquet-and-columnar-formats) for when that trade is worth it over JSONL.
- **Simulate a paginated ticket API** as one of your sources instead of a static export, and handle it with the patterns in [pagination patterns](/learn/python-data-apis/pagination-patterns).
- **Route low-confidence classifications to a review queue** instead of writing them straight through — anything under a confidence threshold gets its own output file for a human to check.
- **Add a semantic-duplicate check before classifying** — embed each ticket body and flag near-duplicates so you're not paying for an LLM call on five tickets that are the same complaint; [embeddings and semantic similarity](/learn/rag/embeddings-and-semantic-similarity) covers the technique.

**Related:** [Python data pipeline, the whole game](/learn/python-data-apis/python-data-pipeline-whole-game) · [Calling LLM APIs in Python](/learn/python-data-apis/calling-llm-apis-in-python) · [Batching LLM calls for throughput](/learn/python-data-apis/batching-llm-calls-for-throughput) · [Structuring a Python AI service](/learn/python-data-apis/structuring-a-python-ai-service) · [Testing data pipelines](/learn/python-data-apis/testing-data-pipelines) · [Secrets and config management](/learn/python-data-apis/secrets-and-config-management) · [Type coercion and parsing dates](/learn/python-data-apis/type-coercion-and-parsing-dates)
