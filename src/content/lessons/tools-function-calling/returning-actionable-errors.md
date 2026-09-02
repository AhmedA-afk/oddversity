---
title: "Returning Errors the Model Can Act On"
track: "tools-function-calling"
status: live
summary: "Build an error formatter that turns exceptions into corrective guidance a model can actually use — not a stack trace."
duration: "7 min read"
---

The difference between an agent that recovers from a bad tool call and one that spirals is usually one string: what your code puts in the `error` field of the tool result.

## What we're building

An error formatter — one function that sits between "an exception was raised" and "a tool result goes back to the model." It takes whatever your tool code threw and returns a small, structured object with three properties: it names the failure type, it says exactly what was wrong, and it never leaks internals (file paths, stack frames, connection strings, secrets) that the model has no use for and your logs shouldn't be broadcasting into a conversation.

## Setup

Assume a `book_flight` tool with a Pydantic-style schema and a dispatcher that calls it:

```python
from datetime import date
from pydantic import BaseModel, ValidationError, field_validator

class BookFlightArgs(BaseModel):
    origin: str
    destination: str
    depart_date: str  # "YYYY-MM-DD"

    @field_validator("depart_date")
    @classmethod
    def check_format(cls, v):
        date.fromisoformat(v)  # raises ValueError if malformed
        return v
```

And two failure examples to work from throughout: a malformed date (`"03/2026"` instead of `"2026-03-15"`), and a downstream booking API that raises `ConnectionError` because the flights service is down.

## Build it

### Step 1: define the shape every error result takes

```python
def tool_error(kind: str, message: str, retryable: bool = False) -> dict:
    return {
        "ok": False,
        "error": kind,        # short, stable, machine-checkable code
        "message": message,   # human/model-readable, names the fix
        "retryable": retryable,
    }
```

> **Why this step?** A fixed shape means downstream code — logging, loop-guard checks, the model's own reasoning — can rely on `error` always being present on failure. `retryable` separates "the model should try again differently" from "code already retried this and gave up," which [Retry, Back Off, or Give Up](/learn/tools-function-calling/retry-strategies-for-tools) uses to decide whether to even show the failure to the model.

### Step 2: map validation errors to field-level messages

```python
def format_validation_error(exc: ValidationError) -> dict:
    first = exc.errors()[0]
    field = ".".join(str(p) for p in first["loc"])
    return tool_error(
        kind="invalid_argument",
        message=f"'{field}' is invalid: {first['msg']}. "
                 f"Expected format: YYYY-MM-DD, got a value that doesn't parse as a date.",
    )
```

> **Why this step?** `exc.errors()[0]` alone gives you Pydantic's internal message, which is precise but written for a developer reading a traceback, not a model reasoning about what to send next. Naming the field and restating the expected format turns "1 validation error for BookFlightArgs" into something the model can pattern-match against the call it just made.

### Step 3: map infrastructure exceptions without leaking internals

```python
def format_infra_error(exc: Exception) -> dict:
    if isinstance(exc, ConnectionError):
        return tool_error(
            kind="service_unavailable",
            message="The flight booking service is temporarily unreachable. This is not a problem with your request.",
            retryable=True,
        )
    if isinstance(exc, TimeoutError):
        return tool_error(
            kind="timeout",
            message="The request took too long and was cancelled before a result came back.",
            retryable=True,
        )
    # Anything unrecognized: log the real exception, tell the model nothing internal.
    return tool_error(
        kind="internal_error",
        message="The tool failed unexpectedly and could not complete the request.",
        retryable=True,
    )
```

> **Why this step?** Notice what's *not* in the message: no connection string, no host name, no line number, no library name. That's deliberate — see [Reliability Mistakes](/learn/tools-function-calling/reliability-common-mistakes) for what leaks when this discipline slips. The catch-all branch is just as important as the specific ones: an exception type you didn't anticipate should still produce a safe, generic message instead of `str(exc)` verbatim, which can contain anything the underlying library decided to print.

### Step 4: wire it into the dispatcher

```python
def call_tool(tool_name: str, raw_args: dict) -> dict:
    try:
        args = BookFlightArgs(**raw_args)
    except ValidationError as e:
        return format_validation_error(e)

    try:
        return {"ok": True, "result": book_flight(**args.model_dump())}
    except (ConnectionError, TimeoutError, Exception) as e:
        return format_infra_error(e)
```

> **Why this step?** Validation happens *before* dispatch, on the raw arguments, so a bad date never reaches the real booking API at all — nothing executes, so correcting it costs nothing. This mirrors the validate-first discipline in [How a Model Corrects Its Own Call](/learn/tools-function-calling/self-correction-mechanics).

## Run it

Two transcripts from the same bad call, differing only in the error text.

**With a raw traceback** (what *not* to send back):

```
Model  → book_flight(origin="SFO", destination="JFK", depart_date="03/2026")
Tool   → {"ok": false, "error": "Traceback (most recent call last):\n
          File \"pydantic/validators.py\", line 771, in date_validator\n
          ...\nValueError: invalid date format"}
Model  → "I'm sorry, I ran into an error booking that flight. Could you try again?"
```

The model has no field name, no expected format, and no idea whether the problem is `origin`, `destination`, or `depart_date`. It punts to the user instead of fixing anything — the failure the model itself caused becomes the user's problem to diagnose.

**With the formatted error:**

```
Model  → book_flight(origin="SFO", destination="JFK", depart_date="03/2026")
Tool   → {"ok": false, "error": "invalid_argument",
          "message": "'depart_date' is invalid: input should be a valid date.
                       Expected format: YYYY-MM-DD, got a value that doesn't
                       parse as a date."}
Model  → book_flight(origin="SFO", destination="JFK", depart_date="2026-03-15")
Tool   → {"ok": true, "result": {...}}
```

Same underlying mistake, same model, same schema. The only variable that changed is the message — and it's the difference between a self-correcting call and a dead end handed to the user. This is [self-correction](/learn/tools-function-calling/self-correction-mechanics) working exactly as designed; see [Self-Correction in a Full Trace](/learn/tools-function-calling/self-correction-worked-example) for a longer annotated version of this same pattern.

## Harden it

- **Never interpolate the raw exception string into the message.** `str(exc)` from a database driver can contain a connection string; from a subprocess call it can contain an environment variable. Always route through a known `kind` with a hand-written message template, and log the real exception separately, out of the model's context.
- **Cap message length.** A validation library can produce a wall of nested errors for a deeply nested schema. Truncate to the first error and a count ("and 3 more issues") rather than dumping all of it — a flooded context window is its own reliability problem.
- **Keep `error` codes stable.** If you rename `invalid_argument` to `bad_arg` next release, anything checking for it downstream (loop guards, dashboards, tests) silently stops matching. Treat the code list like a public API.

## Extend it

Add a `field` key alongside `message` for validation errors so downstream code (or a stricter model prompt) can programmatically point at the exact argument, without parsing English out of the message string. For tools with enum-constrained arguments, always list the valid values in the message rather than just naming the constraint — "must be one of ['low','medium','high'], got 'urgent'" is strictly more actionable than "invalid priority value," and it's the exact pattern [Self-Correction in a Full Trace](/learn/tools-function-calling/self-correction-worked-example) walks through end to end.

**Related:** [Handling Tool Errors and Retries](/learn/tools-function-calling/handling-errors-and-retries), [How a Model Corrects Its Own Call](/learn/tools-function-calling/self-correction-mechanics), [Self-Correction in a Full Trace](/learn/tools-function-calling/self-correction-worked-example), [Reliability Mistakes](/learn/tools-function-calling/reliability-common-mistakes)
