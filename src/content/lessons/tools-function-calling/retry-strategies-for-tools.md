---
title: "Retry, Back Off, or Give Up"
track: "tools-function-calling"
status: live
summary: "A decision tree for telling transient failures worth retrying apart from deterministic ones that never will succeed."
duration: "6 min read"
---

Retrying is free until it isn't: a timeout that succeeds on attempt two is a good outcome, and a 404 retried five times is five wasted calls that all fail the identical way.

## What it is

Every retry decision comes down to one question: **will trying again, with nothing changed, plausibly produce a different result?**

- **Yes — transient failures.** A `429 Too Many Requests`, a `503 Service Unavailable`, a connection timeout. The failure is about *when* you asked, not *what* you asked. The environment might be fine a second later.
- **No — deterministic failures.** A `400` from a malformed argument, a `404` for a resource that doesn't exist, a `403` for a permission you don't have. The exact same request will produce the exact same failure every time, because nothing about the request changed.

Retrying the second category isn't caution, it's waste — three identical failures cost three times the latency and tell you nothing you didn't know after the first one. Not retrying the first category is also a mistake — a lot of production traffic fails transiently and succeeds a moment later, and treating every timeout as fatal makes an agent needlessly brittle.

## The mental model

```
tool call fails
      │
      ▼
 is the status/exception in the transient set?
 (timeout, 429, 502/503/504, connection reset)
      │
     yes                              no
      │                                │
      ▼                                ▼
 retry with backoff,            return to the model or
 up to a small cap                    user (see
      │                          handling-errors-and-retries)
      ▼
 still failing after cap?
      │
     yes
      │
      ▼
 stop — surface it as a
 failure, don't loop forever
```

This is the code-fixable branch of the fork in [Handling Tool Errors and Retries](/learn/tools-function-calling/handling-errors-and-retries) — transient failures are the ones code can plausibly fix by itself, without any new information from the model. Everything else routes elsewhere.

## Why it works this way

Exponential backoff exists because retrying instantly makes the transient problem worse, not better: a service returning 429s under load gets hit with your immediate retry at the exact moment it's overloaded. Waiting, and waiting longer each time, gives the system room to recover. Jitter — a small random amount added to each wait — exists for a second reason: if a hundred clients all failed at the same moment and all back off on the identical schedule, they all retry at the identical moment too, recreating the spike they were trying to avoid.

```python
import random
import time

def call_with_backoff(fn, *args, max_attempts=4, base_delay=0.5, **kwargs):
    for attempt in range(max_attempts):
        try:
            return fn(*args, **kwargs)
        except TransientError:
            if attempt == max_attempts - 1:
                raise
            delay = base_delay * (2 ** attempt) + random.uniform(0, base_delay)
            time.sleep(delay)
```

Four attempts, delays roughly `0.5-1.0s`, `1.0-1.5s`, `2.0-2.5s` — enough room for a momentary blip to clear without holding the whole conversation hostage for tens of seconds. This retry loop is deliberately invisible to the model: it happens entirely in code, and the model only ever sees the eventual success or the final failure once the cap is hit. That's the same discipline as [Handling Tool Errors and Retries](/learn/tools-function-calling/handling-errors-and-retries) — the model shouldn't have to reason about backoff, because it has no power over whether a downstream service is overloaded.

## A concrete example (shown)

A weather tool call with a real HTTP status behind it:

```python
TRANSIENT_STATUSES = {429, 502, 503, 504}

def classify(status_code: int, exc: Exception | None) -> str:
    if exc is not None and isinstance(exc, (TimeoutError, ConnectionError)):
        return "transient"
    if status_code in TRANSIENT_STATUSES:
        return "transient"
    if status_code in (400, 404, 422):
        return "deterministic"
    if status_code == 403:
        return "deterministic — needs human, not model, see error-surface-strategies"
    return "unknown — treat as deterministic, don't loop blindly"
```

`get_weather(city="Springfeild")` (misspelled) returns `404 City Not Found` — deterministic. Retrying gets you `404` a second time; what fixes it is the model correcting the spelling, which needs [an actionable error](/learn/tools-function-calling/returning-actionable-errors), not a retry. `get_weather(city="Springfield")` failing with `503` — transient. Retry it, probably silently, and the model never even needs to know it happened.

The unclassified default matters: an exception type or status code you didn't anticipate should default to *not* retrying blindly. Retrying the unknown is how you accidentally hammer a genuinely broken downstream service four times per call.

## Where it shows up

This split feeds directly into [Stopping Runaway Loops](/learn/tools-function-calling/infinite-loop-and-retry-caps) — the retry cap here is a *per-call* guard against hammering a flaky service, while the loop cap there guards the whole agent turn against a model that keeps trying different bad arguments against the same tool. They're not the same ceiling and shouldn't share a counter. It also shows up in [Fail to the Model, the User, or Silently Retry](/learn/tools-function-calling/error-surface-strategies), where "silent retry in code" is exactly this transient-failure branch, named as one of three ways to surface a failure.

## Watch out for

- **Retrying non-idempotent calls blind.** A `POST /charge` that times out might have already succeeded server-side before the timeout fired client-side. Retrying without an idempotency key can double-charge. Check idempotency before retrying anything with a side effect, not just its error class.
- **No cap on the backoff loop.** Four attempts with exponential backoff is seconds; an uncapped loop against a service that's actually down is an agent that hangs indefinitely on one tool call while the user watches a spinner.
- **Classifying by exception type alone, ignoring status code nuance.** Not every `500` is transient — some are a server-side bug that will 500 forever on that exact payload. When you can, key off retry-relevant signals the API actually gives you (a `Retry-After` header, a documented error taxonomy) instead of assuming all 5xx is safe to retry.

## Where next

Once the transient/deterministic split is made, deterministic failures still need somewhere to go — back to [Handling Tool Errors and Retries](/learn/tools-function-calling/handling-errors-and-retries) for the model-vs-human fork, or straight into [How a Model Corrects Its Own Call](/learn/tools-function-calling/self-correction-mechanics) if the fix is squarely the model's to make.

**Related:** [Handling Tool Errors and Retries](/learn/tools-function-calling/handling-errors-and-retries), [A Taxonomy of Tool-Calling Failures](/learn/tools-function-calling/taxonomy-of-tool-failures), [Stopping Runaway Loops](/learn/tools-function-calling/infinite-loop-and-retry-caps), [Fail to the Model, the User, or Silently Retry](/learn/tools-function-calling/error-surface-strategies)
