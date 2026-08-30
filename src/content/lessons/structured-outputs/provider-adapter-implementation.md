---
title: "A Provider Adapter"
track: "structured-outputs"
status: live
summary: "A runnable adapter that takes one Pydantic schema and produces a validated object from either of two providers, swappable in one line."
duration: "8 min read"
---

[Writing Portable Schema Code](/learn/structured-outputs/writing-portable-schema-code) laid out the shape: one schema, one adapter per provider, one validation step. Here it is built out end to end, against the ticket-triage schema from [One Schema, Three Providers](/learn/structured-outputs/same-schema-three-providers-example), for two real providers.

## What we're building

A small `extract()` function that takes a provider name, a Pydantic schema, and a document, and returns a validated instance of that schema — regardless of which provider actually served the request. The provider is a config value, not a code branch anyone has to touch per call site.

## Setup

You'll need the two provider SDKs installed and their API keys set as environment variables, and the schema from earlier:

```python
from pydantic import BaseModel
from typing import Literal, Optional

class TicketExtraction(BaseModel):
    category: Literal["billing", "bug", "feature_request", "other"]
    priority: Literal["low", "medium", "high"]
    escalation_note: Optional[str] = None
```

## Build it

### Step 1 — define the adapter interface

```python
from typing import Protocol, Any

class ProviderAdapter(Protocol):
    def request(self, schema: type[BaseModel], document: str) -> Any: ...
    def normalize(self, raw_response: Any) -> dict: ...
```

> **Why this step?** Fixing the interface first, before either implementation exists, is what forces both adapters to agree on the same contract. Anything that doesn't fit this shape — a provider needing a wildly different calling convention — is a sign it needs its own `request`/`normalize` pair, not a special case bolted onto `extract`.

### Step 2 — implement the Anthropic adapter

```python
import anthropic

class AnthropicAdapter:
    def __init__(self, model: str):
        self.client = anthropic.Anthropic()
        self.model = model

    def request(self, schema: type[BaseModel], document: str):
        return self.client.messages.create(
            model=self.model,
            max_tokens=256,
            tools=[{
                "name": schema.__name__,
                "description": f"Extract fields matching {schema.__name__}.",
                "input_schema": schema.model_json_schema(),
            }],
            tool_choice={"type": "tool", "name": schema.__name__},
            messages=[{"role": "user", "content": document}],
        )

    def normalize(self, raw_response) -> dict:
        block = next(b for b in raw_response.content if b.type == "tool_use")
        return block.input
```

> **Why this step?** `normalize` is the only place that knows Anthropic hands back an already-parsed dict inside a `tool_use` content block. Everything above this class treats that as an implementation detail it never has to think about again.

### Step 3 — implement the OpenAI adapter

```python
import json
from openai import OpenAI

class OpenAIAdapter:
    def __init__(self, model: str):
        self.client = OpenAI()
        self.model = model

    def request(self, schema: type[BaseModel], document: str):
        s = schema.model_json_schema()
        s["additionalProperties"] = False
        s["required"] = list(s["properties"].keys())  # strict mode: no optional keys
        return self.client.chat.completions.create(
            model=self.model,
            messages=[{"role": "user", "content": document}],
            response_format={
                "type": "json_schema",
                "json_schema": {"name": schema.__name__, "strict": True, "schema": s},
            },
        )

    def normalize(self, raw_response) -> dict:
        return json.loads(raw_response.choices[0].message.content)
```

> **Why this step?** The strict-mode workaround (forcing every field into `required`) lives inside `request`, right next to the API call it's specific to — not in the shared schema definition, which stays clean for every other adapter that reads it.

### Step 4 — write the one function everything else calls

```python
def extract(adapter: ProviderAdapter, schema: type[BaseModel], document: str) -> BaseModel:
    raw = adapter.request(schema, document)
    normalized = adapter.normalize(raw)
    return schema.model_validate(normalized)
```

> **Why this step?** This is the entire point of the exercise: one function, one call to `model_validate`, no `if provider == ...` branch anywhere in sight. [Validation and Auto-Repair](/learn/structured-outputs/validation-and-auto-repair) plugs in right here — wrap this call in a repair loop and every adapter gets repair for free.

## Run it

```python
document = "Subject: Can't export my report — urgent, demo in 2 hours\n\n..."

adapter = AnthropicAdapter(model=ANTHROPIC_MODEL)
result = extract(adapter, TicketExtraction, document)
print(result)
# category='bug' priority='high' escalation_note=None

adapter = OpenAIAdapter(model=OPENAI_MODEL)          # <- the one-line swap
result = extract(adapter, TicketExtraction, document)
print(result)
# category='bug' priority='high' escalation_note=None
```

Same schema, same document, same call shape at the site that matters — only the `adapter =` line changed, and `result` is the identical validated `TicketExtraction` instance either way, `escalation_note` and all, because `schema.model_validate` doesn't care whether the field arrived as an absent key or an explicit `null`.

## Harden it

- **Wrap `adapter.request` in a retry with backoff**, scoped per adapter — rate-limit shapes and transient error types differ by provider, and that's exactly the kind of thing that belongs inside the adapter, not in `extract`.
- **Log the raw response alongside the normalized one**, tagged with provider and model, before validation runs. When a validation failure shows up, you need to know whether the provider produced bad data or the adapter's `normalize` mis-translated good data — those are different bugs with different fixes.
- **Version-pin the schema-to-request translation.** If `schema.model_json_schema()` output changes shape after a Pydantic upgrade (a new keyword, a different `$ref` style), an adapter that special-cases specific keywords can silently stop applying its workaround. Snapshot-test the generated request payload per adapter, not just the round-trip result.

## Extend it

- Add a third adapter for an OSS engine using [grammar-constrained generation](/learn/structured-outputs/grammar-constrained-generation) — its `request` compiles the schema into a grammar instead of sending it as a parameter, which is a good test of whether your interface genuinely doesn't assume "schema" means "JSON Schema over HTTP."
- Build a routing layer above `extract` that picks an adapter by cost or by fallback order, using this same interface, so a primary-provider outage falls through to a secondary without any caller-visible change — the pattern [Structured Output Failure Modes](/learn/structured-outputs/structured-output-failure-modes) assumes exists.
- Feed `extract` straight into the harness from [Building an Eval Harness](/learn/structured-outputs/building-an-extraction-eval-harness) and run the same gold set through both adapters to compare field accuracy, not just whether each one validates.

**Related:** [Writing Portable Schema Code](/learn/structured-outputs/writing-portable-schema-code), [Pydantic and Zod: Deriving Schemas from Code](/learn/structured-outputs/pydantic-zod-schema-patterns), [Tool Schemas as a Structured-Extraction Mechanism](/learn/structured-outputs/tool-function-schemas), [Validation and Auto-Repair](/learn/structured-outputs/validation-and-auto-repair)
