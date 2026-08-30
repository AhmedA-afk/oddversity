---
title: "Building a Validate-and-Repair Loop"
track: "prompt-engineering"
status: live
summary: "Parse, validate, and on failure feed the exact error back for one repair attempt — then fail loudly, not forever."
duration: "8 min read"
---

A retry loop with no cap doesn't fix a broken contract — it just spends more tokens finding out the contract is still broken. This builds the version that repairs once, with the real error, and gives up loudly if that doesn't work.

## What we're building

A wrapper around the ticket classifier from [Enforcing a JSON Schema From the Prompt](/learn/prompt-engineering/json-schema-in-prompts): on a schema failure, it sends the model its own broken output plus the exact validation error, asks for one corrected object, and raises a clear exception if that single repair doesn't fix it — rather than looping until it either succeeds or burns through the request budget silently.

## Setup

Reuses `TICKET_SCHEMA` and `call_model(prompt, prefill=None, temperature=0)` exactly as defined in [Enforcing a JSON Schema From the Prompt](/learn/prompt-engineering/json-schema-in-prompts).

## Build it

### 1. Give a failed repair its own exception type

```python
class SchemaRepairFailed(Exception):
    def __init__(self, original_output, last_error):
        super().__init__(f"repair attempt failed: {last_error}")
        self.original_output = original_output
        self.last_error = last_error
```

A distinct exception means the caller can tell "the model never produced valid output, even after a repair try" apart from every other kind of failure, and decide what to do about it — route to a human queue, log for review, alert — instead of catching a bare `Exception` and guessing.

### 2. Write a repair prompt that shows the model its own mistake

```python
REPAIR_TEMPLATE = """Your previous response was not valid according to the
required schema.

Your response:
{bad_output}

Validation error:
{error_message}

Return a corrected JSON object that fixes this specific error. Keep the
same schema as before. Respond with JSON only, no other text."""
```

The error text has to be the literal message the validator produced, not a paraphrase like "please fix the formatting." A model can only fix a mistake it can see named — "'needs_escalation' is a required property" points at exactly one gap; "please fix the formatting" could send it rewriting fields that were already correct.

### 3. The loop itself, capped at one repair

```python
import json
import jsonschema

def validate_with_one_repair(raw_output, schema, call_model, max_repairs=1):
    attempt = raw_output
    last_error = None

    for attempt_num in range(max_repairs + 1):
        try:
            data = json.loads(attempt)
            jsonschema.validate(instance=data, schema=schema)
            return data
        except (json.JSONDecodeError, jsonschema.ValidationError) as e:
            last_error = e
            if attempt_num == max_repairs:
                break
            attempt = call_model(
                REPAIR_TEMPLATE.format(bad_output=attempt, error_message=str(e)),
                prefill="{",
                temperature=0,
            )

    raise SchemaRepairFailed(original_output=raw_output, last_error=str(last_error))
```

`max_repairs=1` isn't a placeholder — it's the actual policy. The loop runs the original attempt, and if that fails, exactly one more call with the error attached. If that also fails, it raises instead of trying a third or fourth time.

### 4. Wire it into the classifier

```python
def classify_ticket_safely(ticket_text, call_model):
    raw = classify_ticket(ticket_text, call_model)  # from the schema-enforcement lesson
    try:
        return validate_with_one_repair(raw, TICKET_SCHEMA, call_model)
    except SchemaRepairFailed as e:
        raise RuntimeError(
            f"no valid classification after one repair attempt: {e}"
        ) from e
```

## Run it

```python
raw = '{"category": "billing", "urgency": 4}'  # missing needs_escalation
result = validate_with_one_repair(raw, TICKET_SCHEMA, call_model)
```

The first `jsonschema.validate` call raises `'needs_escalation' is a required property`. That exact message goes into the repair prompt, the model gets one more turn to see it, and comes back with:

```json
{"category": "billing", "urgency": 4, "needs_escalation": false}
```

which validates clean on the second pass and returns normally — no exception, no extra calls beyond the one repair.

## Harden it

- **Cap stays at one, on purpose.** An unbounded retry against a genuinely broken prompt just spends latency and tokens rediscovering the same failure — it hides a bug that needs a fixed prompt, not a persistent one. One repair catches the common transient slip (a dropped field, a stray comma); a second and third attempt rarely add much beyond that, and each one costs a full round trip.
- **Log the full failure on the way out, not just "repair failed."** `SchemaRepairFailed` carries `original_output` and `last_error` specifically so a human debugging a batch job doesn't have to reproduce the failure blind — the exact broken text and the exact validator message are already attached.
- **Keep decode errors and validation errors distinguishable in what you log**, even though this loop catches both the same way. A pattern of decode errors (truncated output) points at a `max_tokens` problem; a pattern of validation errors on the same field points at a prompt-wording problem — see [Enforcing a JSON Schema From the Prompt](/learn/prompt-engineering/json-schema-in-prompts) for why those two failures mean different things.

## Extend it

If repairs cluster on the same field across many tickets, that's not a case for raising `max_repairs` — it's a signal the original prompt's wording for that field is the actual bug, and the fix belongs in the [contract](/learn/prompt-engineering/structured-output-contracts) itself, not in a bigger safety net. Treat the repair-trigger rate across a batch as a quality signal on the upstream prompt, the same way you'd track any other metric in [evaluating a prompt before you ship it](/learn/prompt-engineering/prompt-evaluation-basics). And if this classifier is one stage in a larger pipeline, wrap every stage's output in the same `validate_with_one_repair` call so every seam fails the same predictable way — see [Passing State Cleanly Between Pipeline Stages](/learn/prompt-engineering/passing-state-between-stages) for what a stage should do once it has a validated result in hand.

**Related:** [Enforcing a JSON Schema From the Prompt](/learn/prompt-engineering/json-schema-in-prompts), [Structured Output: Making the Model Speak a Contract](/learn/prompt-engineering/structured-output-contracts), [Before/After: Taming Malformed JSON](/learn/prompt-engineering/fixing-malformed-json-output), [Passing State Cleanly Between Pipeline Stages](/learn/prompt-engineering/passing-state-between-stages), [Evaluating Prompts Before You Ship Them](/learn/prompt-engineering/prompt-evaluation-basics)
