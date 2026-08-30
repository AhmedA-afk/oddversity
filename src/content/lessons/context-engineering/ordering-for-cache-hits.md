---
title: "Ordering for Cache Hits"
track: "context-engineering"
status: live
summary: "Refactor a request-builder so the stable prefix is truly immutable and every volatile field lands after it, then measure the hit rate."
duration: "9 min read"
---

Knowing the rule — stable content first, volatile content last — doesn't guarantee a codebase follows it. Request-building code accretes small conveniences over time, and one of the most common is exactly the thing that quietly destroys a cache hit rate: a "helpful" timestamp or session marker dropped into the system prompt because it seemed like the natural place to put it. This builds the refactor that finds and fixes that, plus the instrumentation to prove it worked.

## What we're building

A `build_request()` function, refactored in place, that produces a request where everything before the last cache breakpoint is byte-identical across calls whenever the underlying instructions and tools haven't changed — and a small logging wrapper that reports the actual cache-hit rate from `response.usage` on every call, so the fix is verified against real numbers instead of assumed.

## Setup

Starting point: an agent's request builder that works correctly but was never written with caching in mind.

```python
import json
from datetime import datetime

TOOLS = load_tool_defs()  # returns a list, order not guaranteed

def build_request_v1(user_message, history):
    system_prompt = f"""You are a support agent. Today's date is {datetime.now().isoformat()}.
Tools available: {json.dumps(TOOLS)}
Always be concise and cite the ticket number when relevant."""
    return {
        "system": system_prompt,
        "messages": history + [{"role": "user", "content": user_message}],
    }
```

## Build it

### Step 1: Classify every part of the request by volatility

Before touching code, list what's actually in the request and mark each piece stable or volatile:

| Content | Volatility |
|---|---|
| "You are a support agent... be concise..." | Stable — never changes |
| `datetime.now().isoformat()` | Volatile — different every call |
| `json.dumps(TOOLS)` | Should be stable, but isn't guaranteed to serialize identically |
| Conversation history | Semi-stable — append-only, grows but doesn't rewrite |
| Current user message | Volatile — always new |

The date is the actual bug. It's sitting inside the system prompt, ahead of everything else in the request, which means the entire prefix diverges from token one on every single call — the tools list and instructions never get a chance to be reused, even though they never change.

### Step 2: Confirm the break with a diagnostic

```python
def prefix_diverges_at(req_a: dict, req_b: dict) -> int:
    a, b = json.dumps(req_a["system"]), json.dumps(req_b["system"])
    for i, (ca, cb) in enumerate(zip(a, b)):
        if ca != cb:
            return i
    return min(len(a), len(b))

r1 = build_request_v1("hello", [])
r2 = build_request_v1("hello", [])
print(prefix_diverges_at(r1, r2))  # small number - breaks almost immediately, inside the date string
```

> **Why this step?** Don't guess where a cache is breaking — measure it. A diff at position 30-something (right where the ISO timestamp starts) confirms exactly what's invalidating the prefix, rather than assuming.

### Step 3: Freeze the stable content, move volatile content to the boundary

```python
STATIC_SYSTEM_PROMPT = (
    "You are a support agent. "
    "Always be concise and cite the ticket number when relevant."
)
FROZEN_TOOLS = sorted(load_tool_defs(), key=lambda t: t["name"])  # computed once, at import time

def build_request_v2(user_message, history):
    return {
        "system": [
            {"type": "text", "text": STATIC_SYSTEM_PROMPT, "cache_control": {"type": "ephemeral"}},
        ],
        "tools": FROZEN_TOOLS,
        "messages": history + [
            {"role": "user", "content": f"[{datetime.now().isoformat()}] {user_message}"},
        ],
    }
```

> **Why this step?** The date now lives in the last message, strictly after the cache breakpoint on the system prompt. It can change on every call without touching a single byte of what's already cached — the model still sees the date, it just no longer sits where it can break the prefix.

### Step 4: Freeze tool serialization, not just the tool content

```python
FROZEN_TOOLS = sorted(load_tool_defs(), key=lambda t: t["name"])
```

> **Why this step?** `load_tool_defs()` returning "the same tools" isn't the same guarantee as returning them in the same *order*, byte for byte, every time — a dict or set-backed implementation can silently reorder between calls even when nothing about the tools themselves changed. Sorting once and freezing the result at import time removes that as a variable entirely.

### Step 5: Instrument the actual hit rate

```python
def call_and_log(client, request):
    resp = client.messages.create(**request)
    u = resp.usage
    total = u.input_tokens + u.cache_read_input_tokens + u.cache_creation_input_tokens
    hit_rate = u.cache_read_input_tokens / total if total else 0
    print(f"read={u.cache_read_input_tokens} write={u.cache_creation_input_tokens} "
          f"fresh={u.input_tokens} hit_rate={hit_rate:.0%}")
    return resp
```

> **Why this step?** "It should be cached now" is a hypothesis, not a result. `response.usage` is the only source of truth on whether a given call actually hit the cache — see [Measuring Cache Savings](/learn/context-engineering/measuring-cache-savings) for turning this into a full cost comparison.

## Run it

Five calls with `build_request_v1` (the buggy version):

```
read=0 write=0 fresh=2551 hit_rate=0%
read=0 write=0 fresh=2551 hit_rate=0%
read=0 write=0 fresh=2551 hit_rate=0%
read=0 write=0 fresh=2551 hit_rate=0%
read=0 write=0 fresh=2551 hit_rate=0%
```

Flat zero, every time — exactly what you'd expect once the timestamp is confirmed to sit inside the prefix. Five calls with `build_request_v2`:

```
read=0    write=2500 fresh=51  hit_rate=0%
read=2500 write=0    fresh=61  hit_rate=98%
read=2500 write=0    fresh=58  hit_rate=98%
read=2500 write=0    fresh=64  hit_rate=98%
read=2500 write=0    fresh=59  hit_rate=98%
```

The first call still has to populate the cache — that's expected and unavoidable. Every call after it reads the same 2,500-token stable prefix instead of recomputing it, with only the handful of new tokens (the timestamp-tagged user message) processed fresh each time.

## Harden it

- **Canonicalize serialization everywhere the prefix touches JSON.** `json.dumps(..., sort_keys=True)` at every point volatile-looking metadata might sneak into a "stable" structure, not just in the obvious places.
- **Add a regression test.** Build the same logical request twice and assert the stable portion is byte-identical:
  ```python
  def test_prefix_is_stable():
      r1, r2 = build_request_v2("hi", []), build_request_v2("bye", [])
      assert json.dumps(r1["system"]) == json.dumps(r2["system"])
      assert json.dumps(r1["tools"]) == json.dumps(r2["tools"])
  ```
  This catches a future refactor that reintroduces the same bug before it ships, rather than after a week of a flat 0% hit rate in production.
- **Watch for mid-conversation edits.** Editing or reordering an earlier turn in `history` — even a small cleanup — invalidates every cache entry built on top of it. See [Cache and Merge Mistakes](/learn/context-engineering/cache-invalidation-mistakes) for the full catalog of ways this shows up.

## Extend it

Add a second cache breakpoint for a large, session-stable reference document that sits between the frozen system prompt and the growing history — see [Cache-Aware Context Design](/learn/context-engineering/cache-aware-context-design-deep) for why a single breakpoint under-serves that layout. Then wire the `call_and_log` instrumentation into wherever the rest of your token spend is already tracked, so cache performance shows up next to everything else — see [Context Observability and Token Accounting](/learn/context-engineering/context-observability-and-token-accounting).

**Related:** [Cache-Aware Context Design](/learn/context-engineering/cache-aware-context-design-deep) · [How Prompt Caching Works](/learn/context-engineering/prompt-caching-mechanics) · [Measuring Cache Savings](/learn/context-engineering/measuring-cache-savings) · [Cache and Merge Mistakes](/learn/context-engineering/cache-invalidation-mistakes)
