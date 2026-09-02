---
title: "Debugging With Trace Logging"
track: "tools-function-calling"
status: live
summary: "Log every tool call as structured data and build a minimal trace viewer that shows exactly where an agent went wrong."
duration: "7 min read"
---

A stack trace tells you your code crashed. It tells you nothing about why the model called that tool with those arguments in the first place. Trace logging fixes that by recording the whole exchange, not just the failure.

## What we're building

An instrumented tool-call loop that logs every call, its arguments, its result, and its position in the conversation as one structured record — plus a minimal trace viewer to walk through a real agent run and find the exact turn it went off the rails.

## Setup

Assume a standard tool-call loop (see [The Tool Call Loop](/learn/tools-function-calling/the-tool-call-loop)). We'll log to newline-delimited JSON, one file per session, so records are both machine-parseable and diffable.

### Step 1: Wrap every tool call with a logger

```python
import json, time, uuid

def log_event(session_id: str, event: dict):
    event["session_id"] = session_id
    event["ts"] = time.time()
    with open(f"traces/{session_id}.jsonl", "a") as f:
        f.write(json.dumps(event) + "\n")

def instrumented_dispatch(session_id, iteration, tool_call, dispatch_fn):
    log_event(session_id, {
        "type": "tool_call",
        "iteration": iteration,
        "tool_name": tool_call.name,
        "arguments": tool_call.input,
        "call_id": tool_call.id,
    })
    result = dispatch_fn(tool_call)
    log_event(session_id, {
        "type": "tool_result",
        "iteration": iteration,
        "call_id": tool_call.id,
        "result": result,
    })
    return result
```

> **Why this step?** Logging the call and the result as two linked records (joined by `call_id`) rather than one combined blob means you can grep for either half independently — "every call to `charge_card`" or "every result that contained an error" — without parsing nested structure each time.

### Step 2: Log the model's reasoning turn too, not just the calls

```python
def instrumented_model_turn(session_id, iteration, messages, model_call_fn):
    response = model_call_fn(messages)
    log_event(session_id, {
        "type": "model_turn",
        "iteration": iteration,
        "text": getattr(response, "text", None),
        "tool_calls": [tc.name for tc in response.tool_calls] if response.tool_calls else [],
        "stop_reason": response.stop_reason,
    })
    return response
```

> **Why this step?** The tool call alone doesn't tell you *why* — the model's text before it (if any) plus `stop_reason` often shows whether it was reasoning toward the right goal or had already lost the thread. Log this even on iterations where no tool was called.

### Step 3: Build a minimal trace viewer

```python
def render_trace(session_id: str):
    with open(f"traces/{session_id}.jsonl") as f:
        events = [json.loads(line) for line in f]

    for e in sorted(events, key=lambda x: x["ts"]):
        if e["type"] == "model_turn":
            calls = ", ".join(e["tool_calls"]) or "(no tool call)"
            print(f"[{e['iteration']}] MODEL → {calls}")
        elif e["type"] == "tool_call":
            print(f"    → {e['tool_name']}({e['arguments']})")
        elif e["type"] == "tool_result":
            status = "ERROR" if e["result"].get("is_error") else "ok"
            print(f"    ← [{status}] {e['result']}")
```

> **Why this step?** You don't need a UI to get most of the value — a linear, timestamp-ordered printout of what the model decided and what came back is usually enough to spot the turn where it went wrong. Build a real dashboard only once this stops being sufficient.

### Step 4: Use it to find where a real agent broke

```
[3] MODEL → search_restaurants
    → search_restaurants({'cuisine': 'italian', 'city': 'Boston'})
    ← [ok] {'results': [{'id': 'r_882', 'name': 'Lupo'}, ...]}
[4] MODEL → book_table
    → book_table({'restaurant_id': 'r_991', 'party_size': 4, 'time': '19:00'})
    ← [ERROR] {'is_error': True, 'message': 'restaurant_id r_991 not found'}
[5] MODEL → book_table
    → book_table({'restaurant_id': 'r_991', 'party_size': 4, 'time': '19:00'})
    ← [ERROR] {'is_error': True, 'message': 'restaurant_id r_991 not found'}
```

Reading this top to bottom, the bug is visible immediately: `search_restaurants` returned `r_882`, but the model booked `r_991` — a ​stale or hallucinated ID that never came from the actual search result — and then retried the exact same wrong ID at iteration 5 instead of noticing the mismatch. No amount of staring at the handler's exception would have shown that; the handler is working correctly. This is a [hallucinated argument](/learn/tools-function-calling/hallucinated-tool-calls), and the fix is upstream of your code — likely returning fewer, more clearly labeled search results, or reinforcing in the tool description that `restaurant_id` must come verbatim from a prior `search_restaurants` result.

## Run it

Turn this on for every session in development, and sample a percentage of production traffic in production — full logging on every request is often too expensive to keep indefinitely, but you want enough coverage to catch new failure classes as they appear.

## Harden it

- Redact sensitive arguments (payment details, personal data) before writing to disk — a trace log is a new place secrets can leak from.
- Rotate and expire trace files; they're a debugging tool, not a permanent record.
- Correlate `session_id` with your application's own request ID so a user-reported bug can be traced back to its exact log file quickly.

## Extend it

Every trace where the agent got stuck or chose wrong is a candidate fixture for your regression suite — feed it straight into [Unit-Testing Handlers and Replaying Traces](/learn/tools-function-calling/unit-testing-tool-handlers). And a repeated pattern across many traces (the same tool consistently misused) is exactly the kind of signal a formal [eval harness](/learn/tools-function-calling/building-a-tool-use-eval-harness) should be tracking on every model or prompt change, not something you should have to rediscover by hand each time.

**Related:** [Testing Tool Calls](/learn/tools-function-calling/testing-tool-calls-strategies), [Unit-Testing Handlers and Replaying Traces](/learn/tools-function-calling/unit-testing-tool-handlers), [Hallucinated Tool Calls](/learn/tools-function-calling/hallucinated-tool-calls), [Debugging a Stuck Agent Loop](/learn/tools-function-calling/debugging-a-stuck-agent-loop)
