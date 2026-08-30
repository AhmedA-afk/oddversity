---
title: "One Schema, Three Providers"
track: "structured-outputs"
status: live
summary: "The same extraction schema and the same document, sent to three providers, with the exact bytes that come back laid side by side."
duration: "7 min read"
---

The [cross-provider landscape](/learn/structured-outputs/cross-provider-landscape) told you the failures are real. This lesson shows you one, end to end: same schema, same input document, three providers, and the three genuinely different response bodies you get back before any normalization happens.

## The setup

The task is support-ticket triage: pull a category, a priority, and an optional `escalation_note` out of a short customer message. The schema, defined once:

```python
from pydantic import BaseModel
from typing import Literal, Optional

class TicketExtraction(BaseModel):
    category: Literal["billing", "bug", "feature_request", "other"]
    priority: Literal["low", "medium", "high"]
    escalation_note: Optional[str] = None
```

The input document, identical across all three calls:

```text
Subject: Can't export my report — urgent, demo in 2 hours

Hi, the CSV export button just spins forever on the analytics page.
I have a client demo in two hours and need this file. Please help ASAP.
```

`escalation_note` is genuinely optional here — there's urgency in the text, but nothing that maps cleanly to a note field unless the model decides to add color.

## Step by step

#### 1. Anthropic — tool-schema mediated

```python
response = client.messages.create(
    model=ANTHROPIC_MODEL,
    max_tokens=256,
    tools=[{
        "name": "extract_ticket",
        "description": "Extract triage fields from a support ticket.",
        "input_schema": TicketExtraction.model_json_schema(),
    }],
    tool_choice={"type": "tool", "name": "extract_ticket"},
    messages=[{"role": "user", "content": document}],
)
tool_call = next(b for b in response.content if b.type == "tool_use")
raw = tool_call.input
```

`raw` comes back as an already-parsed Python dict, not a string:

```python
{"category": "bug", "priority": "high"}
```

> **Why this step?** Anthropic's tool-use path never hands you a JSON *string* to parse in the first place — `escalation_note` is simply absent from the dict rather than present as `null`. That's a real, load-bearing difference from the other two: `"escalation_note" not in raw` and `raw.get("escalation_note") is None` are the same check here, but they won't be for Provider 2.

#### 2. OpenAI — strict schema-constrained response

```python
schema = TicketExtraction.model_json_schema()
schema["additionalProperties"] = False
schema["required"] = list(schema["properties"].keys())  # strict mode requires every key

response = client.chat.completions.create(
    model=OPENAI_MODEL,
    messages=[{"role": "user", "content": document}],
    response_format={
        "type": "json_schema",
        "json_schema": {"name": "extract_ticket", "strict": True, "schema": schema},
    },
)
raw_text = response.choices[0].message.content
```

`raw_text` is a JSON *string* this time, and strict mode's "every field required" rule means the optional field comes back explicit rather than omitted:

```json
{"category": "bug", "priority": "high", "escalation_note": null}
```

> **Why this step?** Strict mode's ban on optional keys is exactly what [Optional and Nullable Fields](/learn/structured-outputs/optional-and-nullable-fields) warns about: OpenAI's dialect has no concept of "absent," only "present with value `null`." Code written against Anthropic's "just check for the key" habit will read `raw_text` fine — `escalation_note` really is `null` — but if it instead branched on Anthropic's *absence* convention, it now has to branch on presence-with-null instead. Same information, different shape to test for.

#### 3. A permissive OSS engine — grammar-adjacent but not strict

Running the same document through a locally-hosted open-weight model with JSON-mode-style prompting instead of a hard grammar (a common quick-start setup before someone wires up an actual GBNF grammar):

```text
{"category": "bug", "priority": "high", "escalation_note": "Customer has a demo in 2 hours, treat as urgent"}

Note: I inferred urgency from the demo deadline mentioned in the ticket.
```

> **Why this step?** Two failures stacked in one response. First, the model *invented* an escalation note the schema allows but the document never explicitly asked for — that's a field-accuracy problem a validator can't catch, because the shape is perfectly valid; see [Metrics for Structured-Output Quality](/learn/structured-outputs/evaluating-structured-output-quality-metrics) for why valid-rate alone would score this a pass. Second, the trailing `Note:` line means `json.loads(raw_text)` throws `Extra data` — this engine's constraint wasn't a hard grammar, so nothing stopped generation from continuing past the closing brace.

## Where it breaks (+fix)

The naive integration — `json.loads(response_text)` followed by `TicketExtraction.model_validate(parsed)` — works unmodified for exactly one of these three responses (Provider 2's). Provider 1 never produced a string to parse at all; Provider 3's string isn't valid JSON on its own.

The fix is a normalization step that runs *before* validation, specific to each provider, converging on one shape:

```python
def normalize(provider: str, response) -> dict:
    if provider == "anthropic":
        return next(b.input for b in response.content if b.type == "tool_use")
    if provider == "openai":
        return json.loads(response.choices[0].message.content)
    if provider == "oss_engine":
        text = response.text
        start, end = text.find("{"), text.rfind("}") + 1
        return json.loads(text[start:end])  # trims anything outside the object
    raise ValueError(f"unknown provider: {provider}")
```

The `oss_engine` branch's brace-slicing is a patch, not a fix — it recovers from a missing hard constraint after the fact. The real fix, covered in [Grammar-Constrained Generation](/learn/structured-outputs/grammar-constrained-generation), is to compile the schema into an actual grammar so the engine can't emit the trailing `Note:` line in the first place. Slicing braces is what you do while you don't yet have that, not a permanent substitute for it.

Field accuracy is a separate fix entirely: the invented `escalation_note` passes validation and needs field-level scoring to even get noticed, then a tighter field description to actually fix.

## Takeaways

- The same schema and the same document produce three genuinely different wire formats — a parsed dict, a clean JSON string, and a JSON string with trailing prose. None of this is visible from the schema definition alone.
- "Absent" and "present-with-null" are not the same convention, and providers disagree on which one they use for optional fields — normalize this explicitly, don't assume one check covers both.
- A response can be schema-valid and still wrong in content (the invented escalation note) — validity and accuracy are different checks, caught by different tools.
- Normalize per provider into one canonical shape *before* validation runs, so the validator only ever has to reason about one input format.

**Related:** [The Cross-Provider Landscape](/learn/structured-outputs/cross-provider-landscape), [Tool Schemas as a Structured-Extraction Mechanism](/learn/structured-outputs/tool-function-schemas), [Optional and Nullable Fields](/learn/structured-outputs/optional-and-nullable-fields), [Writing Portable Schema Code](/learn/structured-outputs/writing-portable-schema-code)
