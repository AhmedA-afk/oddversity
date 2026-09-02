---
title: Structured outputs you can validate
phase: ai
module: prompts-and-structure
kind: lesson
summary: "A model that returns prose is a demo. A model that returns a JSON object matching a schema your customer's system already expects is an integration. The gap between those two is validation, and it is where most field failures live."
duration: 11 min
updated: "2026-09-02"
outcomes:
  - Define an output schema before writing the prompt that produces it, and explain why that order matters.
  - Validate a model's output against that schema in code, and design what happens when validation fails.
  - Distinguish a schema mismatch from a content error, and know which one gets fixed in the prompt and which one gets fixed in the pipeline.
artifact: A Pydantic schema and a validation-with-retry function for one structured extraction task, tested against at least one deliberately malformed input.
---

A demo where the model writes a nice paragraph summarising a claim is a demo. A production system where that summary has to land in a specific field of the customer's claims-management system, alongside a structured decision and a confidence flag, is an integration — and integrations do not tolerate "usually formatted correctly". This lesson is about closing that gap.

## Define the schema before the prompt

The instinct is to write a prompt that asks nicely for JSON and hope. The correct order is the reverse: write the schema first, in code, as the contract the rest of your pipeline will trust, and only then write a prompt whose entire job is to satisfy that contract.

```python
from pydantic import BaseModel, Field
from typing import Literal

class ClaimTriage(BaseModel):
    claim_id: str
    decision: Literal["auto_approve", "route_to_reviewer", "reject"]
    confidence: float = Field(ge=0.0, le=1.0)
    reason: str
    flagged_fields: list[str] = Field(default_factory=list)
```

This schema is not documentation. It is the thing you validate against, the thing your database column types are derived from, and the thing the customer's downstream system was already built to expect before you arrived. Most enterprise integrations do not get to define the target shape — a claims system, an ERP, a CRM already has field names and types, and your job is to produce output that fits them, not the other way round.

## Ask the model to produce exactly that shape

Both major providers support constraining output to a schema directly rather than asking in prose and parsing hopefully — covered with working code in the provider SDK reference in this module. Use that mechanism when it is available for your provider and model; it removes an entire category of "the model wrapped the JSON in a sentence" failures. Where it is not available, or where you need output the constrained mode does not support, parse and validate explicitly:

```python
import json
from pydantic import ValidationError

def parse_and_validate(raw_output: str) -> ClaimTriage:
    data = json.loads(raw_output)
    return ClaimTriage.model_validate(data)

def get_triage(raw_output: str, retry_fn) -> ClaimTriage:
    try:
        return parse_and_validate(raw_output)
    except (json.JSONDecodeError, ValidationError) as exc:
        corrected = retry_fn(raw_output, str(exc))
        return parse_and_validate(corrected)
```

`retry_fn` is a second model call that receives the original output and the specific validation error, and asks for a corrected version — not a fresh attempt from scratch. Telling the model precisely what was wrong ("`confidence` must be between 0 and 1, you returned 1.4") fixes far more cases on the first retry than asking it to try again with no diagnosis.

## Two different kinds of failure

Validation failures split into two categories that get fixed in different places, and conflating them wastes debugging time.

**Schema mismatches** are structural: a field is missing, a type is wrong, an enum value isn't one of the allowed options. These are almost always fixed in the prompt or the constrained-output configuration — the model needs clearer instructions or a tighter schema, not a smarter model.

**Content errors** are the schema validating cleanly while the content inside it is wrong: the decision field is a valid enum value but the wrong one for this claim. These are not caught by schema validation at all. They are caught by the eval set from the earlier module in this phase, scored against domain-expert labels — which is why validation and evaluation are two separate steps, not one. A response can pass every schema check and still be wrong.

## Handling failure at each layer

Design what happens at three points, because "the pipeline threw an exception" is not an acceptable production answer in a customer's environment:

1. **Malformed JSON.** Retry once with the specific parse error. If it fails twice, route to a human queue rather than looping — an infinite retry against a paid API is both a cost incident and a latency incident, and the following lesson on agent stop conditions covers exactly this pattern.
2. **Valid JSON, invalid schema.** Same retry-with-diagnosis pattern, capped.
3. **Valid schema, low confidence or a flagged field.** This is not a validation failure at all — it is the system correctly telling you it is unsure, and it should route to a human reviewer by design, not by accident. Building a `confidence` field into the schema from the start, as above, gives you this escape hatch for free.

## The FDE angle

A stakeholder rarely asks about JSON schemas. They ask "what happens when it gets confused" — and a structured output with a confidence field and a defined low-confidence path is the honest answer to that question, in a form you can demo. It is also the difference between a system a customer's engineering team can integrate against a stable contract and one where every model update risks silently reshaping the output their downstream code parses with string matching. When you hand over, the schema file is part of what you leave behind — it is the one artifact both the model and the customer's existing systems have to honour.

## What you should be able to do now

Given a task description like "extract the claim amount, the policy number, and a decision from this adjuster's note", you should be able to write the target schema before touching a prompt, explain what a validation failure at each layer means, and say where a low-confidence result should go instead of straight into the customer's database.

Build the artifact now: one Pydantic schema for a real extraction task from a lab you have already done in this path, a validate-with-retry function, and a test that deliberately feeds it malformed output to confirm the retry path actually recovers.
