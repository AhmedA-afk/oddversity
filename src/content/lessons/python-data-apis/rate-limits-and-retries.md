---
title: "Rate Limits, Backoff, and Retries"
track: "python-data-apis"
status: live
summary: "Implementation walkthrough teaching readers to read a 429's Retry-After header and build both a hand-rolled and tenacity-based exponential-backoff-with-jitter retry client — retryi"
duration: "7 min read"
---

You fire off twenty calls in a loop, and call number twelve comes back with a `429`. If your code treats that like any other failure, you'll raise an exception, log a scary traceback, and drop a request that the server was always going to accept — just not yet. This lesson builds a client that reads the rejection correctly and waits, instead of panicking.

## What we're building

A tiny "flaky API" running locally (no API key needed, fully deterministic) that rejects the first couple of calls with `429 Too Many Requests` and a `Retry-After` header, then succeeds. Against it you'll build two clients that do the same job:

1. A hand-rolled retry loop with exponential backoff and jitter, so you understand exactly what's happening.
2. The same behavior with `tenacity`, a retry library, including a custom wait strategy that honors `Retry-After` when the server gives you one.

Both versions will retry `429` and `503` but fail immediately on `400` — because retrying a malformed request just gets you the same rejection, slower.

## Setup (deps/env)

Work inside a project virtual environment — see [Python environments and venv](/learn/python-data-apis/python-environments-and-venv) if you haven't set one up yet — then install the two libraries this lesson uses:

```bash
python -m venv .venv
source .venv/bin/activate          # .venv\Scripts\activate on Windows
pip install requests tenacity
```

No `.env` file or real API key is required for this lesson — the mock server stands in for the remote API so the retry behavior is reproducible. When you point this pattern at a real provider later, load your key the way [Secrets and config management](/learn/python-data-apis/secrets-and-config-management) describes, and see [Calling REST APIs with Python](/learn/python-data-apis/calling-rest-apis-with-python) for the request basics this lesson builds on.

## Build it

### Stand up a flaky server to retry against

Real rate-limited APIs are hard to demo reliably — the whole point of a `429` is that it *shouldn't* keep happening. So build a local one that misbehaves on purpose, using nothing but the standard library:

```python
# mock_server.py
import threading
from http.server import BaseHTTPRequestHandler, HTTPServer

request_count = {"n": 0}


class FlakyHandler(BaseHTTPRequestHandler):
    def do_GET(self):
        if self.path == "/bad-request":
            self.send_response(400)
            self.send_header("Content-Type", "application/json")
            self.end_headers()
            self.wfile.write(b'{"error": "missing required field: symbol"}')
            return

        request_count["n"] += 1
        n = request_count["n"]

        if n <= 2:
            self.send_response(429)
            self.send_header("Retry-After", "1")
            self.send_header("Content-Type", "application/json")
            self.end_headers()
            self.wfile.write(b'{"error": "rate limited"}')
        else:
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.end_headers()
            self.wfile.write(b'{"symbol": "ACME", "price": 42.17}')

    def log_message(self, format, *args):
        pass  # silence default request logging


def start_server(port=8000):
    server = HTTPServer(("localhost", port), FlakyHandler)
    thread = threading.Thread(target=server.serve_forever, daemon=True)
    thread.start()
    return server
```

`/quote` rejects the first two calls, then succeeds. `/bad-request` always returns `400`. That's the whole test bed: one endpoint that's *transiently* broken, one that's *permanently* wrong.

### Read a 429 the way the server means it

Before writing any retry logic, look at what actually comes back:

```python
import requests
from mock_server import start_server

start_server()
resp = requests.get("http://localhost:8000/quote")

print(resp.status_code)                    # 429
print(resp.headers.get("Retry-After"))     # "1"
print(resp.json())                         # {'error': 'rate limited'}
```

`Retry-After` is the server telling you, explicitly, how long to back off — either as an integer number of seconds (`"1"`, `"120"`) or as an HTTP-date (`"Wed, 21 Oct 2026 07:28:00 GMT"`). Real APIs use both forms, so parse defensively:

```python
from datetime import datetime, timezone
from email.utils import parsedate_to_datetime


def parse_retry_after(value):
    """Retry-After is either an integer number of seconds or an HTTP-date.
    Returns seconds to wait, or None if the header is missing/unparseable."""
    if value is None:
        return None
    value = value.strip()
    if value.isdigit():
        return float(value)
    try:
        target = parsedate_to_datetime(value)
        if target.tzinfo is None:
            target = target.replace(tzinfo=timezone.utc)
        return max((target - datetime.now(timezone.utc)).total_seconds(), 0.0)
    except (TypeError, ValueError):
        return None
```

When this returns a number, that's your wait time — full stop, no need to guess.

### Write the backoff-with-jitter loop by hand

When `Retry-After` is missing (plenty of `503`s don't include it), you fall back to exponential backoff: double the wait after each failure, capped at some ceiling. Pure exponential backoff has a problem, though — if ten clients all get rate-limited at the same moment, they all retry at the same moment too, and you get a second wave of `429`s. **Jitter** — adding randomness to the wait — spreads retries out so that doesn't happen:

```python
import random
import time

RETRYABLE_STATUS = {429, 500, 502, 503, 504}


class GaveUp(Exception):
    """Raised when we exhaust every retry attempt without success."""


def call_with_backoff(url, max_attempts=5, base_delay=0.5, max_delay=20.0):
    for attempt in range(1, max_attempts + 1):
        resp = requests.get(url, timeout=5)

        if resp.status_code < 400:
            return resp

        if resp.status_code not in RETRYABLE_STATUS:
            # 400/401/403/404/422... the request itself is wrong.
            # Retrying won't fix a malformed request, so fail fast.
            resp.raise_for_status()

        if attempt == max_attempts:
            raise GaveUp(
                f"gave up after {attempt} attempts, last status {resp.status_code}"
            )

        retry_after = parse_retry_after(resp.headers.get("Retry-After"))
        if retry_after is not None:
            delay = retry_after  # the server told us exactly how long, honor it
        else:
            exp = min(base_delay * (2 ** (attempt - 1)), max_delay)
            delay = random.uniform(0, exp)  # "full jitter": random point in [0, exp]

        print(f"  attempt {attempt} -> {resp.status_code}, sleeping {delay:.2f}s")
        time.sleep(delay)

    raise GaveUp(f"max_attempts={max_attempts} must be at least 1")
```

Two decisions worth noticing, because it's easy to get both wrong:

- **`raise_for_status()` runs for non-retryable codes before any sleep happens.** A `400` exits the function on attempt one — it never reaches the backoff math. That's the "why you retry 429/503 but not 400" rule, enforced in code, not just in a comment.
- **Jitter is applied to the *computed* exponential delay, not to `Retry-After`.** If the server says "wait 1 second," randomizing that down to 0.2 seconds defeats the point — the server is telling you when its rate-limit window resets, not offering a suggestion.

### Cap total attempts, not just delay

`max_attempts` in the loop above is your ceiling on how many times you'll knock before giving up — without it, a persistently broken endpoint turns into an infinite loop that looks like a hang. Five is a reasonable default for interactive code; a background batch job might allow more, paired with a wall-clock budget (more on that in **Harden it**).

### Do the same thing with tenacity

The hand-rolled loop is maybe 25 lines, which is fine for one function. Once you have API calls in ten different places, `tenacity` turns each of those into one decorator instead of one duplicated loop:

```python
import logging

import requests
from tenacity import (
    before_sleep_log,
    retry,
    retry_if_exception,
    stop_after_attempt,
    wait_exponential_jitter,
)

logging.basicConfig(level=logging.INFO, format="  %(message)s")
logger = logging.getLogger("api-client")


class RateLimited(Exception):
    def __init__(self, retry_after):
        self.retry_after = retry_after
        super().__init__(f"rate limited, retry_after={retry_after}")


class ServerError(Exception):
    pass


def is_transient(exc: BaseException) -> bool:
    return isinstance(
        exc,
        (RateLimited, ServerError, requests.ConnectionError, requests.Timeout),
    )


def wait_respecting_retry_after(fallback):
    """Use the server's Retry-After value when we have one; otherwise fall
    back to the given wait strategy (e.g. exponential backoff with jitter)."""

    def wait(retry_state):
        exc = retry_state.outcome.exception()
        if isinstance(exc, RateLimited) and exc.retry_after is not None:
            return exc.retry_after
        return fallback(retry_state)

    return wait


@retry(
    retry=retry_if_exception(is_transient),
    wait=wait_respecting_retry_after(wait_exponential_jitter(initial=0.5, max=20)),
    stop=stop_after_attempt(5),
    before_sleep=before_sleep_log(logger, logging.INFO),
    reraise=True,
)
def get_quote(url):
    resp = requests.get(url, timeout=5)

    if resp.status_code == 429:
        raise RateLimited(parse_retry_after(resp.headers.get("Retry-After")))
    if resp.status_code in {500, 502, 503, 504}:
        raise ServerError(f"server returned {resp.status_code}")

    resp.raise_for_status()  # 400/401/404/... -> raised, NOT retried
    return resp.json()
```

Same rules as the hand-rolled version, expressed declaratively: `retry_if_exception(is_transient)` only retries the exceptions you've marked transient; `wait_respecting_retry_after` prefers the server's own number and falls back to jittered exponential backoff; `stop_after_attempt(5)` is the attempt cap; `reraise=True` means that when attempts run out, tenacity re-raises the *last real exception* instead of wrapping it in its own `RetryError` — so your calling code's `except RateLimited` still works whether tenacity retried zero times or four.

Notice `resp.raise_for_status()` for a `400` raises `requests.HTTPError`, which `is_transient` doesn't match — so `retry_if_exception` never retries it. Same guarantee as the manual loop, enforced by what you chose to catch.

## Run it

Running the hand-rolled version against the mock server:

```python
if __name__ == "__main__":
    start_server()

    print("calling /quote (rate-limited twice, then succeeds):")
    resp = call_with_backoff("http://localhost:8000/quote")
    print("  final result:", resp.status_code, resp.json())

    print("\ncalling /bad-request (should fail immediately, no retries):")
    try:
        call_with_backoff("http://localhost:8000/bad-request")
    except requests.HTTPError as e:
        print("  raised immediately:", e)
```

produces output like:

```text
calling /quote (rate-limited twice, then succeeds):
  attempt 1 -> 429, sleeping 1.00s
  attempt 2 -> 429, sleeping 1.00s
  final result: 200 {'symbol': 'ACME', 'price': 42.17}

calling /bad-request (should fail immediately, no retries):
  raised immediately: 400 Client Error: Bad Request for url: http://localhost:8000/bad-request
```

Both sleeps show `1.00s` here because the mock always sends `Retry-After: 1` — that's the server's exact number being honored, not backoff math. Point the same code at an endpoint that returns `503` with no `Retry-After` header and you'd see the exponential-with-jitter branch instead: something like `sleeping 0.31s` on attempt one, a wider and growing range on each attempt after.

The tenacity version, run the same way, logs each retry through `before_sleep_log` before producing the identical final result:

```text
Retrying __main__.get_quote in 1 seconds as it raised RateLimited: rate limited, retry_after=1.0.
Retrying __main__.get_quote in 1 seconds as it raised RateLimited: rate limited, retry_after=1.0.
calling /quote via tenacity (rate-limited twice, then succeeds):
  final result: {'symbol': 'ACME', 'price': 42.17}
```

Same two calls into `/bad-request` raise `requests.HTTPError` on the first attempt in both versions — no sleeping, no retry log lines. That's the behavior this whole lesson is really about: two failure shapes, two different responses, decided automatically by status code.

## Harden it

A retry loop that only handles the happy path of "429 then 200" isn't ready for a real API. Before you trust this in production code, close these gaps:

- **Retry network failures too, not just bad status codes.** A `ConnectionError` or `Timeout` from `requests` means you never got a response at all — that's exactly as transient as a `503`. The tenacity `is_transient` check above already includes both; if you're hand-rolling, wrap the `requests.get()` call in a `try/except` and route those exceptions into the same retry path.
- **Cap wall-clock time, not just attempt count.** `stop_after_attempt(5)` with a `Retry-After: 300` response means your process could sit through four ~5-minute waits — roughly 20 minutes — doing nothing useful. Combine stop conditions so whichever limit hits first wins:
  ```python
  from tenacity import stop_after_attempt, stop_after_delay

  stop = stop_after_attempt(8) | stop_after_delay(30)  # 8 tries OR 30 seconds, whichever first
  ```
- **Never blindly retry a non-idempotent write.** Retrying a `GET` is free — you're just asking again. Retrying a `POST` that charges a card or creates a record can create it twice if your first attempt actually succeeded server-side but the response got lost. Real payment and LLM APIs solve this with an idempotency key (a client-generated ID sent with the request so the server can recognize and dedupe a retried write) — check whether the API you're calling supports one before you wrap `POST` calls in a retry decorator.
- **Distinguish `429` from `503` in what you log, even though you retry both.** A `429` means *you're* calling too fast — it's a signal to slow your own request rate. A `503` usually means the *server* is struggling, independent of anything you're doing. Logging them identically as "transient error" buries a signal you'll want later when you're deciding whether to add a client-side rate limiter.
- **Validate the body before you trust it, even on a 200.** A rate-limited response with a JSON body still needs the same scrutiny as any other API payload — see [Parsing and validating API responses](/learn/python-data-apis/parsing-and-validating-api-responses) and [Data contracts and validation](/learn/python-data-apis/data-contracts-and-validation) for that step, which sits right after this one in a real client.
- **Test against a mock, not the real API.** Hammering a live rate limiter to verify your retry logic works is slow, occasionally gets your key throttled for real, and isn't reproducible. The `mock_server.py` pattern above — a handler that counts requests and changes behavior by count — is the general technique; reuse it for any "fails N times then succeeds" test case.

## Extend it

- **A circuit breaker for when retrying stops helping.** If an endpoint has failed on every attempt for the last minute, retrying each new call individually just adds load to an already-struggling service. A circuit breaker tracks recent failure rate and, once it crosses a threshold, stops calling out entirely for a cooldown window — failing fast instead of queuing up more retries. Worth knowing the name even if you don't implement one today.
- **Fan-out without triggering the rate limit in the first place.** Retrying after a `429` treats the symptom; a semaphore that caps how many requests you have in flight at once prevents it. See [Concurrent API calls with asyncio](/learn/python-data-apis/concurrent-api-calls-with-asyncio) and [Batching LLM calls for throughput](/learn/python-data-apis/batching-llm-calls-for-throughput) for the async side of this — tenacity's `@retry` decorator works on `async def` functions too, using `asyncio.sleep` under the hood instead of blocking `time.sleep`.
- **Rate limits show up mid-pagination, not just on single calls.** Pulling ten thousand records across a hundred paged requests hits the same `429` risk on request forty-seven — see [Pagination patterns](/learn/python-data-apis/pagination-patterns) for combining the two.
- **LLM SDKs often retry for you already.** The official Anthropic and OpenAI Python clients retry `429` and `5xx` internally with a configurable `max_retries`, so check what's built in before layering your own decorator on top — see [Calling LLM APIs in Python](/learn/python-data-apis/calling-llm-apis-in-python). You'll still want your own logic on top for things the SDK doesn't know about: a cost ceiling for the batch you're running, structured logging tied to your own request IDs, or a stricter attempt cap for a user-facing call than for an overnight job.

**Related:** [Calling REST APIs with Python](/learn/python-data-apis/calling-rest-apis-with-python) · [Calling LLM APIs in Python](/learn/python-data-apis/calling-llm-apis-in-python) · [Pagination patterns](/learn/python-data-apis/pagination-patterns) · [Parsing and validating API responses](/learn/python-data-apis/parsing-and-validating-api-responses) · [Concurrent API calls with asyncio](/learn/python-data-apis/concurrent-api-calls-with-asyncio) · [API-calling common mistakes](/learn/python-data-apis/api-calling-common-mistakes)
