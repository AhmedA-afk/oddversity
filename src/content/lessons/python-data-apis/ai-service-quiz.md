---
title: "Quiz: Building the Service"
track: "python-data-apis"
status: live
summary: "Six scenario-based MCQs on testing a Python AI service — pure functions, mocking for determinism, where validation lives in the module layout, injected vs imported config, and whic"
duration: "12 min read"
---

You've seen the shape of a well-structured service — a pure core, a client you can swap out, config that gets handed in rather than reached for. This is where you find out if it stuck, because every wrong answer below is a choice that passes code review and fails three weeks later when someone tries to test it.

All six questions assume the same layout from [structuring a Python AI service](/learn/python-data-apis/structuring-a-python-ai-service):

```
service/
  config.py     # ServiceConfig — no other module reads os.environ directly
  schemas.py    # Pydantic models: InputRecord, ModelOutput
  client.py     # the only module that talks to the network
  core.py       # pure business logic: transform, score, decide
  main.py       # entrypoint — wires the above together
```

## 1. Pure functions and testability

Two versions of the same function:

```python
# Version A
def clean_record(raw: dict) -> dict:
    return {
        "id": raw["id"],
        "text": raw["body"].strip(),
        "score": float(raw.get("score", 0.0)),
    }
```

```python
# Version B
import requests

def clean_record(item_id: str) -> dict:
    raw = requests.get(f"https://api.example.com/items/{item_id}").json()
    return {
        "id": raw["id"],
        "text": raw["body"].strip(),
        "score": float(raw.get("score", 0.0)),
    }
```

Why is Version A easier to test?

- A. Because it has fewer lines of code, so there's less to test.
- B. Because it takes its input as an argument and returns output with no hidden dependency on the network — a test can call it and assert on the result directly, with no mocking, no network access, and no ordering concerns.
- C. Because dictionary access is faster than making an HTTP request.
- D. Because pure functions never raise exceptions, so tests don't need to check for errors.

<details><summary>Answer</summary>

**Correct: B.** Version A's entire behavior is a function of its argument. `clean_record({"id": 1, "body": "  hi  ", "score": "0.9"})` either returns the right dict or it doesn't — there's nothing else to control. Version B has the same transformation logic buried inside a function that also owns an HTTP call, so testing the transformation means testing (or faking) the network too.

**A** is the trap that makes people think "simple code" and "testable code" are the same thing. They're correlated, not identical — you could write a 40-line pure function that's perfectly easy to test, or a 3-line impure one (like Version B, which isn't much longer) that isn't. What matters is *what the function depends on*, not how many lines it has.

**C** is true but irrelevant — the question is about testability, not performance. Speed differences between a dict lookup and an HTTP call are real, but they don't explain why one is easier to write a test for.

**D** is false on its face: `raw["id"]` in Version A will raise `KeyError` if the key is missing, same as it would anywhere else. Purity doesn't mean error-free — it means the function's failures are also deterministic and traceable to its input, which is exactly why they're easy to write a test for too (`clean_record({})` should raise `KeyError`, and you can assert that).

</details>

## 2. Mocking the API for determinism

```python
# client.py
def summarize(text: str, client=None) -> str:
    client = client or _default_client()
    response = client.chat.completions.create(
        model="gpt-x",
        messages=[{"role": "user", "content": text}],
    )
    return response.choices[0].message.content
```

```python
# test_client.py
from unittest.mock import MagicMock

def test_summarize_returns_message_content():
    fake_client = MagicMock()
    fake_client.chat.completions.create.return_value.choices = [
        MagicMock(message=MagicMock(content="a short summary"))
    ]
    result = summarize("long text goes here", client=fake_client)
    assert result == "a short summary"
```

Why does mocking the client keep this test deterministic, compared to letting `summarize` call the real API?

- A. Because mocks run faster than real network calls, and fast tests are more likely to be deterministic.
- B. Because the mock returns exactly the response you told it to, every time — so the test result depends only on `summarize`'s own logic, not on network latency, rate limits, model sampling temperature, or the API being temporarily down.
- C. Because `unittest.mock` automatically retries failed calls until they succeed.
- D. Because mocking removes the need to handle exceptions in the code under test.

<details><summary>Answer</summary>

**Correct: B.** A real call to an LLM API introduces at least three sources of nondeterminism you don't control: the model might sample a different completion, the network might be slow or drop, and the service might rate-limit or 500 on a bad day. `fake_client` has none of that — it's a plain Python object that returns the exact `MagicMock` structure you built. The only variable left in the test is whether `summarize` correctly pulls `.choices[0].message.content` out of it.

**A** confuses a nice side effect with the mechanism. Mocks are fast, and fast test suites are pleasant to run — but speed isn't why the *result* is deterministic. A fast flaky call is still flaky.

**C** describes something `unittest.mock` doesn't do at all — a `MagicMock` has no retry behavior; it just returns what you configured. If you want to test retry logic, you configure the mock to raise on the first call and succeed on the second, which is a different, deliberate setup (see [rate limits and retries](/learn/python-data-apis/rate-limits-and-retries)).
- 
**D** is backwards. Mocking doesn't remove the need for exception handling — it's actually what lets you *test* your exception handling, by configuring `fake_client.chat.completions.create.side_effect = SomeError()` and asserting `summarize` does the right thing. See [testing data pipelines](/learn/python-data-apis/testing-data-pipelines) for that pattern.

</details>

## 3. Where validation belongs

A teammate wants to enforce that `text` is non-empty and under 4000 characters before it ever reaches `core.py`. Given the layout above, where should that check live?

- A. Inside `core.py`'s business-logic functions, right before they use `text` — that's closest to where the value is actually consumed.
- B. In `schemas.py`, as part of the input model — `main.py` validates the moment a record enters the system, so anything that reaches `core.py` is already guaranteed valid.
- C. In `client.py`, immediately before the API call, since that's the boundary where a malformed payload does the most damage.
- D. It doesn't matter, as long as the check happens somewhere before the API call.

<details><summary>Answer</summary>

**Correct: B.** Validating at the entry point — with a [Pydantic model or similar contract](/learn/python-data-apis/data-contracts-and-validation) — means the check happens exactly once, fails fast with one clear error, and every function downstream (`core.py`, `client.py`) gets to *assume* valid input instead of re-checking it. That assumption is what keeps `core.py` pure and simple: no `if not text: raise ValueError(...)` scattered through five different functions.

**A** sounds reasonable ("check it where it's used") but it means every function that touches `text` needs its own copy of the same length check, and a bad record travels further into the system — through however much of `core.py` runs — before anything catches it. You've also just made a "pure business logic" function partly about input hygiene, which is a second job it didn't need.

**C** puts the check in the wrong place for a different reason: by the time data reaches `client.py`, `core.py` has already run on it. If the text was invalid, you've wasted work (and possibly produced a bad intermediate result) before finding out. It also tangles "is this data well-formed" with "how do I call the API," which makes `client.py` harder to reason about — that module should be worrying about auth, retries, and rate limits, not string lengths.

**D** — it does matter, concretely: one check at the boundary gives you one error message, one place to update the rule, and a `core.py`/`client.py` that never need defensive `if` statements. Scattering it "somewhere before the API call" gets you duplicate logic and inconsistent error messages the first time someone adds a second entrypoint (a CLI alongside the API route, say).

</details>

## 4. Config: inject or import?

```python
# Version A — config.py
import os
MODEL_NAME = os.environ["MODEL_NAME"]
MAX_RETRIES = int(os.environ.get("MAX_RETRIES", "3"))
```

```python
# Version A — core.py
from config import MODEL_NAME, MAX_RETRIES

def summarize(text: str) -> str:
    return call_model(text, model=MODEL_NAME, retries=MAX_RETRIES)
```

```python
# Version B — core.py
from dataclasses import dataclass

@dataclass
class ServiceConfig:
    model_name: str
    max_retries: int = 3

def summarize(text: str, config: ServiceConfig) -> str:
    return call_model(text, model=config.model_name, retries=config.max_retries)
```

You're about to write unit tests for `summarize`. Why prefer Version B?

- A. Because building a `ServiceConfig` object is faster than reading `os.environ` at import time.
- B. Because a test can pass in whatever `ServiceConfig` it wants — a fake model name, zero retries — without setting real environment variables or monkeypatching a module-level import. Each test controls its own config instead of sharing one global.
- C. Because Version A will crash if `MODEL_NAME` isn't set in the environment, and Version B never crashes.
- D. Because dataclasses automatically validate the types of their fields at runtime.

<details><summary>Answer</summary>

**Correct: B.** In Version A, `MODEL_NAME` and `MAX_RETRIES` are baked in the moment `config.py` is imported — anywhere. To test `summarize` with a different retry count, you'd need to `monkeypatch.setattr("config.MAX_RETRIES", 0)` and hope nothing else imported the old value first, or juggle real environment variables per test. In Version B, `config` is just a parameter — `summarize("hi", ServiceConfig(model_name="fake-model", max_retries=0))` is a normal function call. No patching, no shared global, no test-ordering surprises. This is the same idea covered in [secrets and config management](/learn/python-data-apis/secrets-and-config-management): read the environment once, at the edge, and hand the result down as data.

**A** isn't the reason, and it isn't even really true in any way that matters here — you're not choosing B for speed.

**C** contains a real observation wrapped in an overclaim. Version A genuinely does have a testability problem beyond the one this question is about: just *importing* `core.py` in a test file requires `MODEL_NAME` to already be set in the environment, or the import itself blows up. But "Version B never crashes" is false — nothing stops you from constructing `ServiceConfig(model_name="", max_retries=-1)`, and `call_model` will fail on that, just later. The dataclass doesn't protect you from bad values; it protects you from *hidden* values.

**D** is a common misconception about dataclasses: type hints on a `@dataclass` are not enforced at runtime. `ServiceConfig(model_name=123, max_retries="three")` constructs without complaint — the annotations are documentation, not validation. If you want real validation on the config object, that's what a Pydantic model buys you, not a plain dataclass.

</details>

## 5. Who owns retry logic

Given the same layout, where should retry-with-backoff for a transient API error (a rate limit or a dropped connection) live?

- A. Inside `core.py`'s business-logic functions, since that's where you know how important the operation is.
- B. In `client.py`, wrapping the actual network call — every caller gets the same retry behavior for free, and `core.py` never has a `try/except` or a `time.sleep` in it.
- C. In `main.py`'s route handler, so a single retry can cover the whole request — validation included — if anything in it fails.
- D. Split it: `client.py` retries once, and `core.py` retries again if that still fails, for defense in depth.

<details><summary>Answer</summary>

**Correct: B.** Retrying a rate-limited or dropped request is a *transport* concern — it has nothing to do with what the business logic is trying to accomplish, and everything to do with how flaky the network happens to be today. Putting it in `client.py` means every function that goes through the client gets consistent, tested backoff behavior automatically, and `core.py` stays pure: no `time.sleep`, no `except RateLimitError`, nothing that needs a mocked clock to test.

```python
# client.py
import time

def call_model(text: str, client, max_retries: int = 3) -> str:
    for attempt in range(max_retries):
        try:
            response = client.chat.completions.create(
                model="gpt-x",
                messages=[{"role": "user", "content": text}],
            )
            return response.choices[0].message.content
        except RateLimitError:
            if attempt == max_retries - 1:
                raise
            time.sleep(2 ** attempt)
```

**A** couples a network-flakiness concern to your business logic, and it doesn't scale — you'd need to copy the same `try/except`/`sleep` pattern into every function in `core.py` that eventually calls out, and now testing those functions requires mocking `time.sleep` too, which is exactly the kind of thing purity was supposed to save you from.

**C** retries too much at once. A validation failure in `main.py` is deterministic — retrying it changes nothing, you'll get the same rejection every time — while a network failure inside the request *might* succeed on a second attempt. Bundling them under one retry means you either waste attempts retrying things that can't succeed, or you accidentally re-run side effects (like a partially-completed action) that shouldn't happen twice. See [rate limits and retries](/learn/python-data-apis/rate-limits-and-retries) for why retry policy needs to know *which* failures are worth retrying.

**D** sounds like extra safety but it's the opposite: two independent retry loops multiply into a number of attempts nobody chose on purpose (3 in `client.py` × 2 in `core.py` = up to 6 real calls for one logical request), and now nobody can predict the worst-case latency or API cost of a single `summarize()` call by reading either function alone. Retry policy belongs in exactly one place.

</details>

## 6. What the test should actually check

Same `classify` function, two tests, both using a mock:

```python
# client.py
def classify(text: str, client) -> str:
    response = client.chat.completions.create(
        model="gpt-x",
        messages=[{"role": "user", "content": f"Classify: {text}"}],
    )
    return response.choices[0].message.content.strip().lower()
```

```python
# Test A
def test_classify_calls_api_correctly(fake_client):
    classify("free money now", fake_client)
    fake_client.chat.completions.create.assert_called_once_with(
        model="gpt-x",
        messages=[{"role": "user", "content": "Classify: free money now"}],
    )
```

```python
# Test B
def test_classify_returns_label(fake_client):
    fake_client.chat.completions.create.return_value.choices = [
        MagicMock(message=MagicMock(content="SPAM"))
    ]
    result = classify("free money now", fake_client)
    assert result == "spam"
```

Both mock the client. Which test is actually checking the thing that matters, and why?

- A. Test A — it verifies the exact prompt sent to the API, and getting the prompt right is the most important part of this function.
- B. Test B — it checks `classify`'s observable behavior: given a certain API response, does the function return the right label. Test A instead locks in an implementation detail (the exact call signature and prompt string) that breaks on a harmless refactor without ever touching the actual `response → label` logic.
- C. Neither — since both use mocks, neither one proves the code works against the real API.
- D. Test A — asserting on the arguments passed in is more of a true "unit" test than asserting on a return value.

<details><summary>Answer</summary>

**Correct: B.** `classify`'s job is: take an API response, produce a lowercase label. Test B exercises exactly that — it hands the function a response and checks the output. Test A never actually checks whether `classify` extracts and normalizes the label correctly; it would pass even if `.strip().lower()` were deleted entirely, because it only inspects what went *into* the mock, not what the function did with what came *out*. Worse, it breaks the moment someone reformats the prompt string ("Classify this: {text}" instead of "Classify: {text}") — a change that might not even affect correctness — because the assertion is pinned to the exact literal call.

**A** raises something real (prompt wording affects LLM output quality) but answers the wrong question. Whether a prompt is *well-written* is worth checking — with an eval against known inputs, not a unit test that string-matches it — but it's a different concern from whether `classify` correctly turns a response into a label. See [parsing and validating API responses](/learn/python-data-apis/parsing-and-validating-api-responses) for the response-handling half of this.

**C** is correct about the limits of mocking — neither test tells you the *real* API accepts this request shape or returns responses in this format, which is what an integration or contract test is for — but it dodges the actual question. Between these two tests, one is still doing useful work for its scope and one isn't; "both are equally limited" isn't true.

**D** invents a rule that doesn't exist. What makes Test A worse than Test B isn't that it "asserts on inputs" — it's that it asserts on *implementation* (exactly how `classify` happens to call the client) instead of *behavior* (what `classify` returns for a given response). Both tests are unit tests; only one of them tests the unit's job. This is a common way [mocking goes wrong](/learn/python-data-apis/api-calling-common-mistakes) once teams get comfortable with it — over-mocking turns tests into a change-detector for refactors instead of a safety net for bugs.

</details>

**Related:** [Structuring a Python AI service](/learn/python-data-apis/structuring-a-python-ai-service) · [Testing data pipelines](/learn/python-data-apis/testing-data-pipelines) · [Data contracts and validation](/learn/python-data-apis/data-contracts-and-validation) · [Secrets and config management](/learn/python-data-apis/secrets-and-config-management) · [Rate limits and retries](/learn/python-data-apis/rate-limits-and-retries) · [Messy data to LLM pipeline (capstone)](/learn/python-data-apis/messy-data-to-llm-pipeline-capstone)
