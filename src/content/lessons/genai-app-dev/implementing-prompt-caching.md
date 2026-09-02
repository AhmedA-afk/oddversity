---
title: "Implementing Prompt Caching"
track: "genai-app-dev"
status: live
summary: "Add cache breakpoints around a stable context, verify the hit rate, and layer an exact-match response cache on top."
duration: "8 min read"
---

[Prompt Caching for Speed and Cost](/learn/genai-app-dev/prompt-caching) covered what makes a prefix cacheable. This lesson builds it: breakpoints around a real stable context, a way to verify the cache is actually being hit, and a second, cheaper layer for when the entire request repeats.

## What we're building

A document Q&A endpoint that caches a large reference document as a stable prefix, instrumentation that reports the before/after cost and confirms the cache is landing, and an exact-match response cache in front of the model call for the case where the exact same question comes in twice.

## Setup

```bash
pip install anthropic
```

The examples use `claude-sonnet-5` ($2.00 / $10.00 per million input / output tokens) with a 5,000-token reference document as the stable prefix.

## Build it

### Place the breakpoint after the stable block

```python
import anthropic

client = anthropic.Anthropic()

REFERENCE_DOC = load_reference_document()  # ~5,000 tokens, static per release

def ask(question: str):
    return client.messages.create(
        model="claude-sonnet-5",
        max_tokens=1024,
        system=[
            {"type": "text", "text": "You answer questions using only the reference document below."},
            {"type": "text", "text": REFERENCE_DOC, "cache_control": {"type": "ephemeral"}},
        ],
        messages=[{"role": "user", "content": question}],
    )
```

> **Why this step?** The `cache_control` breakpoint sits on the last block of the stable content — the instructions and the document — so everything up to and including it is what gets matched on the next call. The question, which is always different, stays outside the cached region entirely.

### Verify the hit, don't assume it

```python
def ask_and_report(question: str):
    response = ask(question)
    u = response.usage
    print(f"write={u.cache_creation_input_tokens} read={u.cache_read_input_tokens} "
          f"uncached_input={u.input_tokens} output={u.output_tokens}")
    return response

ask_and_report("What's the refund window?")
# write=5012 read=0 uncached_input=9 output=41        <- first call: cache miss, writes the prefix
ask_and_report("Does that apply to the enterprise plan?")
# write=0 read=5012 uncached_input=11 output=38        <- second call: cache hit
```

> **Why this step?** `cache_read_input_tokens` staying at zero across calls that should share a prefix is the single most common silent failure in this pattern — a stray timestamp, an unsorted tool list, or a reordered system block ahead of the breakpoint will break the match with no error raised. Checking usage on every call, not just trusting that caching is "on," is what catches it.

### Do the before/after arithmetic

Using the published approximate multipliers — cache writes cost about 1.25x the normal input rate, cache reads about 0.1x — a 10-question session against the same document:

**Without caching**, every call pays full price for the 5,000-token document plus its own question and answer (~5,050 input tokens, ~200 output tokens per call at Sonnet 5 rates):

```
per_call = (5050 / 1_000_000) * 2.00 + (200 / 1_000_000) * 10.00
         = 0.0101 + 0.0020 = $0.0121
10 calls = $0.121
```

**With caching**, the first call writes the document to cache; the next nine read it:

```
first_call  = (5000/1e6)*2.00*1.25 + (50/1e6)*2.00 + (200/1e6)*10.00 = $0.0146
each_repeat = (5000/1e6)*2.00*0.1  + (50/1e6)*2.00 + (200/1e6)*10.00 = $0.0031
10 calls = 0.0146 + 9 * 0.0031 = $0.0425
```

That's roughly a 65% cost reduction for this session shape, and it grows with session length — the document's cost is paid essentially once no matter how many questions follow. These multipliers are the provider's published approximations, not a guarantee; always confirm against `usage.cache_creation_input_tokens` and `usage.cache_read_input_tokens` on your own traffic rather than trusting the arithmetic alone.

### Layer an exact-match response cache on top

Prompt caching still pays for the uncached question and re-runs generation every time. If the exact same question comes in twice — a common pattern for FAQ-style features — skip the model call entirely.

```python
import hashlib
import json

_response_cache: dict[str, str] = {}

def cache_key(question: str) -> str:
    normalized = question.strip().lower()
    return hashlib.sha256(normalized.encode()).hexdigest()

def ask_with_response_cache(question: str) -> str:
    key = cache_key(question)
    if key in _response_cache:
        return _response_cache[key]  # zero cost, zero latency

    response = ask(question)
    answer = next(b.text for b in response.content if b.type == "text")
    _response_cache[key] = answer
    return answer
```

> **Why this step?** This is a different layer than prompt caching — it's an exact match on the *entire* normalized question, held app-side (Redis in production, not an in-memory dict), and it eliminates the call entirely rather than making it cheaper. It only fires on identical questions; a true semantic cache that matches near-duplicate phrasing needs an embedding similarity check and a similarity threshold, which trades a correctness risk (two questions that read as "close" but need different answers) for a higher hit rate — treat that as a deliberate, tested extension, not a default.

## Run it

```python
ask_and_report("What's the refund window?")     # cache miss, writes prefix
ask_and_report("What's the refund window?")     # response cache hit — no model call at all
ask_and_report("Does that apply to enterprise?") # prompt-cache hit, new question, real call
```

## Harden it

- **Cap the response cache's memory and add a TTL.** Reference content changes; a response cache with no invalidation path will confidently serve a stale answer forever. Tie its TTL to how often the underlying document actually changes.
- **Cap the prompt-cache TTL to your traffic pattern**, not the maximum available — a longer TTL held on content nobody calls again in time just pays the write premium for nothing.
- **Log cache reads and writes as part of your [usage log](/learn/genai-app-dev/token-accounting-and-quotas)**, not separately, so a cost regression shows up in the same place every other regression does.

## Extend it

This is the caching half of the systems view the module builds toward — pairing a cached prefix with streaming (a cached prefix still streams its output token by token, cache or no cache) and background batching is covered fully in [Streaming, Caching, and Batching Together](/learn/genai-app-dev/streaming-caching-batching-together). For requests where even a cache miss is too slow, the next lever is routing cheap attempts to a cheaper model first — see [Cutting Cost With a Model Cascade](/learn/genai-app-dev/cutting-cost-with-model-cascade).

**Related:** [Prompt Caching for Speed and Cost](/learn/genai-app-dev/prompt-caching), [Token Accounting and Per-User Quotas](/learn/genai-app-dev/token-accounting-and-quotas), [Streaming, Caching, and Batching Together](/learn/genai-app-dev/streaming-caching-batching-together), [Cutting Cost With a Model Cascade](/learn/genai-app-dev/cutting-cost-with-model-cascade)
