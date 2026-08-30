---
title: "Get reliable JSON out of an LLM"
description: "Four techniques ranked by how often they actually hold — from prompt-and-pray to constrained decoding — with the validation and repair loop you need regardless."
question: "Why does my model keep returning broken JSON, and how do I stop it?"
level: "beginner"
duration: "20 min"
published: "2026-08-30"
tags: ["Structured outputs", "Reliability", "Python"]
featured: true
steps:
  - "Define the shape as a schema before you write the prompt"
  - "Use the provider's structured-output mode instead of asking politely"
  - "Validate every response against the schema, never trust the shape"
  - "Repair once with the validation error, then fail loudly"
  - "Handle the three things a schema cannot catch"
related:
  - "/learn/structured-outputs/json-mode-basics"
  - "/learn/structured-outputs/validation-and-auto-repair"
  - "/learn/structured-outputs/why-structured-output"
---

If you are parsing model output with a regex and a prayer, you already know the failure:
it works for a week and then something returns a markdown fence, a trailing comma, or a
cheerful "Here's the JSON you asked for!" before the payload. The fix is not a better
prompt. It is moving the constraint out of the prose and into the decoder.

Here are the four approaches, worst to best, and the validation loop you need under all of
them.

## Level 0 — Asking nicely (don't ship this)

```text
Return your answer as JSON with keys "name", "risk", and "reason". Only JSON.
```

This works most of the time, which is exactly what makes it dangerous — the failure rate
is low enough to survive your testing and high enough to page you later. If you must do
it, at minimum strip fences before parsing:

```python
import json, re

def loads_loose(text: str):
    text = text.strip()
    text = re.sub(r"^```(?:json)?\s*|\s*```$", "", text)
    start, end = text.find("{"), text.rfind("}")
    if start == -1 or end == -1:
        raise ValueError("no JSON object found")
    return json.loads(text[start : end + 1])
```

Treat this as a compatibility shim for models that offer nothing better, not as a design.

## Level 1 — Define the schema first

Write the shape as a real schema before you write a word of the prompt. It becomes the
prompt, the validator, and the type in one artifact.

```python
# pip install pydantic
from typing import Literal
from pydantic import BaseModel, Field

class Assessment(BaseModel):
    name: str = Field(description="The subject of the assessment, verbatim from the input")
    risk: Literal["low", "medium", "high"]
    reason: str = Field(max_length=280)
    sources: list[str] = Field(default_factory=list)
```

Two details that matter more than they look. `Literal` beats `str` every time — a free-text
enum will eventually come back as `"Medium"`, `"medium risk"` or `"moderate"`, and you will
write a normaliser you did not need. And `description` on a field is not decoration: with
structured output modes it is passed to the model as part of the schema, so it is the
cheapest place to disambiguate a field.

## Level 2 — Use the provider's structured-output mode

Every major provider now has a way to constrain decoding to a schema. This is categorically
different from prompting: the tokens that would produce invalid JSON are not available to
sample, so malformed output is not a probability you are managing, it is a state that
cannot occur.

```python
# Anthropic — a tool definition is a schema the model must fill
import anthropic

client = anthropic.Anthropic()
tool = {
    "name": "record_assessment",
    "description": "Record the risk assessment for one subject.",
    "input_schema": Assessment.model_json_schema(),
}

message = client.messages.create(
    model="claude-sonnet-4-5",
    max_tokens=1024,
    tools=[tool],
    tool_choice={"type": "tool", "name": "record_assessment"},
    messages=[{"role": "user", "content": document}],
)
block = next(b for b in message.content if b.type == "tool_use")
assessment = Assessment.model_validate(block.input)
```

```python
# OpenAI — response_format with a strict JSON schema
from openai import OpenAI

client = OpenAI()
completion = client.chat.completions.create(
    model="gpt-4.1",
    messages=[{"role": "user", "content": document}],
    response_format={
        "type": "json_schema",
        "json_schema": {"name": "assessment", "schema": Assessment.model_json_schema(), "strict": True},
    },
)
assessment = Assessment.model_validate_json(completion.choices[0].message.content)
```

`tool_choice` forcing a specific tool is the part people miss. Without it the model may
answer in prose because it decided the tool was not needed, and you are back to parsing.

Strict schema modes usually come with restrictions — commonly every property must be
required, and open-ended maps are rejected. Design the schema for the constraint: make
optional fields explicitly nullable rather than absent.

## Level 3 — Validate anyway, always

Constrained decoding guarantees the *shape*. It guarantees nothing about the *content*.
Validation is not redundant with it; they catch different classes of problem.

```python
from pydantic import ValidationError

def extract(document: str, retries: int = 1) -> Assessment:
    error = None
    for attempt in range(retries + 1):
        raw = call_model(document, previous_error=error)
        try:
            return Assessment.model_validate(raw)
        except ValidationError as exc:
            error = exc.errors()          # feed the specific failure back in
    raise RuntimeError(f"schema validation failed after {retries + 1} attempts: {error}")
```

One repair attempt, not a loop. If the second try fails, the input is out of distribution
or the schema is wrong, and retrying is just spending money to arrive at the same place
more slowly. Log the failure with the input — that log is where your next schema fix comes
from.

## The three things a schema cannot catch

**Values that are well-typed and wrong.** `risk: "low"` validates perfectly whether or not
it is correct. Schemas are a syntax check on a semantic problem. If correctness matters,
you need an eval set with expected values, not a validator.

**Fabricated identifiers.** A `sources` list of plausible-looking IDs will pass any
`list[str]`. Check every identifier against the set you actually supplied, and reject the
response — do not silently drop the bad entries, or you will never see the rate.

```python
allowed = {s["id"] for s in supplied_sources}
unknown = set(assessment.sources) - allowed
if unknown:
    raise ValueError(f"model invented source ids: {sorted(unknown)}")
```

**Silent truncation.** If the model hits `max_tokens` mid-object, a constrained decoder
gives you a well-formed object with the tail missing rather than an obvious crash. Always
inspect the stop reason, and treat a length-based stop as an error rather than a result.

## The rule worth keeping

Constrain the decoder, validate the result, repair once, then fail loudly. Every layer
catches something the others cannot, and a pipeline that fails visibly is worth far more
than one that succeeds ambiguously.
