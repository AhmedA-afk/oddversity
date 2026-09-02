---
title: "Unit-Testing Handlers and Replaying Traces"
track: "tools-function-calling"
status: live
summary: "Test your dispatcher and handlers with mocked tool calls and real production traces, with no model in the loop."
duration: "7 min read"
---

Your handler code doesn't need a model to be wrong. This lesson tests it without one — mocked tool calls for the cases you can imagine, replayed production traces for the ones you couldn't.

## What we're building

A unit-test suite for the deterministic layer of a tool-calling system: a mocked `tool_call` object that exercises your dispatcher's validation and your handler's logic directly, plus a small library of fixtures pulled from real logged transcripts so regressions in either layer get caught before they ship.

## Setup

Assume a dispatcher function that takes a `tool_call` (name + arguments) and routes it to the right handler after validating arguments against the tool's schema — see [Building a Tool Dispatcher](/learn/tools-function-calling/building-a-tool-dispatcher) if that piece doesn't exist yet. We'll use plain `pytest`; any test framework works the same way.

### Step 1: Build a mock tool_call fixture

```python
from dataclasses import dataclass

@dataclass
class MockToolCall:
    id: str
    name: str
    input: dict

def make_call(name: str, **kwargs) -> MockToolCall:
    return MockToolCall(id="test-call-1", name=name, input=kwargs)
```

> **Why this step?** You want a fixture shaped exactly like what the real SDK hands your dispatcher, so a test failure means your code is wrong — not that your mock diverged from the real interface.

### Step 2: Test the validator in isolation

```python
def test_dispatcher_rejects_missing_required_field():
    call = make_call("book_flight", origin="SFO")  # missing destination, date
    result = dispatch(call)
    assert result["is_error"] is True
    assert "destination" in result["content"]

def test_dispatcher_rejects_wrong_type():
    call = make_call("book_flight", origin="SFO", destination="JFK", date="2026-03-03", passengers="two")
    result = dispatch(call)
    assert result["is_error"] is True
```

> **Why this step?** This is the layer that catches a malformed call *before* your handler runs at all — see [Validating Tool Arguments](/learn/tools-function-calling/validating-tool-arguments). Testing it separately from the handler means a validation bug and a handler bug never get confused for each other.

### Step 3: Test the handler directly, no dispatcher involved

```python
def test_book_flight_handler_success():
    result = book_flight_handler(origin="SFO", destination="JFK", date="2026-03-03")
    assert result["status"] == "confirmed"
    assert result["confirmation_id"]

def test_book_flight_handler_no_availability():
    result = book_flight_handler(origin="SFO", destination="XXX", date="2026-03-03")
    assert result["status"] == "error"
    assert "no flights found" in result["message"].lower()
```

> **Why this step?** Well-formed arguments can still hit a real-world failure — sold out, rate-limited, downstream API down. These paths matter as much as the happy path, and none of them need a model to test.

### Step 4: Build a fixture library from real traces

```python
import json, glob

def load_production_fixtures(path="fixtures/logged_calls/"):
    fixtures = []
    for file in glob.glob(f"{path}*.json"):
        with open(file) as f:
            record = json.load(f)
        fixtures.append(MockToolCall(
            id=record["tool_use_id"],
            name=record["tool_name"],
            input=record["arguments"],
        ))
    return fixtures

def test_all_logged_failures_now_pass():
    for call in load_production_fixtures("fixtures/regressions/"):
        result = dispatch(call)
        assert result["is_error"] is False, f"regression on {call.id}: {result}"
```

> **Why this step?** Every real production failure — a date the model phrased unexpectedly, a field it left null instead of omitting — becomes a permanent fixture the moment you fix it. This is what keeps a fix fixed when the next prompt or model version changes what the model tends to emit; pull these straight from your [trace logs](/learn/tools-function-calling/debugging-with-trace-logging).

## Run it

```bash
pytest tests/test_handlers.py -v
```

Run this on every commit that touches a handler or a schema. None of it calls a model, so it's fast enough for every PR, not just a nightly job.

## Harden it

- Assert on the *content* of results, not just the absence of an exception — a handler that silently returns an empty list on a real error is a passing test and a broken feature.
- Keep the fixture library growing: every new production incident gets a fixture before the ticket closes, not after.
- Separate "should raise a validation error" fixtures from "should raise a business-logic error" fixtures — they exercise different code paths and a merge of the two hides which one broke.

## Extend it

Once handler tests are solid, layer selection tests on top using the same fixture format — the arguments a real model actually produced, not ones you imagine it might. See [Testing Tool Calls](/learn/tools-function-calling/testing-tool-calls-strategies) for how the two layers fit together, and [Building Your Own Eval Harness](/learn/tools-function-calling/building-a-tool-use-eval-harness) for turning selection tests into something you track over time.

**Related:** [Testing Tool Calls](/learn/tools-function-calling/testing-tool-calls-strategies), [Debugging With Trace Logging](/learn/tools-function-calling/debugging-with-trace-logging), [Validating Tool Arguments](/learn/tools-function-calling/validating-tool-arguments), [Building a Tool Dispatcher](/learn/tools-function-calling/building-a-tool-dispatcher)
