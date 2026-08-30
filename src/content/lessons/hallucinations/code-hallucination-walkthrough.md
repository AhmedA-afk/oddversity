---
title: "Worked Example: Hallucinated APIs and Slopsquatting"
track: "hallucinations"
status: live
summary: "A walkthrough of a model inventing a plausible async HTTP method and a matching fake package, and the supply-chain risk that follows it."
duration: "6 min read"
---

This carries one request all the way through: "fetch this URL asynchronously and pull out the JSON," and what a model does when it doesn't actually know the async HTTP library it reaches for.

## The setup

Prompt: *"Write a Python function that fetches a URL asynchronously and returns the parsed JSON body."* The model has seen plenty of `requests` code (synchronous) and plenty of `asyncio` code, and it blends them into something that looks like it should exist.

## Step by step

**Step 1 — the model picks a package name.**

```python
import requests_async

async def fetch_json(url: str) -> dict:
    response = await requests_async.get_json(url)
    return response
```

> **Why this step?** `requests` is the single most common HTTP library in Python training data, and `asyncio`-flavored wrappers of popular sync libraries are a real, common pattern (`aiohttp`, `httpx`, `asyncpg` all exist). `requests_async` is exactly the name you'd predict if you were pattern-completing "the async version of requests" — plausible enough that it briefly existed as an abandoned real project, which makes it an especially sharp example of the risk, not a random string a model made up from nothing.

**Step 2 — the model invents a method to match.**

`.get_json(url)` doesn't exist on any released version of any mainstream Python HTTP client. Real libraries split it into two calls — fetch, then parse:

```python
# what actually exists (using httpx, a real async client)
import httpx

async def fetch_json(url: str) -> dict:
    async with httpx.AsyncClient() as client:
        response = await client.get(url)
        return response.json()
```

> **Why this step?** `.get_json()` is a *reasonable API design* — arguably a nicer one than the real two-step version. That's exactly the tell: the model isn't reproducing a memorized signature, it's designing the API it thinks *should* exist. Convenience-shaped method names that collapse two real steps into one are one of the most common hallucinated-API patterns, because "this would be a clean method to offer" and "this method exists" are the same shape of judgment to a model that's optimizing for plausibility.

**Step 3 — the model documents the fake signature with full confidence.**

Asked to explain the function, a model will often produce something like: *"`requests_async.get_json(url)` sends an asynchronous GET request and returns the parsed JSON body directly, raising `requests_async.JSONDecodeError` on malformed responses."* Note what happened: it didn't just invent the call, it invented an exception type to go with it, filling out the API surface with the same fluent confidence it would use to describe `requests.get` — because at generation time, there is no internal difference between describing a real method and describing an invented one.

## Where it breaks — and the supply-chain risk on the other side of it

If this were the whole story, it would be a bug: the code fails at import time with `ModuleNotFoundError`, someone notices, someone fixes it. The actual risk is what happens when it *doesn't* fail.

This is **slopsquatting**: because models tend to hallucinate the *same* fake package names for the *same* kinds of prompts, attackers run large batches of common coding prompts against popular models, collect the invented names that show up repeatedly, and register those exact names on the real package index — loaded with malware. A name like `requests_async` is a good squatting target precisely because it's the kind of name many different developers' coding assistants will independently suggest. The next `pip install requests_async` that runs isn't hitting a 404. It's installing whatever the attacker put there. See [code hallucination and package slop](/learn/hallucinations/code-hallucination-and-package-slop) for the full mechanism and why pinning and lockfiles are the baseline defense.

**The fix for this specific walkthrough:** never run a generated install command without checking the package first, and prefer grounding library-specific code in the real docs (or a tool that can query the real package index) rather than trusting recall of an API surface the model may only have pattern-matched into existence — see [grounding with source documents](/learn/hallucinations/grounding-with-source-documents).

## Takeaways

- **The tells, in order of reliability:** a method name that's *too clean* for the real library (collapses two real steps into one); a method that "should" exist by analogy to a nearby real API; and — the most dangerous, because it hides the failure — zero error handling around the call, as if the model has never once seen this call fail. A model that's actually seen a real API in production code has usually also seen someone catch its real exceptions.
- Confident documentation of a nonexistent method is not evidence the method exists. It's evidence the model is fluent, which was never in question.
- Treat every generated dependency the way you'd treat any other unverified claim: format-plausible until resolved, never installed on the strength of the model sounding sure. [Implementation: a guard against hallucinated packages](/learn/hallucinations/detecting-package-slop-impl) builds exactly this check as a pre-run gate.

**Related:** [Code Hallucination and Package Slop](/learn/hallucinations/code-hallucination-and-package-slop), [Implementation: A Guard Against Hallucinated Packages](/learn/hallucinations/detecting-package-slop-impl), [Grounding: Constraining Answers to Supplied Sources](/learn/hallucinations/grounding-with-source-documents), [Worked Example: Fabricated Tool Names and Arguments](/learn/hallucinations/tool-call-argument-fabrication)
