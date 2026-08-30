---
title: "JSON vs JSONL: Whole Files and Streams"
track: "python-data-apis"
status: live
summary: "A hands-on build of a batch LLM job that appends one JSON record per line instead of building one big JSON document, plus a generator-based reader that makes a mid-run crash cost y"
duration: "22 min read"
---

A batch job that calls an LLM on ten thousand rows can run for hours, and hours-long processes crash: a rate limit, a flaky network, an OOM kill, a laptop lid closed at the wrong moment. Whether that crash costs you one row or the entire job comes down to a file format decision you make before you write the first line of the loop.

## What we're building

You have a list of customer tickets. For each one you call an LLM to produce a short summary, and you want the results saved to disk. The job takes long enough that "it might not finish" is a real possibility, not a hypothetical.

You'll build the same job two ways:

- **Whole-document JSON** — collect every result in memory, `json.dump` one array at the end. Simple, and exactly wrong for a long-running job: nothing touches disk until the very last line runs successfully.
- **JSON Lines (JSONL)** — append one complete JSON object per line, as each result comes back. Every line is durable the instant it's written. A crash at row 9,412 leaves you with 9,411 finished rows on disk and a job you can resume, not restart.

If you haven't seen the two formats side by side yet, JSON and JSONL files is the primer — this lesson is the deep, hands-on version: a real batch loop, a real crash, and a generator that reads the results back without ever loading the whole file into memory.

## Setup

Everything here is the standard library — `json`, `pathlib`, `time` — so there's nothing to install. Create a working file, say `batch_llm.py`, and run it with:

```bash
python batch_llm.py
```

The "LLM call" in this lesson is a mocked function so the whole thing runs with no API key and no network. Once the mechanics make sense, swapping it for a [real LLM API call](/learn/python-data-apis/calling-llm-apis-in-python) is a one-function change — everything else in this lesson (the append-per-line write, the generator read, the resume logic) stays exactly the same.

## Build it

### Step 1: the risky version — one JSON document for the whole batch

Start with the version most people write first, because it's the version that maps most directly onto "make a list, dump it to a file":

```python
import json
import time
from pathlib import Path

def call_llm(prompt: str) -> dict:
    """Stand-in for a real API call. Deterministic and fast so the
    example runs anywhere with no network and no key."""
    time.sleep(0.01)  # pretend this is network latency
    return {
        "summary": prompt[:40] + ("..." if len(prompt) > 40 else ""),
        "tokens": len(prompt.split()),
    }

rows = [
    {"id": i, "prompt": f"Summarize customer ticket #{i}: the widget won't power on."}
    for i in range(1, 21)
]

def run_batch_json(rows, out_path="results.json"):
    results = []
    for row in rows:
        if row["id"] == 12:
            raise RuntimeError("simulated crash: rate limit exceeded")
        output = call_llm(row["prompt"])
        results.append({"id": row["id"], **output})
    # nothing is written to disk until every row above succeeds
    with open(out_path, "w") as f:
        json.dump(results, f, indent=2)
```

**Why this is risky:** `json.dump` needs one complete top-level value — here, a list — before it can write anything. That's fine for a config file or a single API response you build in one shot. It's the wrong shape for "20,000 independent records produced one at a time over three hours," because the write only happens after the *last* row succeeds. Eleven completed LLM calls sitting in the `results` list in memory are worth nothing the moment the process dies — they were never durable.

### Step 2: switch to JSONL — append one durable record per line

```python
def run_batch_jsonl(rows, out_path="results.jsonl"):
    with open(out_path, "a", encoding="utf-8") as f:
        for row in rows:
            if row["id"] == 12:
                raise RuntimeError("simulated crash: rate limit exceeded")
            output = call_llm(row["prompt"])
            record = {"id": row["id"], **output}
            f.write(json.dumps(record) + "\n")
            f.flush()
```

Two details matter here. First, the file is opened once in **append mode** ("a") for the whole loop, not reopened per row — one open file handle, many small writes. Second, `f.flush()` after every write pushes the line out of Python's internal buffer immediately, instead of leaving it to be flushed later (or lost) when the process exits normally. Without it, a crash could still lose the last few "written" rows even though `write()` had already been called on them.

The result is a file where each line is a complete, independent JSON value:

```jsonl
{"id": 1, "summary": "Summarize customer ticket #1: the widget...", "tokens": 9}
{"id": 2, "summary": "Summarize customer ticket #2: the widget...", "tokens": 9}
```

Note the file *as a whole* is not valid JSON — there's no enclosing `[...]` and no commas between lines. That's fine. JSONL never promised to be one JSON document; it promises that every line is one.

### Step 3: read it back with a generator, not `json.load`

`json.load` wants a single, complete document, which is exactly what JSONL doesn't give you. Instead, read one line at a time and hand back one parsed record at a time:

```python
def iter_jsonl(path):
    with open(path, "r", encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if not line:
                continue
            yield json.loads(line)
```

This is a plain [generator function](/learn/python-data-apis/comprehensions-and-generators): calling `iter_jsonl(path)` doesn't read anything yet, it hands you an iterator. Each `next()` (or each turn of a `for` loop) reads one line, parses it, and yields it. Memory use stays flat whether the file has 20 lines or 20 million — you never hold more than one record at a time, unlike `json.load`, which has to materialize the entire array before you can touch element zero.

### Step 4: make the run resumable — skip what's already done

Now combine the two ideas: before starting, read whatever's already on disk to find out which rows are already done, then only process what's left.

```python
def already_done_ids(path):
    if not Path(path).exists():
        return set()
    return {rec["id"] for rec in iter_jsonl(path)}

def run_batch_resumable(rows, out_path="results.jsonl", crash_at=None):
    done = already_done_ids(out_path)
    with open(out_path, "a", encoding="utf-8") as f:
        for row in rows:
            if row["id"] in done:
                continue
            if row["id"] == crash_at:
                raise RuntimeError(f"simulated crash at id={crash_at}")
            output = call_llm(row["prompt"])
            record = {"id": row["id"], **output}
            f.write(json.dumps(record) + "\n")
            f.flush()
```

`already_done_ids` reuses the same generator from Step 3 — it never needed a special "peek" mode, because streaming one record at a time is already the cheap way to check what's there. On a fresh file it returns an empty set and the job runs from scratch; on a partially-written file it returns every `id` already recorded, and the loop below skips straight past them.

## Run it

Wire it together with a small driver that deliberately crashes once, then "restarts":

```python
if __name__ == "__main__":
    # A. whole-document JSON: a crash loses everything
    Path("results.json").unlink(missing_ok=True)
    try:
        run_batch_json(rows)
    except RuntimeError as e:
        print(f"[json] crashed: {e}")
        print(f"[json] results.json exists on disk: {Path('results.json').exists()}")

    # B. JSONL: a crash loses only what hadn't been written yet
    out = Path("results.jsonl")
    out.unlink(missing_ok=True)
    try:
        run_batch_resumable(rows, out_path=out, crash_at=12)
    except RuntimeError as e:
        done_so_far = sum(1 for _ in iter_jsonl(out))
        print(f"[jsonl] crashed: {e}")
        print(f"[jsonl] {done_so_far} rows already durable on disk")

    # simulate restarting the process later, same input, no crash this time
    run_batch_resumable(rows, out_path=out)

    all_results = list(iter_jsonl(out))
    print(f"[jsonl] finished: {len(all_results)} rows in {out}")
    assert len(all_results) == len(rows)
    assert len({r["id"] for r in all_results}) == len(rows)  # no duplicates
```

Running `python batch_llm.py` prints:

```
[json] crashed: simulated crash: rate limit exceeded
[json] results.json exists on disk: False
[jsonl] crashed: simulated crash at id=12
[jsonl] 11 rows already durable on disk
[jsonl] finished: 20 rows in results.jsonl
```

The whole-document run does eleven LLM calls' worth of work and has nothing to show for it — no file, no partial results, if this were a real API you paid for eleven calls and kept zero. The JSONL run keeps all eleven, resumes at row twelve, and finishes with exactly twenty rows and no duplicates.

If this were a real multi-hour job, you could open a second terminal while it's running and check progress without touching the process:

```bash
wc -l results.jsonl
tail -n 2 results.jsonl
```

`wc -l` climbs in real time as rows complete, and `tail` shows you the most recent result — something `results.json` can't offer you at all until the job finishes, because until then it doesn't exist.

## Harden it

A few things the happy path above glosses over:

- **A torn last line.** If the process dies mid-`write()` (rare for a short JSON line, but not impossible, especially over a network filesystem), the last line in the file can be incomplete JSON. Make the reader tolerant instead of assuming every line is clean:

```python
def iter_jsonl(path):
    with open(path, "r", encoding="utf-8") as f:
        for lineno, line in enumerate(f, start=1):
            line = line.strip()
            if not line:
                continue
            try:
                yield json.loads(line)
            except json.JSONDecodeError:
                print(f"skipping malformed line {lineno} in {path} — likely a torn write")
```

  A skipped malformed line means that row's `id` won't show up in `already_done_ids`, so the resume logic naturally reprocesses it. That's the safe failure mode: redo one row, never lose one.

- **Non-ASCII content.** LLM output isn't guaranteed to be ASCII. `json.dumps(record, ensure_ascii=False)` writes real UTF-8 characters instead of `\uXXXX` escapes — more readable, and just as valid — as long as the file is opened with `encoding="utf-8"` on both ends, which it already is above.

- **Non-serializable values.** If a record ever holds something `json.dumps` doesn't know how to encode (a `datetime`, a custom object), you'll get a `TypeError` mid-batch — which, notice, is itself a good argument for JSONL, since everything written before that row stays intact. Pass `default=str` to `json.dumps` as a blanket fallback, or convert the field explicitly before writing.

- **Trust, but verify, what comes back.** A JSONL line can be syntactically valid JSON and still be missing the fields your downstream code expects — an LLM call that returned an error payload instead of a summary, say. Check the shape of each record as you read it, not after it's already fed a pipeline three steps downstream; see [data contracts and validation](/learn/python-data-apis/data-contracts-and-validation) for a more structured version of that check than an ad hoc `assert`.

- **Don't let "done" tracking outrun the file.** `already_done_ids` is only correct if the file it reads is the same file being written to. If two processes append to the same path concurrently, you can get duplicate `id`s or worse. For a single sequential batch job, append-only-in-one-process is simple and correct — just don't reach for concurrency on the writer without also reaching for a lock (or a queue that funnels everything through one writer).

## Extend it

- **Make the LLM call real.** Replace `call_llm` with an actual client call from [calling LLM APIs in Python](/learn/python-data-apis/calling-llm-apis-in-python), and wrap it with backoff and retry logic from [rate limits and retries](/learn/python-data-apis/rate-limits-and-retries) — a batch of thousands of rows will hit a rate limit far more reliably than any single call does.
- **Go faster.** The loop here is sequential on purpose, so the crash-and-resume behavior is easy to see. Once that's solid, [batching LLM calls for throughput](/learn/python-data-apis/batching-llm-calls-for-throughput) covers running many requests concurrently — the append-one-line-per-result pattern still works, but you'll want a single writer (or a lock) so concurrent tasks don't interleave partial writes.
- **Analyze the results.** JSONL is a great write log for a running job and a mediocre format for analysis once it's done. Load the finished file into a dataframe, or convert it to a columnar format if you're going to query it repeatedly at scale — [Parquet and columnar formats](/learn/python-data-apis/parquet-and-columnar-formats) covers when that trade is worth making.

**Related:** JSON and JSONL files · [Rate limits and retries](/learn/python-data-apis/rate-limits-and-retries) · [Batching LLM calls for throughput](/learn/python-data-apis/batching-llm-calls-for-throughput) · [Data contracts and validation](/learn/python-data-apis/data-contracts-and-validation) · [Parquet and columnar formats](/learn/python-data-apis/parquet-and-columnar-formats)
