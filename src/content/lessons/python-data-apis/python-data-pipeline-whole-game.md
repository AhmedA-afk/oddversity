---
title: "The Whole Game: Messy Data to a Model-Ready Pipeline"
track: "python-data-apis"
status: live
summary: "Whole-game overview lesson for Oddversity's Python & Data track: walks one end-to-end pipeline (messy CSV tickets to pandas to cleaning/validation to LLM sentiment classification t"
duration: "2 min read"
---

This track teaches one skill wearing a lot of costumes: turning data you don't control into a shape you do, cheaply enough and safely enough to hand to a model. Pandas, NumPy, async, retries — they're all in service of that one move, and it's easy to lose sight of it while you're learning each piece in isolation.

So before any of that, here's the whole thing built once, badly-lit corners included.

## The big picture

You've got a folder of support-ticket exports from a helpdesk tool. A new CSV lands every week. Nobody promised you clean data:

```csv
ticket_id,Created At,body,channel
T-1001,2026-01-03,"Still can't log in, this is the third time!",email
T-1002,01/04/2026,"thanks, that fixed it",chat
T-1003,,,email
T-1004,2026-01-05,"Any update on my refund?",chat
```

Different date formats across exports, blank rows, inconsistent column casing between files. Your job: turn this folder into one JSONL file, one ticket per line, each tagged with a sentiment an LLM assigned. That's the whole capstone in miniature, and it's the shape of most real data-to-model work.

> The hard part is never the pandas syntax. It's knowing which ten lines of cleaning code stand between "works on my laptop" and "silently mislabels a customer's angriest ticket as neutral."

**Before you write a line of pipeline code**, you need somewhere to run it and somewhere to keep the API key that isn't in the script. That's [environments and venv](/learn/python-data-apis/python-environments-and-venv) and [secrets and config management](/learn/python-data-apis/secrets-and-config-management) — not glamorous, but skip them and every other step becomes hard to reproduce or unsafe to share:

```bash
python -m venv .venv
source .venv/bin/activate
pip install pandas numpy anthropic python-dotenv
```

```python
from dotenv import load_dotenv
load_dotenv()  # ANTHROPIC_API_KEY now lives in the environment, not in your source
```

**Getting the files into memory** is where [files and data formats](/learn/python-data-apis/files-and-data-formats-overview) and [reading and writing CSV](/learn/python-data-apis/reading-and-writing-csv) come in — CSV is the input format here because that's what the helpdesk tool exports, not because it's a good format for what comes out the other end:

```python
from pathlib import Path
import pandas as pd

files = sorted(Path("tickets/").glob("*.csv"))
raw = pd.concat((pd.read_csv(f) for f in files), ignore_index=True)
print(raw.shape, raw.columns.tolist())
```

Every column in that dataframe is a NumPy array under the hood — that's why `raw["body"].str.strip()` runs in one vectorized pass instead of a Python loop per row. [NumPy arrays](/learn/python-data-apis/numpy-arrays-fundamentals) and [why arrays beat lists](/learn/python-data-apis/why-arrays-beat-lists-intuition) explain the mechanic; [pandas dataframes](/learn/python-data-apis/pandas-dataframes-fundamentals) and [loading data into pandas](/learn/python-data-apis/loading-data-into-pandas) are where you'll actually use it. And every row, once you pull it out with `.to_dict()`, is just the dict/JSON shape from [data structures for data work](/learn/python-data-apis/python-data-structures-for-data-work) and [nested JSON in memory](/learn/python-data-apis/nested-json-in-memory) — pandas is a fast way to manipulate a pile of dicts, not a different universe from one.

**Cleaning and validating** is the step that decides whether the rest of the pipeline is trustworthy:

```python
raw.columns = [c.strip().lower().replace(" ", "_") for c in raw.columns]

clean = (
    raw
    .assign(created_at=lambda df: pd.to_datetime(df["created_at"], errors="coerce"))
    .dropna(subset=["ticket_id", "body", "created_at"])
    .drop_duplicates(subset="ticket_id")
    .assign(
        body=lambda df: df["body"].str.strip(),
        created_at=lambda df: df["created_at"].dt.strftime("%Y-%m-%dT%H:%M:%S"),
    )
)
```

That's [the cleaning workflow](/learn/python-data-apis/data-cleaning-workflow), [handling missing values](/learn/python-data-apis/handling-missing-values), and [type coercion and parsing dates](/learn/python-data-apis/type-coercion-and-parsing-dates) in five lines. Then, because "looks clean" and "is clean" aren't the same claim, validate the shape explicitly before anything downstream trusts it:

```python
from pydantic import BaseModel, ValidationError

class Ticket(BaseModel):
    ticket_id: str
    body: str
    created_at: str

validated, rejected = [], []
for row in clean.to_dict(orient="records"):
    try:
        validated.append(Ticket(**row))
    except ValidationError as e:
        rejected.append((row, e))

print(f"{len(validated)} clean, {len(rejected)} rejected")
```

That's [validating dataframes with schemas](/learn/python-data-apis/validating-dataframes-with-schemas) and the broader idea of [data contracts and validation](/learn/python-data-apis/data-contracts-and-validation) — a schema is a promise about your data that fails loudly instead of drifting quietly. Watch for the classic trap here too: chained indexing on a dataframe copy silently not doing what you meant, covered in [pandas SettingWithCopy mistakes](/learn/python-data-apis/pandas-settingwithcopy-mistakes).

**Turning a validated row into something an LLM should see** is its own small decision — you don't hand a model your raw dataframe row, you build a deliberate, bounded prompt:

```python
def to_prompt(ticket: Ticket) -> str:
    body = ticket.body[:2000]  # bound the input so cost and latency stay predictable
    return (
        "Classify the sentiment of this support ticket as exactly one word: "
        f"positive, neutral, or negative.\n\nTicket: {body}"
    )
```

This is [turning messy data into model inputs](/learn/python-data-apis/turning-messy-data-into-model-inputs) — a step people skip because it looks trivial, right up until an 8,000-word ticket blows their token budget.

**Calling the LLM** is, underneath the SDK, the same REST shape as any other API call — a POST, a JSON body, an auth header — which is why [calling REST APIs with Python](/learn/python-data-apis/calling-rest-apis-with-python) and [authentication and API keys](/learn/python-data-apis/authentication-and-api-keys) come before [calling LLM APIs](/learn/python-data-apis/calling-llm-apis-in-python) specifically:

```python
import os
import anthropic

client = anthropic.Anthropic(api_key=os.environ["ANTHROPIC_API_KEY"])

def classify_sentiment(ticket: Ticket) -> str:
    response = client.messages.create(
        model="claude-sonnet-5",
        max_tokens=16,
        messages=[{"role": "user", "content": to_prompt(ticket)}],
    )
    return response.content[0].text.strip().lower()
```

Two things break here in practice, both worth a module of their own: the call itself fails sometimes (rate limits, transient 5xxs — [rate limits and retries](/learn/python-data-apis/rate-limits-and-retries)), and the model's answer isn't guaranteed to be one of your three labels just because you asked nicely ([parsing and validating API responses](/learn/python-data-apis/parsing-and-validating-api-responses)). Validation isn't a step you do once at the input — you do it again at the output, because the model is now part of your data source.

**Doing this one ticket at a time doesn't scale** — each call spends most of its time waiting on the network, not on your CPU, which is exactly the case [async I/O](/learn/python-data-apis/async-python-for-io) is for:

```python
import asyncio
from anthropic import AsyncAnthropic

async_client = AsyncAnthropic(api_key=os.environ["ANTHROPIC_API_KEY"])

async def classify_one(sem: asyncio.Semaphore, ticket: Ticket) -> tuple[str, str]:
    async with sem:
        response = await async_client.messages.create(
            model="claude-sonnet-5",
            max_tokens=16,
            messages=[{"role": "user", "content": to_prompt(ticket)}],
        )
        return ticket.ticket_id, response.content[0].text.strip().lower()

async def classify_all(tickets: list[Ticket], concurrency: int = 5) -> dict[str, str]:
    sem = asyncio.Semaphore(concurrency)
    results = await asyncio.gather(*(classify_one(sem, t) for t in tickets))
    return dict(results)

sentiments = asyncio.run(classify_all(validated))
```

The semaphore caps how many requests are in flight at once — set it too high and you trade one rate-limit error for a wall of them. [Concurrent API calls with asyncio](/learn/python-data-apis/concurrent-api-calls-with-asyncio) covers the pattern; [batching LLM calls for throughput](/learn/python-data-apis/batching-llm-calls-for-throughput) covers what changes once you're doing this for tens of thousands of tickets instead of a few hundred.

**Writing the result back out** closes the loop — JSONL instead of CSV, because each line is a self-contained, appendable record and nesting isn't a fight:

```python
import json

with open("tickets_scored.jsonl", "w") as f:
    for ticket in validated:
        record = ticket.model_dump() | {"sentiment": sentiments[ticket.ticket_id]}
        f.write(json.dumps(record) + "\n")
```

That choice — and when Parquet or plain CSV would've been the better call instead — is [choosing a data format](/learn/python-data-apis/choosing-a-data-format) and [JSON and JSONL files](/learn/python-data-apis/json-and-jsonl-files).

Once every step above is a function instead of a script running top to bottom, you've got the shape of [structuring a Python AI service](/learn/python-data-apis/structuring-a-python-ai-service) — load, clean, validate, classify, write, each testable on its own ([testing data pipelines](/learn/python-data-apis/testing-data-pipelines)) without needing a real API key or a real folder of CSVs to run the tests. That's also what [Python for AI services](/learn/python-data-apis/python-for-ai-services) is about: the same pipeline, but built to run unattended instead of once in a notebook.

The [capstone](/learn/python-data-apis/messy-data-to-llm-pipeline-capstone) is this exact pipeline, built by you, on messier data than the example above.

## What trips people up

| Idea | Common confusion | Where to learn it |
|---|---|---|
| Filtering a dataframe | Editing a filtered slice and getting a warning, or a change that silently didn't apply | [pandas SettingWithCopy mistakes](/learn/python-data-apis/pandas-settingwithcopy-mistakes) |
| Missing data | Treating `NaN`, `None`, and `""` as interchangeable, or dropping rows without checking why they're missing | [Handling missing values](/learn/python-data-apis/handling-missing-values) |
| Parsing dates | Assuming `pd.to_datetime` parses every format the same way across files | [Type coercion and parsing dates](/learn/python-data-apis/type-coercion-and-parsing-dates) |
| Schema validation | Validating once at the start and trusting the data stays clean through every later step | [Validating dataframes with schemas](/learn/python-data-apis/validating-dataframes-with-schemas) |
| Virtual environments | Installing packages globally, then having two projects silently fight over versions | [Environments and venv](/learn/python-data-apis/python-environments-and-venv) |
| API keys | Hardcoding a key in the script, or committing a `.env` file | [Secrets and config management](/learn/python-data-apis/secrets-and-config-management) |
| Calling APIs under load | Retrying a failed request immediately in a loop instead of backing off | [Rate limits and retries](/learn/python-data-apis/rate-limits-and-retries) |
| LLM output | Trusting the model's text as an already-valid label instead of re-validating it | [Parsing and validating API responses](/learn/python-data-apis/parsing-and-validating-api-responses) |
| Async code | Expecting async to speed up CPU-bound work, or forgetting to cap concurrency and tripping rate limits anyway | [Why async for API calls](/learn/python-data-apis/why-async-for-api-calls-intuition) |

## A reading path

A short, ordered route through everything above:

1. [Environments and venv](/learn/python-data-apis/python-environments-and-venv) → [Setting up venv and Jupyter](/learn/python-data-apis/setting-up-venv-and-jupyter) → [Secrets and config management](/learn/python-data-apis/secrets-and-config-management) → [Loading secrets with dotenv](/learn/python-data-apis/loading-secrets-with-dotenv)
2. [Data structures for data work](/learn/python-data-apis/python-data-structures-for-data-work) → [Nested JSON in memory](/learn/python-data-apis/nested-json-in-memory) → [Files and data formats](/learn/python-data-apis/files-and-data-formats-overview) → [Reading and writing CSV](/learn/python-data-apis/reading-and-writing-csv) → [JSON and JSONL files](/learn/python-data-apis/json-and-jsonl-files)
3. [NumPy arrays fundamentals](/learn/python-data-apis/numpy-arrays-fundamentals) → [Pandas dataframes fundamentals](/learn/python-data-apis/pandas-dataframes-fundamentals) → [Loading data into pandas](/learn/python-data-apis/loading-data-into-pandas)
4. [The cleaning workflow](/learn/python-data-apis/data-cleaning-workflow) → [Handling missing values](/learn/python-data-apis/handling-missing-values) → [Type coercion and parsing dates](/learn/python-data-apis/type-coercion-and-parsing-dates) → [Validating dataframes with schemas](/learn/python-data-apis/validating-dataframes-with-schemas) → [Turning messy data into model inputs](/learn/python-data-apis/turning-messy-data-into-model-inputs)
5. [Calling REST APIs with Python](/learn/python-data-apis/calling-rest-apis-with-python) → [Authentication and API keys](/learn/python-data-apis/authentication-and-api-keys) → [Rate limits and retries](/learn/python-data-apis/rate-limits-and-retries) → [Calling LLM APIs in Python](/learn/python-data-apis/calling-llm-apis-in-python) → [Parsing and validating API responses](/learn/python-data-apis/parsing-and-validating-api-responses)
6. [Async Python for I/O](/learn/python-data-apis/async-python-for-io) → [Concurrent API calls with asyncio](/learn/python-data-apis/concurrent-api-calls-with-asyncio) → [Batching LLM calls for throughput](/learn/python-data-apis/batching-llm-calls-for-throughput)
7. [Structuring a Python AI service](/learn/python-data-apis/structuring-a-python-ai-service) → [Testing data pipelines](/learn/python-data-apis/testing-data-pipelines) → [The capstone](/learn/python-data-apis/messy-data-to-llm-pipeline-capstone)

Follow that route and you'll have written every stage of this page's pipeline yourself, on data messier than the example above.

**Related:** [Data contracts and validation](/learn/python-data-apis/data-contracts-and-validation) · [Python for AI services](/learn/python-data-apis/python-for-ai-services) · [Pagination patterns](/learn/python-data-apis/pagination-patterns) · [Choosing a data format](/learn/python-data-apis/choosing-a-data-format)
