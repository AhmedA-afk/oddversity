---
title: "Executing Parallel Calls Concurrently"
track: "tools-function-calling"
status: live
summary: "Run a batch of tool calls at the same time with asyncio.gather, keep results in order, and let one failure not sink the rest."
duration: "8 min read"
---

Receiving a batch of independent tool calls and then running them one after another anyway is the single most common way teams throw away the entire point of [Parallel Tool Calls](/learn/tools-function-calling/parallel-tool-calls). This builds the executor that actually captures the win.

## What we're building

A function that takes a turn's list of `tool_use` blocks, runs their handlers concurrently, and returns `tool_result` blocks in the shape [Parallel Tool Calls](/learn/tools-function-calling/parallel-tool-calls-mechanics) requires — one per call, matched by id — while making sure one handler raising an exception doesn't take down the other two that were running fine.

## Setup

Three illustrative "slow" tools, each simulating a real network call with `asyncio.sleep`:

```python
import asyncio
import json
import time

async def get_weather(city: str) -> dict:
    await asyncio.sleep(2.0)  # stand-in for a real HTTP call
    return {"city": city, "tempC": 22, "conditions": "cloudy"}

async def get_exchange_rate(currency: str) -> dict:
    await asyncio.sleep(1.5)
    return {"currency": currency, "rate_to_usd": 1.09}

async def get_local_news(city: str) -> dict:
    await asyncio.sleep(2.5)
    return {"city": city, "headline": "Transit line reopens after repairs"}

TOOL_REGISTRY = {
    "get_weather": get_weather,
    "get_exchange_rate": get_exchange_rate,
    "get_local_news": get_local_news,
}
```

Each is deliberately a different latency, so the concurrency win is visible rather than assumed.

## Build it

### Step 1 — dispatch a single call, capturing errors instead of raising

```python
async def run_one(tool_call: dict) -> dict:
    name = tool_call["name"]
    handler = TOOL_REGISTRY.get(name)
    if handler is None:
        return {"type": "tool_result", "tool_use_id": tool_call["id"],
                "content": json.dumps({"error": f"unknown tool: {name}"}), "is_error": True}
    try:
        result = await handler(**tool_call["input"])
        return {"type": "tool_result", "tool_use_id": tool_call["id"], "content": json.dumps(result)}
    except Exception as exc:
        return {"type": "tool_result", "tool_use_id": tool_call["id"],
                "content": json.dumps({"error": str(exc)}), "is_error": True}
```

> **Why this step?** Every failure mode — unknown tool, handler exception — turns into a normal `tool_result` with `is_error: true`, never a raised exception that escapes this function. That's what makes it safe to run several of these concurrently: nothing here can propagate an exception into `asyncio.gather` and abort the batch.

### Step 2 — run the whole batch concurrently

```python
async def execute_batch(tool_calls: list[dict]) -> list[dict]:
    results = await asyncio.gather(*(run_one(tc) for tc in tool_calls))
    return list(results)
```

> **Why this step?** `asyncio.gather` starts every coroutine immediately and returns when all of them finish, in the same order they were passed in — which is exactly the ordering guarantee you need to hand back to the model. Because `run_one` never raises, `gather`'s default behavior (abort all on first exception) never triggers; every call gets to finish on its own regardless of what the others do.

### Step 3 — wire it into the loop

```python
async def handle_turn(response, messages: list[dict]) -> bool:
    tool_uses = [b for b in response["content"] if b["type"] == "tool_use"]
    if not tool_uses:
        return False  # final answer, no more tools

    results = await execute_batch(tool_uses)
    messages.append({"role": "user", "content": results})
    return True
```

> **Why this step?** This slots directly into the loop from [Sequential, Multi-Step Tool Use](/learn/tools-function-calling/sequential-multi-step-tool-use) — the loop doesn't need to know or care whether `tool_uses` has one entry or five. Whether the turn was a single call or a parallel batch is invisible to the outer loop; `execute_batch` handles both because a single-element list is just a batch of one.

## Run it

Timing the three-tool batch against running the same three calls serially:

```python
async def serial_baseline(tool_calls: list[dict]) -> list[dict]:
    return [await run_one(tc) for tc in tool_calls]

calls = [
    {"id": "c1", "name": "get_weather", "input": {"city": "Nairobi"}},
    {"id": "c2", "name": "get_exchange_rate", "input": {"currency": "KES"}},
    {"id": "c3", "name": "get_local_news", "input": {"city": "Nairobi"}},
]

start = time.monotonic()
await serial_baseline(calls)
print(f"serial:     {time.monotonic() - start:.1f}s")   # ~6.0s — 2.0 + 1.5 + 2.5

start = time.monotonic()
await execute_batch(calls)
print(f"concurrent: {time.monotonic() - start:.1f}s")   # ~2.5s — the slowest single call
```

Serial pays the sum of every call's latency: 2.0 + 1.5 + 2.5 ≈ 6.0 seconds. Concurrent pays roughly the slowest one, 2.5 seconds, because all three are in flight at once. The gap between "sum of latencies" and "max of latencies" is exactly what parallel dispatch buys you, and it grows with every additional independent call you add to the batch.

## Harden it

- **Cap concurrency for large batches.** `asyncio.gather` on twenty calls fires twenty requests at once — fine for three, potentially a rate-limit violation for twenty against one downstream API. Wrap `run_one` calls with an `asyncio.Semaphore` sized to what your slowest downstream dependency can actually absorb.
- **Add a per-call timeout.** One hung network call inside a `gather` batch can stall the entire batch's return, even though `gather` isolates *exceptions* per task — it does not, on its own, isolate a task that never completes. Wrap each `handler(...)` call in `asyncio.wait_for` with a sane timeout, and return a timeout error as a normal `is_error` result rather than letting the batch hang indefinitely.
- **Watch for shared-state races.** Two calls in the same batch that both write to the same row or file can race in ways serial execution never exposed. If a tool has side effects, either make it safe under concurrency or keep it out of parallel batches — see [Parallel or Sequential?](/learn/tools-function-calling/parallel-vs-sequential-decision) for when that split matters.

## Extend it

The same `execute_batch` shape generalizes past "flat batch of independent calls" once some calls in a turn depend on others — that's the jump [Chaining Calls Into a DAG](/learn/tools-function-calling/chaining-into-dag-workflows) makes, and [Building a DAG Executor](/learn/tools-function-calling/building-a-tool-dag-executor) reuses this exact concurrent-dispatch pattern per graph layer instead of per turn.

**Related:** [Parallel Tool Calls](/learn/tools-function-calling/parallel-tool-calls-mechanics), [Parallel or Sequential?](/learn/tools-function-calling/parallel-vs-sequential-decision), [Handling Tool Errors and Retries](/learn/tools-function-calling/handling-tool-errors-and-retries), [Building a DAG Executor](/learn/tools-function-calling/building-a-tool-dag-executor)
