---
title: "Comprehensions and Generators for Transforms"
track: "python-data-apis"
status: live
summary: "Implementation-walkthrough lesson: refactor a manual loop over ticket dicts into list/dict comprehensions for transform+filter+re-key, then write a generator that streams a huge JS"
duration: "2 min read"
---

Every for-loop that builds up a list one `.append()` at a time is doing the same three things: pull an item, maybe transform it, maybe keep it. Comprehensions say that in one line; generators say it without ever holding more than one item in memory at a time. You'll build both against a realistic batch of support tickets, then scale the same idea up to a file too big to load whole.

## What we're building

You have a list of ticket dicts pulled from a support system — messy status casing, some missing assignees, nested tag lists. You'll:

1. Replace a manual loop with a **list comprehension** that transforms and filters in one pass.
2. **Re-key** the results into a dict with a **dict comprehension**, both for O(1) lookup by ID and to reshape the records into a different public shape.
3. Then scale up: instead of six tickets, imagine a nightly export with hundreds of thousands of lines. You'll write a **generator** that streams it one record at a time, contrast it against the version that loads everything into a list, and measure the memory difference yourself with `tracemalloc`.

By the end you'll know not just the syntax, but when a comprehension is the wrong tool and a generator is the right one — and a real gotcha involving `with` blocks that catches people the first time they write a streaming generator.

## Setup

Everything here is Python standard library — `json`, `itertools`, `tracemalloc`, `random`. No installs needed. If you don't already have an isolated environment for this track, set one up per [Python environments and venv](/learn/python-data-apis/python-environments-and-venv) — it takes two minutes and keeps this experiment from touching anything else on your machine.

```bash
python3 -m venv .venv
source .venv/bin/activate   # on Windows: .venv\Scripts\activate
python3 --version           # 3.8+ is fine; examples below assume 3.8+
```

Put the code below in a file called `tickets.py` and run it with `python3 tickets.py` as you go — every snippet in **Build it** is meant to run, not just be read.

## Build it

### Start with messy, real-looking ticket data

Real exports are never clean. Statuses come back in inconsistent casing, some fields are `None`, nested lists show up where you'd like a flat value. That messiness is the whole reason you reach for comprehensions instead of trusting the data to already be in the shape you want.

```python
tickets = [
    {"id": 101, "subject": "Login button unresponsive", "status": "Open",
     "priority": "high", "created_at": "2026-08-01", "assignee": "priya",
     "tags": ["bug", "auth"]},
    {"id": 102, "subject": "Add dark mode", "status": "Backlog",
     "priority": "low", "created_at": "2026-07-15", "assignee": None,
     "tags": ["feature", "ui"]},
    {"id": 103, "subject": "Checkout 500 error", "status": "OPEN",
     "priority": "high", "created_at": "2026-08-20", "assignee": "marcus",
     "tags": ["bug", "payments"]},
    {"id": 104, "subject": "Slow dashboard load", "status": "In Progress",
     "priority": "medium", "created_at": "2026-08-10", "assignee": "priya",
     "tags": ["perf"]},
    {"id": 105, "subject": "Typo on pricing page", "status": "Closed",
     "priority": "low", "created_at": "2026-06-30", "assignee": "marcus",
     "tags": ["docs"]},
    {"id": 106, "subject": "API rate limit too low", "status": "open",
     "priority": "high", "created_at": "2026-08-25", "assignee": None,
     "tags": ["api", "bug"]},
]
```

Each ticket is a plain dict — no classes, no ORM. If you haven't spent much time with lists of dicts as your default data shape yet, [lists, dicts, and sets](/learn/python-data-apis/lists-dicts-sets-intuition) is worth a detour before continuing; everything below is built on that one structure.

### The manual loop you're replacing

Here's the version most people write first: normalize the status, keep only urgent open tickets, default a missing assignee.

```python
open_high_priority = []
for t in tickets:
    status = t["status"].lower()
    if status in ("open", "in progress") and t["priority"] == "high":
        open_high_priority.append({
            "id": t["id"],
            "subject": t["subject"],
            "status": status,
            "priority": t["priority"],
            "assignee": t["assignee"] or "unassigned",
        })
```

Nothing wrong with this — it's correct and readable. The problem is it takes four lines to say "build a new list from an old one, transforming and filtering as you go," and that pattern shows up constantly enough that Python gives it dedicated syntax.

### Transform and filter in one list comprehension

```python
open_high_priority = [
    {
        "id": t["id"],
        "subject": t["subject"],
        "status": t["status"].lower(),
        "priority": t["priority"],
        "assignee": t["assignee"] or "unassigned",
    }
    for t in tickets
    if t["status"].lower() in ("open", "in progress") and t["priority"] == "high"
]
```

Read it right to left, bottom to top: iterate `tickets`, keep only the ones matching the `if`, and for each survivor, build the dict on the left. It's the exact same four operations as the loop — same result, same order — just laid out as an expression instead of statements. Run it against the sample data and you get three tickets back: 101, 103, and 106 (104 is filtered out because it's medium priority, not high). That's the pattern to internalize: **a list comprehension is a for-loop where the body is always "produce one value," nothing else.** The moment your loop body does something other than build up a list — logging, mutating an external counter, branching into different collections — stop reaching for a comprehension and write the loop.

### Re-key into a dict for O(1) lookups

A list is fine for iterating, but if you're going to look tickets up by ID repeatedly — in a webhook handler, in a template, in another loop — scanning the list each time is wasteful. A dict comprehension turns the list into a lookup table in one line:

```python
tickets_by_id = {t["id"]: t for t in tickets}

tickets_by_id[103]["subject"]
# 'Checkout 500 error'
```

The shape is `{key_expr: value_expr for item in iterable}` — same mental model as a list comprehension, just producing key-value pairs instead of single values.

That's "re-keying" in the loose sense of *indexing by a field*. The other sense — renaming and reshaping fields, like turning internal snake_case into a public API shape — is just as natural in the same syntax:

```python
api_tickets = {
    t["id"]: {
        "ticket_id": t["id"],
        "subject": t["subject"],
        "status": t["status"].lower(),
        "is_urgent": t["priority"] == "high",
    }
    for t in tickets
}
```

Now `api_tickets[101]` gives you `{"ticket_id": 101, "subject": "Login button unresponsive", "status": "open", "is_urgent": True}` — a completely different field set from the source dict, built in the same expression that did the keying. This is the pattern you reach for constantly when [turning messy data into model inputs](/learn/python-data-apis/turning-messy-data-into-model-inputs): the source shape and the shape a downstream consumer needs are rarely the same, and a dict comprehension is usually enough to bridge them without a helper class.

### Flatten nested fields with a set comprehension (bonus)

Comprehensions nest naturally when a field itself contains a collection. Each ticket has a `tags` list; if you want every distinct tag across all tickets, you iterate twice in one expression:

```python
all_tags = {tag for t in tickets for tag in t["tags"]}
# {'api', 'auth', 'bug', 'docs', 'feature', 'payments', 'perf', 'ui'}
```

Read the two `for` clauses left to right, same order you'd nest the loops: outer loop over tickets, inner loop over each ticket's tags. Using `{}` instead of `[]` makes it a **set** comprehension, which is exactly what you want here since duplicates (both 101 and 106 have `"bug"`) should collapse to one entry. This same nested shape is the first thing you reach for once ticket data starts looking like real [nested JSON](/learn/python-data-apis/nested-json-in-memory) instead of flat dicts — comments-per-ticket, sub-tasks, activity logs.

### Scale up: streaming a huge JSONL export

Six tickets fit in memory without a second thought. But suppose the support system exports full ticket history nightly as newline-delimited JSON — one ticket object per line, and after a year of tickets that file is hundreds of thousands of lines, maybe gigabytes. [JSONL](/learn/python-data-apis/json-and-jsonl-files) is the standard shape for exactly this: unlike a single JSON array, you don't have to parse the whole file to read one record, because each line is independently valid JSON.

Generate a sample file to work against:

```python
import json
import random

def generate_sample_export(path, n=50_000):
    statuses = ["open", "in progress", "closed", "backlog"]
    priorities = ["low", "medium", "high"]
    with open(path, "w") as f:
        for i in range(n):
            record = {
                "id": i,
                "subject": f"Ticket {i}",
                "status": random.choice(statuses),
                "priority": random.choice(priorities),
                "created_at": "2026-08-01",
            }
            f.write(json.dumps(record) + "\n")

generate_sample_export("tickets_export.jsonl")
```

### The list-building way (and why it doesn't scale)

The obvious approach: read every line, parse it, collect the results.

```python
def load_all_tickets(path):
    with open(path) as f:
        return [json.loads(line) for line in f]

all_tickets = load_all_tickets("tickets_export.jsonl")
high_count = sum(1 for t in all_tickets if t["priority"] == "high")
```

This *is* a list comprehension, and there's nothing syntactically wrong with it. The problem is semantic: `load_all_tickets` parses all 50,000 records and holds every single one in memory simultaneously, just so you can compute a single number afterward. Double the export size and this function's memory footprint roughly doubles with it. At some point — a few million rows, or a machine with limited RAM — this stops being a style choice and starts being a crash.

### The generator way: one ticket in memory at a time

A generator function produces values lazily — one at a time, on demand — instead of building a collection up front. Swap `return [...]` for a loop with `yield`:

```python
def stream_tickets(path):
    with open(path) as f:
        for line in f:
            line = line.strip()
            if not line:
                continue
            yield json.loads(line)

high_count = sum(1 for t in stream_tickets("tickets_export.jsonl") if t["priority"] == "high")
```

Same result — against a sample file it counts roughly a third of the 50,000 tickets as high-priority — about what you'd expect from three priorities chosen uniformly at random. But the mechanics are completely different. Calling `stream_tickets(path)` doesn't read a single byte — it returns a generator object immediately. Only when `sum(...)` asks for the next value does execution jump into the function, read one line, parse it, and `yield` it back, then pause exactly there. At any instant, there's one open file handle, one parsed dict, and the running total — that's it. It doesn't matter if the file has 50,000 lines or 50 million; the peak memory is the same.

`sum(1 for t in stream_tickets(...) if ...)` is a **generator expression** consuming a **generator function** — two related but distinct things worth telling apart. `stream_tickets` is a function you define with `yield` in its body; calling it produces a generator object. `(1 for t in ... if ...)` is an expression, syntactically a comprehension with parentheses instead of brackets, that also produces a generator object without you writing a function at all. Use a generator expression for a single lazy transform-and-filter; use a generator function (like `stream_tickets`) when you need setup logic — like opening a file — wrapped around the yielding.

### Measure it yourself with tracemalloc

Don't take "memory stays flat" on faith — the standard library ships a memory profiler:

```python
import tracemalloc

tracemalloc.start()
_ = load_all_tickets("tickets_export.jsonl")
_, peak = tracemalloc.get_traced_memory()
print(f"list version peak: {peak / 1_000_000:.2f} MB")
tracemalloc.stop()

tracemalloc.start()
_ = sum(1 for t in stream_tickets("tickets_export.jsonl") if t["priority"] == "high")
_, peak = tracemalloc.get_traced_memory()
print(f"generator version peak: {peak / 1_000_000:.2f} MB")
tracemalloc.stop()
```

On one run against the 50,000-line sample file, this printed a list-version peak around 33 MB and a generator-version peak around 0.02 MB — three orders of magnitude apart, for computing the exact same number. Your numbers will differ by machine and Python version, and they'll scale with `n` if you regenerate the file bigger — that's the experiment worth running yourself: bump `n` to `500_000`, rerun, and watch the list version's peak grow roughly proportionally while the generator version barely moves.

## Run it

Running the full script top to bottom against the sample data above should show you:

- `open_high_priority` — a list of exactly 3 dicts (tickets 101, 103, 106), each with a lowercased `status` and `assignee` defaulted to `"unassigned"` where it was `None`.
- `tickets_by_id` — a 6-entry dict keyed by ticket ID, letting `tickets_by_id[103]` resolve instantly instead of scanning.
- `api_tickets` — the same 6 tickets reshaped into a different field set (`ticket_id`, `is_urgent`) suitable for handing to an external consumer.
- `all_tags` — an 8-element set (`bug` and the others deduplicated across tickets).
- Against the generated JSONL file, `load_all_tickets` and `stream_tickets` produce the **same count** of high-priority tickets — the point isn't a different answer, it's the same answer computed with a different, and dramatically smaller, memory footprint.

If any count comes out different, check that you copied the `if` condition on the comprehension exactly — a stray `and`/`or`, or forgetting to `.lower()` the status before comparing, is the most common way to silently drop or keep the wrong tickets.

## Harden it

**Missing keys, not just `None` values.** The sample tickets always have an `"assignee"` key, even when its value is `None`. Real exports drop keys entirely for optional fields. `t["assignee"]` raises `KeyError` the moment a ticket lacks the key; `t.get("assignee")` returns `None` safely, and `t.get("assignee") or "unassigned"` gives you the same default either way:

```python
assignee = t.get("assignee") or "unassigned"
```

This is the same class of problem [data contracts and validation](/learn/python-data-apis/data-contracts-and-validation) covers more formally — decide up front whether missing fields are an error or a default, and don't let a comprehension's terseness hide that decision.

**Malformed lines break `json.loads`, and comprehensions can't `try`/`except`.** A generator expression has no way to catch an exception mid-iteration — one corrupt line and the whole thing dies. A generator *function* can, because it's ordinary Python with a loop body:

```python
def stream_tickets(path):
    with open(path) as f:
        for lineno, line in enumerate(f, start=1):
            line = line.strip()
            if not line:
                continue
            try:
                yield json.loads(line)
            except json.JSONDecodeError:
                print(f"skipping malformed line {lineno}")
                continue
```

This is the practical reason to reach for a generator function instead of a one-line generator expression once your input is a real file instead of an in-memory list — you need somewhere to put the error handling.

**Dict comprehensions silently drop duplicates — last one wins, no error.** If two tickets share an ID (a re-export, a merge bug upstream), `{t["id"]: t for t in tickets}` won't complain; it just keeps whichever one it saw last:

```python
tickets_with_dupe = tickets + [{"id": 101, "subject": "Duplicate entry", "status": "open",
                                 "priority": "high", "assignee": "priya", "tags": []}]
tickets_by_id = {t["id"]: t for t in tickets_with_dupe}

len(tickets_with_dupe), len(tickets_by_id)
# (7, 6)  — one ticket vanished, silently
```

If duplicate IDs would be a data bug worth knowing about, check `len(source_list) != len(result_dict)` right after building it, before you trust the dict as your source of truth.

**A generator can only be walked once.** Unlike a list, once you've consumed a generator, it's empty — calling it again doesn't rewind it, because there's nothing to rewind; the function already ran off the end.

```python
counts = stream_tickets("tickets_export.jsonl")
total = sum(1 for _ in counts)                              # exhausts it: 50000
high = sum(1 for t in counts if t["priority"] == "high")    # 0 — nothing left to iterate
```

The fix is to call `stream_tickets(path)` again — each call returns a brand-new generator object that starts the file from line one. If you genuinely need two passes over the same data without re-reading the file twice, that's a sign you actually want a list (or to compute both aggregates in a single pass with two accumulators).

> A `with` block inside a generator *function* stays open across every `yield` — because the function's execution is literally paused mid-body between calls, still inside the block. But a generator *expression* built inside a `with` and returned from a plain function does not get that protection:
> ```python
> def bad_stream_tickets(path):
>     with open(path) as f:
>         return (json.loads(line) for line in f if line.strip())
>
> gen = bad_stream_tickets("tickets_export.jsonl")
> next(gen)
> # ValueError: I/O operation on closed file.
> ```
> The `with` block exits — closing the file — the instant `bad_stream_tickets` returns, because a normal function's body runs to completion before returning. The generator expression hasn't consumed anything yet at that point, so by the time you call `next()`, it's trying to read from an already-closed file. This is the single most common bug people hit the first time they write a streaming generator — the fix is exactly the `yield`-based `stream_tickets` above, where the function itself never runs to completion until the generator is exhausted.

## Extend it

Generators chain. Once `stream_tickets` gives you one ticket at a time, you can stack lazy transforms on top without ever materializing an intermediate list:

```python
urgent = (t for t in stream_tickets("tickets_export.jsonl") if t["priority"] == "high")
subjects = (t["subject"] for t in urgent)

for subject in subjects:
    ...  # still one ticket in memory at a time, all the way through
```

Each stage only pulls from the one before it when asked — the whole pipeline stays as flat, memory-wise, as the single-generator version.

This same "yield one thing, not the whole collection" shape reappears the moment you're pulling from a network source instead of a file — an API that hands back results a page at a time follows the identical pattern, which is why [pagination patterns](/learn/python-data-apis/pagination-patterns) reads like a rerun of this lesson with HTTP requests standing in for file lines.

It also composes directly with batching. If the next step in your pipeline is sending tickets to an LLM for classification, you rarely want to call the API once per ticket or once for all 50,000 — you want fixed-size batches, streamed:

```python
from itertools import islice

def batched(iterable, size):
    it = iter(iterable)
    while batch := list(islice(it, size)):
        yield batch

for batch in batched(stream_tickets("tickets_export.jsonl"), 500):
    ...  # send this batch of 500 to an API call
```

That's the same generator discipline feeding directly into [batching LLM calls for throughput](/learn/python-data-apis/batching-llm-calls-for-throughput). Once you're chaining generators like this in a real pipeline, it's worth writing a couple of tests around the boundaries — an empty file, a final partial batch, a malformed line — which is exactly what [testing data pipelines](/learn/python-data-apis/testing-data-pipelines) walks through. And if you want to see comprehensions and generators sitting alongside the rest of a real pipeline — files, validation, an API call at the end — [the whole game](/learn/python-data-apis/python-data-pipeline-whole-game) is the next lesson to read.

**Related:** [Lists, dicts, and sets](/learn/python-data-apis/lists-dicts-sets-intuition) · [JSON and JSONL files](/learn/python-data-apis/json-and-jsonl-files) · [Data contracts and validation](/learn/python-data-apis/data-contracts-and-validation) · [Pagination patterns](/learn/python-data-apis/pagination-patterns) · [Batching LLM calls for throughput](/learn/python-data-apis/batching-llm-calls-for-throughput) · [Python data pipeline: the whole game](/learn/python-data-apis/python-data-pipeline-whole-game)
