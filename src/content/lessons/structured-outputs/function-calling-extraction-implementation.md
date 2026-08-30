---
title: "Forcing a Tool Call to Extract"
track: "structured-outputs"
status: live
summary: "Define a tool whose input schema is your extraction schema, force it, and read the arguments straight off the tool_use block."
duration: "8 min read"
---

This is the runnable version of [Tool Calling as an Extraction Mechanism](/learn/structured-outputs/tool-and-function-schemas-for-extraction): one tool definition, one forced call, one parsed result — using Anthropic's Messages API tool use.

## What we're building

An extraction call against a support-ticket email that returns `{category, priority, summary, needs_escalation}` by forcing the model to call a tool whose arguments are exactly those four fields.

## Setup

```bash
pip install anthropic
```

```python
import anthropic

client = anthropic.Anthropic()
MODEL = "claude-opus-4-5"  # any current tool-use-capable model
```

## Build it

### 1. Define the extraction schema as a tool

```python
extract_ticket_tool = {
    "name": "extract_ticket",
    "description": "Extract structured fields from a raw support ticket email.",
    "input_schema": {
        "type": "object",
        "properties": {
            "category": {
                "type": "string",
                "enum": ["billing", "bug", "feature_request", "other"],
            },
            "priority": {
                "type": "string",
                "enum": ["low", "medium", "high", "urgent"],
            },
            "summary": {"type": "string", "description": "One sentence, plain language."},
            "needs_escalation": {"type": "boolean"},
        },
        "required": ["category", "priority", "summary", "needs_escalation"],
        "additionalProperties": False,
    },
    "strict": True,
}
```

> **Why this step?** `strict: true` is a top-level field on the tool definition, not on the tool choice — it tells the API to enforce the schema exactly (requires `additionalProperties: false` and a `required` list), so `tool_use.input` is guaranteed to validate against this shape rather than merely being "close."

### 2. Force the tool with `tool_choice`

```python
tool_choice = {"type": "tool", "name": "extract_ticket"}
```

> **Why this step?** Without `tool_choice`, the model decides on its own whether to call a tool at all, and might just reply with text. Forcing the specific tool by name removes that branch entirely — the only way for the turn to end is with a `tool_use` block for `extract_ticket`.

### 3. Send the request

```python
ticket_email = """
Subject: App crashes every time I upload a PDF

I've tried three different files and the app crashes immediately after
I select "upload." This started after yesterday's update. I have a
client deadline tomorrow morning and this is blocking me completely.
"""

response = client.messages.create(
    model=MODEL,
    max_tokens=1024,
    tools=[extract_ticket_tool],
    tool_choice=tool_choice,
    messages=[{"role": "user", "content": ticket_email}],
)
```

### 4. Read the structured arguments off the tool_use block

```python
def parsed_extraction(response) -> dict:
    for block in response.content:
        if block.type == "tool_use" and block.name == "extract_ticket":
            return block.input  # already a parsed dict, not a JSON string
    raise ValueError(f"expected a tool_use block, got stop_reason={response.stop_reason}")

result = parsed_extraction(response)
print(result)
```

## Run it

```json
{
  "category": "bug",
  "priority": "urgent",
  "summary": "App crashes on PDF upload since the latest update, blocking a client deadline.",
  "needs_escalation": true
}
```

`block.input` arrives as a Python dict — no `json.loads()` needed, unlike the free-text JSON you'd parse out of a plain-text response.

## Harden it

`strict: true` guarantees the *shape* is right; it says nothing about whether `category` is the *correct* category or `priority` reflects genuine urgency versus a customer who writes in all caps. Run the result through the same domain validation you'd apply to any other extraction — a Pydantic model is a natural fit here since the JSON Schema and the Pydantic schema describe the same shape:

```python
from pydantic import BaseModel
from typing import Literal

class TicketExtraction(BaseModel):
    category: Literal["billing", "bug", "feature_request", "other"]
    priority: Literal["low", "medium", "high", "urgent"]
    summary: str
    needs_escalation: bool

validated = TicketExtraction.model_validate(result)
```

Also guard the response shape defensively even though the tool is forced: `parsed_extraction` raises rather than silently returning `None` if `stop_reason` isn't `tool_use` for some reason (a refusal, a context-length error), so a caller can't accidentally treat a missing extraction as an empty one. And because exactly one tool is forced, there's no parallel-tool-use ambiguity to handle here — the response will contain at most one relevant `tool_use` block, unlike an agentic loop where several tools might fire in the same turn.

## Extend it

Define several tools — one extraction schema per document type — and force nothing, letting the model choose which one to call; tool choice becomes a router that classifies the document as a side effect of picking a schema. For extraction that spans more input than one call comfortably holds, wrap this exact request in the chunk-and-merge loop from [Chunk, Extract, Merge](/learn/structured-outputs/chunk-and-merge-extraction), calling this per chunk instead of once.

**Related:** [Tool Calling as an Extraction Mechanism](/learn/structured-outputs/tool-and-function-schemas-for-extraction), [Tool/Function Schemas](/learn/structured-outputs/tool-function-schemas), [Validation and Auto-Repair](/learn/structured-outputs/validation-and-auto-repair), [A Receipt Image to a Typed Object](/learn/structured-outputs/receipt-image-to-schema-example), [Schema Design for Reliability](/learn/structured-outputs/schema-design-for-reliability)
