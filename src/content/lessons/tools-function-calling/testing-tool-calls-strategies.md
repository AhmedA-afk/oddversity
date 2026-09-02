---
title: "Testing Tool Calls"
track: "tools-function-calling"
status: live
summary: "Three layers fail independently — model choice, handler logic, and the full loop — so test each one differently."
duration: "6 min read"
---

"The agent didn't work" can mean three unrelated things: the model picked the wrong tool, your handler crashed on valid arguments, or the loop as a whole never converged. Testing them the same way hides which one you're actually looking at.

## What it is

Tool-calling systems have three distinct layers, and each one needs a different kind of test:

1. **Selection** — did the model choose the right tool (or correctly choose none) for a given request? This requires the model in the loop and is inherently probabilistic — the same prompt can produce a different call on a different run.
2. **Execution** — given a specific set of arguments, does your dispatcher validate them and your handler produce the right result or a clean error? This is ordinary code, deterministic, and needs no model at all to test.
3. **Integration** — does the whole loop, model plus handler plus retry logic, actually complete the task across multiple turns? This is where selection and execution errors compound, and where timing- and state-dependent bugs live that neither layer catches alone.

## The mental model

Think of it like testing a web form: you don't test "does the user type the right thing" the same way you test "does the server reject a malformed request." One is about a choice a person (or model) makes; the other is about code behaving correctly regardless of that choice. Conflating them means a flaky selection test looks identical to a real handler bug, and you waste time debugging the wrong layer.

## Why it works this way

Selection tests are expensive and noisy — they call a real model, cost tokens, and can fail from ordinary sampling variance even when nothing is actually broken. Execution tests are cheap and deterministic — they're just unit tests against your own code, and they should never fail because a model felt like phrasing something differently today. If you only have integration tests, every failure requires you to manually trace back through both layers to find the actual cause; if you have all three, a failing execution test tells you immediately it's your code, not the model.

## A concrete example (shown)

A `book_flight` tool takes `origin`, `destination`, `date` (ISO 8601). Split across the three layers:

```python
# Layer 2 — execution, no model involved
def test_book_flight_rejects_bad_date():
    result = book_flight_handler(origin="SFO", destination="JFK", date="next tuesday")
    assert result["error"] == "date must be ISO 8601 (YYYY-MM-DD)"

# Layer 1 — selection, model involved, run against a labeled prompt set
def test_model_picks_book_flight():
    response = call_model("I need to fly from SF to New York next Tuesday", tools=[book_flight_schema])
    assert response.tool_calls[0].name == "book_flight"

# Layer 3 — integration, full loop
def test_full_booking_flow():
    transcript = run_agent_loop("Book me a one-way flight SFO to JFK for March 3rd")
    assert transcript.final_state == "confirmed"
```

Each assertion answers a different question, and each one fails for a different reason.

## Where it shows up

Every tool-calling agent needs all three, but most teams over-invest in layer 3 (it feels like "real" testing) and under-invest in layer 2 (it feels too simple to matter) — see [Unit-Testing Handlers and Replaying Traces](/learn/tools-function-calling/unit-testing-tool-handlers) for building that layer out properly, and [Debugging With Trace Logging](/learn/tools-function-calling/debugging-with-trace-logging) for instrumenting layer 3 so its failures are actually diagnosable instead of just visible.

## Watch out for

- **Treating a selection-test failure as a code bug.** If the model picked the wrong tool, the fix is usually a [tool description](/learn/tools-function-calling/writing-tool-descriptions-models-follow) or schema change, not a handler patch.
- **Skipping execution tests because "the model will just retry."** Retries paper over a genuinely broken handler; you want that caught in CI, not discovered live — see [Handling Tool Errors and Retries](/learn/tools-function-calling/handling-tool-errors-and-retries).
- **No fixtures from real failures.** Ad hoc test cases miss the exact malformed arguments a real model actually produces; the most valuable execution tests come from replaying logged production calls, not from ones you invent.

## Where next

[Unit-Testing Handlers and Replaying Traces](/learn/tools-function-calling/unit-testing-tool-handlers) builds out the deterministic layer in detail. [Benchmarking Tool Use With BFCL](/learn/tools-function-calling/benchmarking-with-bfcl) covers formalizing the selection layer into a repeatable eval.

**Related:** [Unit-Testing Handlers and Replaying Traces](/learn/tools-function-calling/unit-testing-tool-handlers), [Debugging With Trace Logging](/learn/tools-function-calling/debugging-with-trace-logging), [Testing and Debugging Tool Calls](/learn/tools-function-calling/testing-and-debugging-tool-calls), [Handling Tool Errors and Retries](/learn/tools-function-calling/handling-tool-errors-and-retries)
