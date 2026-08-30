---
title: "A Bounded Repair Loop"
track: "structured-outputs"
status: live
summary: "A working repair loop that feeds validation errors back to the model, capped at N attempts, with a graceful give-up path."
duration: "8 min read"
---

The second rung of [the repair ladder](/learn/structured-outputs/auto-repair-strategies) is a loop, and a loop without a hard ceiling is a liability. This lesson builds the whole thing: the correction message, the cap, and the honest failure path.

## What we're building

A function, `repair_loop`, that takes a schema, a bad response, and a callable that can ask the model to try again. It re-validates after every attempt, stops the moment validation passes, and returns a typed "gave up" result — never an unhandled exception — if it exhausts its attempt budget.

## Setup

Python, Pydantic v2, and a `model_call(prompt: str) -> str` function standing in for your actual API client.

## Build it

### Step 1: Build the correction message from the real error, every time

```python
def build_correction_prompt(schema_json: str, bad_output: str, errors: list[dict]) -> str:
    error_lines = "\n".join(
        f"- field \"{'.'.join(str(p) for p in e['loc'])}\": {e['msg']} (got: {e['input']!r})"
        for e in errors
    )
    return f"""Your last response failed schema validation.

Schema:
{schema_json}

Your response:
{bad_output}

Validation errors:
{error_lines}

Return the corrected JSON only, matching the schema exactly. No other text.
"""
```

The prompt is rebuilt from the latest errors on every single attempt — never cached from attempt one and reused. If attempt two produces a *different* mistake than attempt one, the model needs to see that new mistake, not be re-shown the old one.

### Step 2: One attempt — call, parse, validate

```python
from pydantic import BaseModel, ValidationError
import json

def attempt(prompt: str, schema: type[BaseModel], model_call) -> tuple[BaseModel | None, list[dict] | None, str]:
    raw = model_call(prompt)
    try:
        parsed = json.loads(raw)
    except json.JSONDecodeError as e:
        return None, [{"loc": (), "msg": f"invalid JSON: {e}", "input": raw}], raw
    try:
        return schema.model_validate(parsed), None, raw
    except ValidationError as e:
        return None, e.errors(), raw
```

This reuses the parse-then-validate split from [Validate, Then Branch](/learn/structured-outputs/validate-then-branch-pipeline) — a syntactic failure and a structural failure both come back as an error list the correction prompt can describe, but they're diagnosed separately so the log always shows which kind of mistake actually happened.

### Step 3: The bounded loop itself

```python
from dataclasses import dataclass

@dataclass
class RepairResult:
    success: bool
    value: BaseModel | None
    attempts: int
    final_errors: list[dict] | None

def repair_loop(
    schema: type[BaseModel],
    initial_output: str,
    initial_errors: list[dict],
    model_call,
    max_attempts: int = 3,
) -> RepairResult:
    bad_output, errors = initial_output, initial_errors
    schema_json = json.dumps(schema.model_json_schema())

    for attempt_num in range(1, max_attempts + 1):
        prompt = build_correction_prompt(schema_json, bad_output, errors)
        value, errors, bad_output = attempt(prompt, schema, model_call)

        if value is not None:
            return RepairResult(success=True, value=value, attempts=attempt_num, final_errors=None)

        # errors changed shape every loop — logged here so a stuck loop
        # is visible in the logs, not just in a final failure
        print(f"[repair] attempt {attempt_num} still failing: {errors}")

    return RepairResult(success=False, value=None, attempts=max_attempts, final_errors=errors)
```

`max_attempts` is a hard, non-negotiable ceiling. There is no path through this function that calls the model a fourth time. The loop's only two exits are "validation passed" and "budget exhausted" — both return a typed `RepairResult`, so the caller never has to guess which happened.

### Step 4: Wire the give-up path to something real

```python
def handle_repair_result(result: RepairResult, ticket_id: str):
    if result.success:
        return result.value
    # exhausted the budget without a valid object — this is not a crash,
    # it's a routed decision (see When to Reject Instead of Repair)
    send_to_human_review(ticket_id, reason=result.final_errors)
    return None
```

A `RepairResult(success=False, ...)` is not an error state to swallow — it's the reject branch from [Validate, Then Branch](/learn/structured-outputs/validate-then-branch-pipeline) getting exercised for real.

## Run it

**Case A — fixed in one round.** The mock model gets a wrong-type field and returns a corrected value the moment it sees the specific error:

```python
def mock_model_fixes_type(prompt: str) -> str:
    return '{"id": "t9", "priority": 3, "status": "open"}'

initial = '{"id": "t9", "priority": "high", "status": "open"}'
initial_errors = [{"loc": ("priority",), "msg": "should be an integer", "input": "high"}]

result = repair_loop(Ticket, initial, initial_errors, mock_model_fixes_type, max_attempts=3)
print(result.success, result.attempts)   # True 1
```

**Case B — genuinely unfixable, gives up gracefully.** The mock model keeps returning the same out-of-set enum value no matter what it's told:

```python
def mock_model_stuck(prompt: str) -> str:
    return '{"id": "t9", "priority": 3, "status": "closed-ish"}'  # never in the allowed set

result = repair_loop(Ticket, initial, initial_errors, mock_model_stuck, max_attempts=3)
print(result.success, result.attempts, result.final_errors)
# False 3 [{'loc': ('status',), 'msg': "Input should be 'open', 'pending' or 'resolved'", ...}]
```

Three attempts, three identical failures, and a clean `success=False` — not an exception, not a fourth silent retry, and not data flowing downstream with a bad `status` value hiding inside it.

## Harden it

- **Cap cost, not just count.** Three attempts against a huge schema and a long input can still be expensive. Track cumulative tokens spent across the loop and cut it short on a cost ceiling too, independent of `max_attempts`.
- **Log every attempt's errors, even on eventual success.** A repair that took three tries and "worked" is still worth knowing about — a rising repair rate for one schema is an early warning the prompt or schema has drifted, the exact blind spot [Repair-Loop Mistakes](/learn/structured-outputs/repair-loop-mistakes) calls out.
- **Never widen the schema mid-loop to make a stubborn field pass.** If `status` keeps failing, the fix is a better prompt or [a redesigned enum](/learn/structured-outputs/enums-and-constrained-fields) at design time — not loosening the validator inside the retry path itself.

## Extend it

Swap the plain re-ask on the final attempt for [constrained regeneration](/learn/structured-outputs/constrained-decoding-under-the-hood) — if two plain re-asks haven't worked, the third rung of [the repair ladder](/learn/structured-outputs/auto-repair-strategies) is worth its extra cost. And before reaching for a fourth attempt "just this once," read [When to Reject Instead of Repair](/learn/structured-outputs/when-not-to-repair) — some failures are a signal to stop trying, not to try harder.

**Related:** [The Repair Ladder](/learn/structured-outputs/auto-repair-strategies), [Validate, Then Branch](/learn/structured-outputs/validate-then-branch-pipeline), [Always Validate at the Boundary](/learn/structured-outputs/the-validation-layer), [Repair-Loop Mistakes](/learn/structured-outputs/repair-loop-mistakes), [When to Reject Instead of Repair](/learn/structured-outputs/when-not-to-repair), [Validation and Auto-Repair](/learn/structured-outputs/validation-and-auto-repair)
