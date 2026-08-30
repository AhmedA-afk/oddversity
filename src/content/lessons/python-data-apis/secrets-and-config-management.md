---
title: "Secrets and Config: Keys Never Live in Code"
track: "python-data-apis"
status: live
summary: "A concept-level lesson teaching why API keys and connection strings belong in environment variables and .env files rather than source code, using the real pattern of an OpenAI key "
duration: "14 min read"
---

A hardcoded OpenAI key in a public repo doesn't stay secret for long — automated scanners find it faster than most people notice their own mistake, and the key gets killed before you've even opened your pull request. This lesson is about making sure that scanner never has anything to find.

## What it is

A **secret** is any string that grants access on its own — an API key, a database connection string, a webhook signing secret, a cloud access token. If having the string is enough to spend someone's money, read their data, or impersonate their app, it's a secret.

An **environment variable** is a key-value pair the operating system hands to a running process, completely separate from that process's source code. A **`.env` file** is just a plain-text, per-machine convention for defining those variables locally — a file named `.env` sitting next to your project, read at startup by a small library (`python-dotenv` is the standard one in Python) and injected into the process's environment.

The rule this lesson is built around: **secrets live in environment variables, never in source files, and `.env` never gets committed to git.** Your code reads a name (`OPENAI_API_KEY`) and asks the environment for its value at runtime. The value itself never appears in a `.py` file, never gets typed into a commit, and never ships in your git history.

## The mental model

Picture three concentric layers, each one overriding the layer inside it:

1. **A default baked into your code** — `os.getenv("REQUEST_TIMEOUT", "30")`. This is the innermost, least trustworthy layer: it's shipped in your source, committed to git, and visible to anyone who can read the file.
2. **A `.env` file on disk** — a per-machine notepad. Better than hardcoding, because it's excluded from git, but it's still a plaintext file sitting on someone's laptop.
3. **A real environment variable** — set by your shell (`export OPENAI_API_KEY=...`), injected by CI (a GitHub Actions secret), or provided by your hosting platform's secret manager. This is the outermost, most trustworthy layer: it lives only in the memory of the running process, never touches your repository, and can be rotated without touching a single line of code.

The outer layer always wins. A real environment variable beats whatever's in `.env`, and `.env` beats whatever default is written in the code. That ordering is not an accident — it's what lets the exact same codebase run correctly on your laptop, in CI, and in production, each with different secrets, without an `if environment == "prod"` branch anywhere in sight.

## Why it works this way

Git is designed to remember everything, forever, on purpose — that's what makes it useful for code review and rollback. That is exactly the wrong property for a secret. A credential's whole job is to prove identity at the moment of use; it has no reason to be readable by anyone who can read your source — and "anyone who can read your source" is often every contributor, every CI log, every fork, and, if the repo is public, anyone with a browser.

This is also why config and code are kept apart as a general practice, not just for secrets. One codebase should run in dev, staging, and production with identical code and different configuration values — different database URLs, different API keys, different timeouts. Bake a secret into the code and you no longer have one codebase for three environments; you have a merge conflict waiting to leak a production key into a dev branch's git history.

Environment variables specifically (rather than, say, a checked-in `config.json`) work because they're process-scoped: they don't touch disk unless you choose to via `.env`, they don't get accidentally baked into a Docker image layer or a build artifact the way a file can, and every language and platform already agrees on them as the interface. The same `OPENAI_API_KEY` name works whether the process is running in your terminal, inside a container, or on a PaaS.

## A concrete example

Set this up in order — the `.gitignore` entry comes *before* the `.env` file exists, so there's never a window where an unignored secret sits in your working tree.

**1. Ignore the file before you create it:**

```bash
# .gitignore
.env
```

**2. Create the real, local `.env`** (never committed):

```bash
OPENAI_API_KEY=sk-your-real-key-goes-here
REQUEST_TIMEOUT=45
```

**3. Commit a template instead**, so teammates know what's needed without ever seeing a real value:

```bash
# .env.example
OPENAI_API_KEY=
REQUEST_TIMEOUT=30
```

**4. Load it in Python, and fail loudly if something required is missing:**

```python
# config.py
import os
from dotenv import load_dotenv

load_dotenv()  # reads .env into the process environment;
                # does NOT override a variable that's already set

def require_env(name: str) -> str:
    """Fetch a required secret, failing fast instead of silently continuing with None."""
    value = os.getenv(name)
    if not value:
        raise RuntimeError(
            f"Missing required environment variable: {name}. "
            f"Set it in your shell, or copy .env.example to .env and fill it in."
        )
    return value

OPENAI_API_KEY = require_env("OPENAI_API_KEY")
OPENAI_BASE_URL = os.getenv("OPENAI_BASE_URL", "https://api.openai.com/v1")   # fine to default
REQUEST_TIMEOUT = float(os.getenv("REQUEST_TIMEOUT", "30"))                   # fine to default
```

Only the actual secret uses `require_env` and crashes if it's absent. Non-secret config like a base URL or timeout can safely fall back to a sane default — leaking a timeout value is not a security incident, so it's fine to bake `"30"` in as a fallback the same way you'd use any other default argument.

**5. Use it like any other import** — see [calling REST APIs with Python](/learn/python-data-apis/calling-rest-apis-with-python) for the request pattern itself:

```python
# main.py
import requests
from config import OPENAI_API_KEY, OPENAI_BASE_URL, REQUEST_TIMEOUT

response = requests.post(
    f"{OPENAI_BASE_URL}/chat/completions",
    headers={"Authorization": f"Bearer {OPENAI_API_KEY}"},
    json={
        "model": "gpt-4o-mini",
        "messages": [{"role": "user", "content": "Say hello in five words."}],
    },
    timeout=REQUEST_TIMEOUT,
)
response.raise_for_status()
print(response.json()["choices"][0]["message"]["content"])
```

Nowhere in `main.py` or `config.py` does an actual key appear. You could publish both files on the front page of GitHub and leak nothing.

**Now, precedence in action.** `load_dotenv()` deliberately does *not* overwrite a variable that's already set in the real environment — that's the mechanism that makes the layering from the mental model actually true:

```python
import os
from dotenv import load_dotenv

os.environ["REQUEST_TIMEOUT"] = "5"   # imagine this was set by: export REQUEST_TIMEOUT=5

load_dotenv()   # .env on disk says REQUEST_TIMEOUT=45

print(os.getenv("REQUEST_TIMEOUT"))   # "5" — the real env var wins, .env never overwrote it
```

This is exactly what you want: your platform's secret manager injects the real `OPENAI_API_KEY` as a genuine environment variable at deploy time, and it silently takes precedence over anything a stray `.env` file might contain — you don't need different code, or even a different `.env`, for the two environments.

**Now the leak scenario.** Suppose someone skips `config.py` and writes this instead:

```python
# DON'T DO THIS
api_key = "sk-proj-ab12cd34ef56...redacted"
response = requests.post(..., headers={"Authorization": f"Bearer {api_key}"})
```

```bash
git add main.py
git commit -m "wip: testing chat endpoint"
git push origin main
```

If that repo is public, the key is now compromised, full stop — regardless of intent. GitHub's secret-scanning partner program fingerprints known key formats in every public push and reports matches straight to the issuing provider; OpenAI is one of those partners. The key can be revoked automatically, sometimes before anyone even reviews the pull request.

The instinct at this point is to fix the file:

```bash
# This does NOT fix a leaked key:
git rm main.py
git commit -m "remove hardcoded key, oops"
git push
```

That's a patch, not a fix. The key string is still sitting in the repository's history — in the earlier commit, in anything that already cloned or forked the repo, in any cached view of the diff. Deleting the line only removes it from the tip of the default branch; the leak already happened the moment it was pushed.

> **Rotate, don't patch.** The moment you know a key leaked: (1) revoke or regenerate the credential at the provider immediately — this is the one action that actually neutralizes the leaked string; (2) update the new value everywhere it's used — your local `.env`, your CI secrets, your platform's config — never back in the source; (3) check the provider's usage or billing logs for the exposure window; (4) only then, if you want the string gone from history too, rewrite it with a tool like `git filter-repo` — this is cleanup, not the fix, and it doesn't matter if you skip it, because the rotated key is worthless to whoever has it.

## Where it shows up

This pattern isn't specific to OpenAI keys — it's the default way any real project handles anything sensitive:

- **Database connection strings** (`postgresql://user:password@host/db`) — same rules, same `.env` pattern, and if you're pairing this with data work, the same discipline applies before you ever get to [loading data into pandas](/learn/python-data-apis/loading-data-into-pandas).
- **Third-party API keys** — Stripe, Twilio, any LLM provider. See [authentication and API keys](/learn/python-data-apis/authentication-and-api-keys) for how these get attached to a request once they're safely loaded.
- **CI/CD secrets** — GitHub Actions, GitLab CI, and similar all have a dedicated encrypted secrets store precisely so a workflow can use a credential without it ever being visible in a log or a `.yml` file.
- **Cloud provider credentials** — AWS access keys, GCP service account JSON, all subject to the exact same "never in source" rule, usually with even higher blast radius if leaked.
- **Per-environment config** — one codebase, multiple `.env` files or platform-managed variable sets, for dev/staging/production, exactly as described in the mental model above.
- **Local development setup** — this is one of the first things you configure inside a fresh [virtual environment](/learn/python-data-apis/python-environments-and-venv), right alongside installing dependencies.

## Watch out for

**The `.env` file gets committed anyway.** This usually happens because the file existed before the `.gitignore` entry did, or because a sibling file like `.env.local` or `.env.backup` isn't covered by the exact pattern you wrote. Get in the habit of running `git status` before every commit and actually reading the file list — don't `git add .` on autopilot in a project that has secrets in it.

**The secret leaks somewhere other than the source file.** A `print(config)` for debugging, an unhandled exception whose traceback includes request headers, a Jupyter notebook whose *output cell* still holds the value even after you delete the input cell and the notebook gets committed with outputs intact — all of these put the secret in a place `.gitignore` was never protecting. Scrub secrets from anything you log, and clear notebook outputs before committing.

**Treating "removed from the file" as equivalent to "safe."** As the leak scenario above showed, git history is permanent by design. If a key was ever committed, the only credential-level fix is rotating it at the provider — not editing the file, not force-pushing over it, not apologizing in the next commit message. If you didn't rotate it, it's still live.

## Where next

Once this is second nature, [loading secrets with dotenv](/learn/python-data-apis/loading-secrets-with-dotenv) walks through `python-dotenv` in more depth, and [authentication and API keys](/learn/python-data-apis/authentication-and-api-keys) covers how a safely-loaded key actually gets attached to outgoing requests. Check your understanding with the [secrets & config quiz](/learn/python-data-apis/secrets-config-quiz).

**Related:** [Loading secrets with dotenv](/learn/python-data-apis/loading-secrets-with-dotenv) · [Authentication and API keys](/learn/python-data-apis/authentication-and-api-keys) · [Calling REST APIs with Python](/learn/python-data-apis/calling-rest-apis-with-python) · [Python environments and venv](/learn/python-data-apis/python-environments-and-venv) · [Secrets & config quiz](/learn/python-data-apis/secrets-config-quiz)
