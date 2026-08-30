---
title: "Authenticating API Requests"
track: "python-data-apis"
status: live
summary: "A hands-on walkthrough building a Python script that authenticates to a REST API with a bearer token pulled from an environment variable — including deliberately breaking the heade"
duration: "14 min read"
---

Most API calls don't fail because your logic is wrong — they fail because one header is wrong. Get the `Authorization` header right, keep the secret out of your source, and the rest of the call is just `requests.get`.

## What we're building

A small script, `call_api.py`, that does exactly what every authenticated API client does under the hood: read a secret key from an environment variable, attach it to an outgoing request as a bearer token, and handle whatever comes back. We'll run it once with the header built correctly (200, JSON back) and once with the header built wrong (401, nothing back) — on purpose, against a real endpoint, so you see both outcomes instead of taking my word for them.

This is the same shape you'll use to call [REST APIs generally](/learn/python-data-apis/calling-rest-apis-with-python) and [LLM APIs specifically](/learn/python-data-apis/calling-llm-apis-in-python) — swap the URL and maybe the header name, and the logic doesn't change. If you want the conceptual map of auth schemes (API keys vs. OAuth vs. bearer tokens) before diving into code, see authentication and API keys; this lesson is the "now make it work" companion to that.

We'll hit `https://httpbin.org/bearer` — a public test endpoint built for exactly this. It checks that your `Authorization` header is a well-formed bearer token and returns 401 if it isn't, which is all we need to practice the mechanics without signing up for anything.

## Setup

You need Python 3.9+, `requests`, and `python-dotenv`. If you haven't set up an isolated environment yet, do that first — see [Python environments and venv](/learn/python-data-apis/python-environments-and-venv) — then:

```bash
python -m venv .venv
source .venv/bin/activate      # Windows: .venv\Scripts\activate
pip install requests python-dotenv
```

Create a `.env` file next to your script:

```bash
# .env
API_KEY=sk-demo-51a9c3f2b8
```

That value is one you make up for this exercise — there's no real service issuing it, httpbin doesn't check it against anything, it just needs to look like a token. In a real project this is the literal string a provider hands you (OpenAI, Anthropic, Stripe, whatever), and it's exactly as sensitive as a password. Add `.env` to `.gitignore` right now, before you forget:

```bash
echo ".env" >> .gitignore
```

If any of this — why the key lives in a file instead of the script, what `.gitignore` is protecting you from — feels unfamiliar, [secrets and config management](/learn/python-data-apis/secrets-and-config-management) covers the reasoning; this lesson is the applied half.

## Build it

### 1. Keep the key out of your source

The rule is simple: nothing that grants access ever appears as a string literal in a `.py` file. Not even temporarily "to test it." Files get committed, pasted into chat, and screen-shared before anyone remembers to redact them — the `.env` file from Setup is the one place the secret lives on disk, and it's already excluded from git.

### 2. Load it into the process, not into a variable you typed

```python
import os
from dotenv import load_dotenv

load_dotenv()  # reads .env into the process environment — dev convenience only

api_key = os.environ["API_KEY"]
```

`load_dotenv()` copies the contents of `.env` into `os.environ` for this process. Then `os.environ["API_KEY"]` — square brackets, not `.get()` — reads it back out. That choice matters: `os.environ[...]` raises `KeyError` immediately if the variable is missing. `.get()` would hand you `None` and let the bug travel further downstream, which we'll watch go wrong in a minute. See [loading secrets with dotenv](/learn/python-data-apis/loading-secrets-with-dotenv) for the full pattern, including keeping separate `.env` files per environment.

Notice `load_dotenv()` only matters locally. In production, your deployment platform (Docker, CI, your host's secrets manager) injects `API_KEY` directly into the environment before your process starts — `os.environ["API_KEY"]` finds it either way, and this line of code doesn't change between your laptop and prod.

### 3. Attach it as a bearer token

```python
import requests

response = requests.get(
    "https://httpbin.org/bearer",
    headers={"Authorization": f"Bearer {api_key}"},
    timeout=10,
)
```

This is the full call. `Authorization: Bearer <token>` is the standard header format for bearer-token auth — the word `Bearer`, one space, then the raw token, all as a single header value. Almost every REST and LLM API you'll call from Python uses this exact shape (a few use a custom header name like `x-api-key` instead, but the pattern — secret value, one header, every request — is identical). The `timeout=10` isn't optional politeness: without it, a hung connection blocks your script forever instead of failing.

### 4. Check the response before you trust it

```python
response.raise_for_status()
print(response.status_code)
print(response.json())
```

`raise_for_status()` turns a 4xx or 5xx status into a Python exception instead of letting you silently process an error page as if it were data. That single line is the difference between "my script crashed with a clear traceback" and "my script ran fine and produced garbage." Put together, `call_api.py` is:

```python
import os
import requests
from dotenv import load_dotenv

load_dotenv()
api_key = os.environ["API_KEY"]

response = requests.get(
    "https://httpbin.org/bearer",
    headers={"Authorization": f"Bearer {api_key}"},
    timeout=10,
)
response.raise_for_status()
print(response.status_code)
print(response.json())
```

## Run it

With the `.env` file from Setup in place:

```bash
$ python call_api.py
200
{'authenticated': True, 'token': 'sk-demo-51a9c3f2b8'}
```

That's a correctly authenticated request: httpbin parsed the `Bearer <token>` header, accepted its shape, and echoed the token back so you can confirm the server saw what you sent.

Now break it on purpose. Copy the script to `call_api_broken.py` and drop the `Bearer ` prefix — a mistake that's easy to make if you build the header by hand and forget the scheme name:

```python
headers={"Authorization": api_key}  # missing "Bearer " prefix
```

Run it:

```bash
$ python call_api_broken.py
401
Traceback (most recent call last):
  File "call_api_broken.py", line 12, in <module>
    response.raise_for_status()
  File ".../requests/models.py", line 1024, in raise_for_status
    raise HTTPError(http_error_msg, response=self)
requests.exceptions.HTTPError: 401 Client Error: UNAUTHORIZED for url: https://httpbin.org/bearer
```

Same key, same script, one missing word — 401. The server never got far enough to check whether your token was *valid*; it rejected the header for not even being in the right *shape*. That's worth internalizing: a 401 usually means "I don't know who you are" (missing, malformed, or wrong credential), while a 403 means "I know who you are and you're not allowed" (valid credential, insufficient permission). You'll misread a lot fewer error logs once that distinction is automatic.

## Harden it

Two failure modes matter more than the one above, because they don't announce themselves with a clean traceback.

**Silent `None` instead of a loud crash.** If you'd loaded the key with `os.getenv("API_KEY")` instead of `os.environ["API_KEY"]`, a missing `.env` file wouldn't raise anything — you'd just get `None` back, and `f"Bearer {api_key}"` would quietly become the string `"Bearer None"`. Here's the uncomfortable part: against httpbin, that request returns **200**, not 401 — `{"authenticated": true, "token": "None"}` — because this particular test endpoint only checks that a bearer token is *present*, not that it's *real*. A production API validates the token's actual value and would reject `"Bearer None"` outright, but you shouldn't be relying on the far end to catch your bug. `os.environ["API_KEY"]` failing fast, at the top of your script, before any network call happens, is the fix — a `KeyError` on line 5 is infinitely easier to debug than a phantom "authenticated" response built on a typo three files away.

**Calling `.json()` on an error response.** The 401 response body in the broken run above is empty — no JSON at all. If your code called `response.json()` before checking the status, you'd trade a clear `HTTPError` for a confusing `JSONDecodeError: Expecting value: line 1 column 1 (char 0)`, which tells you nothing about *why* the body was empty. Always check status before you parse: `raise_for_status()` (or an explicit `if response.status_code != 200:` branch) first, `.json()` second, never the other way around. This is the same discipline covered in depth in [parsing and validating API responses](/learn/python-data-apis/parsing-and-validating-api-responses) — don't trust a response's shape until you've confirmed the call actually succeeded.

A couple of cheaper habits worth adding while you're in this code: never `print(api_key)` or log headers wholesale (log that a key was present, not what it is), and if a key can be rotated, read it fresh per run rather than caching it in a global at import time.

## Extend it

- **Move auth into a `requests.Session`.** If you're making more than one call, set the header once — `session = requests.Session(); session.headers["Authorization"] = f"Bearer {api_key}"` — instead of repeating the dict on every call. See [calling REST APIs with Python](/learn/python-data-apis/calling-rest-apis-with-python) for the fuller client pattern.
- **Add retry logic for transient failures.** A 401 should never be retried (the credential is wrong, retrying won't fix it) — but a 429 or 503 should be, with backoff. [Rate limits and retries](/learn/python-data-apis/rate-limits-and-retries) covers telling those apart so you don't hammer a server that's rejecting you on purpose.
- **Point it at a real LLM API.** OpenAI, Anthropic, and most providers use this identical `Authorization: Bearer <key>` (or a close variant like `x-api-key`) pattern — [calling LLM APIs in Python](/learn/python-data-apis/calling-llm-apis-in-python) walks through the same auth step against a real model endpoint instead of a test one.
- **Support multiple keys per environment.** One `.env` for local dev, a different secret source for staging and prod, without touching the code that reads `os.environ["API_KEY"]`. [Secrets and config management](/learn/python-data-apis/secrets-and-config-management) shows the layering.

**Related:** Authentication and API keys · [Loading secrets with dotenv](/learn/python-data-apis/loading-secrets-with-dotenv) · [Calling REST APIs with Python](/learn/python-data-apis/calling-rest-apis-with-python) · [Rate limits and retries](/learn/python-data-apis/rate-limits-and-retries) · [Parsing and validating API responses](/learn/python-data-apis/parsing-and-validating-api-responses)
