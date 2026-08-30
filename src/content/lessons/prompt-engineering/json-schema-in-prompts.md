---
title: "Enforcing a JSON Schema From the Prompt"
track: "prompt-engineering"
status: live
summary: "Write the schema first, phrase the prompt from it, prefill the opening brace, then validate — not just parse — the result."
duration: "8 min read"
---

A schema you only described in prose drifts the moment the wording gets ambiguous. This builds a small ticket classifier where the schema is written first, as code, and the prompt and the validator are both generated from the same commitment.

## What we're building

A function that classifies a support ticket into exactly `{category, urgency, needs_escalation}`, using a written [output contract](/learn/prompt-engineering/structured-output-contracts), a prefilled opening token, low temperature, and real schema validation in Python — not just a JSON parse.

## Setup

```bash
pip install jsonschema
```

The rest is a `call_model(prompt, prefill=None, temperature=0)` stub standing in for whatever client you're using — the pattern is the same regardless of provider.

## Build it

### 1. Write the schema before the prompt

Decide the contract as code first, so the prompt has to describe a shape you've already committed to instead of inventing one in prose as you go:

```python
TICKET_SCHEMA = {
    "type": "object",
    "properties": {
        "category": {
            "type": "string",
            "enum": ["billing", "technical", "account", "other"],
        },
        "urgency": {"type": "integer", "minimum": 1, "maximum": 5},
        "needs_escalation": {"type": "boolean"},
    },
    "required": ["category", "urgency", "needs_escalation"],
    "additionalProperties": False,
}
```

`additionalProperties: False` matters as much as the required fields — without it, a model that adds a stray `"notes"` field still passes validation, and stray fields are exactly what tells you the prompt's wording has started to drift.

### 2. Turn the schema into prompt instructions

```python
PROMPT_TEMPLATE = """Classify this support ticket. Return ONLY a JSON object
with exactly these fields:
- category: one of "billing", "technical", "account", "other"
- urgency: integer from 1 to 5 (5 = most urgent)
- needs_escalation: true or false

No other fields. No text before or after the JSON.

Ticket: {ticket_text}"""
```

Every value in the prose (the four category strings, the 1-5 range) is copied straight from `TICKET_SCHEMA`, not re-derived. If you maintain many of these, render this block from the schema dict itself with a small template — see [Prompt Templates and Variables](/learn/prompt-engineering/prompt-templates-and-variables) — so the two can't quietly diverge.

### 3. Prefill the opening token and drop the temperature

```python
def classify_ticket(ticket_text, call_model):
    prompt = PROMPT_TEMPLATE.format(ticket_text=ticket_text)
    raw = call_model(prompt, prefill="{", temperature=0)
    return raw if raw.lstrip().startswith("{") else "{" + raw
```

[Prefilling](/learn/prompt-engineering/prefilling-responses) the assistant turn with `{` removes the model's ability to open with "Here's the classification:" or an apology — there's no valid continuation of an already-open brace except more JSON. Temperature 0 isn't there to make the *content* deterministic — the model still has to judge urgency — it's there to stop the *shape* from wobbling across calls, which is a separate thing than reasoning quality. Some SDKs echo the prefilled text back in the completion and some strip it; the `if`/`else` above normalizes either behavior before it reaches the parser.

### 4. Validate against the schema, not just `json.loads`

```python
import json
import jsonschema

def parse_and_validate(raw_json_text):
    data = json.loads(raw_json_text)                          # syntax check
    jsonschema.validate(instance=data, schema=TICKET_SCHEMA)   # contract check
    return data
```

`json.loads` only proves the text is syntactically valid JSON — `{"category": "Billing"}` passes it fine. `jsonschema.validate` is what catches the capitalization, the missing `urgency`, or the stray field, because those violate the contract even though they're syntactically legal.

### 5. Keep the two failure modes distinct on the way out

```python
def run(ticket_text, call_model):
    raw = classify_ticket(ticket_text, call_model)
    try:
        return parse_and_validate(raw)
    except json.JSONDecodeError as e:
        raise RuntimeError(f"model did not return valid JSON: {e}") from e
    except jsonschema.ValidationError as e:
        raise RuntimeError(f"model returned JSON that violates the contract: {e.message}") from e
```

A decode error means the output wasn't even JSON — usually truncation or leaked prose. A validation error means it was JSON but broke the contract — usually a wrong enum value or a missing field. Collapsing both into one generic "parse failed" hides which repair you actually need, which matters the moment you wire in [a repair step](/learn/prompt-engineering/validation-and-repair-loop).

## Run it

```python
ticket = "My card was charged twice for the same order, please fix this ASAP"
result = run(ticket, call_model)
print(result)
# {'category': 'billing', 'urgency': 4, 'needs_escalation': False}
```

## Harden it

- **Prefer a native structured-output or tool-use mode when your provider has one.** Several model APIs now let you pass a JSON schema directly and constrain decoding to match it at the token level, rather than relying on instructions the model could ignore. Where that's available, it's more reliable than the prompt-level approach here — treat this lesson's pattern as the portable fallback for providers without it, or for keeping one contract stable while [porting a prompt across models](/learn/prompt-engineering/prompt-portability-across-models).
- **Set `max_tokens` generously enough that a valid object can never be truncated mid-field.** A cut-off response looks like a `JSONDecodeError`, and it's tempting to treat every decode error as "the model misbehaved" when it was actually your own length cap.
- **Prefill only fixes the first token.** It stops "Here's the JSON:" preambles, but everything after the opening brace is still generated normally and still needs the validation step — never skip step 4 because step 3 made the output "look" trustworthy.

## Extend it

Chain a single repair attempt onto a validation failure instead of just raising — that's the whole subject of [Building a Validate-and-Repair Loop](/learn/prompt-engineering/validation-and-repair-loop). If this classifier is one stage of a larger pipeline, the dict `parse_and_validate` returns is exactly what the next stage should receive — see [Passing State Cleanly Between Pipeline Stages](/learn/prompt-engineering/passing-state-between-stages) for what to forward and what to leave out.

**Related:** [Structured Output: Making the Model Speak a Contract](/learn/prompt-engineering/structured-output-contracts), [Prefilling the Assistant Turn](/learn/prompt-engineering/prefilling-responses), [Building a Validate-and-Repair Loop](/learn/prompt-engineering/validation-and-repair-loop), [Passing State Cleanly Between Pipeline Stages](/learn/prompt-engineering/passing-state-between-stages), [Prompt Portability Across Models](/learn/prompt-engineering/prompt-portability-across-models)
