---
title: "API Calling Mistakes That Bite in Production"
track: "python-data-apis"
status: live
summary: "A common-mistakes lesson covering five documented production API-calling failures — missing timeouts, ignored status codes, retried non-idempotent POSTs, hardcoded keys, and unchec"
duration: "14 min read"
---

## The mistake

Every one of these will pass code review, pass your local tests, and then bite someone in production — usually at 2am, usually on the one call you didn't think twice about. None of them are exotic. They're the five ways a `requests.get()` or `requests.post()` call quietly turns into an incident.

### 1. No timeout — the call that hangs forever

**Why it's wrong.** `requests` (and most HTTP clients, in most languages) does not time out by default. If you call `requests.get(url)` with no `timeout` argument, the underlying socket will wait as long as the server — or a proxy, load balancer, or NAT device between you and it — is willing to hold the TCP connection open. The Requests library's own docs are explicit about this: without a timeout, your code can hang indefinitely, and they recommend passing one on every single call.

**Symptom.** A worker thread that never returns. A script that isn't crashing, isn't erroring, isn't logging anything — it's just *gone*, sitting in a syscall. If this is inside a request-handling thread pool (a Flask/FastAPI worker, a Celery task), one hung upstream call eventually exhausts the pool and takes down everything else that pool was supposed to serve, even requests that have nothing to do with the flaky API.

**Fix.** Always pass `timeout`. Use a `(connect_timeout, read_timeout)` tuple so you can be strict about connection setup and looser about slow-but-alive responses (this matters a lot when you move on to [calling LLM APIs](/learn/python-data-apis/calling-llm-apis-in-python), where a real response can legitimately take tens of seconds):

```python
import requests

# Wrong: no timeout — this can hang forever
response = requests.get("https://api.example.com/v1/items")

# Fix: (connect_timeout, read_timeout) in seconds — set this on every call
response = requests.get(
    "https://api.example.com/v1/items",
    timeout=(3.05, 30),
)
```

Catch the specific exception so a timeout is a handled case, not a stack trace that surprises you:

```python
try:
    response = requests.get(url, timeout=(3.05, 30))
except requests.exceptions.Timeout:
    # log it, retry with backoff, or fail the job — but decide on purpose
    raise
```

### 2. Ignoring the status code, parsing an error page as data

**Why it's wrong.** `requests` does not raise an exception on a 4xx or 5xx response — it hands you the response object regardless, and `.json()` will happily parse whatever's in the body. If the API returns `{"error": "rate limited"}` with a 429, or your load balancer returns an HTML error page with a 502, your code doesn't know the difference unless you check the status yourself. The failure mode isn't a crash — it's silently accepting garbage as a real answer.

**Symptom.** Downstream code that expects `data["results"]` throws a `KeyError` far away from the actual cause. Or worse — it doesn't throw at all, and you end up writing an error message or an empty list into your dataset as if it were legitimate output. This is exactly the kind of contract violation covered in [parsing and validating API responses](/learn/python-data-apis/parsing-and-validating-api-responses) and [data contracts and validation](/learn/python-data-apis/data-contracts-and-validation) — the shape you got back isn't the shape you asked for, and nothing forced you to notice.

**Fix.** Call `response.raise_for_status()` before you touch the body. It's one line, and it turns a silent bad-data problem into a loud, catchable `requests.HTTPError`:

```python
response = requests.get(url, timeout=(3.05, 30))
response.raise_for_status()  # raises HTTPError on 4xx/5xx — check this before parsing
data = response.json()
```

This matters just as much when calling an LLM API — a 400 or 429 from a chat completions endpoint comes back as a structured error object (`{"error": {"message": ...}}`), not the completion shape you were expecting, and code that skips the status check will try to read a message or token count out of an error payload.

### 3. Retrying a non-idempotent POST — the double charge

**Why it's wrong.** GET, PUT, and DELETE are specified to be idempotent: calling them twice has the same effect as calling them once. POST is not. If you wrap all your API calls in a generic "retry on timeout" decorator without thinking about the method, you'll eventually retry a POST whose *first* attempt actually succeeded server-side — the response just never made it back to you (network blip, your own read timeout firing a second too early). Your retry logic sees "no response, must have failed" and fires the same POST again. The server sees two distinct requests and does the thing twice.

**Symptom.** Duplicate orders. Duplicate rows in a database. A user charged twice for one purchase. Two emails sent for one signup. It's rarely reproducible on demand — it shows up as a slow trickle of "why do I have two of these" support tickets that correlates with periods of network flakiness, not with a code path anyone tested directly.

**Fix.** Never blindly retry a POST unless the API gives you a way to make it safe. The documented, widely-adopted pattern for this is an idempotency key: you generate a unique key *once* per logical attempt, attach it as a header, and reuse the *same* key across every retry of that attempt. The server deduplicates on the key and returns the original result instead of repeating the side effect.

> Stripe's API docs describe exactly this mechanism: generate a key, send it as the `Idempotency-Key` header, and a retried request with the same key returns the original charge instead of creating a second one. It's not Stripe-specific — plenty of payment and order APIs document the same header.

```python
import uuid
import requests

# Generate once per logical attempt, not once per HTTP call — reuse it across retries
idempotency_key = str(uuid.uuid4())

for attempt in range(3):
    try:
        response = requests.post(
            "https://api.example.com/v1/charges",
            json={"amount": 2000, "currency": "usd"},
            headers={"Idempotency-Key": idempotency_key},  # the one-line guard
            timeout=(3.05, 30),
        )
        response.raise_for_status()
        break
    except requests.exceptions.RequestException:
        if attempt == 2:
            raise
```

If the API you're calling doesn't support idempotency keys, the safe default is: don't auto-retry POSTs with side effects. Retry GETs freely; treat POSTs as retry-only-if-you-can-prove-it's-safe. This is exactly the judgment call covered in [rate limits and retries](/learn/python-data-apis/rate-limits-and-retries) — and it applies to LLM calls too: a retried `/chat/completions` POST doesn't double-charge a customer, but it does double the token bill and can duplicate any tool call or side effect the model's output triggered.

### 4. Hardcoding the API key

**Why it's wrong.** A key typed directly into a `.py` file gets committed. Once it's pushed, it's in git history permanently — deleting the line in a later commit doesn't remove it from `git log -p`, and anyone with read access to the repo (a contractor, a former teammate, a public fork) can pull it out. It also means the same key is shared across your laptop, CI, staging, and production, so there's no way to revoke access for one environment without breaking all of them.

**Symptom.** A secret-scanning alert (GitHub and most CI providers run this automatically now) flagging a key in a commit from months ago. Or a bill from a provider for usage you didn't generate, because the key leaked through a public repo, a shared notebook, or a screenshot in a bug report that included a terminal with the key in it.

**Fix.** Load the key from the environment, never from a literal in source. Use `python-dotenv` for local development and real environment variables in deployed environments, and make missing keys fail loudly instead of silently running as `None`:

```python
import os
from dotenv import load_dotenv

load_dotenv()  # reads .env into the process environment — .env is in .gitignore, never committed

api_key = os.environ["API_KEY"]  # KeyError if it's missing — fail loudly, don't fall back to None
```

`os.environ["API_KEY"]` (not `os.getenv`) is the one-line guard here on purpose: `os.getenv` returns `None` on a missing key, and a `None` API key doesn't fail until three lines later with a confusing 401. See [secrets and config management](/learn/python-data-apis/secrets-and-config-management), [loading secrets with dotenv](/learn/python-data-apis/loading-secrets-with-dotenv), and [authentication and API keys](/learn/python-data-apis/authentication-and-api-keys) for the full pattern, including separate keys per environment and what to do the moment you suspect one has leaked (rotate it immediately — don't wait to confirm the leak first).

### 5. Assuming the body is always valid JSON

**Why it's wrong.** `.json()` assumes the response body is JSON. In practice, plenty of things sit between you and the API that will happily return something else with a 200 or an error status: a WAF or CDN returning an HTML challenge page, a load balancer returning a plaintext error, a `204 No Content` with an empty body, or a rate-limiter returning plain text. None of that is JSON, and `.json()` doesn't check first — it tries to parse and throws if it fails.

**Symptom.** `json.decoder.JSONDecodeError: Expecting value: line 1 column 1 (char 0)` — one of the most common tracebacks in API-calling code, and it almost always means "the body wasn't JSON at all," not "the JSON was malformed." It's especially confusing because it often fires intermittently — the API is JSON 99% of the time and an HTML error page the 1% of the time your infra hiccups.

**Fix.** Wrap `.json()` in a `try`/`except` and log the raw body when it fails, so you can actually see what came back instead of guessing:

```python
try:
    data = response.json()
except requests.exceptions.JSONDecodeError:
    raise RuntimeError(
        f"Non-JSON response ({response.status_code}): {response.text[:200]!r}"
    )
```

`requests.exceptions.JSONDecodeError` is a subclass of the built-in `ValueError`, so if you're on an older `requests` version (it was added in 2.27), catching `ValueError` instead is the portable version of the same guard.

## Putting the five guards together

None of these fixes are exotic — the point is that they all belong on *every* production API call at once, not sprinkled in after the first incident. A small wrapper makes that the default instead of something you have to remember:

```python
import os
import uuid
import requests
from dotenv import load_dotenv

load_dotenv()
API_KEY = os.environ["API_KEY"]  # guard 4: fail loudly if missing


def call_api(method, url, **kwargs):
    headers = kwargs.pop("headers", {})
    headers["Authorization"] = f"Bearer {API_KEY}"

    if method == "POST":
        headers.setdefault("Idempotency-Key", str(uuid.uuid4()))  # guard 3

    response = requests.request(
        method,
        url,
        headers=headers,
        timeout=(3.05, 30),  # guard 1
        **kwargs,
    )
    response.raise_for_status()  # guard 2

    try:
        return response.json()  # guard 5
    except requests.exceptions.JSONDecodeError:
        raise RuntimeError(
            f"Non-JSON response ({response.status_code}): {response.text[:200]!r}"
        )
```

Every call in your codebase that goes through this function gets all five guards without anyone having to remember them individually. That's the same instinct behind building a proper client in [calling REST APIs with Python](/learn/python-data-apis/calling-rest-apis-with-python) — push the safety behavior down into one place instead of trusting every call site to get it right.

## Pre-flight checklist

Before an API call ships to production, check it against all five:

- **Timeout set?** Every `requests` call has an explicit `timeout=(connect, read)` — never a bare call with no timeout argument.
- **Status checked before parsing?** `response.raise_for_status()` (or an equivalent explicit check) runs before you touch `.json()` or `.text`.
- **Is this POST safe to retry?** If it has a side effect (charge, order, send, generate), it either carries an idempotency key or your retry logic explicitly excludes it.
- **Is the key coming from the environment?** No literal key string anywhere in source, `os.environ[...]` (not `.getenv`) so a missing key fails immediately.
- **Is `.json()` wrapped?** A non-JSON body raises something readable — status code and a snippet of the raw response — instead of an opaque `JSONDecodeError` three calls downstream.

**Related:** [Rate limits and retries](/learn/python-data-apis/rate-limits-and-retries) · [Parsing and validating API responses](/learn/python-data-apis/parsing-and-validating-api-responses) · [Secrets and config management](/learn/python-data-apis/secrets-and-config-management) · [Calling LLM APIs in Python](/learn/python-data-apis/calling-llm-apis-in-python)
