---
title: "Validate, Then Branch"
track: "structured-outputs"
status: live
summary: "The runtime skeleton every structured-output pipeline needs: parse, validate, then branch into accept, repair, or reject."
duration: "7 min read"
---

Most structured-output code that breaks in production doesn't break because the model misbehaved — it breaks because the code only knew how to handle the case where validation passes. This lesson builds the skeleton that handles all three outcomes on purpose.

## What we're building

A single function, `handle_output`, that takes raw model text and a schema and returns a tagged result: `Accepted`, `Repairable`, or `Rejected`. Nothing calls a database or a downstream API before this function has made its decision. Every other lesson in this module — the repair ladder, the bounded retry loop, the reject rule — plugs into one of the three branches this skeleton defines.

## Setup

Python, Pydantic v2. The same shape translates directly to Zod in TypeScript — `safeParse` returns the equivalent `{success, data}` / `{success, error}` union.

## Build it

### Step 1: Parse first, separately from validation

```python
import json
from dataclasses import dataclass

@dataclass
class ParseFailure:
    raw: str
    error: str

def try_parse(raw_text: str) -> dict | ParseFailure:
    try:
        return json.loads(raw_text)
    except json.JSONDecodeError as e:
        return ParseFailure(raw=raw_text, error=str(e))
```

Parsing and validating are different failures with different fixes, so they get separate steps. A `JSONDecodeError` means the text isn't even well-formed JSON yet — that's a job for a repair pass (deterministic bracket-closing, prose-stripping), not for a schema. Handing malformed text straight to Pydantic just trades one exception type for another without learning anything extra.

### Step 2: Validate what parsed

```python
from pydantic import BaseModel, ValidationError

def try_validate(parsed: dict, schema: type[BaseModel]):
    try:
        return schema.model_validate(parsed), None
    except ValidationError as e:
        return None, e.errors()
```

`e.errors()` is the payload the rest of this module is built around — a list of `{loc, msg, input, type}` dicts, one per field that failed. It's specific enough to hand back to the model verbatim in a repair prompt (see [The Repair Ladder](/learn/structured-outputs/auto-repair-strategies)) or to a human reviewing a rejected item.

### Step 3: Classify the errors, then branch

```python
from enum import Enum, auto

class Outcome(Enum):
    ACCEPTED = auto()
    REPAIRABLE = auto()
    REJECTED = auto()

REPAIRABLE_ERROR_TYPES = {
    "missing", "string_type", "int_parsing",
    "enum", "extra_forbidden",
}

def classify(errors: list[dict]) -> Outcome:
    if not errors:
        return Outcome.ACCEPTED
    # any error type outside the known-repairable set forces a reject —
    # an unfamiliar failure shape is exactly the case you don't want
    # a repair loop guessing its way through
    if all(e["type"] in REPAIRABLE_ERROR_TYPES for e in errors):
        return Outcome.REPAIRABLE
    return Outcome.REJECTED
```

The classifier is deliberately conservative: it only calls something repairable if every single error on the object is a kind you've seen before and know how to fix. One unfamiliar error type — a custom validator raising on a cross-field business rule, say — is enough to route the whole object to reject. [When to Reject Instead of Repair](/learn/structured-outputs/when-not-to-repair) covers the reasoning behind erring toward reject rather than guessing.

### Step 4: Wire the three branches together

```python
def handle_output(raw_text: str, schema: type[BaseModel]):
    parsed = try_parse(raw_text)
    if isinstance(parsed, ParseFailure):
        # syntactic failure — see A Taxonomy of Structured-Output Failures
        return Outcome.REPAIRABLE, parsed

    obj, errors = try_validate(parsed, schema)
    if obj is not None:
        return Outcome.ACCEPTED, obj

    outcome = classify(errors)
    return outcome, errors
```

`handle_output` never raises on a bad response. Every path returns a tagged outcome the caller must handle explicitly — accept the object, hand the errors to a repair loop, or route to a rejection queue. There is no silent fourth path where a caller forgets to check and an unvalidated object slips through.

## Run it

```python
class Ticket(BaseModel):
    id: str
    priority: int
    status: str

good = '{"id": "t1", "priority": 3, "status": "open"}'
fixable = '{"id": "t2", "priority": "high", "status": "open"}'
truncated = '{"id": "t3", "priority": 2, "stat'

print(handle_output(good, Ticket))       # (Outcome.ACCEPTED, Ticket(...))
print(handle_output(fixable, Ticket))    # (Outcome.REPAIRABLE, [{'type': 'int_parsing', ...}])
print(handle_output(truncated, Ticket))  # (Outcome.REPAIRABLE, ParseFailure(...))
```

Three inputs, three different reasons for the outcome, and the caller gets a consistent shape back regardless of which one fired.

## Harden it

- **Log the classification, not just the outcome.** When repair rates creep up over time, you want to know *which* error types are driving it — that's the leading indicator [Repair-Loop Mistakes](/learn/structured-outputs/repair-loop-mistakes) says most teams only discover after the fact.
- **Keep `REPAIRABLE_ERROR_TYPES` short and reviewed.** Every entry you add is a claim that this failure shape is safe to hand to an automated fix. Adding one because a single incident was annoying, without checking it can't mask a genuine semantic problem, is how a repair loop quietly starts fixing things it shouldn't.
- **Never let a branch bypass the others.** A tempting shortcut is to skip straight to a repair call when the raw text "looks close enough." Route everything through `try_parse` and `try_validate` first, every time — consistency here is what makes the pipeline auditable.

## Extend it

The `REPAIRABLE` branch here just returns the errors — it doesn't fix anything yet. [A Bounded Repair Loop](/learn/structured-outputs/repair-loop-implementation) takes that output and actually climbs [the repair ladder](/learn/structured-outputs/auto-repair-strategies) against it. The `REJECTED` branch similarly just returns; wiring it to a human-review queue instead of a silent drop is the other half of [When to Reject Instead of Repair](/learn/structured-outputs/when-not-to-repair).

**Related:** [Always Validate at the Boundary](/learn/structured-outputs/the-validation-layer), [A Taxonomy of Structured-Output Failures](/learn/structured-outputs/failure-modes-taxonomy), [The Repair Ladder](/learn/structured-outputs/auto-repair-strategies), [A Bounded Repair Loop](/learn/structured-outputs/repair-loop-implementation), [When to Reject Instead of Repair](/learn/structured-outputs/when-not-to-repair), [Pydantic and Zod Schema Patterns](/learn/structured-outputs/pydantic-zod-schema-patterns)
