---
title: "Load Secrets with .env and os.environ"
track: "python-data-apis"
status: live
summary: "A hands-on walkthrough that builds a two-file config/client pattern: store a key in .env, gitignore it, load it into os.environ with python-dotenv, and fail fast at startup instead"
duration: "14 min read"
---

The most common way an API key leaks isn't a hack — it's a `git add .` that swept up a `.env` file, or a key typed straight into a function call that later gets pasted into a bug report or a Jupyter notebook someone shares. This walkthrough builds the boring, correct version: a key that lives in one untracked file, flows into `os.environ`, and makes your program refuse to start if it's missing — instead of quietly sending a request that was never going to work.

## What we're building

Two small files:

- `config.py` — loads `.env`, reads the key out of `os.environ`, and raises immediately if it's not there.
- `client.py` — imports the validated key from `config.py` and uses it to call an API.

To test this without needing a real paid API key, we'll call [httpbin.org](https://httpbin.org)'s echo endpoint, which just reflects back whatever headers you sent it. That means you can literally see your `Authorization` header arrive intact — and see exactly what it looks like when it doesn't. Once the pattern works, swapping in a real provider (OpenAI, a weather API, whatever) is a one-line change, which we'll cover in [Extend it](#extend-it).

If you haven't set up an isolated environment yet, do that first — see [Python environments and venv](/learn/python-data-apis/python-environments-and-venv). Everything below assumes you're working inside one.

## Setup (deps/env)

```bash
python -m venv .venv
source .venv/bin/activate   # on Windows: .venv\Scripts\activate

pip install python-dotenv requests
```

Your project folder should look like this:

```
myproject/
├── .venv/
├── .env
├── .gitignore
├── config.py
└── client.py
```

`python-dotenv` reads a `.env` file and sets its contents into `os.environ`. `requests` is just here to make the actual HTTP call — the secrets pattern doesn't care which HTTP library or SDK you use downstream.

## Build it

### 1. Create the `.env` file

```
API_KEY=sk-demo-51a30c9e2b7f
```

That's the whole file: `NAME=value`, no quotes needed unless the value has spaces, no spaces around the `=`. This is where real, machine-specific secrets live — the value here is never typed into your Python source, so it's never sitting in a diff, a stack trace, or a screen-share.

### 2. Gitignore it before you commit anything

```
# .gitignore
.env
```

Do this in the same breath you create the `.env` file, before your first `git add`. If `.env` somehow already got committed earlier, `.gitignore` alone won't undo that — you'd need `git rm --cached .env` and to treat the key as burned (rotate it).

It's worth committing a sibling file that *is* safe to share, so teammates know what to set:

```
# .env.example
API_KEY=
```

### 3. Load it into the process environment

```python
from dotenv import load_dotenv

load_dotenv()
```

`load_dotenv()` looks for a file named `.env`, starting in the current directory and walking upward, and sets each line into `os.environ` — the same place environment variables from your shell or your CI system already live. By default it won't clobber a variable that's already set in the real environment (`override=False`), so a value exported by your deployment platform always wins over whatever is sitting in a local `.env` file. This is the whole point of the library: it makes `os.environ` the *one* interface your code reads from, regardless of where the value actually came from.

### 4. Read it with a fail-fast check

```python
# config.py
import os
from dotenv import load_dotenv

load_dotenv()

def _require_env(name: str) -> str:
    value = os.environ.get(name)
    if not value:
        raise RuntimeError(
            f"{name} is not set. Add it to your .env file "
            f"(see .env.example) or export it in your shell."
        )
    return value

API_KEY = _require_env("API_KEY")
```

`os.environ.get(name)` returns `None` if the variable is missing — it never raises on its own. That's exactly the trap: if you skip the check and do `headers = {"Authorization": f"Bearer {os.environ.get('API_KEY')}"}`, a missing key doesn't crash anything. It silently becomes the string `"Bearer None"`, gets sent over the wire, and the API rejects it with a 401 that looks exactly like an *invalid* key — sending you off to check for typos and expired credentials instead of the one-line bug that's actually there.

Raising a `RuntimeError` here does two things: it fails at **import time**, the moment `config.py` is loaded — not three hours into a batch job when call #4,000 finally 401s — and the error message tells you precisely what to fix. This is the fail-fast principle applied to configuration: crash loud and early beats fail quiet and late. See [Authentication and API keys](/learn/python-data-apis/authentication-and-api-keys) for more on what a well-formed auth header should look like.

### 5. Pass it into the API client

```python
# client.py
import requests
from config import API_KEY

def call_api(payload: dict) -> dict:
    response = requests.post(
        "https://httpbin.org/anything",
        headers={"Authorization": f"Bearer {API_KEY}"},
        json=payload,
        timeout=10,
    )
    response.raise_for_status()
    return response.json()

if __name__ == "__main__":
    result = call_api({"ping": "pong"})
    print(result["headers"]["Authorization"])
```

Notice the key never appears as a literal anywhere in `client.py`. It flows `.env` → `os.environ` → `config.py` → the request header, and `client.py` only ever sees `API_KEY` as an already-validated name. That separation matters once you have more than one file calling APIs — the validation logic lives in exactly one place. This is the same header pattern you'll use for any REST call; see [Calling REST APIs with Python](/learn/python-data-apis/calling-rest-apis-with-python) for the fuller picture (query params, JSON bodies, status codes).

## Run it

With `.env` in place:

```bash
$ python client.py
Bearer sk-demo-51a30c9e2b7f
```

httpbin echoed back the exact header you sent, confirming the key made it all the way from the file into the request. (If you swap in a real API, you'd get real response data back instead of an echo — the point here is just to make the plumbing visible.)

Now delete or rename `.env` and run it again:

```bash
$ mv .env .env.bak
$ python client.py
Traceback (most recent call last):
  File "client.py", line 2, in <module>
    from config import API_KEY
  File "config.py", line 12, in <module>
    API_KEY = _require_env("API_KEY")
  File "config.py", line 8, in _require_env
    raise RuntimeError(
RuntimeError: API_KEY is not set. Add it to your .env file (see .env.example) or export it in your shell.
```

The program never gets as far as opening a socket. That's the behavior you want: a config problem should look like a config problem, not a network problem.

## Harden it

**Don't let `.get()` with a default hide a missing secret.** This looks harmless but isn't:

```python
# Don't do this
API_KEY = os.environ.get("API_KEY", "")
headers = {"Authorization": f"Bearer {API_KEY}"}
# API_KEY missing → headers == {"Authorization": "Bearer "}
# A real request goes out. It just can't possibly succeed.
```

A default value is fine for genuinely optional settings (a timeout, a feature flag). It's never fine for something the program cannot function without.

**Validate every required variable at once, not one at a time.** If you have several secrets, failing on the first missing one means a teammate fixes it, reruns, and immediately hits the *next* missing one — annoying in local dev, worse in CI logs. Collect everything that's wrong and report it together:

```python
import os
from dotenv import load_dotenv

load_dotenv()

REQUIRED_VARS = ["API_KEY", "API_BASE_URL"]

def load_config() -> dict:
    missing = [name for name in REQUIRED_VARS if not os.environ.get(name)]
    if missing:
        raise RuntimeError(
            f"Missing required environment variables: {', '.join(missing)}. "
            f"Check your .env file against .env.example."
        )
    return {name: os.environ[name] for name in REQUIRED_VARS}

config = load_config()
```

**Never log the raw key.** If you're printing config for debugging, mask it:

```python
def mask(secret: str, visible: int = 4) -> str:
    return f"{'*' * (len(secret) - visible)}{secret[-visible:]}"

print(f"Using API_KEY ending in ...{mask(config['API_KEY'])}")
# Using API_KEY ending in ...****************2b7f
```

**Remember everything from `.env` arrives as a string.** `TIMEOUT_SECONDS=30` in your `.env` file gives you the string `"30"` via `os.environ`, not the integer `30` — comparing it to a number or doing arithmetic on it without casting is a quiet source of bugs. Cast explicitly at the boundary:

```python
timeout = int(os.environ.get("TIMEOUT_SECONDS", "30"))
```

This is a small instance of a bigger idea — untrusted input (and config counts as input) should be validated and coerced at the edge of your program, not trusted implicitly downstream. See [Data contracts and validation](/learn/python-data-apis/data-contracts-and-validation) for that pattern applied to full data structures, not just single values.

## Extend it

**Multiple environments.** Once you have dev, staging, and prod, point `load_dotenv()` at a different file based on an `ENV` variable your deployment sets:

```python
env = os.environ.get("ENV", "dev")
load_dotenv(f".env.{env}")
```

Locally you never set `ENV`, so it falls back to `.env.dev`. In CI or production, the platform sets real environment variables directly and `.env` files usually aren't present at all — which is fine, since `load_dotenv()` finding nothing to load just leaves `os.environ` as the platform already configured it.

**LLM SDKs often auto-detect their own key.** Libraries like the OpenAI or Anthropic clients will read a well-known variable name (`OPENAI_API_KEY`, `ANTHROPIC_API_KEY`) automatically if you don't pass a key explicitly — so `load_dotenv()` plus the right variable name is sometimes all you need, no `config.py` required. The fail-fast wrapper still earns its keep for any custom or lesser-known key the SDK doesn't know to look for. See [Calling LLM APIs in Python](/learn/python-data-apis/calling-llm-apis-in-python) for that in practice.

**Outgrowing `.env` entirely.** `.env` is a local-development convenience, not a production secrets store — it sits on disk in plaintext, which is fine for your laptop and wrong for a server. In real deployments, secrets typically arrive as environment variables injected by the platform itself (a container orchestrator, a CI secrets store, a dedicated secrets manager) — your `config.py` doesn't need to change at all, because it was always reading from `os.environ`, never from the `.env` file directly. That's the actual payoff of this pattern: you built one interface that works identically on your laptop and in production.

For the broader picture of what belongs in config versus what belongs in a secret, and how to structure settings beyond a single key, go back to [Secrets and config management](/learn/python-data-apis/secrets-and-config-management). When you're ready to check your understanding, there's a [quiz](/learn/python-data-apis/secrets-config-quiz) covering this section.

**Related:** [Secrets and config management](/learn/python-data-apis/secrets-and-config-management) · [Python environments and venv](/learn/python-data-apis/python-environments-and-venv) · [Authentication and API keys](/learn/python-data-apis/authentication-and-api-keys) · [Calling REST APIs with Python](/learn/python-data-apis/calling-rest-apis-with-python) · [Calling LLM APIs in Python](/learn/python-data-apis/calling-llm-apis-in-python) · [Secrets & config quiz](/learn/python-data-apis/secrets-config-quiz)
