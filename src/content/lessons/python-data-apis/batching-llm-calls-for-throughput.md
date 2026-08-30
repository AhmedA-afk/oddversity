---
title: "Batching LLM Calls for Throughput and Cost"
track: "python-data-apis"
status: live
summary: "Worked example: classify 5,000 reviews with an async + semaphore-capped pipeline that writes results to JSONL as they land, so a crash resumes instead of restarting. Shows naive-vs"
duration: "18 min read"
---

Five thousand reviews, one API call at a time, is a script that finishes just in time for you to not care about the result anymore — and if it dies at review 4,200, you start over from zero. This walks through turning that script into a concurrent, crash-resumable pipeline, and puts real numbers on what each change actually buys you.

## The setup

You've got `reviews.csv`: 5,000 customer reviews, one per row, and you need a sentiment label — `positive`, `neutral`, or `negative` — on each one.

```csv
review_id,text
r00001,"Shipped fast and the case fits perfectly. Would buy again."
r00002,"Battery died after two weeks. Support never replied to my email."
r00003,"It's fine. Does what it says, nothing special."
r00004,"Packaging was crushed but the item inside was undamaged, so no complaints."
r00005,"Worst purchase this year. Returning it."
... (4,995 more rows)
```

For the model, reach for [Claude Haiku 4.5](/learn/python-data-apis/calling-llm-apis-in-python) rather than a bigger model. Three-way sentiment classification on a sentence or two of text is exactly the "simple, well-specified, done at volume" job a small model is built for — you'd reach for something bigger only if the categories were subtle or the review text was long and ambiguous.

Here's the prompt contract and the naive baseline — the thing you'd write first, before thinking about scale at all:

```python
import csv
import time
import anthropic

MODEL = "claude-haiku-4-5"
LABELS = {"positive", "neutral", "negative"}
SYSTEM_PROMPT = (
    "Classify the product review into exactly one label: "
    "positive, neutral, or negative. Reply with only the label, lowercase."
)

client = anthropic.Anthropic()  # reads ANTHROPIC_API_KEY from the environment

def classify_one(text: str) -> str:
    response = client.messages.create(
        model=MODEL,
        max_tokens=10,
        system=SYSTEM_PROMPT,
        messages=[{"role": "user", "content": text}],
    )
    for block in response.content:
        if block.type == "text":
            return block.text.strip().lower()
    return "unparsed"

def run_naive(rows: list[dict]) -> list[dict]:
    results = []
    for row in rows:
        label = classify_one(row["text"])
        results.append({"review_id": row["review_id"], "label": label})
    return results
```

This works. It's also the version you'll rewrite in the next section, for two reasons that have nothing to do with each other: it's slow, and it's fragile. Fixing the first one (concurrency) is easy. Fixing the second one (a crash losing your progress) is the part people skip and regret.

## Step by step

### Step 1 — Make the output parseable, not just readable

The prompt above works because the instruction is narrow: one word, from a closed set, lowercase. That's deliberate — a model that occasionally answers "Positive." or "This review seems positive overall" turns "classify 5,000 reviews" into "classify 5,000 reviews and then clean up the labels." Validate on the way in, not after the fact:

```python
def extract_label(response) -> str:
    for block in response.content:
        if block.type == "text":
            candidate = block.text.strip().lower()
            return candidate if candidate in LABELS else "unparsed"
    return "unparsed"
```

> **Why this step?** An "unparsed" bucket is not a failure state — it's a signal. If it's 2 rows out of 5,000, ignore it. If it's 200, your prompt is underspecified and no amount of concurrency or retrying will fix that; you need a tighter instruction or a [validated response schema](/learn/python-data-apis/parsing-and-validating-api-responses), not a bug report.

### Step 2 — Go concurrent, capped by a semaphore

Swap the blocking client for `AsyncAnthropic` and fire requests concurrently instead of one after another. The [semaphore](/learn/python-data-apis/concurrent-api-calls-with-asyncio) is what keeps "concurrent" from meaning "all 5,000 at once":

```python
import asyncio
import anthropic

async_client = anthropic.AsyncAnthropic()

async def classify_one_async(sem: asyncio.Semaphore, review_id: str, text: str) -> dict:
    async with sem:
        response = await async_client.messages.create(
            model=MODEL,
            max_tokens=10,
            system=SYSTEM_PROMPT,
            messages=[{"role": "user", "content": text}],
        )
    return {
        "review_id": review_id,
        "label": extract_label(response),
        "input_tokens": response.usage.input_tokens,
        "output_tokens": response.usage.output_tokens,
    }

async def run_batched(rows: list[dict], concurrency: int = 20) -> list[dict]:
    sem = asyncio.Semaphore(concurrency)
    tasks = [
        asyncio.create_task(classify_one_async(sem, r["review_id"], r["text"]))
        for r in rows
    ]
    results = []
    for coro in asyncio.as_completed(tasks):
        results.append(await coro)
    return results
```

> **Why this step?** Each `await client.messages.create(...)` spends almost all of its time waiting on the network, not your CPU — the textbook case for [async over threads](/learn/python-data-apis/why-async-for-api-calls-intuition). All 5,000 tasks exist immediately, but the semaphore only lets `concurrency` of them hold an active request at once; the rest sit paused at `async with sem` until a slot frees up. Note the extra fields on the return value — `input_tokens` and `output_tokens` straight from `response.usage`. You'll use those in Step 5 to compute real cost instead of guessing it.

### Step 3 — Write results to JSONL as they land

`run_batched` above still returns one big list at the end — which means if request 4,999 raises, you lose everything, not just that one row. Fix that by writing each result out the moment it completes, to a [JSON Lines file](/learn/python-data-apis/json-and-jsonl-files) rather than one big JSON array (you can't append to the middle of a `]`, but you can always append a new line):

```python
import json

OUTPUT_JSONL = "labels.jsonl"

async def run_batched_streaming(rows: list[dict], concurrency: int = 20, out_path: str = OUTPUT_JSONL) -> None:
    sem = asyncio.Semaphore(concurrency)
    tasks = [
        asyncio.create_task(classify_one_async(sem, r["review_id"], r["text"]))
        for r in rows
    ]
    with open(out_path, "a") as f:
        for coro in asyncio.as_completed(tasks):
            result = await coro
            f.write(json.dumps(result) + "\n")
```

> **Why this step?** This looks done. It isn't — hold that thought for the next section.

### Step 4 — Make it resumable

Before starting a run, read whatever's already in `labels.jsonl` and skip those review IDs. This is what turns "crash" from "start over" into "pick up where you left off":

```python
import os

def load_done_ids(out_path: str) -> set[str]:
    done = set()
    if not os.path.exists(out_path):
        return done
    with open(out_path) as f:
        for line in f:
            line = line.strip()
            if not line:
                continue
            try:
                done.add(json.loads(line)["review_id"])
            except json.JSONDecodeError:
                continue  # a partial last line from a prior crash — ignore it, don't crash on it
    return done

async def run_batched_resumable(rows: list[dict], concurrency: int = 20, out_path: str = OUTPUT_JSONL) -> None:
    done = load_done_ids(out_path)
    todo = [r for r in rows if r["review_id"] not in done]
    print(f"{len(done)} already done, {len(todo)} to go")

    sem = asyncio.Semaphore(concurrency)
    tasks = [
        asyncio.create_task(classify_one_async(sem, r["review_id"], r["text"]))
        for r in todo
    ]
    with open(out_path, "a") as f:
        for coro in asyncio.as_completed(tasks):
            result = await coro
            f.write(json.dumps(result) + "\n")
```

> **Why this step?** `custom_id`-style keys (here, `review_id`) are what make resume safe: you're not counting lines and guessing an offset, you're checking "did *this specific row* get classified" — so it's correct even if the crash happened mid-batch, out of order, or after a partial write. The `except json.JSONDecodeError: continue` is doing real work — see Step where it breaks for why.

### Step 5 — Measure, from real numbers not guesses

`response.usage` on every call already told you exactly how many tokens you spent — so read the ledger back instead of estimating:

```python
def summarize(out_path: str, price_in_per_mtok: float, price_out_per_mtok: float) -> tuple[int, int, float]:
    total_in = total_out = 0
    with open(out_path) as f:
        for line in f:
            record = json.loads(line)
            total_in += record["input_tokens"]
            total_out += record["output_tokens"]
    cost = (total_in / 1_000_000) * price_in_per_mtok + (total_out / 1_000_000) * price_out_per_mtok
    return total_in, total_out, cost
```

Say (illustrative, but the arithmetic is real) each request runs about 90 input tokens — a short system instruction plus a sentence or two of review — and 2 output tokens for the label. At Haiku 4.5's $1.00 / $5.00 per million tokens:

```
total_in  = 90 * 5,000  = 450,000 tokens  ->  450,000 / 1e6 * $1.00 = $0.45
total_out =  2 * 5,000  =  10,000 tokens  ->   10,000 / 1e6 * $5.00 = $0.05
total cost                                                          = $0.50
```

Now the part that surprises people: **that $0.50 doesn't change between the naive version and the batched version.** You're sending the same tokens either way — concurrency doesn't make the model cheaper, it makes the wall clock shorter. If you assume roughly half a second per call (measure this on your own account with a 50-row pilot before trusting any number, including this one — see [rate limits and retries](/learn/python-data-apis/rate-limits-and-retries) for why it varies):

| Approach | Concurrency | Wall clock (5,000 rows) | Cost |
|---|---|---|---|
| Naive, one at a time | 1 | ~42 min (5,000 x 0.5s) | $0.50 |
| Batched | 20 | ~2 min (5,000 / (20/0.5s)) | $0.50 |

Same money, about 20x faster — because concurrency is buying you overlap, not a discount. If you also want the bill itself smaller, that's a different lever: a cheaper/smaller model, shorter prompts, or (if same-day results aren't required) Anthropic's Message Batches API, which runs asynchronously at roughly half the per-token price — a genuinely different tool for a genuinely different SLA than the live, streaming-results pipeline built here.

## Where it breaks

### Failure 1: the crash-resume that doesn't resume

Run `run_batched_streaming` (Step 3, before the resume logic) on the full 5,000 rows, and kill the process partway through — a laptop sleeping, an OOM kill, a spot instance getting reclaimed, anything that ends the process without it choosing to. Simulate it directly:

```python
# crash_demo.py — reproduces a real crash on demand
import asyncio, os

async def main():
    rows = load_rows("reviews.csv")[:3200]  # pretend we're 3,200 rows into the run
    await run_batched_streaming(rows, concurrency=20)
    os._exit(1)  # no cleanup, no flush — exactly what a SIGKILL does to your process

asyncio.run(main())
```

Restart with the resume logic from Step 4 and check `len(load_done_ids("labels.jsonl"))`. It's nowhere near 3,200. It might be 40. It might be a few thousand, if you got unlucky with timing. That's not random — it's Python's file buffering. `open(path, "a")` doesn't write to disk on every `f.write()`; it fills an internal buffer (a few kilobytes) and only flushes when that buffer is full or the file is closed cleanly. `os._exit()` skips the clean-close entirely, so whatever was still sitting in the buffer — which could be most of your "completed" work — never reached the disk. The whole point of writing incrementally was to survive a crash, and the buffering silently defeated it.

The fix is to force the write out immediately, past both Python's buffer and the OS page cache:

```python
with open(out_path, "a") as f:
    for coro in asyncio.as_completed(tasks):
        result = await coro
        f.write(json.dumps(result) + "\n")
        f.flush()             # push it out of Python's buffer now
        os.fsync(f.fileno())  # ...and out of the OS cache now too
```

`flush()` alone protects you against the process dying; `os.fsync()` additionally protects you against the machine losing power before the OS gets around to writing its cache to disk. It costs a small amount of latency per write — for a few-hundred-millisecond LLM call, that overhead is noise. Re-run the crash demo with the fixed version and `load_done_ids` now reports (approximately) 3,200, right where you killed it.

### Failure 2: sizing the semaphore against the rate limit

Going from `concurrency=1` to `concurrency=20` was a free 20x. So try `concurrency=150`:

```python
await run_batched_resumable(rows, concurrency=150)
```

```text
anthropic.RateLimitError: Error code: 429 - {'error': {'type': 'rate_limit_error',
  'message': 'Number of requests has exceeded your per-minute rate limit...'}}
```

The SDK's built-in retry (exponential backoff, on by default) absorbs a few of these, but at 150-way oversubscription you're not occasionally tripping the limit — you're permanently past it, so most requests spend their time backing off and retrying instead of doing work. Net wall clock usually ends up *worse* than the well-tuned 20-concurrency run, not 7x better.

The right way to size the semaphore is Little's Law: the number of requests you can have in flight is your target throughput times your average latency per request — `concurrency ≈ throughput (req/s) x latency (s/req)`. Say your usage tier caps you at 4,000 requests per minute (~67 req/s) — check your actual number in the Console, this is illustrative. Aim for maybe 80% of that ceiling as a safety margin, so ~53 req/s. With a ~0.5s average latency:

```
concurrency ≈ 53 req/s * 0.5 s/req ≈ 27
```

Set the semaphore to 25, comfortably under that ceiling, and you get essentially the full benefit of the rate limit with no 429s to retry around — better throughput than the "safe but conservative" 20, and none of the failure mode at 150.

## Takeaways

- Concurrency (async + a semaphore) buys you **wall-clock time**, not lower cost — you're sending the same tokens either way. If you want the bill itself down, that's model choice, shorter prompts, or the Batch API, not more in-flight requests.
- Write results to disk the instant they land, in JSONL, keyed by a stable ID — and resume by checking "is this ID done," never by counting lines or trusting an offset.
- `f.write()` is not `f.flush()`. If crash-survival is the point of writing incrementally, you need `flush()` (survives a killed process) and, for a stronger guarantee, `os.fsync()` (survives a killed machine) — otherwise your "resumable" pipeline resumes from wherever the buffer last happened to fill.
- Size the semaphore from your rate limit, not from ambition: `concurrency ≈ target throughput x average latency`. Measure latency on a small pilot before trusting the arithmetic.
- Read `response.usage` on every call and let that be your cost ledger — it's exact, and it costs nothing extra since you're already parsing the response.

**Related:** [Loading secrets with dotenv](/learn/python-data-apis/loading-secrets-with-dotenv) · [API-calling common mistakes](/learn/python-data-apis/api-calling-common-mistakes) · [Structuring a Python AI service](/learn/python-data-apis/structuring-a-python-ai-service) · [Async & batching quiz](/learn/python-data-apis/async-and-batching-quiz)
