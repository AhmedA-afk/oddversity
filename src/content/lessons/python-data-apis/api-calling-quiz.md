---
title: "Quiz: Calling APIs"
track: "python-data-apis"
status: live
summary: "A six-question self-check on status code classes, retry safety, pagination shapes, API key hygiene, and the silent failure mode of a call with no timeout."
duration: "12 min read"
---

You won't get burned by a concept you can define — you'll get burned by a status code you didn't check, a retry you shouldn't have made, or a call that just never comes back. These six are all things that actually happen in a working pipeline, not trivia.

## 1. Reading a batch of status codes

Your pipeline calls a REST API in a loop and logs the status code for every request. Here's a slice of one run, all against the same endpoint:

```text
200  GET /orders/8891
404  GET /orders/8892
429  GET /orders/8893
500  GET /orders/8894
401  GET /orders/8895
```

Without looking at a single response body, what's the correct read of this batch?

- A. All five are "results" except the 200 — the pipeline should stop and alert on all four the same way.
- B. 404 means order 8892 doesn't exist (client error, not retriable). 429 means you're being rate-limited (retriable, after backoff). 500 means the server broke on its end (worth a retry). 401 means your credentials are bad or expired (not retriable until you fix auth). This batch needs three different handling paths, not one.
- C. 404 and 401 are both "not found"-style errors, and 429/500 are both server-side problems, so really you only need two handling paths.
- D. Since 500 is the only genuine failure, the 404/429/401 responses can all be logged as warnings and skipped.

<details><summary>Answer</summary>

**Correct: B.** The status code *class* (2xx/4xx/5xx) tells you who's at fault; the specific code tells you what to do about it. A 404 says "this resource doesn't exist" — retrying won't create it. A 429 says "you personally are going too fast" — that's the one class of 4xx that *is* retriable, ideally after reading a `Retry-After` header. A 500 says "the server broke," which may or may not resolve itself, so a bounded retry is reasonable. A 401 says "your credentials didn't work" — and critically, if it's wrong for one request in a loop, it's very likely wrong for all of them, since it's usually the same token.

**A** treats every non-2xx as equivalent, which either buries you in alerts (every 404 for a missing record shouldn't page anyone) or, worse, treats a systemic auth failure exactly like one missing row. See [Calling REST APIs with Python](/learn/python-data-apis/calling-rest-apis-with-python) for how to structure this dispatch in code.

**C** merges codes that mean unrelated things. 404 ("not found") and 401 ("not authenticated") have nothing to do with each other — one is about the resource, the other is about you. And 429 is explicitly about *your* request rate, which is a completely different fix (slow down) than a 500, where you have no idea what's wrong on the server and are just hoping a retry lands on a healthier instance.

**D** is the dangerous one. Silently skipping 401s means every remaining call in the batch is probably about to fail the same way — you'd rather find that out on request one than discover, an hour later, that your entire run silently did nothing. See [Rate limits and retries](/learn/python-data-apis/rate-limits-and-retries) for how to build the 429 path specifically.

</details>

## 2. The retry trap

You write a retry wrapper for your pipeline's API calls:

```python
import time
import requests

def call_api(method, url, **kwargs):
    resp = None
    for attempt in range(3):
        resp = requests.request(method, url, timeout=10, **kwargs)
        if resp.status_code < 400:
            return resp
        time.sleep(2 ** attempt)
    resp.raise_for_status()
```

It retries on *any* status code 400 or above, with exponential backoff. What's actually wrong with this, and what's the fix?

- A. Nothing — retrying with exponential backoff on any failure is the standard safe pattern.
- B. It retries 400/401/403/404 the same as 429/500, which just fails identically three times and burns your backoff window for nothing. Worse: if `method` is `POST` and the *response* got lost after the server already created the resource, blindly retrying can create it twice. The fix is to only retry on 429 and 5xx (plus network-level timeouts), and to only retry non-idempotent methods when you're passing an idempotency key the server can use to dedupe.
- C. The real problem is it should also retry on 200, just to be safe.
- D. `time.sleep` is the bug — you should never sleep inside a retry loop; fail immediately and make the caller retry instead.

<details><summary>Answer</summary>

**Correct: B.** "Safe to retry" depends on two independent things: whether the *error* is transient (429/5xx usually are; 4xx client errors usually aren't — the request itself is wrong and retrying sends the identical wrong request three times), and whether the *operation* is idempotent (a `GET` is safe to repeat; a `POST` that creates an order is not, unless the API gives you a way to dedupe, like an idempotency key). This function ignores both distinctions.

**A** is the naive version of "just retry on failure," and it's exactly what breaks in production: a 401 doesn't fix itself in 1, 2, then 4 seconds — you've just added 7 seconds of latency to a request that was always going to fail, and if it's a POST, you may not even know whether the *first* attempt actually succeeded server-side before the response was lost.

**C** doesn't make sense as stated — retrying a request that already succeeded wastes a call and, for a non-idempotent one, can duplicate a real side effect (charging a card twice, creating a second row). There's no scenario where retrying a 200 helps you.

**D** gets the direction backwards. The sleep *is* the backoff — that's the correct, standard part of this pattern. The bug isn't that you wait between attempts; it's *which* status codes you decide are worth waiting for.

</details>

## 3. What shape is this pagination?

You call `GET /users?page=1` and get back:

```json
{
  "data": [
    { "id": 1, "name": "Ada" },
    { "id": 2, "name": "Grace" }
  ],
  "next_cursor": "eyJpZCI6MTAwfQ==",
  "has_more": true
}
```

What pagination style is this, and how do you correctly fetch the next page?

- A. Offset-based pagination — just call `?page=2` next.
- B. Cursor-based pagination — take the opaque `next_cursor` value and pass it back verbatim as a parameter (e.g. `?cursor=eyJpZCI6MTAwfQ==`) on the next request. You keep looping until `has_more` is `false`; you never compute a page number yourself.
- C. Link-header pagination — check the HTTP response headers for a `Link: <...>; rel="next"` entry and follow that URL.
- D. This is offset pagination wearing a disguise — base64-decode the string and you'll find it's just a row offset underneath.

<details><summary>Answer</summary>

**Correct: B.** The tell is `next_cursor` plus `has_more`: the server is handing you a pointer to resume from, not a page count. Your job is to treat it as opaque — pass it back exactly as given — and stop when `has_more` is `false`. This is the more general reference for the whole family: [Pagination patterns](/learn/python-data-apis/pagination-patterns).

**A** is a real pagination style — you'll see `page`/`per_page` or `offset`/`limit` params elsewhere — but the signal here is different. There's no page number anywhere in this response for you to increment; the server is explicitly not giving you one, and constructing `page=2` yourself will either be ignored or hit an endpoint that doesn't support it.

**C** is also a real style (it's how the GitHub API works), but the pagination info there lives in HTTP response *headers*, not the JSON body. If you're grabbing `response.headers['Link']`, you're doing link-header pagination; this example puts everything in the body instead, so that's not what's happening here.

**D** is the tempting trap precisely because cursors are often base64-encoded, so it *looks* decodable. But the entire point of an opaque cursor is that the server can encode whatever it wants inside it — an ID, a timestamp, a signed pointer into an index — and change that encoding at any time without breaking clients, as long as clients keep treating it as opaque. Code that decodes and reconstructs it will work today and quietly break the day the API team changes the internal format.

</details>

## 4. Where does the key come from?

You're writing a script that calls an LLM API, and you're about to commit it to a git repo your team can see. Where should the API key come from in the code you commit?

- A. Hardcode it as a string constant at the top of the script, so anyone who clones the repo can run it with zero setup.
- B. Read it from an environment variable — `os.environ["OPENAI_API_KEY"]`, typically loaded via `python-dotenv` from a local `.env` file that's in `.gitignore`. The key itself never appears in the code or in git history; only a *reference* to where it lives does.
- C. Put it in a `config.json` file and commit that — it's more readable than environment variables.
- D. Pass it as a command-line flag, `python script.py --api-key sk-abc123`, so it's explicit right there when you run it.

<details><summary>Answer</summary>

**Correct: B.**

```python
import os
from dotenv import load_dotenv

load_dotenv()  # reads .env into the process environment; .env itself is gitignored
api_key = os.environ["OPENAI_API_KEY"]
```

The key lives outside the code entirely. Anyone can read the script safely, and swapping keys per environment (dev/staging/prod, or a teammate's own key) is a config change, not a code change. See [Secrets and config management](/learn/python-data-apis/secrets-and-config-management) and [Loading secrets with dotenv](/learn/python-data-apis/loading-secrets-with-dotenv) for the full pattern.

**A** is the single most common real mistake, and it doesn't get safer just because you "remember to delete it before pushing" — once a secret is in git history, it's in git history; deleting the line in a later commit doesn't remove it from the earlier one, and a public or later-shared repo leaks it retroactively.

**C** is functionally identical to A. Git doesn't care whether the literal secret string sits in a `.py` file or a `.json` file — committing either one commits the secret. The extra layer of "it's a config file" doesn't add any protection.

**D** feels safer because it's not "in the code," but it fails differently: CLI arguments land in your shell history file, and on any shared or multi-user machine, process arguments are visible to other users via `ps aux` for as long as the process runs. See [Authentication and API keys](/learn/python-data-apis/authentication-and-api-keys) for why keys need to be treated as bytes that shouldn't touch disk, shell history, or logs unnecessarily.

</details>

## 5. The call that never returns

```python
import requests

resp = requests.get("https://api.example.com/data")
print(resp.json())
```

No `timeout` argument. The server accepts the TCP connection but — because it's having a bad day — never sends a response. What actually happens when you run this?

- A. `requests` has a built-in default timeout of 30 seconds, after which it raises `requests.exceptions.Timeout`.
- B. Your program hangs on that line indefinitely. `requests` has no default timeout at all — the call will block until the underlying TCP connection eventually dies (which can take a very long time) or until something external kills the process.
- C. Python's socket layer enforces a default 60-second timeout, so you'll get a `TimeoutError` after a minute.
- D. Since the server accepted the connection but sent no data, the request fails immediately with a connection error.

<details><summary>Answer</summary>

**Correct: B.** This is deliberate, documented `requests` behavior that trips up almost everyone the first time: there is no default timeout. "No data yet" and "still thinking" look identical at the transport layer, so the call just waits. In a script that's annoying; in a pipeline it's a real incident — one stalled request can block an entire batch job, and if you're firing these off from a thread pool or async worker, a few stuck calls can exhaust your whole pool of workers while they wait on nothing. The fix is always explicit:

```python
resp = requests.get(
    "https://api.example.com/data",
    timeout=(5, 30),  # (connect timeout, read timeout), in seconds
)
```

Now a stalled server raises `requests.exceptions.ReadTimeout` at 30 seconds instead of hanging forever, and you can decide what to do about it (log it, retry it if idempotent, surface it). See [Calling REST APIs with Python](/learn/python-data-apis/calling-rest-apis-with-python) for the rest of this setup.

**A** is the assumption almost everyone brings in from other tools or languages that *do* default to a reasonable timeout — `requests` explicitly does not, and it's called out in its own docs for exactly this reason.

**C** invents a Python-level default that doesn't exist either. The underlying `socket` module's default timeout is `None` (block forever) unless something sets it, and nothing in `requests` changes that unless you pass `timeout=`.

**D** gets the failure mode backwards. A connection being *accepted* with no data yet is not a failure signal — it's indistinguishable from "the server is just slow," which is precisely why it doesn't fail fast on its own. If it failed immediately the way D describes, this wouldn't be a scenario worth asking about.

</details>

## 6. 200 OK, and yet...

You call an LLM completion endpoint and get back HTTP `200`. You parse the body and get:

```json
{
  "id": "chatcmpl-123",
  "choices": [],
  "error": {
    "code": "content_filter",
    "message": "The response was filtered due to the prompt triggering a content management policy."
  }
}
```

What does the `200` actually tell you here, and what should your code be checking?

- A. `200` means it worked — since the request succeeded at the network level, `choices[0]` is safe to use.
- B. `200` only tells you the HTTP transaction completed and the server processed your request enough to return a structured response. It does not guarantee the payload has usable content. Your code has to check the body itself — an `error` key, an empty `choices` list — independent of the status code, before touching the result.
- C. This has to be a bug in the API — a real error should always come back as a 4xx or 5xx.
- D. A 200 with an `error` field means a transient hiccup on the server, so the right move is to retry the exact same request.

<details><summary>Answer</summary>

**Correct: B.** Status codes describe the HTTP transaction, not your business logic — plenty of real APIs, LLM providers very much included, return `200` for "request understood, here's a structured outcome," even when that outcome is a refusal, a filter, or a partial result. The status code and the *content* of success are two separate things you have to check separately. This is worth internalizing well before you're calling LLM endpoints specifically — see [Calling LLM APIs in Python](/learn/python-data-apis/calling-llm-apis-in-python) and [Parsing and validating API responses](/learn/python-data-apis/parsing-and-validating-api-responses) for the pattern of validating a body's shape before trusting it.

**A** is the assumption that breaks in practice: code that does `resp.json()["choices"][0]["message"]["content"]` without checking anything first will throw an `IndexError` on the empty list — and only because it used the status code as a stand-in for "the thing I wanted actually happened," which it never guaranteed.

**C** assumes status codes and application outcomes must always line up, which is a clean idea that a lot of real APIs simply don't follow. A content filter rejection isn't a transport failure — the request was received and handled correctly; the *outcome* was a refusal, which is a completely valid thing for a `200` to carry.

**D** misreads what "transient" means. Retrying the identical prompt against a content filter gets you the identical rejection every time — there's no server hiccup to wait out. This calls for changing the request (rephrasing, or building an explicit refusal-handling path in your code), not backing off and trying again.

</details>

**Related:** [Rate limits and retries](/learn/python-data-apis/rate-limits-and-retries) · [Pagination patterns](/learn/python-data-apis/pagination-patterns) · [Authentication and API keys](/learn/python-data-apis/authentication-and-api-keys) · [Parsing and validating API responses](/learn/python-data-apis/parsing-and-validating-api-responses) · [Calling LLM APIs in Python](/learn/python-data-apis/calling-llm-apis-in-python) · [API-calling common mistakes](/learn/python-data-apis/api-calling-common-mistakes)
