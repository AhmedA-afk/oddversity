---
title: "Concurrent API Calls with asyncio"
track: "python-data-apis"
status: live
summary: "A hands-on walkthrough building an async HTTP fetcher with httpx and asyncio.gather, bounding concurrency with a semaphore, adding backoff retries, and measuring the real speedup a"
duration: "16 min read"
---

If you've ever written a `for` loop that calls an API twenty times and watched it crawl, you already know the problem this lesson solves: most of that time isn't your CPU working, it's your program sitting idle waiting for a response. Let's fix that properly — fast, but not so fast you get banned.

## What we're building

A small async fetcher that pulls a list of URLs, compares three strategies head to head, and prints how long each one actually takes:

1. A plain sequential loop (the thing everyone starts with, and the baseline we're beating).
2. A naive "fire everything at once" version using `asyncio.gather` (fast, but reckless).
3. A production-shaped version that bounds concurrency with a semaphore and retries transient failures with backoff.

This is the exact pattern behind pulling hundreds of paginated API pages ([pagination patterns](/learn/python-data-apis/pagination-patterns)) or sending a batch of prompts to an LLM without hammering the endpoint ([batching LLM calls for throughput](/learn/python-data-apis/batching-llm-calls-for-throughput)). Get this one right and both of those become trivial.

## Setup

You need Python 3.9+ (we use the `list[str]` style type hints) and one library:

```bash
python -m venv .venv
source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install httpx
```

If venv is new to you, [Python environments and venv](/learn/python-data-apis/python-environments-and-venv) covers why you isolate projects like this before anything else.

We'll hit `https://httpbin.org/delay/1`, a public test endpoint that deliberately waits about a second before responding — perfect for making concurrency's effect visible without needing a real API key. (If `httpbin.org` is slow or down when you try this, `httpbingo.org` is a drop-in mirror.) When you swap this for a real API later, load your key from an environment variable rather than hardcoding it — see [secrets and config management](/learn/python-data-apis/secrets-and-config-management).

## Build it

### Start with the sequential baseline you're trying to beat

Before optimizing anything, write the boring version. You need a real number to compare against, not a guess.

```python
import time
import httpx

URLS = ["https://httpbin.org/delay/1"] * 20

def fetch_all_sequential(urls: list[str]) -> list[dict]:
    results = []
    with httpx.Client() as client:
        for url in urls:
            response = client.get(url, timeout=10.0)
            results.append({"url": url, "status": response.status_code})
    return results

if __name__ == "__main__":
    start = time.perf_counter()
    fetch_all_sequential(URLS)
    print(f"Sequential: {time.perf_counter() - start:.1f}s")
```

Nothing clever here — `httpx.Client` (no `Async`) blocks on every `.get()` call until the response comes back, then moves to the next one. With 20 requests each taking about a second, this should take roughly 20 seconds. That wasted time is entirely your program doing nothing, waiting on the network — the exact case [async is built for](/learn/python-data-apis/why-async-for-api-calls-intuition).

### Fire every request at once with gather — and see why that's risky

The naive fix: use `httpx.AsyncClient` and let `asyncio.gather` launch every request without waiting for the others.

```python
import asyncio
import httpx

async def fetch_all_naive(urls: list[str]) -> list[dict]:
    async with httpx.AsyncClient() as client:
        tasks = [client.get(url, timeout=10.0) for url in urls]
        responses = await asyncio.gather(*tasks)
        return [{"url": str(r.url), "status": r.status_code} for r in responses]
```

`client.get(url)` returns a coroutine immediately without running it. `asyncio.gather` schedules all of them on the event loop and lets the loop switch between them every time one is waiting on I/O, so all 20 requests are in flight together. Against `/delay/1`, this finishes in about a second instead of twenty — a real win.

But this is the version that gets you rate-limited. Real APIs cap how many concurrent connections (or requests per second) they'll accept from you. Fire 200 requests at once against a service with a limit of 20, and you'll get a wave of `429 Too Many Requests` or dropped connections back — see [rate limits and retries](/learn/python-data-apis/rate-limits-and-retries) for what that looks like from the API's side. You need a way to cap concurrency without going back to one-at-a-time.

### Bound concurrency with a semaphore

An `asyncio.Semaphore(n)` is a counter that only lets `n` coroutines hold it at once. Everything else queues until a slot frees up. That's exactly "at most N requests in flight" — the rate-limit-safe middle ground between the two versions above.

```python
import asyncio
import httpx

async def fetch_one(client: httpx.AsyncClient, url: str, semaphore: asyncio.Semaphore) -> dict:
    async with semaphore:
        response = await client.get(url, timeout=10.0)
    return {"url": url, "status": response.status_code}

async def fetch_all_bounded(urls: list[str], concurrency: int = 5) -> list[dict]:
    semaphore = asyncio.Semaphore(concurrency)
    async with httpx.AsyncClient() as client:
        tasks = [fetch_one(client, url, semaphore) for url in urls]
        return await asyncio.gather(*tasks)
```

All 20 tasks still get created up front and handed to `gather`, but only 5 of them can be inside `async with semaphore:` at the same time. The other 15 sit paused at that line until one finishes and releases its slot. With `concurrency=5` against 20 requests at ~1 second each, expect roughly 4 batches of 5 running in parallel — about 4 seconds total, not 20 and not 1. Pick `concurrency` based on whatever limit the API actually publishes; when it doesn't publish one, start conservative (5–10) and watch for 429s.

### Add retry logic that doesn't hog the semaphore

Individual requests fail — a dropped connection, a timeout, a `503` while the server is busy. You don't want one flaky request to sink the whole batch, and you don't want to retry something that will never succeed (retrying a `404` is just burning time). The fix is to retry only *transient* failures, with a backoff delay so you're not hammering an already-struggling server.

```python
import asyncio
import random
import httpx

MAX_RETRIES = 3
BASE_DELAY = 0.5  # seconds; doubles each retry

class RetryableError(Exception):
    pass

async def fetch_one(client: httpx.AsyncClient, url: str, semaphore: asyncio.Semaphore) -> dict:
    for attempt in range(1, MAX_RETRIES + 1):
        try:
            async with semaphore:
                response = await client.get(url, timeout=10.0)
            if response.status_code == 429 or response.status_code >= 500:
                raise RetryableError(f"retryable status {response.status_code}")
            response.raise_for_status()  # raises for other 4xx codes
            return {"url": url, "status": response.status_code, "ok": True, "attempts": attempt}
        except httpx.HTTPStatusError as exc:
            # a non-429 4xx is a client-side problem (bad URL, bad auth) —
            # retrying it won't change the outcome, so fail immediately
            return {"url": url, "status": exc.response.status_code, "ok": False, "error": "not retryable"}
        except (RetryableError, httpx.TransportError) as exc:
            if attempt == MAX_RETRIES:
                return {"url": url, "status": "failed", "ok": False, "error": str(exc), "attempts": attempt}
            backoff = BASE_DELAY * (2 ** (attempt - 1)) + random.uniform(0, 0.25)
            await asyncio.sleep(backoff)
    return {"url": url, "status": "failed", "ok": False, "error": "exhausted retries"}
```

Two details worth noticing:

- **The semaphore only wraps the actual network call**, not the retry sleep. `async with semaphore:` closes right after `client.get()` returns, so a request that's backing off before its next attempt isn't holding a slot other pending requests could be using. If you wrapped the whole loop (including `asyncio.sleep`) in the semaphore, one struggling request would throttle everyone else's throughput too.
- **`httpx.HTTPStatusError` and the retryable branch are separate `except` clauses.** A `404` fails fast with `ok: False`; a `429` or `503` gets backed off and retried. `httpx.TransportError` already covers connection resets and timeouts, so there's no need to list them separately.

### Put it together and time both versions

Now wire it into one script that runs the sequential baseline and the bounded-concurrent version back to back and prints the difference.

```python
import asyncio
import random
import time
import httpx

URLS = ["https://httpbin.org/delay/1"] * 20
MAX_RETRIES = 3
BASE_DELAY = 0.5

class RetryableError(Exception):
    pass

def fetch_all_sequential(urls: list[str]) -> list[dict]:
    results = []
    with httpx.Client() as client:
        for url in urls:
            response = client.get(url, timeout=10.0)
            results.append({"url": url, "status": response.status_code})
    return results

async def fetch_one(client: httpx.AsyncClient, url: str, semaphore: asyncio.Semaphore) -> dict:
    for attempt in range(1, MAX_RETRIES + 1):
        try:
            async with semaphore:
                response = await client.get(url, timeout=10.0)
            if response.status_code == 429 or response.status_code >= 500:
                raise RetryableError(f"retryable status {response.status_code}")
            response.raise_for_status()
            return {"url": url, "status": response.status_code, "ok": True, "attempts": attempt}
        except httpx.HTTPStatusError as exc:
            return {"url": url, "status": exc.response.status_code, "ok": False, "error": "not retryable"}
        except (RetryableError, httpx.TransportError) as exc:
            if attempt == MAX_RETRIES:
                return {"url": url, "status": "failed", "ok": False, "error": str(exc), "attempts": attempt}
            backoff = BASE_DELAY * (2 ** (attempt - 1)) + random.uniform(0, 0.25)
            await asyncio.sleep(backoff)
    return {"url": url, "status": "failed", "ok": False, "error": "exhausted retries"}

async def fetch_all_bounded(urls: list[str], concurrency: int = 5) -> list[dict]:
    semaphore = asyncio.Semaphore(concurrency)
    async with httpx.AsyncClient() as client:
        tasks = [fetch_one(client, url, semaphore) for url in urls]
        return await asyncio.gather(*tasks)

def main():
    start = time.perf_counter()
    fetch_all_sequential(URLS)
    print(f"Sequential:            {time.perf_counter() - start:.1f}s")

    start = time.perf_counter()
    asyncio.run(fetch_all_bounded(URLS, concurrency=5))
    print(f"Concurrent (limit=5):  {time.perf_counter() - start:.1f}s")

if __name__ == "__main__":
    main()
```

Save that as `fetch_demo.py` and run it with `python fetch_demo.py`.

## Run it

Here's the arithmetic to expect, not a measured benchmark: 20 requests against `/delay/1`, one at a time, is about 20 x 1s = ~20 seconds for the sequential loop, plus whatever your connection setup and DNS lookups add on top. The bounded version runs 5 at a time, so 20 requests take about ceil(20 / 5) = 4 batches, each gated by the ~1 second server delay — call it ~4-5 seconds including overhead. That's roughly a 4-5x speedup from the semaphore alone, before you even push `concurrency` higher. Your actual numbers will depend on your network and how busy `httpbin.org` is at that moment — run it twice and compare, don't trust a single run.

If you inspect the returned list, each entry looks like:

```python
{"url": "https://httpbin.org/delay/1", "status": 200, "ok": True, "attempts": 1}
```

`attempts` tells you whether a request succeeded on the first try or needed a retry — worth logging in a real pipeline so you can see if your `concurrency` is set too aggressively for the API you're calling.

## Harden it

A few things the demo above glosses over that matter once real APIs are involved:

**A single unhandled exception in `gather` kills the whole batch.** Because every path through `fetch_one` returns a dict instead of raising, `asyncio.gather` never sees an exception here — but if you ever call `client.get()` directly inside `gather` without a try/except, one connection error cancels every other in-flight task. Pass `return_exceptions=True` if you want partial failures to come back as exception objects in the results list instead:

```python
results = await asyncio.gather(*tasks, return_exceptions=True)
failures = [r for r in results if isinstance(r, Exception)]
```

**Respect `Retry-After` when a server gives you one.** Fixed exponential backoff is a reasonable default, but a `429` response often includes a `Retry-After` header telling you exactly how long to wait — use it when present instead of guessing:

```python
if response.status_code == 429 and "retry-after" in response.headers:
    wait = float(response.headers["retry-after"])
else:
    wait = BASE_DELAY * (2 ** (attempt - 1))
```

**One semaphore per host, not one global semaphore, if you're calling multiple APIs.** A single `Semaphore(5)` shared across requests to two different services means a slow endpoint on service A steals slots that service B's requests could be using. Keep a `dict[str, asyncio.Semaphore]` keyed by hostname instead.

**Don't trust the response body just because the status code was 200.** A successful HTTP status doesn't mean the JSON inside is shaped the way you expect. Once you're pulling data out of these responses at scale, validate it — see [parsing and validating API responses](/learn/python-data-apis/parsing-and-validating-api-responses) and [data contracts and validation](/learn/python-data-apis/data-contracts-and-validation) for patterns that catch a malformed payload before it corrupts a downstream pipeline.

**Set an overall deadline, not just a per-request timeout.** `timeout=10.0` bounds one request, but a pathological case (a slot that never frees up, a retry loop against a server that's always briefly failing) can still run long. Wrap the whole batch in `asyncio.wait_for(fetch_all_bounded(urls, concurrency), timeout=120)` if you need a hard ceiling on total run time.

## Extend it

A few directions worth exploring once this pattern feels natural:

- **Stream results as they finish** with `asyncio.as_completed` instead of `gather`, so you can write each result to disk or update a progress bar the moment it's ready, rather than waiting for the slowest of the batch.
- **Use `asyncio.TaskGroup`** (Python 3.11+) instead of `gather` for structured concurrency — if one task raises an unhandled exception, the group cancels the rest automatically, which is often what you actually want instead of a batch that limps along with silent failures.
- **Make concurrency adaptive.** Start at a modest limit, and if you see a run of 429s, shrink the semaphore's effective size for a while before ramping back up — a crude but effective self-throttle.
- **Apply this exact shape to LLM calls.** Swap `client.get(url)` for a call to your model provider's completions endpoint and you have the backbone of a batch-prompting pipeline — see [batching LLM calls for throughput](/learn/python-data-apis/batching-llm-calls-for-throughput) for the parts specific to token limits and provider-side concurrency caps, and [calling LLM APIs in Python](/learn/python-data-apis/calling-llm-apis-in-python) if you haven't made a single async call to a model yet.

**Related:** [Why async for API calls (intuition)](/learn/python-data-apis/why-async-for-api-calls-intuition) · [Async Python for I/O](/learn/python-data-apis/async-python-for-io) · [Rate limits and retries](/learn/python-data-apis/rate-limits-and-retries) · [Pagination patterns](/learn/python-data-apis/pagination-patterns) · [Batching LLM calls for throughput](/learn/python-data-apis/batching-llm-calls-for-throughput) · [Async & batching quiz](/learn/python-data-apis/async-and-batching-quiz)
