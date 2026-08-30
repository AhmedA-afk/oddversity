---
title: "Quiz: Secrets & Configuration"
track: "python-data-apis"
status: live
summary: "A 6-question scenario-based self-check on .gitignore judgment, why env vars beat hardcoded secrets, the correct incident response after a committed key, and the classic 'works on m"
duration: "12 min read"
---

Six scenarios, not six definitions — the way secrets actually go wrong is never "I didn't know what `.gitignore` does," it's misapplying the idea under time pressure. Work each one out before you open the answer.

## 1. What actually belongs in .gitignore

A teammate hands you a repo. Its entire `.gitignore` is one line:

```
config.py
```

`config.py` contains:

```python
DEFAULT_MODEL = "gpt-4o-mini"
MAX_RETRIES = 3
```

Meanwhile `.env`, which holds the real `OPENAI_API_KEY`, has no entry in `.gitignore` at all — it's tracked normally.

What's wrong here, and what should change?

- A) Nothing — `config.py` is configuration, and configuration is exactly what `.gitignore` is for.
- B) The `.gitignore` has it backwards: it hides a harmless, shareable file while leaving the actual secret tracked and exposed.
- C) Both files should be gitignored — anything with "config" in its name or purpose is sensitive by definition.
- D) Neither file needs to be gitignored — Python projects don't require a `.gitignore` for configuration.

<details><summary>Answer</summary>

**Correct: B.** `.gitignore` isn't a filter on "config" as a category — it's a filter on things that are secret, credential-bearing, or specific to one machine/environment (so committing them either leaks something or breaks for everyone else). `config.py` here has neither problem: `DEFAULT_MODEL` and `MAX_RETRIES` are exactly the kind of setting the whole team should see, and a change to either should show up as a reviewable diff. `.env`, on the other hand, holds a live credential and should never be tracked. The fix is to flip it: drop `config.py` from `.gitignore`, add `.env`. **A** mistakes "this file is called config" for "this file is sensitive" — plenty of config is meant to be shared and versioned, see [secrets and config management](/learn/python-data-apis/secrets-and-config-management) for the actual split. **C** overcorrects into gitignoring anything config-adjacent, which just means nobody can see or review your defaults. **D** is wrong on the facts — the repo clearly has a secret-bearing file that needs excluding.

</details>

## 2. Why env vars beat hardcoded strings

Two versions of the same function:

```python
# version A
API_KEY = "sk-proj-8f3a1c9d2e7b4a10"

def call_model(prompt):
    return client.chat.completions.create(model="gpt-4o-mini", messages=[{"role": "user", "content": prompt}])
```

```python
# version B
import os
API_KEY = os.environ["OPENAI_API_KEY"]

def call_model(prompt):
    return client.chat.completions.create(model="gpt-4o-mini", messages=[{"role": "user", "content": prompt}])
```

Your teammate says version A is fine "as long as the repo stays private." What's the strongest reason to prefer version B regardless?

- A) `os.environ` lookups are faster at runtime than reading a hardcoded constant.
- B) Python won't let you commit a file containing a literal API key — version A can't be pushed at all.
- C) Version B lets the same code run against different keys per environment (yours, a teammate's, staging, prod) and lets you rotate the key without touching or redeploying code — version A permanently welds the secret to the source.
- D) Version B encrypts the key automatically, while version A stores it in plaintext.

<details><summary>Answer</summary>

**Correct: C.** The win isn't really about "private vs. public" — it's that hardcoding ties one specific secret value to the source code forever. Every developer, every environment, and every future rotation now requires editing and redeploying code. With `os.environ`, the same `call_model` function runs identically for you, your teammate, CI, and production — each supplies its own value from outside the code. And "private repo" doesn't cover you as well as it feels like it does: repos get made public, forked, cloned to laptops, pasted into tickets, and git history outlives a visibility toggle. **A** is false — there's no meaningful performance difference; this was never a speed argument. **B** is false — Python has zero opinion about what string literals you write; nothing stops you from hardcoding a key, which is precisely why it's tempting. **D** is false — an environment variable is still plaintext, sitting in your shell, a `.env` file, or process memory; see [loading secrets with dotenv](/learn/python-data-apis/loading-secrets-with-dotenv). The benefit is separation of code from secret value, not encryption.

</details>

## 3. It works on your machine. Your teammate clones the repo and it doesn't.

Your script:

```python
from dotenv import load_dotenv
import os

load_dotenv()
api_key = os.getenv("OPENAI_API_KEY")

response = client.chat.completions.create(
    model="gpt-4o-mini",
    messages=[{"role": "user", "content": "hello"}],
)
```

This runs fine for you. A teammate `git clone`s the same repo, runs `pip install -r requirements.txt`, then runs the same script and gets:

```
openai.AuthenticationError: Incorrect API key provided: None.
```

What's the most likely cause?

- A) The teammate's Python version doesn't support `os.getenv`.
- B) `load_dotenv()` only works on the operating system it was originally written on.
- C) `.env` is (correctly) excluded from version control, so it never reached the teammate's clone — `os.getenv("OPENAI_API_KEY")` returns `None` because that variable doesn't exist anywhere on their machine.
- D) The teammate needs to run `pip install --upgrade openai` to fix the authentication error.

<details><summary>Answer</summary>

**Correct: C.** `.env` being gitignored is working exactly as intended — that's why it's excluded — but it means a fresh clone has no secrets at all. `load_dotenv()` silently finds no file, `os.getenv` returns `None`, and the API call fails with an error that *looks* like an auth problem (and technically is one — "None" isn't a valid key) but is really a missing-file problem. The fix isn't to commit `.env` — that defeats the point. It's to commit a `.env.example` with the variable names and no values (`OPENAI_API_KEY=`) and tell teammates to copy it to `.env` and fill in their own key; see [loading secrets with dotenv](/learn/python-data-apis/loading-secrets-with-dotenv) for the full pattern. **A** and **D** are the classic wrong reflex when you hit an auth error — blame the tooling or version before checking whether the secret exists at all; `os.getenv` has been in the standard library for decades and upgrading a package won't materialize a missing key. **B** is fabricated — `python-dotenv` behaves the same across operating systems; the difference between machines here is which files exist on disk, not which OS is running.

</details>

## 4. A key just got committed. What's the correct response?

```
$ git log --oneline -3
a1b2c3d fix typo
4d5e6f7 oops, remove key
890abcd add .env with real key
```

Your teammate says: "I noticed `.env` got committed with the real key, so I deleted the file and pushed a new commit removing it. We're good now, right?"

- A) Yes — the file is gone from the latest commit, so the key is no longer accessible to anyone.
- B) No — the key still exists in commit `890abcd`'s history (anyone who already cloned, or any bot scanning public commits, still has it). Treat the key as compromised and rotate/revoke it at the provider immediately; only then worry about cleaning history.
- C) No — deleting the file was fine, but they also need to add `.env` to `.gitignore` before this counts as fixed.
- D) Yes, as long as the repository stays private — only teammates with access could ever see the old commit.

<details><summary>Answer</summary>

**Correct: B.** Deleting a file in a later commit doesn't erase it from earlier commits — `git show 890abcd:.env` still prints the real key, and it will keep printing it for as long as that commit exists in any clone, fork, or CI cache. The one step you fully control is at the provider: revoke or rotate the credential so the leaked string stops working, regardless of who has seen it. History cleanup (`git filter-repo`, BFG, or just accepting the repo's history is tainted) matters too, but it's secondary — rotating is what actually neutralizes the leak, and it's true even for a key that was only ever public for a few minutes, since scanning tools move fast. **A** is the misunderstanding at the center of this question — git history is additive, not a stack where the last commit is the only one that exists. **C** describes good hygiene for *next time*, but as "the fix" for *this* leak it's a no-op — `.gitignore` only affects future tracking, not a credential already sitting in history. **D** confuses repo visibility (who can currently browse it) with whether the credential itself is still valid — the string is compromised the moment it's pushed anywhere outside your own head, private repo or not, since access lists change, repos get made public, and anyone who already cloned keeps their copy regardless.

</details>

## 5. You just added .env to .gitignore. Git still sees it.

```
$ echo ".env" >> .gitignore
$ git status
On branch main
Changes not staged for commit:
  modified:   .env
```

The developer is confused: "I just gitignored `.env` — why does git still track it?" What's going on, and what's the actual fix?

- A) `.gitignore` only takes effect after you commit it — commit, and `.env` will disappear from `git status`.
- B) `.env` was already tracked (added with `git add` in an earlier commit) before it was gitignored. `.gitignore` only stops git from picking up *new, untracked* files — to drop an already-tracked file, you have to explicitly untrack it with `git rm --cached .env`, then commit that.
- C) This is a bug — `.gitignore` should immediately hide any file it lists, tracked or not.
- D) `.gitignore` must be in the exact same folder as `.env`, so it's probably in the wrong directory.

<details><summary>Answer</summary>

**Correct: B.** `.gitignore` governs whether git starts tracking a file it hasn't seen before — it has no opinion about a file git is already tracking. Once something's been `git add`ed and committed, listing it in `.gitignore` afterward changes nothing about its tracked status; you have to say `git rm --cached .env` (removes it from the index, leaves it on disk) and commit that removal. And this only stops future commits from including it — per question 4, anything already committed is still sitting in history, so if the tracked `.env` ever held a real key, that key still needs rotating. **A** misreads the mechanism as a timing issue — it isn't about when you commit the `.gitignore` file, it's about whether the target file was tracked before the rule existed. **C** assumes this is broken behavior; it's deliberate — if `.gitignore` could silently untrack files, one typo in the file could make git "forget" things you meant to keep versioned, with no confirmation. **D** is a reasonable-sounding red herring: path mismatches do cause ignore rules to silently not apply, but that's not what's happening here — `git status` is showing `.env` as **modified**, which is only possible if git is already tracking it; a pure path/matching problem wouldn't produce that specific symptom.

</details>

## 6. The key is in an env var. It leaks anyway.

```python
import os
import requests

def call_llm(prompt):
    headers = {"Authorization": f"Bearer {os.environ['OPENAI_API_KEY']}"}
    try:
        r = requests.post("https://api.example.com/v1/generate", headers=headers, json={"prompt": prompt})
        r.raise_for_status()
        return r.json()
    except requests.HTTPError as e:
        print(f"Request failed: {e}, headers sent: {headers}")
        raise
```

This service correctly loads its key from an environment variable rather than hardcoding it. Which part of this code most likely leaks the secret anyway?

- A) The line building `headers` with the key — constructing an `Authorization` header always exposes the key.
- B) `os.environ['OPENAI_API_KEY']` — reading from an environment variable is inherently less secure than a config file.
- C) The `except` block's `print`, which dumps the full `headers` dict — live key included — to stdout or a log file every time a request fails. Logs routinely end up somewhere less protected than the `.env` file ever was: log aggregators, error trackers, terminal scrollback, support tickets.
- D) `requests.post` — sending the key over the network exposes it to anyone monitoring traffic.

<details><summary>Answer</summary>

**Correct: C.** "Not hardcoded in git" and "never exposed anywhere" are different guarantees, and this code satisfies only the first one. The moment a request fails, the debug `print` writes the live bearer token to whatever's capturing stdout — and that's often a much wider audience than the original `.env` file ever had: a shared CI log, an error-tracking dashboard, a teammate's terminal during a screen share. The fix is to never log credential-bearing structures directly — redact before logging, e.g. `{**headers, "Authorization": "Bearer ***"}`, or log only the status code and a non-secret excerpt of the payload. **A** confuses using the key (required to call the API at all, see [authentication and API keys](/learn/python-data-apis/authentication-and-api-keys)) with logging it — building the header in memory to send one request isn't a leak; what you do with that value afterward is. **B** is a myth — reading from `os.environ` is the recommended pattern, not a weaker one; the vulnerability here is a mistake layered on top of it, not the env var itself. **D** ignores that the URL is `https://`, meaning the request body and headers are encrypted in transit; if anything here defeats the network protocol's job, it's putting the same secret in plaintext in a log file right afterward.

</details>

**Related:** [Secrets and config management](/learn/python-data-apis/secrets-and-config-management) · [Loading secrets with dotenv](/learn/python-data-apis/loading-secrets-with-dotenv) · [Authentication and API keys](/learn/python-data-apis/authentication-and-api-keys) · [API calling common mistakes](/learn/python-data-apis/api-calling-common-mistakes) · [Python environments and venv](/learn/python-data-apis/python-environments-and-venv)
